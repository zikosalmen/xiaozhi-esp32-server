"""
时间与日期工具模块 / Time & Date utility module
提供统一的时间与日期获取功能（支持多语言：法语、英语、中文）
"""

from datetime import datetime

WEEKDAY_MAP_ZH = {
    "Monday": "星期一",
    "Tuesday": "星期二",
    "Wednesday": "星期三",
    "Thursday": "星期四",
    "Friday": "星期五",
    "Saturday": "星期六",
    "Sunday": "星期日",
}

WEEKDAY_MAP_FR = {
    "Monday": "Lundi",
    "Tuesday": "Mardi",
    "Wednesday": "Mercredi",
    "Thursday": "Jeudi",
    "Friday": "Vendredi",
    "Saturday": "Samedi",
    "Sunday": "Dimanche",
}

WEEKDAY_MAP_EN = {
    "Monday": "Monday",
    "Tuesday": "Tuesday",
    "Wednesday": "Wednesday",
    "Thursday": "Thursday",
    "Friday": "Friday",
    "Saturday": "Saturday",
    "Sunday": "Sunday",
}


def get_current_time() -> str:
    """获取当前时间字符串 (格式: HH:MM)"""
    return datetime.now().strftime("%H:%M")


def get_current_date() -> str:
    """获取今天日期字符串 (格式: YYYY-MM-DD)"""
    return datetime.now().strftime("%Y-%m-%d")


def get_current_weekday(lang: str = "fr") -> str:
    """获取今天星期几（支持语言参数）"""
    now = datetime.now()
    day_en = now.strftime("%A")
    lang_lower = str(lang).lower()

    if any(z in lang_lower for z in ["zh", "中文", "chinese"]):
        return WEEKDAY_MAP_ZH.get(day_en, day_en)
    elif any(e in lang_lower for e in ["en", "english"]):
        return WEEKDAY_MAP_EN.get(day_en, day_en)
    else:
        return WEEKDAY_MAP_FR.get(day_en, day_en)


def get_current_lunar_date() -> str:
    """获取农历日期字符串（仅中文模式使用）"""
    try:
        import cnlunar
        now = datetime.now()
        today_lunar = cnlunar.Lunar(now, godType="8char")
        return "%s年%s%s" % (
            today_lunar.lunarYearCn,
            today_lunar.lunarMonthCn[:-1],
            today_lunar.lunarDayCn,
        )
    except Exception:
        return ""


def get_current_time_info(lang: str = "fr") -> tuple:
    """
    获取当前时间信息
    返回: (当前时间字符串, 今天日期, 今天星期, 农历日期)
    """
    current_time = get_current_time()
    today_date = get_current_date()
    today_weekday = get_current_weekday(lang=lang)

    lang_lower = str(lang).lower()
    if any(z in lang_lower for z in ["zh", "中文", "chinese"]):
        lunar_date = get_current_lunar_date()
    else:
        lunar_date = ""

    return current_time, today_date, today_weekday, lunar_date
