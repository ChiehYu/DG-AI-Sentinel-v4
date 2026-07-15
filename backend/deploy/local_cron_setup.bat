@echo off
:: ==============================================================================
:: DG AI Sentinel V3.0 - 本地 Windows 工作排程器一鍵註冊腳本
:: 執行後將會在 Windows 系統註冊每天早晨 08:15 自動執行沙盤推演與推播
:: ==============================================================================

chcp 65001 >nul
echo 正在為您設定 Windows 系統工作排程器...
echo 任務名稱：DG_AI_Sentinel_Daily_0815
echo 執行頻率：每日早晨 08:15
echo.

set PROJECT_DIR=%~dp0..
set PYTHON_EXE=python

schtasks /create /tn "DG_AI_Sentinel_Daily_0815" /tr "cmd /c cd /d \"%PROJECT_DIR%\" && %PYTHON_EXE% run_daily_sentinel.py" /sc daily /st 08:15 /f

if %errorlevel% equ 0 (
    echo.
    echo ✅ 【設定成功！】系統將於每天早晨 08:15 自動為您抓取 4 大市場與融資籌碼數據並推送至手機。
    echo 💡 若要手動測試執行該任務，可在終端機輸入：schtasks /run /tn "DG_AI_Sentinel_Daily_0815"
) else (
    echo.
    echo ❌ 【設定失敗！】請點選本 batch 檔案「右鍵」 -> 「以系統管理員身分執行」再試一次。
)

pause
