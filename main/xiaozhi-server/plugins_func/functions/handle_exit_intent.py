from plugins_func.register import register_function, ToolType, ActionResponse, Action
from config.logger import setup_logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.connection import ConnectionHandler

TAG = __name__
logger = setup_logging()

handle_exit_intent_function_desc = {
    "type": "function",
    "function": {
        "name": "handle_exit_intent",
        "description": "Appelé lorsque l'utilisateur veut terminer la conversation, dire au revoir, se mettre en veille ou quitter. / Call when user wants to exit, say goodbye, sleep or end conversation.",
        "parameters": {
            "type": "object",
            "properties": {
                "say_goodbye": {
                    "type": "string",
                    "description": "Formule chaleureuse et brève d'au revoir / Friendly farewell phrase",
                }
            },
            "required": ["say_goodbye"],
        },
    },
}


@register_function(
    "handle_exit_intent", handle_exit_intent_function_desc, ToolType.SYSTEM_CTL
)
def handle_exit_intent(conn: "ConnectionHandler", say_goodbye: str | None = None):
    # Traitement de l'intention de sortie / Handle exit intent
    try:
        if say_goodbye is None:
            tts_cfg = conn.config.get("TTS", {}).get(
                conn.config.get("selected_module", {}).get("TTS", ""), {}
            )
            lang = str(tts_cfg.get("language") or conn.config.get("language") or "").lower()
            if any(z in lang for z in ["zh", "chinese"]):
                say_goodbye = "再见，祝您生活愉快！"
            elif any(e in lang for e in ["en", "english"]):
                say_goodbye = "Goodbye! Have a great day!"
            else:
                say_goodbye = "Au revoir et à bientôt !"

        if not conn.close_after_chat:
            conn.close_after_chat = True
        logger.bind(tag=TAG).info(f"Exit intent processed: {say_goodbye}")
        return ActionResponse(
            action=Action.RESPONSE, result="Session terminated", response=say_goodbye
        )
    except Exception as e:
        logger.bind(tag=TAG).error(f"Error handling exit intent: {e}")
        return ActionResponse(
            action=Action.NONE, result="Exit error", response=""
        )
