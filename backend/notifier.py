# -*- coding: utf-8 -*-
"""
notifier.py
===========
DG AI Sentinel V4.0 早晨 08:30 多標的分層推播與 Obsidian 宇宙日誌回寫引擎

功能概要：
1. 讀取 `data/wargame_report.json` 與 `data/market_context.json`
2. 封裝 4 張高訊號推播文字卡片（總經風控卡、權值進攻卡、收息防守卡、傳送門卡）。
3. 優先透過 LINE Messaging API (`https://api.line.me/v2/bot/message/push`) 利用發送權杖 (`LINE_CHANNEL_ACCESS_TOKEN`) 與接收者 ID (`LINE_USER_ID`) 傳送；
   同時兼容 Telegram Bot 與舊版 LINE Notify 作為多通道備援。
4. 遵守宇宙核心維護規則 (Rule 4, Rule 5, Rule 7)：
   - 同步記錄至當日日誌 `60-DailyNotes/YYYY-MM-DD.md` (`## 🤖 AI 協作與宇宙日誌`)
   - 寫入系統級日誌 `90-Dashboard/log.md`
   - 確保 YAML Frontmatter 帶入 `domain: DG-AI-Sentinel` 與 `ai_words`。
"""

import os
import sys
import io
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime

# 確保 Windows 終端機正常顯示 UTF-8 字符與表情符號
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

# 根目錄與日誌目錄定位 (往上 4 層：backend -> DG_AI_Sentinel_v4.0 -> 投資與量化分析 -> 20-Areas -> ChiehYuObsidian)
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
DAILY_NOTES_DIR = os.path.join(WORKSPACE_ROOT, "60-DailyNotes")
DASHBOARD_LOG_PATH = os.path.join(WORKSPACE_ROOT, "90-Dashboard", "log.md")


def format_multi_symbol_push_messages(report, context):
    """將報告格式化為 4 張結構化分開的手機推文卡片"""
    date_str = report.get("report_date", datetime.now().strftime("%Y-%m-%d"))
    score = report.get("confidence_score", 88)
    directive = report.get("cio_action_directive", "依動態防守黃線抱牢，分批承接")
    
    cat1 = context.get("categories", {}).get("cat1_taifex_night", {})
    cat2 = context.get("categories", {}).get("cat2_us_stocks", {})
    cat3 = context.get("categories", {}).get("cat3_macro_black_swan", {})
    cat4 = context.get("categories", {}).get("cat4_taiwan_margin", {})

    night_chg = cat1.get("night_futures", {}).get("change", 0)
    night_pct = cat1.get("night_futures", {}).get("change_pct", 0)
    sox_pct = cat2.get("indices", {}).get("sox", {}).get("change_pct", 0)
    nvda_pct = cat2.get("tech_leaders", {}).get("nvda", {}).get("change_pct", 0)
    vix_val = cat3.get("vix", {}).get("price", 0)
    margin_rate = cat4.get("margin_analysis", {}).get("market_margin_maintenance_rate", 168.4)
    margin_chg = cat4.get("margin_analysis", {}).get("market_daily_margin_change_twd", 0)

    symbol_reports = report.get("symbol_reports", {})

    # 卡片 1：總經與信心風控快報
    msg_macro = f"""👑【DG AI Sentinel 早間 08:30 戰略總覽】
📅 日期：{date_str} ｜ 全場信心分數：{score}%
============================
📊 4 大金融市場與籌碼指標：
1️⃣ 台指夜盤：{night_chg:+.0f} 點 ({night_pct:+.2f}%)
2️⃣ 費半/輝達：SOX {sox_pct:+.2f}% ｜ NVDA {nvda_pct:+.2f}%
3️⃣ 總經風控：VIX {vix_val:.2f} (區間平穩)
4️⃣ 大盤融資：維持率 {margin_rate}% (單日 {margin_chg:+.1f}億)
============================
🎯 首席總監 (CIO) 今日全景指令：
👉 {directive}"""

    # 封裝單個標的 Actionable Plan 函數
    def get_sym_card_section(sym_code, default_name):
        s_data = symbol_reports.get(sym_code, {})
        name = s_data.get("name", default_name)
        plan = s_data.get("actionable_plan", {})
        verdict = plan.get("verdict", s_data.get("cio_action_directive", "沿防守黃線緊抱"))
        stop_p = plan.get("dynamic_stop_price", "參照均線")
        advice = plan.get("execution_advice", "嚴守波段防守底線。")
        # 整理換行，避免推文過度鬆散
        advice_clean = advice.replace("\n", "\n   ")
        return f"""📌【{sym_code} {name}】
▫️ 策略定調：{verdict}
▫️ 防守黃線：${stop_p}
▫️ 實操要點：
   {advice_clean}"""

    # 卡片 2：權值與進攻三傑策略
    sec_2330 = get_sym_card_section("2330", "台積電")
    sec_2454 = get_sym_card_section("2454", "聯發科")
    sec_3037 = get_sym_card_section("3037", "欣興")
    msg_growth = f"""🚀【權值與進攻三傑 10 輪對抗策略】
============================
{sec_2330}
----------------------------
{sec_2454}
----------------------------
{sec_3037}"""

    # 卡片 3：月月配防守三劍客策略
    sec_00919 = get_sym_card_section("00919", "群益精選高息")
    sec_0056 = get_sym_card_section("0056", "元大高股息")
    sec_00878 = get_sym_card_section("00878", "國泰永續高息")
    msg_defense = f"""🛡️【月月配防守三劍客與信貸對沖】
============================
{sec_00919}
----------------------------
{sec_0056}
----------------------------
{sec_00878}"""

    # 卡片 4：傳送門
    msg_portal = f"""📱【戰情室傳送門與每日紀錄】
💡 完整的 4 大角色 10 輪交鋒對話、各大券商目標價與 6 大 ECharts 均線副圖，請前往 DG AI Sentinel 手機 PWA 或網頁戰情室儀表板查看！
* 吸收與維護：姜杰佑 (Chiang Chieh-Yu)"""

    return [msg_macro, msg_growth, msg_defense, msg_portal]


