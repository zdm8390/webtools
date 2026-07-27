@echo off
title 蔵書点検チェックツール Pro (Daily Checker)
echo ========================================================
echo   蔵書点検チェックツール Pro (Daily Checker)
echo   Local Web Application
echo ========================================================
echo.
echo バックエンドサーバーを起動しています...
timeout /t 2 /nobreak >nul
start http://127.0.0.1:5000
python app.py
pause
