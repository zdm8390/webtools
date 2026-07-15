@echo off
chcp 65001 > nul
echo ===================================================
echo  CiNii 所蔵館チェッカー ビルドスクリプト
echo ===================================================
echo.
echo [1/2] 依存ライブラリのインストール...
python -m pip install -r requirements.txt pyinstaller

echo.
echo [2/2] PyInstallerによる実行ファイル生成...
pyinstaller --noconsole --onefile --add-data "ui;ui" --name "CiNiiChecker" app.py

echo.
echo ===================================================
echo  ビルドが完了しました。
echo  dist/ フォルダ内の CiNiiChecker.exe を実行してください。
echo ===================================================
pause