def send_line_messaging_api(messages):
    """
    發送 LINE Messaging API Push (官方帳號推文)
    一次可打包最高 5 則文字卡片結構送至 Boss 手機
    """
    token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "").strip()
    user_id = os.getenv("LINE_USER_ID", "").strip()
    if not token or not user_id:
        return False

    try:
        url = "https://api.line.me/v2/bot/message/push"
        payload_messages = []
        for msg_text in messages[:5]:
            payload_messages.append({
                "type": "text",
                "text": msg_text
            })
        
        data = json.dumps({
            "to": user_id,
            "messages": payload_messages
        }).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
        with urllib.request.urlopen(req) as res:
            return res.status == 200
    except Exception as e:
        print(f"⚠️ LINE Messaging API 推播失敗：{e}")
        return False


def send_line_notify(messages):
    """發送舊版 Line Notify 推播 (兼容備援)"""
    token = os.getenv("LINE_NOTIFY_TOKEN", "").strip()
    if not token:
        return False
    success = True
    try:
        url = "https://notify-api.line.me/api/notify"
        for msg_text in messages:
            data = urllib.parse.urlencode({"message": msg_text}).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/x-www-form-urlencoded"
            })
            with urllib.request.urlopen(req) as res:
                if res.status != 200:
                    success = False
            time.sleep(0.5)
        return success
    except Exception as e:
        print(f"⚠️ Line Notify 舊版通道推播失敗：{e}")
        return False


def send_telegram_push(messages):
    """發送 Telegram Bot 推播 (兼容備援)"""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return False
    success = True
    try:
        for msg_text in messages:
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            data = json.dumps({
                "chat_id": chat_id,
                "text": msg_text
            }).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers={
                "Content-Type": "application/json"
            })
            with urllib.request.urlopen(req) as res:
                if res.status != 200:
                    success = False
            time.sleep(0.5)
        return success
    except Exception as e:
        print(f"⚠️ Telegram Bot 推播失敗：{e}")
        return False


