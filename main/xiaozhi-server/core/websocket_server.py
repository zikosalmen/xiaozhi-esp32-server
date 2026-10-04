import asyncio
import logging

import websockets
from config.logger import setup_logging


class SuppressInvalidHandshakeFilter(logging.Filter):
    """过滤掉无效握手错误日志（如HTTPS访问WS端口）"""

    def filter(self, record):
        msg = record.getMessage()
        suppress_keywords = [
            "opening handshake failed",
            "did not receive a valid HTTP request",
            "connection closed while reading HTTP request",
            "line without CRLF",
        ]
        return not any(keyword in msg for keyword in suppress_keywords)


def _setup_websockets_logger():
    """配置 websockets 相关的所有 logger，过滤无效握手错误"""
    filter_instance = SuppressInvalidHandshakeFilter()
    for logger_name in ["websockets", "websockets.server", "websockets.client"]:
        logger = logging.getLogger(logger_name)
        logger.addFilter(filter_instance)


_setup_websockets_logger()


from core.connection import ConnectionHandler
from config.config_loader import get_config_from_api_async
from core.auth import AuthManager, AuthenticationError
from core.utils.modules_initialize import initialize_modules
from core.utils.util import check_vad_update, check_asr_update

TAG = __name__


class WebSocketServer:
    def __init__(self, config: dict):
        self.config = config
        self.logger = setup_logging(config)
        self.config_lock = asyncio.Lock()
        modules = initialize_modules(
            self.logger,
            self.config,
            "VAD" in self.config["selected_module"],
            "ASR" in self.config["selected_module"],
            "LLM" in self.config["selected_module"],
            False,
            "Memory" in self.config["selected_module"],
            "Intent" in self.config["selected_module"],
        )
        self._vad = modules["vad"] if "vad" in modules else None
        self._asr = modules["asr"] if "asr" in modules else None
        self._llm = modules["llm"] if "llm" in modules else None
        self._intent = modules["intent"] if "intent" in modules else None
        self._memory = modules["memory"] if "memory" in modules else None

        auth_config = self.config["server"].get("auth", {})
        self.auth_enable = auth_config.get("enabled", False)
        # 设备白名单
        self.allowed_devices = set(auth_config.get("allowed_devices", []))
        secret_key = self.config["server"]["auth_key"]
        expire_seconds = auth_config.get("expire_seconds", None)
        self.auth = AuthManager(secret_key=secret_key, expire_seconds=expire_seconds)
        self.active_connections = {}

    def register_connection(self, device_id: str, handler):
        self.active_connections[device_id] = handler
        self.logger.bind(tag=TAG).info(
            f"ESP32 client registered: {device_id} (Total active: {len(self.active_connections)})"
        )

    def unregister_connection(self, device_id: str):
        if device_id in self.active_connections:
            del self.active_connections[device_id]
            self.logger.bind(tag=TAG).info(
                f"ESP32 client unregistered: {device_id} (Total active: {len(self.active_connections)})"
            )

    async def send_robot_command(
        self,
        direction: str,
        speed: int = 80,
        duration_ms: int = 1500,
        device_id: str = None,
        extra: dict = None,
    ) -> dict:
        """向已连接的 ESP32 发送底盘电机控制指令 (via MCP JSON-RPC 2.0)"""
        import json

        is_stop = direction == "stop"

        # Build MCP JSON-RPC 2.0 tools/call message wrapped in {"type":"mcp","payload":{...}}
        # Tool names registered in motor_controller.h: "self.robot.move" / "self.robot.stop"
        tool_name_mcp = "self.robot.stop" if is_stop else "self.robot.move"
        arguments = (
            {}
            if is_stop
            else {
                "direction": direction,
                "speed": speed,
                "duration_ms": duration_ms,
            }
        )
        # Incrementing call ID per instance
        if not hasattr(self, "_robot_call_id"):
            self._robot_call_id = 1
        call_id = self._robot_call_id
        self._robot_call_id += 1

        mcp_payload = {
            "jsonrpc": "2.0",
            "id": call_id,
            "method": "tools/call",
            "params": {
                "name": tool_name_mcp,
                "arguments": arguments,
            },
        }
        # Wrap in the envelope the ESP32 application.cc expects for type=="mcp"
        ws_message = {
            "type": "mcp",
            "payload": mcp_payload,
        }
        payload_str = json.dumps(ws_message)

        sent_count = 0
        errors = []

        targets = []
        if device_id:
            device_id_lower = device_id.lower()
            if device_id_lower in self.active_connections:
                targets = [self.active_connections[device_id_lower]]
            elif device_id in self.active_connections:
                targets = [self.active_connections[device_id]]
            else:
                # Pas de device trouvé avec cet ID, broadcaster à tous
                targets = list(self.active_connections.values())
        else:
            targets = list(self.active_connections.values())

        for conn in targets:
            try:
                # 1. 尝试 server-side MCP client (若连接已初始化 mcp_client)
                if (
                    hasattr(conn, "mcp_client")
                    and conn.mcp_client
                    and hasattr(conn.mcp_client, "has_tool")
                ):
                    from core.providers.tools.device_mcp import call_mcp_tool
                    import json as _json

                    # Internal tool names use underscores (sanitized), MCP names use dots
                    tool_name_internal = "self_robot_stop" if is_stop else "self_robot_move"
                    if conn.mcp_client.has_tool(tool_name_internal):
                        await call_mcp_tool(
                            conn,
                            conn.mcp_client,
                            tool_name_internal,
                            _json.dumps(arguments),
                        )
                        sent_count += 1
                        continue

                # 2. Fallback: envoyer le message MCP JSON-RPC directement via WebSocket
                if conn.websocket and hasattr(conn.websocket, "send"):
                    await conn.websocket.send(payload_str)
                    sent_count += 1
            except Exception as e:
                errors.append(str(e))
                self.logger.bind(tag=TAG).error(f"发送机器人指令失败: {e}")

        return {
            "sent_count": sent_count,
            "total_clients": len(self.active_connections),
            "errors": errors,
        }

    async def start(self):
        server_config = self.config["server"]
        host = server_config.get("ip", "0.0.0.0")
        port = int(server_config.get("port", 8000))

        async with websockets.serve(
            self._handle_connection,
            host,
            port,
            process_request=self._http_response,
            ping_interval=20,   # envoie un ping toutes les 20s (garde Cloudflare vivant)
            ping_timeout=10,    # si pas de pong en 10s → ferme proprement
        ):
            await asyncio.Future()

    async def _handle_connection(self, websocket: websockets.ServerConnection):
        headers = dict(websocket.request.headers)
        if headers.get("device-id", None) is None:
            # 尝试从 URL 的查询参数中获取 device-id
            from urllib.parse import parse_qs, urlparse

            # 从 WebSocket 请求中获取路径
            request_path = websocket.request.path
            if not request_path:
                self.logger.bind(tag=TAG).error("无法获取请求路径")
                await websocket.close()
                return
            parsed_url = urlparse(request_path)
            query_params = parse_qs(parsed_url.query)
            if "device-id" not in query_params:
                await websocket.send("端口正常，如需测试连接，请启动digital-human测试")
                await websocket.close()
                return
            else:
                websocket.request.headers["device-id"] = query_params["device-id"][0]
            if "client-id" in query_params:
                websocket.request.headers["client-id"] = query_params["client-id"][0]
            if "authorization" in query_params:
                websocket.request.headers["authorization"] = query_params[
                    "authorization"
                ][0]

        dev_id = websocket.request.headers.get("device-id", f"ws-{id(websocket)}")

        """处理新连接，每次创建独立的ConnectionHandler"""
        # 先认证，后建立连接
        try:
            await self._handle_auth(websocket)
        except AuthenticationError:
            await websocket.send("认证失败")
            await websocket.close()
            return
        # 创建ConnectionHandler时传入当前server实例
        handler = ConnectionHandler(
            self.config,
            self._vad,
            self._asr,
            self._llm,
            self._memory,
            self._intent,
            self,  # 传入server实例
        )
        self.register_connection(dev_id, handler)
        try:
            await handler.handle_connection(websocket)
        except Exception as e:
            self.logger.bind(tag=TAG).error(f"处理连接时出错: {e}")
        finally:
            self.unregister_connection(dev_id)
            # 强制关闭连接（如果还没有关闭的话）
            try:
                # 安全地检查WebSocket状态并关闭
                if hasattr(websocket, "closed") and not websocket.closed:
                    await websocket.close()
                elif hasattr(websocket, "state") and websocket.state.name != "CLOSED":
                    await websocket.close()
                else:
                    # 如果没有closed属性，直接尝试关闭
                    await websocket.close()
            except Exception as close_error:
                self.logger.bind(tag=TAG).error(
                    f"服务器端强制关闭连接时出错: {close_error}"
                )

    async def _http_response(self, websocket, request_headers):
        # 检查是否为 WebSocket 升级请求
        if request_headers.headers.get("connection", "").lower() == "upgrade":
            # 如果是 WebSocket 请求，返回 None 允许握手继续
            return None
        else:
            # 如果是普通 HTTP 请求，返回 "server is running"
            return websocket.respond(200, "Server is running\n")

    async def update_config(self) -> bool:
        """更新服务器配置并重新初始化组件

        Returns:
            bool: 更新是否成功
        """
        try:
            async with self.config_lock:
                # 重新获取配置（使用异步版本）
                new_config = await get_config_from_api_async(self.config)
                if new_config is None:
                    self.logger.bind(tag=TAG).error("获取新配置失败")
                    return False
                self.logger.bind(tag=TAG).info(f"获取新配置成功")
                # 检查 VAD 和 ASR 类型是否需要更新
                update_vad = check_vad_update(self.config, new_config)
                update_asr = check_asr_update(self.config, new_config)
                self.logger.bind(tag=TAG).info(
                    f"检查VAD和ASR类型是否需要更新: {update_vad} {update_asr}"
                )
                # 更新配置
                self.config = new_config
                # 重新初始化组件
                modules = initialize_modules(
                    self.logger,
                    new_config,
                    update_vad,
                    update_asr,
                    "LLM" in new_config["selected_module"],
                    False,
                    "Memory" in new_config["selected_module"],
                    "Intent" in new_config["selected_module"],
                )

                # 更新组件实例
                if "vad" in modules:
                    self._vad = modules["vad"]
                if "asr" in modules:
                    self._asr = modules["asr"]
                if "llm" in modules:
                    self._llm = modules["llm"]
                if "intent" in modules:
                    self._intent = modules["intent"]
                if "memory" in modules:
                    self._memory = modules["memory"]
                self.logger.bind(tag=TAG).info(f"更新配置任务执行完毕")
                return True
        except Exception as e:
            self.logger.bind(tag=TAG).error(f"更新服务器配置失败: {str(e)}")
            return False

    async def _handle_auth(self, websocket: websockets.ServerConnection):
        # 先认证，后建立连接
        if self.auth_enable:
            headers = dict(websocket.request.headers)
            device_id = headers.get("device-id", None)
            client_id = headers.get("client-id", None)
            if self.allowed_devices and device_id in self.allowed_devices:
                # 如果属于白名单内的设备，不校验token，直接放行
                return
            else:
                # 否则校验token
                token = headers.get("authorization", "")
                if token.startswith("Bearer "):
                    token = token[7:]  # 移除'Bearer '前缀
                else:
                    raise AuthenticationError("Missing or invalid Authorization header")
                # 进行认证
                auth_success = self.auth.verify_token(
                    token, client_id=client_id, username=device_id
                )
                if not auth_success:
                    raise AuthenticationError("Invalid token")
