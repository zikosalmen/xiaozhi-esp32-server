import json
from aiohttp import web
from core.api.base_handler import BaseHandler

TAG = __name__


class RobotHandler(BaseHandler):
    def __init__(self, config: dict, ws_server=None):
        super().__init__(config)
        self.ws_server = ws_server

    async def handle_move(self, request):
        """处理机器人移动指令 (POST /xiaozhi/robot/move)"""
        try:
            data = await request.json()
        except Exception:
            data = {}

        direction = data.get("direction", "forward").lower()
        speed = int(data.get("speed", 80))
        duration_ms = int(data.get("duration_ms", 1500))
        device_id = data.get("device_id", None)

        if direction not in ["forward", "backward", "left", "right", "stop"]:
            response = web.json_response(
                {"code": 1, "msg": f"Invalid direction: {direction}"}, status=400
            )
            self._add_cors_headers(response)
            return response

        self.logger.bind(tag=TAG).info(
            f"收到机器人移动指令: direction={direction}, speed={speed}, duration_ms={duration_ms}, device_id={device_id}"
        )

        result = {"sent_count": 0, "total_clients": 0}
        if self.ws_server and hasattr(self.ws_server, "send_robot_command"):
            result = await self.ws_server.send_robot_command(
                direction=direction,
                speed=speed,
                duration_ms=duration_ms,
                device_id=device_id,
            )

        response = web.json_response(
            {
                "code": 0,
                "msg": "Command dispatched",
                "data": {
                    "direction": direction,
                    "speed": speed,
                    "duration_ms": duration_ms,
                    "sent_count": result.get("sent_count", 0),
                    "total_clients": result.get("total_clients", 0),
                },
            }
        )
        self._add_cors_headers(response)
        return response

    async def handle_stop(self, request):
        """处理机器人停止指令 (POST /xiaozhi/robot/stop)"""
        try:
            data = await request.json()
        except Exception:
            data = {}

        device_id = data.get("device_id", None)
        self.logger.bind(tag=TAG).info(f"收到机器人停止指令: device_id={device_id}")

        result = {"sent_count": 0, "total_clients": 0}
        if self.ws_server and hasattr(self.ws_server, "send_robot_command"):
            result = await self.ws_server.send_robot_command(
                direction="stop", speed=0, duration_ms=0, device_id=device_id
            )

        response = web.json_response(
            {
                "code": 0,
                "msg": "Stop command dispatched",
                "data": {
                    "sent_count": result.get("sent_count", 0),
                    "total_clients": result.get("total_clients", 0),
                },
            }
        )
        self._add_cors_headers(response)
        return response

    async def handle_status(self, request):
        """获取机器人连接状态 (GET /xiaozhi/robot/status)"""
        total = 0
        devices = []
        if self.ws_server and hasattr(self.ws_server, "active_connections"):
            devices = list(self.ws_server.active_connections.keys())
            total = len(devices)

        response = web.json_response(
            {
                "code": 0,
                "msg": "ok",
                "data": {
                    "connected_devices_count": total,
                    "devices": devices,
                },
            }
        )
        self._add_cors_headers(response)
        return response