def sync_to_obsidian_daily_note(report, messages):
    """寫入 Obsidian 60-DailyNotes 當日日誌 (Rule 4, Rule 5)"""
    if not os.path.exists(DAILY_NOTES_DIR):
        os.makedirs(DAILY_NOTES_DIR, exist_ok=True)

    today_str = datetime.now().strftime("%Y-%m-%d")
    note_path = os.path.join(DAILY_NOTES_DIR, f"{today_str}.md")

    if not os.path.exists(note_path):
        content = f"""---
domain: DG-AI-Sentinel
ai_words: 950
---
# {today_str} Daily Note

## 🤖 AI 協作與宇宙日誌
"""
        with open(note_path, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        with open(note_path, "r", encoding="utf-8") as f:
            existing = f.read()
        if "domain:" not in existing:
            content = f"""---
domain: DG-AI-Sentinel
ai_words: 950
---
""" + existing
            with open(note_path, "w", encoding="utf-8") as f:
                f.write(content)

    full_push_text = "\n\n".join(messages)
    log_entry = f"""
### ⚡ [08:30 推文紀錄] DG AI Sentinel 多標的 10 輪對抗策略快報
* **吸收與維護：** [[姜杰佑 (Chiang Chieh-Yu)]]
* **決策信心分數：** {report.get('confidence_score', 88)}%
* **CIO 戰略指令：** {report.get('cio_action_directive')}

```text
{full_push_text}
```
---
"""
    with open(note_path, "a", encoding="utf-8") as f:
        f.write(log_entry)
    print(f"✅ [Obsidian Sync] 已將 4 卡推播精華與 6 大標的策略回寫至日誌 `{note_path}`")


def sync_to_dashboard_log(report):
    """寫入 90-Dashboard/log.md 系統級日誌 (Rule 7)"""
    if os.path.exists(os.path.dirname(DASHBOARD_LOG_PATH)):
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"- `{now_str}` [DG Sentinel Wargame] 完成 6 大個股 10 輪沙盤推演與多卡分層推文 | 信心分數: {report.get('confidence_score')}% | 旗艦: 00919\n"
        with open(DASHBOARD_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(entry)
        print(f"✅ [Machine Log] 已寫入系統級日誌 `{DASHBOARD_LOG_PATH}`")


def run_notifier():
    """主執行函數"""
    print("📲 [Notifier] 正在讀取沙盤推演結論並準備早間 08:30 訊息多卡推播...")
    if not os.path.exists(WARGAME_REPORT_PATH) or not os.path.exists(MARKET_CONTEXT_PATH):
        print("❌ [Notifier] 找不到報告文件，請先執行 wargame_council.py")
        return

    with open(WARGAME_REPORT_PATH, "r", encoding="utf-8") as f:
        report = json.load(f)
    with open(MARKET_CONTEXT_PATH, "r", encoding="utf-8") as f:
        context = json.load(f)

    messages = format_multi_symbol_push_messages(report, context)
    
    print("\n" + "="*52)
    print("📢 【準備送至 Boss 手機端的 4 張推文卡片預覽】")
    for idx, card in enumerate(messages, 1):
        print(f"\n--- [卡片 {idx}] ---")
        print(card)
    print("="*52 + "\n")

    # 優先發送 LINE Messaging API Push
    line_msg_ok = send_line_messaging_api(messages)
    # 兼容備援：發送舊版 Line Notify 與 Telegram
    line_notify_ok = send_line_notify(messages)
    tg_ok = send_telegram_push(messages)

    if not line_msg_ok and not line_notify_ok and not tg_ok:
        print("💡 [推播提示] 目前未在 .env 或 GitHub Secrets 讀取到 LINE/Telegram 權杖 (已於終端機預覽成功，填入 Token 即可推至手機)。")
    else:
        if line_msg_ok: print("✅ [LINE Messaging API] 已成功將 4 張精美策略卡推送至 Boss 的 LINE 官方帳號聊天室！")
        if line_notify_ok: print("✅ [LINE Notify 備援] 已成功發送！")
        if tg_ok: print("✅ [Telegram Bot 備援] 已成功推送至 Telegram！")

    sync_to_obsidian_daily_note(report, messages)
    sync_to_dashboard_log(report)


if __name__ == "__main__":
    run_notifier()
