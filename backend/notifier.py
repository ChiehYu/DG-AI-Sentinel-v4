# -*- coding: utf-8 -*-
"""
notifier.py
===========
DG AI Sentinel V4.0 早晨 08:30 多標的分層推播與 Obsidian 宇宙日誌回寫引擎

功能概要：
1. 讀取 `data/wargame_report.json` 與 `data/market_context.json`
2. 封裝 4 張高清晰度推文卡片（含真實股價與 V4.0 旗艦戰情室 clickable URL）
3. 優先發送至 LINE Messaging API Push (`LINE_CHANNEL_ACCESS_TOKEN` + `LINE_USER_ID`)
4. 兼顧舊版 LINE Notify 與 Telegram Bot 備援
5. 同步回寫當日策略至 Obsidian `60-DailyNotes` 與 `90-Dashboard/log.md`
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime

if sys.platform.startswith('win'):
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
WARGAME_REPORT_PATH = os.path.join(DATA_DIR, "wargame_report.json")
MARKET_CONTEXT_PATH = os.path.join(DATA_DIR, "market_context.json")

OBSIDIAN_VAULT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))


def load_json(filepath):
    if not os.path.exists(filepath):
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def format_multi_symbol_push_messages(report, context):
    """
    將晨間沙盤推演報告與市場 context 封裝為 4 張高清晰度推文卡片
    """
    today_str = report.get("wargame_date", datetime.now().strftime("%Y-%m-%d"))
    score = report.get("overall_market_confidence", 88)
    cio_summary = report.get("cio_executive_summary", "今日動能穩健，分批承接、嚴守防線。")

    # 市場總覽
    cat1 = context.get("categories", {}).get("cat1_taifex_night", {})
    cat2 = context.get("categories", {}).get("cat2_us_stocks", {})
    cat3 = context.get("categories", {}).get("cat3_macro_black_swan", {})
    cat4 = context.get("categories", {}).get("cat4_taiwan_margin", {})

    night_q = cat1.get("night_futures", {})
    night_price = night_q.get("price", "N/A")
    night_chg = night_q.get("change", 0.0)
    night_pct = night_q.get("change_pct", 0.0)
    night_sign = "+" if isinstance(night_chg, (int, float)) and night_chg >= 0 else ""

    sox_q = cat2.get("indices", {}).get("sox", {})
    nvda_q = cat2.get("tech_leaders", {}).get("nvda", {})
    vix_q = cat3.get("vix", {})
    margin_m = cat4.get("margin_analysis", {})

    # 卡片 1：早間 08:30 戰略總覽
    card1 = f"""👑【DG AI Sentinel 早間 08:30 戰略總覽】
📅 日期：{today_str} ｜ 全場信心分數：{score}%
============================
📊 4 大金融市場與籌碼指標：
1️⃣ 台指夜盤：{night_price} ({night_sign}{night_chg}點, {night_sign}{night_pct}%)
2️⃣ 費半/輝達：SOX {sox_q.get('change_pct','N/A')}% ｜ NVDA {nvda_q.get('change_pct','N/A')}%
3️⃣ 總經風控：VIX {vix_q.get('price','N/A')} ({cat3.get('status_alerts',{}).get('vix_status','區間平穩')})
4️⃣ 大盤融資：維持率 {margin_m.get('market_margin_maintenance_rate','N/A')}% (單日 {margin_m.get('market_daily_margin_change_twd','N/A')}億)
============================
🎯 首席總監 (CIO) 今日全景指令：
👉 {cio_summary}"""

    # 提取各個股詳細實操點位
    symbols_map = report.get("symbol_reports", {})
    core_quotes = context.get("core_tracking_stocks", {})

    def get_card_section(sym, name):
        s_data = symbols_map.get(sym, {})
        plan = s_data.get("actionable_plan", {})
        q_data = core_quotes.get(sym, {})
        live_p = q_data.get("price", "N/A")
        live_chg = q_data.get("change_pct", "")
        chg_str = f" ({'+' if isinstance(live_chg, (int, float)) and live_chg>=0 else ''}{live_chg}%)" if live_chg != "" else ""
        
        verdict = plan.get("verdict", "🛡️ 穩健偏多 / 守穩黃線")
        stop_p = plan.get("dynamic_stop_price", "依技術均線")
        advice = plan.get("execution_advice", "守穩動態防守黃線續抱。")
        
        return f"""📌【{sym} {name}】現價：${live_p}{chg_str}
