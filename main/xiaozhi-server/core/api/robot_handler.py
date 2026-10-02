import json
from aiohttp import web
from core.api.base_handler import BaseHandler

TAG = __name__


class RobotHandler(BaseHandler):
    def __init__(self, config: dict, ws_server=None):
        super().__init__(config)
        self.ws_server = ws_server

    async def handle_move(self, request):
        """Move command (POST /xiaozhi/robot/move)
        direction: forward|backward|left|right|stop, speed: 0-100, duration_ms: 0=continuous
        """
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
            f"Robot move: direction={direction}, speed={speed}, dur={duration_ms}, device={device_id}"
        )

        result = {"sent_count": 0, "total_clients": 0}
        if self.ws_server and hasattr(self.ws_server, "send_robot_command"):
            result = await self.ws_server.send_robot_command(
                direction=direction, speed=speed,
                duration_ms=duration_ms, device_id=device_id,
            )

        response = web.json_response({
            "code": 0, "msg": "Command dispatched",
            "data": {
                "direction": direction, "speed": speed,
                "duration_ms": duration_ms,
                "sent_count": result.get("sent_count", 0),
                "total_clients": result.get("total_clients", 0),
            },
        })
        self._add_cors_headers(response)
        return response

    async def handle_drive(self, request):
        """Analog drive speed (POST /xiaozhi/robot/drive)
        speed: -100 (full reverse) … +100 (full forward), duration_ms: 0=continuous
        """
        try:
            data = await request.json()
        except Exception:
            data = {}

        speed = int(data.get("speed", 0))
        speed = max(-100, min(100, speed))
        duration_ms = int(data.get("duration_ms", 0))
        device_id = data.get("device_id", None)

        direction = "forward" if speed > 0 else ("backward" if speed < 0 else "stop")
        abs_speed = abs(speed)

        self.logger.bind(tag=TAG).info(f"Robot drive: speed={speed}, dur={duration_ms}")

        result = {"sent_count": 0}
        if self.ws_server and hasattr(self.ws_server, "send_robot_command"):
            result = await self.ws_server.send_robot_command(
                direction=direction, speed=abs_speed,
                duration_ms=duration_ms, device_id=device_id,
                extra={"cmd": "drive", "raw_speed": speed},
            )

        response = web.json_response({
            "code": 0, "msg": "Drive dispatched",
            "data": {"speed": speed, "sent_count": result.get("sent_count", 0)},
        })
        self._add_cors_headers(response)
        return response

    async def handle_steer(self, request):
        """Analog steering angle (POST /xiaozhi/robot/steer)
        angle: -100 (full left) … +100 (full right), duration_ms: 0=hold
        """
        try:
            data = await request.json()
        except Exception:
            data = {}

        angle = int(data.get("angle", 0))
        angle = max(-100, min(100, angle))
        duration_ms = int(data.get("duration_ms", 0))
        device_id = data.get("device_id", None)

        self.logger.bind(tag=TAG).info(f"Robot steer: angle={angle}, dur={duration_ms}")

        result = {"sent_count": 0}
        if self.ws_server and hasattr(self.ws_server, "send_robot_command"):
            result = await self.ws_server.send_robot_command(
                direction="left" if angle < 0 else ("right" if angle > 0 else "stop"),
                speed=abs(angle),
                duration_ms=duration_ms, device_id=device_id,
                extra={"cmd": "steer", "raw_angle": angle},
            )

        response = web.json_response({
            "code": 0, "msg": "Steer dispatched",
            "data": {"angle": angle, "sent_count": result.get("sent_count", 0)},
        })
        self._add_cors_headers(response)
        return response

    async def handle_stop(self, request):
        """Stop all motors (POST /xiaozhi/robot/stop)"""
        try:
            data = await request.json()
        except Exception:
            data = {}

        device_id = data.get("device_id", None)
        self.logger.bind(tag=TAG).info(f"Robot stop: device={device_id}")

        result = {"sent_count": 0, "total_clients": 0}
        if self.ws_server and hasattr(self.ws_server, "send_robot_command"):
            result = await self.ws_server.send_robot_command(
                direction="stop", speed=0, duration_ms=0, device_id=device_id
            )

        response = web.json_response({
            "code": 0, "msg": "Stop command dispatched",
            "data": {
                "sent_count": result.get("sent_count", 0),
                "total_clients": result.get("total_clients", 0),
            },
        })
        self._add_cors_headers(response)
        return response

    async def handle_status(self, request):
        """Robot status + battery (GET /xiaozhi/robot/status)"""
        total = 0
        devices = []
        battery_info = None

        if self.ws_server and hasattr(self.ws_server, "active_connections"):
            devices = list(self.ws_server.active_connections.keys())
            total = len(devices)

            # Get battery from device_status_cache if available
            if hasattr(self.ws_server, "device_status_cache") and devices:
                cache = self.ws_server.device_status_cache
                for dev_id in devices:
                    status = cache.get(dev_id, {})
                    if "battery" in status:
                        battery_info = status["battery"]
                        break

        resp_data = {
            "code": 0, "msg": "ok",
            "data": {
                "connected_devices_count": total,
                "devices": devices,
            },
        }
        if battery_info:
            resp_data["battery"] = battery_info

        response = web.json_response(resp_data)
        self._add_cors_headers(response)
        return response
