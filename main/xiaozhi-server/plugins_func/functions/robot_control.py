"""机器人两轮底盘运动控制插件 / Robot two-wheel chassis movement control plugin"""

import json
from config.logger import setup_logging
from plugins_func.register import register_function, ToolType, ActionResponse, Action
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.connection import ConnectionHandler

TAG = __name__
logger = setup_logging()

robot_move_desc = {
    "type": "function",
    "function": {
        "name": "robot_move",
        "description": (
            "控制双轮机器人底盘运动（前进、后退、左转、右转、停止）。"
            "当用户指示小车或机器人移动时调用（例如：'avance', 'recule', 'tourne à gauche', 'tourne à droite', 'stop', '前进', '后退', '左转', '右转'）。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "direction": {
                    "type": "string",
                    "enum": ["forward", "backward", "left", "right", "stop"],
                    "description": "移动方向：forward (前进/avance), backward (后退/recule), left (左转/gauche), right (右转/droite), stop (停止/stop)",
                },
                "speed": {
                    "type": "integer",
                    "description": "移动速度百分比 0-100，默认 80",
                    "default": 80,
                },
                "duration_ms": {
                    "type": "integer",
                    "description": "移动持续时间（毫秒），默认 1500 毫秒。设为 0 表示持续移动直到收到停止指令。",
                    "default": 1500,
                },
            },
            "required": ["direction"],
        },
    },
}

robot_stop_desc = {
    "type": "function",
    "function": {
        "name": "robot_stop",
        "description": "立即停止机器人小车的双轮运动（刹车/停车）。当用户说'stop', 'arrête', 'arrête-toi', '停止'时调用。",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
}


@register_function("robot_move", robot_move_desc, ToolType.IOT_CTL)
async def robot_move(
    conn: "ConnectionHandler",
    direction: str = "forward",
    speed: int = 80,
    duration_ms: int = 1500,
):
    """控制机器人小车移动"""
    direction = direction.lower()

    # 1. 尝试通过客户端已注册的 MCP 工具调用
    try:
        if hasattr(conn, "mcp_client") and conn.mcp_client:
            from core.providers.tools.device_mcp import call_mcp_tool

            if conn.mcp_client.has_tool("self_robot_move"):
                logger.bind(tag=TAG).info(
                    f"通过 MCP 触发 self.robot.move: dir={direction}, speed={speed}, duration={duration_ms}"
                )
                await call_mcp_tool(
                    conn,
                    "self_robot_move",
                    {
                        "direction": direction,
                        "speed": speed,
                        "duration_ms": duration_ms,
                    },
                )
                return ActionResponse(
                    action=Action.REQLLM,
                    result=f"Robot is moving {direction} at speed {speed}% for {duration_ms}ms.",
                )
    except Exception as e:
        logger.bind(tag=TAG).warning(f"MCP 调用 self.robot.move 失败，尝试 fallback: {e}")

    # 2. 如果未走 MCP，通过通用 WebSocket/IoT 协议下发指令
    try:
        command = {
            "type": "iot",
            "commands": [
                {
                    "name": "robot",
                    "method": "move",
                    "parameters": {
                        "direction": direction,
                        "speed": speed,
                        "duration_ms": duration_ms,
                    },
                }
            ],
        }
        await conn.websocket.send(json.dumps(command))
        logger.bind(tag=TAG).info(f"已通过 WebSocket 下发机器人移动指令: {direction}")
    except Exception as e:
        logger.bind(tag=TAG).error(f"下发机器人移动指令失败: {e}")
        return ActionResponse(
            action=Action.RESPONSE, response="Désolé, impossible d'envoyer l'ordre aux moteurs."
        )

    return ActionResponse(
        action=Action.REQLLM,
        result=f"Action robot effectuée: direction={direction}, vitesse={speed}%, durée={duration_ms}ms.",
    )


@register_function("robot_stop", robot_stop_desc, ToolType.IOT_CTL)
async def robot_stop(conn: "ConnectionHandler"):
    """立即停止机器人"""
    try:
        if hasattr(conn, "mcp_client") and conn.mcp_client:
            from core.providers.tools.device_mcp import call_mcp_tool

            if conn.mcp_client.has_tool("self_robot_stop"):
                logger.bind(tag=TAG).info("通过 MCP 触发 self.robot.stop")
                await call_mcp_tool(conn, "self_robot_stop", {})
                return ActionResponse(
                    action=Action.REQLLM, result="Robot has stopped immediately."
                )
    except Exception as e:
        logger.bind(tag=TAG).warning(f"MCP 调用 self.robot.stop 失败，尝试 fallback: {e}")

    try:
        command = {
            "type": "iot",
            "commands": [{"name": "robot", "method": "stop", "parameters": {}}],
        }
        await conn.websocket.send(json.dumps(command))
        logger.bind(tag=TAG).info("已通过 WebSocket 下发机器人停止指令")
    except Exception as e:
        logger.bind(tag=TAG).error(f"下发机器人停止指令失败: {e}")
        return ActionResponse(
            action=Action.RESPONSE, response="Impossible de stopper les moteurs."
        )

    return ActionResponse(
        action=Action.REQLLM, result="Le robot s'est arrêté immédiatement."
    )
