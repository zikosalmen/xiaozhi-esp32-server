import i18n from '@/i18n';

const dictMap = {
  fr: {
    // Model and Provider Names
    'FunASR语音识别': 'FunASR (Reconnaissance vocale)',
    'SileroVAD语音活动检测': 'SileroVAD (Détection vocale / VAD)',
    '语音活动检测': 'Détection d\'activité vocale (VAD)',
    'SherpaASR语音识别': 'SherpaASR (Reconnaissance vocale)',
    'Sherpa语音识别': 'Sherpa ASR',
    '火山引擎语音识别': 'Doubao ASR (Reconnaissance vocale)',
    '豆包语音识别': 'Doubao ASR (Reconnaissance vocale)',
    '豆包语音识别(流式)': 'Doubao ASR (Streaming)',
    '腾讯语音识别': 'Tencent ASR (Reconnaissance vocale)',
    '百度语音识别': 'Baidu ASR',
    'Edge语音合成': 'Edge TTS (Synthèse vocale)',
    '豆包语音合成': 'Doubao TTS (Synthèse vocale)',
    '豆包语音合成2.0(流式)': 'Doubao TTS 2.0 (Streaming)',
    '硅基流动语音合成': 'Siliconflow CosyVoice TTS',
    'Coze中文语音合成': 'Coze TTS (Synthèse vocale)',
    'FishSpeech语音合成': 'FishSpeech TTS',
    'MiniMax语音合成': 'MiniMax TTS (Synthèse vocale)',
    '阿里云语音合成': 'Aliyun TTS',
    '302AI语音合成': '302AI TTS',
    '机智云语音合成': 'Gizwits TTS',
    'ACGN语音合成': 'ACGN TTS',
    'OpenAI语音合成': 'OpenAI TTS (Synthèse vocale)',
    '自定义语音合成': 'Custom TTS (Personnalisé)',
    '腾讯语音合成': 'Tencent TTS (Synthèse vocale)',
    'FunASR服务语音识别': 'FunASR Server ASR',
    '讯飞流式语音识别': 'iFlytek Streaming ASR',
    '讯飞流式语音合成': 'iFlytek Streaming TTS',
    '通义千问': 'Qwen LLM',
    '通义百炼': 'Bailian LLM',
    '智语AI': 'ZhiYu AI',
    '谷歌Gemini': 'Google Gemini',
    '智谱AI': 'Zhipu AI',
    '智谱视觉AI': 'Zhipu Vision AI',
    '本地短期记忆': 'Mémoire locale courte',
    '本地短期记忆（总结记忆）': 'Mémoire locale résumée',
    '本地短记忆': 'Mémoire courte',
    '无记忆': 'Aucune mémoire',
    '无意图识别': 'Aucune détection d\'intention',
    '服务器音乐播放': 'Lecteur de musique du serveur',
    '联网搜索': 'Recherche Web en direct',
    '默认': 'Par défaut',
    '普通话': 'Mandarin',
    '英语': 'Anglais',
    '法语': 'Français',

    // Voice Timbre Names
    '通用女声': 'Voix féminine standard',
    '通用男声': 'Voix masculine standard',
    '温柔女声': 'Voix féminine douce',
    '知性女声': 'Voix féminine élégante',
    '知性温婉': 'Voix chaleureuse et intellectuelle',
    '清新女声': 'Voix féminine fraîche',
    '活泼男声': 'Voix masculine dynamique',
    '阳光男生': 'Voix masculine jeune et dynamique',
    '阳光青年': 'Jeune homme dynamique',
    '甜美小源': 'Voix douce XiaoYuan',
    '甜美小玲': 'Voix douce XiaoLing',
    '甜美悦悦': 'Voix douce YueYue',
    '甜美桃子': 'Voix douce TaoZi',
    '暖心体贴': 'Voix attentionnée et chaleureuse',
    '渊博学者': 'Érudit sage',
    '美式英语': 'Anglais américain',
    '英式英语': 'Anglais britannique',

    // Form Field Labels
    '检测阈值': 'Seuil de détection',
    '模型目录': 'Répertoire du modèle',
    '输出目录': 'Répertoire de sortie',
    '应用ID': 'ID Application',
    '访问令牌': 'Jeton d\'accès (Token)',
    '服务地址': 'Adresse du serveur (Host)',
    '端口号': 'Numéro de port',
    '接口地址': 'Adresse de l\'API',
    '密钥': 'Clé secrète (Secret Key)',
    '采样率': 'Fréquence d\'échantillonnage',
    '语速': 'Vitesse d\'élocution',
    '音调': 'Hauteur de la voix',
    '音量': 'Volume sonore',
    '最大并发': 'Concurrence maximale',
    '超时时间': 'Délai d\'attente (secondes)',
    '系统提示词': 'Prompt système',
  },
  en: {
    // Model and Provider Names
    'FunASR语音识别': 'FunASR (Speech Recognition)',
    'SileroVAD语音活动检测': 'SileroVAD (Voice Activity Detection / VAD)',
    '语音活动检测': 'Voice Activity Detection (VAD)',
    'SherpaASR语音识别': 'SherpaASR (Speech Recognition)',
    '火山引擎语音识别': 'Doubao ASR (Speech Recognition)',
    '豆包语音识别': 'Doubao ASR (Speech Recognition)',
    'Edge语音合成': 'Edge TTS (Speech Synthesis)',
    '豆包语音合成': 'Doubao TTS (Speech Synthesis)',
    '硅基流动语音合成': 'Siliconflow CosyVoice TTS',
    'Coze中文语音合成': 'Coze TTS (Speech Synthesis)',
    'FishSpeech语音合成': 'FishSpeech TTS',
    'MiniMax语音合成': 'MiniMax TTS (Speech Synthesis)',
    '阿里云语音合成': 'Aliyun TTS',
    '302AI语音合成': '302AI TTS',
    '机智云语音合成': 'Gizwits TTS',
    'ACGN语音合成': 'ACGN TTS',
    'OpenAI语音合成': 'OpenAI TTS (Speech Synthesis)',
    '自定义语音合成': 'Custom TTS',
    '腾讯语音合成': 'Tencent TTS',
    'FunASR服务语音识别': 'FunASR Server ASR',
    '通义千问': 'Qwen LLM',
    '谷歌Gemini': 'Google Gemini',
    '智谱AI': 'Zhipu AI',
    '本地短期记忆': 'Local Short Memory',
    '无记忆': 'No Memory',
    '无意图识别': 'No Intent Recognition',
    '联网搜索': 'Web Search',
    '普通话': 'Mandarin',
    '英语': 'English',
    '法语': 'French',

    // Field Labels
    '检测阈值': 'Detection Threshold',
    '模型目录': 'Model Directory',
    '输出目录': 'Output Directory',
    '应用ID': 'App ID',
    '访问令牌': 'Access Token',
    '服务地址': 'Server Host',
    '端口号': 'Port Number',
    '接口地址': 'API Address',
    '密钥': 'Secret Key',
  }
};

export function translateBackendText(text) {
  if (!text || typeof text !== 'string') return text;

  const locale = (i18n.locale || 'fr').toLowerCase();
  if (locale.startsWith('zh')) {
    return text;
  }

  const langKey = locale.startsWith('en') ? 'en' : 'fr';
  const mapping = dictMap[langKey] || dictMap.fr;

  // Exact match
  if (mapping[text]) {
    return mapping[text];
  }

  // Substring replacement for compound names
  let result = text;
  for (const [zh, trans] of Object.entries(mapping)) {
    if (result.includes(zh)) {
      result = result.replace(new RegExp(zh, 'g'), trans);
    }
  }

  return result;
}

export default translateBackendText;
