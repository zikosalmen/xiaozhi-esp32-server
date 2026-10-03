import time
import json
import uuid
import random
import asyncio
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.connection import ConnectionHandler
from core.utils.dialogue import Message
from core.utils.util import audio_to_data
from core.providers.tts.dto.dto import SentenceType
from core.utils.wakeup_word import WakeupWordsConfig
from core.handle.sendAudioHandle import sendAudioMessage, send_tts_message
from core.utils.util import remove_punctuation_and_length, opus_datas_to_wav_bytes
from core.providers.tools.device_mcp import MCPClient, send_mcp_initialize_message

TAG = __name__

WAKEUP_CONFIG = {
    "refresh_time": 10,
    "responses": [
        "Je suis là, je vous écoute.",
        "Oui, que puis-je faire pour vous ?",
        "Je vous écoute, dites-moi tout.",
        "Je suis prête, je vous écoute.",
        "À vos ordres, que désirez-vous ?",
        "Bonjour ! Comment puis-je vous aider ?",
        "Je suis à votre écoute.",
        "Dites-moi, je vous écoute.",
    ],
}

WAKEUP_RESPONSES_BY_LANG = {
    "fr": [
        "Je suis là, je vous écoute.",
        "Oui, que puis-je faire pour vous ?",
        "Je vous écoute, dites-moi tout.",
        "Je suis prête, je vous écoute.",
        "À vos ordres, que désirez-vous ?",
        "Bonjour ! Comment puis-je vous aider ?",
        "Je suis à votre écoute.",
        "Dites-moi, je vous écoute.",
    ],
    "en": [
        "I'm here, I'm listening.",
        "Yes, how can I help you?",
        "I'm ready, go ahead.",
        "How can I help you today?",
        "I'm listening, please go ahead.",
        "At your service!",
        "Yes, what can I do for you?",
    ],
    "zh": [
        "我一直都在呢，您请说。",
        "在的呢，请随时吩咐我。",
        "来啦来啦，请告诉我吧。",
        "您请说，我正听着。",
        "请您讲话，我准备好了。",
        "请您说出指令吧。",
        "我认真听着呢，请讲。",
        "请问您需要什么帮助？",
        "我在这里，等候您的指令。",
    ],
}


def get_language_from_conn(conn: "ConnectionHandler") -> str:
    """Helper to detect language from connection configuration or TTS voice"""
    try:
        tts_cfg = conn.config.get("TTS", {}).get(
            conn.config.get("selected_module", {}).get("TTS", ""), {}
        )
        lang = str(tts_cfg.get("language") or conn.config.get("language") or "").lower()
        if any(f in lang for f in ["fr", "français", "francais", "french"]):
            return "fr"
        if any(e in lang for e in ["en", "english", "anglais"]):
            return "en"
        if any(z in lang for z in ["zh", "中文", "chinese"]):
            return "zh"

        voice = str(
            getattr(getattr(conn, "tts", None), "voice", "") or tts_cfg.get("voice", "")
        ).lower()
        if voice.startswith("fr-") or "french" in voice:
            return "fr"
        if voice.startswith("en-") or "english" in voice:
            return "en"
        if voice.startswith("zh-") or "chinese" in voice:
            return "zh"
    except Exception:
        pass
    return "fr"


# 创建全局的唤醒词配置管理器
wakeup_words_config = WakeupWordsConfig()

# 用于防止并发调用wakeupWordsResponse的锁
_wakeup_response_lock = asyncio.Lock()


async def handleHelloMessage(conn: "ConnectionHandler", msg_json):
    """处理hello消息"""
    audio_params = msg_json.get("audio_params")
    if audio_params:
        format = audio_params.get("format")
        conn.logger.bind(tag=TAG).debug(f"客户端音频格式: {format}")
        conn.audio_format = format
        conn.welcome_msg["audio_params"] = audio_params
    features = msg_json.get("features")
    if features:
        conn.logger.bind(tag=TAG).debug(f"客户端特性: {features}")
        conn.features = features
        if features.get("mcp"):
            conn.logger.bind(tag=TAG).debug("客户端支持MCP")
            conn.mcp_client = MCPClient()
        if features.get("aec"):
            conn.logger.bind(tag=TAG).debug("客户端启用了服务端AEC")
            conn.client_aec = True

    await conn.websocket.send(json.dumps(conn.welcome_msg))

    # The device waits for the server hello before processing MCP messages.
    if features and features.get("mcp"):
        asyncio.create_task(send_mcp_initialize_message(conn))


