-- Localization: Update default model and provider names to international / French
UPDATE `ai_model_config` SET `model_name` = 'SileroVAD (Détection vocale / VAD)' WHERE `id` = 'VAD_SileroVAD';
UPDATE `ai_model_config` SET `model_name` = 'FunASR (Reconnaissance vocale / ASR)' WHERE `id` = 'ASR_FunASR';
UPDATE `ai_model_config` SET `model_name` = 'SherpaASR (Reconnaissance vocale / ASR)' WHERE `id` = 'ASR_SherpaASR';
UPDATE `ai_model_config` SET `model_name` = 'Doubao ASR (Reconnaissance vocale)' WHERE `id` = 'ASR_DoubaoASR';
UPDATE `ai_model_config` SET `model_name` = 'Tencent ASR (Reconnaissance vocale)' WHERE `id` = 'ASR_TencentASR';
UPDATE `ai_model_config` SET `model_name` = 'Edge TTS (Synthèse vocale)' WHERE `id` = 'TTS_EdgeTTS';
UPDATE `ai_model_config` SET `model_name` = 'Doubao TTS (Synthèse vocale)' WHERE `id` = 'TTS_DoubaoTTS';
UPDATE `ai_model_config` SET `model_name` = 'Siliconflow CosyVoice TTS' WHERE `id` = 'TTS_CosyVoiceSiliconflow';
UPDATE `ai_model_config` SET `model_name` = 'Coze TTS (Synthèse vocale)' WHERE `id` = 'TTS_CozeCnTTS';
UPDATE `ai_model_config` SET `model_name` = 'FishSpeech TTS' WHERE `id` = 'TTS_FishSpeech';
UPDATE `ai_model_config` SET `model_name` = 'MiniMax TTS' WHERE `id` = 'TTS_MinimaxTTS';
UPDATE `ai_model_config` SET `model_name` = 'Aliyun TTS' WHERE `id` = 'TTS_AliyunTTS';
UPDATE `ai_model_config` SET `model_name` = '302AI TTS' WHERE `id` = 'TTS_TTS302AI';
UPDATE `ai_model_config` SET `model_name` = 'Gizwits TTS' WHERE `id` = 'TTS_GizwitsTTS';
UPDATE `ai_model_config` SET `model_name` = 'ACGN TTS' WHERE `id` = 'TTS_ACGNTTS';
UPDATE `ai_model_config` SET `model_name` = 'OpenAI TTS' WHERE `id` = 'TTS_OpenAITTS';
UPDATE `ai_model_config` SET `model_name` = 'Custom TTS (Personnalisé)' WHERE `id` = 'TTS_CustomTTS';
UPDATE `ai_model_config` SET `model_name` = 'Tencent TTS' WHERE `id` = 'TTS_TencentTTS';
UPDATE `ai_model_config` SET `model_name` = 'FunASR Server ASR' WHERE `id` = 'ASR_FunASRServer';

UPDATE `ai_model_provider` SET `name` = 'SileroVAD (Détection vocale)' WHERE `id` = 'SYSTEM_VAD_SileroVAD';
UPDATE `ai_model_provider` SET `name` = 'FunASR (Reconnaissance vocale)' WHERE `id` = 'SYSTEM_ASR_FunASR';
UPDATE `ai_model_provider` SET `name` = 'SherpaASR (Reconnaissance vocale)' WHERE `id` = 'SYSTEM_ASR_SherpaASR';
UPDATE `ai_model_provider` SET `name` = 'Doubao ASR (Reconnaissance vocale)' WHERE `id` = 'SYSTEM_ASR_DoubaoASR';
UPDATE `ai_model_provider` SET `name` = 'FunASR Server ASR' WHERE `id` = 'SYSTEM_ASR_FunASRServer';