▫️ 策略定調：{verdict}
▫️ 防守黃線：${stop_p}
▫️ 實操要點：
{advice}"""

    # 卡片 2：權值與進攻三傑 10 輪對抗策略 (2330, 2454, 3037)
    card2_sections = [
        get_card_section("2330", "台積電"),
        get_card_section("2454", "聯發科"),
        get_card_section("3037", "欣興")
    ]
    card2 = f"""🚀【權值與進攻三傑 10 輪對抗策略】
============================
{"\n----------------------------\n".join(card2_sections)}"""

    # 卡片 3：月月配防守三劍客與信貸對沖 (00919, 0056, 00878)
    card3_sections = [
        get_card_section("00919", "群益精選高息"),
        get_card_section("0056", "元大高股息"),
        get_card_section("00878", "國泰永續高息")
    ]
    card3 = f"""🛡️【月月配防守三劍客與信貸對沖】
============================
{"\n----------------------------\n".join(card3_sections)}"""

    # 卡片 4：戰情室傳送門與每日紀錄 (加入 V4.0 Clickable URL)
    card4 = f"""📱【V4.0 旗艦戰情室傳送門與每日紀錄】
💡 完整的 4 大角色 10 輪交鋒對抗紀錄、各大券商估值與 6 大個股 ECharts 均線副圖，請立刻點擊下方傳送門進入儀表板查看：

🔗 V4.0 旗艦戰情室網址：
https://chiehyu.github.io/DG-AI-Sentinel-v4/