async def checkWakeupWords(conn: "ConnectionHandler", text):
    enable_wakeup_words_response_cache = conn.config.get(
        "enable_wakeup_words_response_cache", True
    )

    # 等待tts初始化，最多等待3秒
    start_time = time.time()
    while time.time() - start_time < 3:
        if conn.tts:
            break
        await asyncio.sleep(0.1)
    else:
        return False

    if not enable_wakeup_words_response_cache:
        return False

    _, filtered_text = remove_punctuation_and_length(text)
    if filtered_text not in conn.config.get("wakeup_words", []):
        return False

    conn.just_woken_up = True
    await send_tts_message(conn, "start")

    # 获取当前音色
    voice = getattr(conn.tts, "voice", "default")
    if not voice:
        voice = "default"

    # 获取唤醒词回复配置
    response = wakeup_words_config.get_wakeup_response(voice)
    opus_packets = None

    if not response or not response.get("file_path"):
        lang = get_language_from_conn(conn)
        responses_list = WAKEUP_RESPONSES_BY_LANG.get(lang, WAKEUP_RESPONSES_BY_LANG["fr"])
        selected_text = random.choice(responses_list)

        try:
            tts_result = await asyncio.to_thread(conn.tts.to_tts, selected_text)
            if tts_result:
                opus_packets = tts_result
                response = {"voice": voice, "text": selected_text}
                wav_bytes = opus_datas_to_wav_bytes(tts_result, sample_rate=conn.sample_rate)
                file_path = wakeup_words_config.generate_file_path(voice)
                with open(file_path, "wb") as f:
                    f.write(wav_bytes)
                wakeup_words_config.update_wakeup_response(voice, file_path, selected_text)
        except Exception as e:
            conn.logger.bind(tag=TAG).warning(f"TTS 唤醒词合成失败，使用备用音频: {e}")

        if not opus_packets:
            fallback_text = "Je suis là !" if lang == "fr" else ("I'm here!" if lang == "en" else "我在这里哦！")
            response = {
                "voice": voice,
                "file_path": "config/assets/wakeup_words_short.wav",
                "time": 0,
                "text": fallback_text,
            }
            opus_packets = await audio_to_data(response.get("file_path"), use_cache=False)
    else:
        opus_packets = await audio_to_data(response.get("file_path"), use_cache=False)

    conn.client_abort = False
    conn.sentence_id = str(uuid.uuid4().hex)

    reply_text = response.get("text", "Je suis là !")
    conn.logger.bind(tag=TAG).info(f"播放唤醒词回复: {reply_text}")
    await sendAudioMessage(conn, SentenceType.FIRST, opus_packets, reply_text)
    await sendAudioMessage(conn, SentenceType.LAST, [], None)

    # 补充对话
    conn.dialogue.put(Message(role="assistant", content=reply_text))

    # 检查是否需要更新唤醒词回复
    if time.time() - response.get("time", 0) > WAKEUP_CONFIG["refresh_time"]:
        if not _wakeup_response_lock.locked():
            asyncio.create_task(wakeupWordsResponse(conn))
    return True


async def wakeupWordsResponse(conn: "ConnectionHandler"):
    if not conn.tts:
        return

    try:
        # 尝试获取锁，如果获取不到就返回
        if not await _wakeup_response_lock.acquire():
            return

        lang = get_language_from_conn(conn)
        responses_list = WAKEUP_RESPONSES_BY_LANG.get(lang, WAKEUP_RESPONSES_BY_LANG["fr"])
        result = random.choice(responses_list)
        if not result or len(result) == 0:
            return

        # 生成TTS音频
        tts_result = await asyncio.to_thread(conn.tts.to_tts, result)
        if not tts_result:
            return

        # 获取当前音色
        voice = getattr(conn.tts, "voice", "default")

        # 使用链接的sample_rate
        wav_bytes = opus_datas_to_wav_bytes(tts_result, sample_rate=conn.sample_rate)
        file_path = wakeup_words_config.generate_file_path(voice)
        with open(file_path, "wb") as f:
            f.write(wav_bytes)
        # 更新配置
        wakeup_words_config.update_wakeup_response(voice, file_path, result)
    finally:
        # 确保在任何情况下都释放锁
        if _wakeup_response_lock.locked():
            _wakeup_response_lock.release()
