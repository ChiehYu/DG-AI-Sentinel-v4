@echo off
chcp 65001 >nul
echo =========================================================================
echo   準備將 DG AI Sentinel v4.0 旗艦戰情室與系統規格書 上傳至 GitHub
echo =========================================================================
echo.
echo [1/3] 正在檢查並將最新檔案加入 Git 追蹤快照...
"C:\Users\dennis.chiang_nb\AppData\Local\Programs\Git\cmd\git.exe" add .

echo [2/3] 正在建立 v4.0 更新版本提交紀錄...
"C:\Users\dennis.chiang_nb\AppData\Local\Programs\Git\cmd\git.exe" commit -m "feat: DG AI Sentinel v4.0 War Room layout, Wargame Council, and system spec"

echo.
echo [3/3] 正在將 v4.0 版本推送到 GitHub 遠端新專案 (DG-AI-Sentinel-v4)...
"C:\Users\dennis.chiang_nb\AppData\Local\Programs\Git\cmd\git.exe" push -u origin main
echo.
echo =========================================================================
echo   [上傳結果確認]
echo   1. 如果上方顯示成功，代表已成功發布至 GitHub 新倉庫 DG-AI-Sentinel-v4！
echo   2. 如果出現 "Repository not found" 或錯誤，請放心，不會覆蓋到 V3.0。
echo      請先前往 GitHub 網頁版 ( https://github.com/new )，
echo      建立名為「 DG-AI-Sentinel-v4 」的全新 Repository (不要勾選 README)，
echo      建立完成後，再次點選執行本批次檔即可順利上傳成功！
echo =========================================================================
pause