*(或者開啟備用專案地址：https://github.com/ChiehYu/DG-AI-Sentinel-v4 )*
* 吸收與維護：姜杰佑 (Chiang Chieh-Yu)"""

    return [card1, card2, card3, card4]


def send_line_messaging_api(messages_list):
    """
    透過 LINE Messaging API (`https://api.line.me/v2/bot/message/push`) 發送多張文字卡片
    """
    access_token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    user_id = os.getenv("LINE_USER_ID", "").strip()

    if not access_token or not user_id:
        print("💡 [LINE Messaging API] 未檢測到 `LINE_CHANNEL_ACCESS_TOKEN` 或 `LINE_USER_ID`，跳過此管道。")
        return False

    url = "https://api.line.me/v2/bot/message/push"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }

    line_messages = [{"type": "text", "text": msg} for msg in messages_list[:5]]
    payload = {
        "to": user_id,
        "messages": line_messages
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                print(f"✅ [LINE Messaging API] 成功發送 {len(line_messages)} 張推文卡片至用戶！")
                return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"❌ [LINE Messaging API] 推播失敗 (HTTP {e.code})：{err_body}")
    except Exception as e:
        print(f"❌ [LINE Messaging API] 發送過程例外：{e}")
    return False


def send_line_notify(message):
    token = os.getenv("LINE_NOTIFY_TOKEN", "").strip()
    if not token:
        return False
    url = "https://notify-api.line.me/api/notify"
    headers = {"Authorization": f"Bearer {token}"}
    data = urllib.parse.urlencode({"message": message}).encode("utf-8")
    try:
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status == 200
    except Exception:
        return False


def send_telegram_push(message):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not bot_token or not chat_id:
        return False
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": message}
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status == 200
    except Exception:
        return False


def sync_to_obsidian_daily_note(report, context, cards):
    """寫入 60-DailyNotes 宇宙日誌與 90-Dashboard/log.md"""
    today_str = report.get("wargame_date", datetime.now().strftime("%Y-%m-%d"))
    daily_notes_dir = os.path.join(OBSIDIAN_VAULT_ROOT, "60-DailyNotes")
    daily_note_path = os.path.join(daily_notes_dir, f"{today_str}.md")
    log_path = os.path.join(OBSIDIAN_VAULT_ROOT, "90-Dashboard", "log.md")

    if not os.path.exists(daily_notes_dir):
        try:
            os.makedirs(daily_notes_dir, exist_ok=True)
        except Exception:
            return

    log_entry = f"""
## 🤖 AI 協作與宇宙日誌 (`{datetime.now().strftime("%H:%M")}`)
---
domain: DG-AI-Sentinel
ai_words: 850
---
### 👑 DG AI Sentinel V4.0 晨間 10 輪對抗推演紀錄
* **全場信心分數**：{report.get('overall_market_confidence', 88)}%
* **CIO 總裁示警**：{report.get('cio_executive_summary', '')}

#### 🎯 核心 6 大個股與高息 ETF 今日實操點位：
"""
    symbols_map = report.get("symbol_reports", {})
    core_quotes = context.get("core_tracking_stocks", {})
    for sym, s_data in symbols_map.items():
        plan = s_data.get("actionable_plan", {})
        live_p = core_quotes.get(sym, {}).get("price", "N/A")
        log_entry += f"- **【{sym} {s_data.get('name', '')}】(現價 ${live_p})**：`{plan.get('verdict','')}`｜防守黃線：**${plan.get('dynamic_stop_price','')}**\n"
        log_entry += f"  - *操作建議*：{plan.get('execution_advice','').replace(chr(10), ' ')}\n"

    log_entry += "\n* 吸收與維護：[[姜杰佑 (Chiang Chieh-Yu)]]\n"

    try:
        content = ""
        if os.path.exists(daily_note_path):
            with open(daily_note_path, "r", encoding="utf-8") as f:
                content = f.read()

        if "## 🤖 AI 協作與宇宙日誌" in content:
            parts = content.split("## 🤖 AI 協作與宇宙日誌")
            new_content = parts[0] + log_entry + "\n## 🤖 AI 協作與宇宙日誌" + parts[1]
        else:
            new_content = content + "\n\n" + log_entry

        with open(daily_note_path, "w", encoding="utf-8") as f:
            f.write(new_content.strip() + "\n")
        print(f"✅ [Obsidian Sync] 已將 6 大個股操作建議寫入 `{daily_note_path}`")
    except Exception as e:
        print(f"⚠️ [Obsidian Sync] 寫入 DailyNote 遭遇異常：{e}")

    try:
        os.makedirs(os.path.join(OBSIDIAN_VAULT_ROOT, "90-Dashboard"), exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        msg = f"- `[{timestamp}]` [Machine Log] DG AI Sentinel V4.0 早間沙盤推演完成並推播 4 卡片至 LINE，同步更新 6 大個股行情。領域: `DG-AI-Sentinel` * 吸收與維護：[[姜杰佑 (Chiang Chieh-Yu)]]\n"
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(msg)
    except Exception:
        pass


def wait_until_taiwan_time_if_early(target_hour=8, target_minute=30):
    from datetime import timezone, timedelta
    import time
    tz_tw = timezone(timedelta(hours=8))
    now_tw = datetime.now(tz_tw)
    if now_tw.hour == target_hour and now_tw.minute < target_minute and "--now" not in sys.argv and "--test" not in sys.argv:
        target_tw = now_tw.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
        sleep_seconds = (target_tw - now_tw).total_seconds()
        if sleep_seconds > 0:
            print(f"⏰ [Notifier] 當前台灣時間 {now_tw.strftime('%H:%M:%S')}，為維持 Boss 睡眠品質，推播進入倒數...")
            print(f"⏳ 將在 {int(sleep_seconds)} 秒後（準時 {target_hour:02d}:{target_minute:02d}:00）發送手機推文卡片！")
            time.sleep(sleep_seconds)
            print(f"🔔 [Notifier] 台灣時間 {datetime.now(tz_tw).strftime('%H:%M:%S')} 已達！立刻發送推播！\n")


def run_notifier():
    from datetime import timezone, timedelta
    tz_tw = timezone(timedelta(hours=8))
    now_tw = datetime.now(tz_tw)
    if now_tw.weekday() in [5, 6] and "--force" not in sys.argv and "--test" not in sys.argv:
        print(f"☀️ [Weekend Guard] 今日為星期{['一','二','三','四','五','六','日'][now_tw.weekday()]} (周末休市日)。略過手機推文推播！")
        return True

    print("⏳ [Notifier] 載入沙盤推演報告與市場 context...")
    report = load_json(WARGAME_REPORT_PATH)
    context = load_json(MARKET_CONTEXT_PATH)

    if not report or not context:
        print("❌ [Notifier] 找不到 `wargame_report.json` 或 `market_context.json`，請先執行前置引擎。")
        return False

    cards = format_multi_symbol_push_messages(report, context)
    print("\n====================================================")
    print("📢 【準備送至 Boss 手機端的 4 張高清晰度推文卡片】")
    for idx, card in enumerate(cards, 1):
        print(f"\n--- [卡片 {idx}] ---")
        print(card)
    print("====================================================\n")

    wait_until_taiwan_time_if_early(target_hour=8, target_minute=30)

    pushed_line = send_line_messaging_api(cards)
    if not pushed_line:
        print("⚠️ 嘗試使用舊版 LINE Notify / Telegram Bot 進行備援推送...")
        combined_text = "\n\n".join(cards)
        send_line_notify(combined_text)
        send_telegram_push(combined_text)

    sync_to_obsidian_daily_note(report, context, cards)
    return True


if __name__ == "__main__":
    run_notifier()
