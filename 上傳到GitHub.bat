@echo off
chcp 65001 >nul
echo =========================================================================
echo   準備將 DG AI Sentinel v4.0 旗艦戰情室與系統規格書 上傳至 GitHub
echo =========================================================================
echo.

:: 自動檢查系統 Git 路徑
set GIT_CMD=git
git --version >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set GIT_CMD="C:\Program Files\Git\cmd\git.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
        set GIT_CMD="%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
    ) else if exist "C:\Users\dennis.chiang_nb\AppData\Local\Programs\Git\cmd\git.exe" (
        set GIT_CMD="C:\Users\dennis.chiang_nb\AppData\Local\Programs\Git\cmd\git.exe"
    ) else (
        echo ❌ 錯誤：找不到 Git 工具！請確認電腦是否有安裝 Git。
        echo 💡 建議：可在終端機執行 `winget install --id Git.Git -e --source winget` 一鍵安裝。
        pause
        exit /b 1
    )
)

echo [1/3] 正在檢查並將最新檔案加入 Git 追蹤快照...
%GIT_CMD% add .

echo [2/3] 正在建立 v4.0 更新版本提交紀錄...
%GIT_CMD% commit -m "feat/fix: DG AI Sentinel v4.0 Wargame Council, LINE Messaging API push, and GITHUB_TOKEN write permissions"

echo.
echo [3/3] 正在將 v4.0 版本推送到 GitHub 遠端新專案...
%GIT_CMD% push -u origin main
echo.
echo =========================================================================
echo   [上傳結果確認]
echo   1. 如果上方顯示成功，代表已成功同步發布至 GitHub！
echo   2. 接著請回到 GitHub Actions 頁面，點選右上角 Re-run jobs 即可完美運行！
echo =========================================================================
pause
