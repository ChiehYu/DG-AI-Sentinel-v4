# -*- coding: utf-8 -*-
"""
run_daily_sentinel.py
=====================
DG AI Sentinel V4.0 主控總指揮腳本 (Daily Master Orchestrator)

功能概要：
每日清晨（如 08:15）自動化調度中心，依序執行：
1. `fetch_market_data.py` -> 抓取 4 大金融市場與籌碼融資數據
2. `wargame_council.py` -> 啟動 5 大角色 10 輪對抗沙盤推演
3. `notifier.py` -> 於 08:30 準時發送推文至手機，並同步 Obsidian 日誌與系統 Log

使用方式：
python run_daily_sentinel.py [--test]
"""

import os
import sys
import time
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

import fetch_market_data
import wargame_council
import notifier


def run_pipeline(is_test=False):
    from datetime import timezone, timedelta
    tz_tw = timezone(timedelta(hours=8))
    now_tw = datetime.now(tz_tw)
    if now_tw.weekday() in [5, 6] and not is_test and "--force" not in sys.argv:
        print(f"\n☀️ [Weekend Guard] 今日為星期{['一','二','三','四','五','六','日'][now_tw.weekday()]} (周末休市日)。為不打擾 Boss 週末休息，系統自動略過沙盤推演與推播！\n")
        return True

    print("=" * 60)
    print(f"🚀 【DG AI Sentinel V4.0 早晨 08:30 自動化推演總指揮啟動】")
    print(f"⏰ 執行時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} {'(測試驗證模式)' if is_test else ''}")
    print("=" * 60)
    start_time = time.time()

    # 步驟 1：4 大市場分類與融資籌碼數據擷取
    print("\n📦 [Step 1/3] 擷取 4 大核心市場數據 (夜盤、美股、黑天鵝、盤後融資)...")
    try:
        context = fetch_market_data.run_all_fetchers()
    except Exception as e:
        print(f"❌ [Step 1] 資料擷取遭遇例外，停止推演：{e}")
        return False

    # 步驟 2：5 大角色 10 輪對抗沙盤推演
    print("\n🧠 [Step 2/3] 啟動 Wargame Council 5 大角色 10 輪對抗沙盤推演...")
    try:
        report = wargame_council.run_wargame()
    except Exception as e:
        print(f"❌ [Step 2] 沙盤推演遭遇例外，停止推播：{e}")
        return False

    # 步驟 3：早晨手機推文發送與 Obsidian 日誌同步
    print("\n📲 [Step 3/3] 執行手機快報推播與 Obsidian 宇宙日誌回寫...")
    try:
        notifier.run_notifier()
    except Exception as e:
        print(f"❌ [Step 3] 推播或日誌同步遭遇例外：{e}")
        return False

    total_time = round(time.time() - start_time, 2)
    print("\n" + "=" * 60)
    print(f"🎉 【DG AI Sentinel V4.0 當日推演與推播工作流完美完結】")
    print(f"⏱️ 總共耗時：{total_time} 秒 | 產出報告：data/wargame_report.json")
    print("=" * 60 + "\n")
    return True


if __name__ == "__main__":
    is_test_mode = "--test" in sys.argv
    run_pipeline(is_test=is_test_mode)
