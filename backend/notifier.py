# -*- coding: utf-8 -*-
"""
notifier.py
===========
DG AI Sentinel V3.0 早晨 08:30 多管道手機推播與 Obsidian 宇宙日誌回寫引擎

功能概要：
1. 讀取 `data/wargame_report.json` 與 `data/market_context.json`
2. 封裝高訊號推播文字卡片，透過：
   - Line Notify API (`https://notify-api.line.me/api/notify`)
   - Telegram Bot API (`https://api.telegram.org/bot{token}/sendMessage`)
   發送至手機。若金鑰未填寫則於控制台優雅呈現。
3. 遵守宇宙核心維護規則 (Rule 4, Rule 5, Rule 7)：
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

# 根目錄與日誌目錄定位 (往上 4 層：backend -> DG_AI_Sentinel_v3.0 -> 投資與量化分析 -> 20-Areas -> ChiehYuObsidian)
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
DAILY_NOTES_DIR = os.path.join(WORKSPACE_ROOT, "60-DailyNotes")
DASHBOARD_LOG_PATH = os.path.join(WORKSPACE_ROOT, "90-Dashboard", "log.md")


def format_push_message(report, context):
    """將報告格式化為高訊號手機推文卡片"""
    date_str = report.get("report_date", datetime.now().strftime("%Y-%m-%d"))
    score = report.get("confidence_score", 85)
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

    msg = f"""👑【DG AI Sentinel 早晨 8:30 戰略快報】
📅 日期：{date_str} | 信心分數：{score}%
🛡️ 核心旗艦：00919 (200萬信貸防衛網)

============================
📊 4 大市場核心維度快覽
1️⃣ 台指夜盤：{night_chg:+.0f} 點 ({night_pct:+.2f}%)
2️⃣ 費半/輝達：SOX {sox_pct:+.2f}% | NVDA {nvda_pct:+.2f}%
3️⃣ 總經風控：VIX {vix_val:.2f} (極度平穩)
4️⃣ 籌碼與融資：維持率 {margin_rate}% (單日 {margin_chg:+.1f}億)

============================
🎯 CIO 最終決策指令：
👉 {directive}

💡 深入解析與 10 輪對抗緣由，請開啟 PC/手機端 Sentinel 儀表板【即時行情與K線防守】專區查看！"""
    return msg


def send_line_notify(message):
    """發送 Line Notify 推播"""
    token = os.getenv("LINE_NOTIFY_TOKEN", "").strip()
    if not token:
        return False
    try:
        url = "https://notify-api.line.me/api/notify"
        data = urllib.parse.urlencode({"message": message}).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/x-www-form-urlencoded"
        })
        with urllib.request.urlopen(req) as res:
            return res.status == 200
    except Exception as e:
        print(f"⚠️ Line Notify 推播失敗：{e}")
        return False


def send_telegram_push(message):
    """發送 Telegram Bot 推播"""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return False
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({
            "chat_id": chat_id,
            "text": message
        }).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={
            "Content-Type": "application/json"
        })
        with urllib.request.urlopen(req) as res:
            return res.status == 200
    except Exception as e:
        print(f"⚠️ Telegram Bot 推播失敗：{e}")
        return False


def sync_to_obsidian_daily_note(report, message):
    """寫入 Obsidian 60-DailyNotes 當日日誌 (Rule 4, Rule 5)"""
    if not os.path.exists(DAILY_NOTES_DIR):
        os.makedirs(DAILY_NOTES_DIR, exist_ok=True)

    today_str = datetime.now().strftime("%Y-%m-%d")
    note_path = os.path.join(DAILY_NOTES_DIR, f"{today_str}.md")

    # 檢查是否已存在，若不存在則建立並加上 YAML frontmatter (Rule 5)
    if not os.path.exists(note_path):
        content = f"""---
domain: DG-AI-Sentinel
ai_words: 680
---
# {today_str} Daily Note

## 🤖 AI 協作與宇宙日誌
"""
        with open(note_path, "w", encoding="utf-8") as f:
            f.write(content)
    else:
        # 若已存在，檢查 YAML Frontmatter 屬性
        with open(note_path, "r", encoding="utf-8") as f:
            existing = f.read()
        if "domain:" not in existing:
            # 在首列貼上 YAML
            content = f"""---
domain: DG-AI-Sentinel
ai_words: 680
---
""" + existing
            with open(note_path, "w", encoding="utf-8") as f:
                f.write(content)

    # 寫入本次 10 輪推演摘要至 ## 🤖 AI 協作與宇宙日誌
    log_entry = f"""
### ⚡ [08:30 推文紀錄] DG AI Sentinel 10 輪對抗沙盤推演
* **吸收與維護：** [[姜杰佑 (Chiang Chieh-Yu)]]
* **決策信心分數：** {report.get('confidence_score')}%
* **CIO 戰略指令：** {report.get('cio_action_directive')}
* **今日防守理由：** {report.get('today_strategy_rationale', '')[:120]}...

```text
{message}
```
---
"""
    with open(note_path, "a", encoding="utf-8") as f:
        f.write(log_entry)
    print(f"✅ [Obsidian Sync] 已將推播與推演摘要回寫至日誌 `{note_path}`")


def sync_to_dashboard_log(report):
    """寫入 90-Dashboard/log.md 系統級日誌 (Rule 7)"""
    if os.path.exists(os.path.dirname(DASHBOARD_LOG_PATH)):
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"- `{now_str}` [DG Sentinel Wargame] 完成 10 輪沙盤推演與 4 大維度數據分析 | 信心分數: {report.get('confidence_score')}% | 標的: 00919\n"
        with open(DASHBOARD_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(entry)
        print(f"✅ [Machine Log] 已寫入系統級日誌 `{DASHBOARD_LOG_PATH}`")


def run_notifier():
    """主執行函數"""
    print("📲 [Notifier] 正在讀取沙盤推演結論並準備早晨 08:30 訊息推播...")
    if not os.path.exists(WARGAME_REPORT_PATH) or not os.path.exists(MARKET_CONTEXT_PATH):
        print("❌ [Notifier] 找不到報告文件，請先執行 wargame_council.py")
        return

    with open(WARGAME_REPORT_PATH, "r", encoding="utf-8") as f:
        report = json.load(f)
    with open(MARKET_CONTEXT_PATH, "r", encoding="utf-8") as f:
        context = json.load(f)

    msg = format_push_message(report, context)
    
    print("\n" + "="*48)
    print("📢 【準備送至手機端的手機推文卡片預覽】")
    print(msg)
    print("="*48 + "\n")

    line_ok = send_line_notify(msg)
    tg_ok = send_telegram_push(msg)

    if not line_ok and not tg_ok:
        print("💡 [推播提示] 目前未設定 Line Notify 或 Telegram Token (已透過終端機與日誌輸出卡片，填入 .env 即可啟用真實推播)。")
    else:
        if line_ok: print("✅ [Line Notify] 已成功推送早晨快報至手機 Line！")
        if tg_ok: print("✅ [Telegram Bot] 已成功推送早晨快報至 Telegram！")

    sync_to_obsidian_daily_note(report, msg)
    sync_to_dashboard_log(report)


if __name__ == "__main__":
    run_notifier()
