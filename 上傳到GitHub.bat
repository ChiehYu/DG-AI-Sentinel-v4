@echo off
chcp 65001 >nul
echo ========================================================
echo   準備將 DG AI Sentinel v3.0 最新介面上傳至 GitHub
echo ========================================================
echo.
echo 正在與 GitHub 連線並推送 main 主分支...
"C:\Users\dennis.chiang_nb\AppData\Local\Programs\Git\cmd\git.exe" push -u origin main
echo.
echo ========================================================
echo   如果上方沒顯示錯誤，代表已成功上傳到你的 GitHub！
echo   請過 1 分鐘後查看手機端的 GitHub Pages 網址。
echo ========================================================
pause
