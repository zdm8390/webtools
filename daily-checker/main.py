import sys
import os
import threading
import time
import webview
from app import app

def start_flask():
    # Flaskサーバー起動
    app.run(host='127.0.0.1', port=5555, debug=False, use_reloader=False)

if __name__ == '__main__':
    # PyInstaller用パス解決関数
    if getattr(sys, 'frozen', False):
        template_folder = os.path.join(sys._MEIPASS, 'templates')
        static_folder = os.path.join(sys._MEIPASS, 'static')
        app.template_folder = template_folder
        app.static_folder = static_folder

    # スレッドでFlaskサーバーをスタート
    t = threading.Thread(target=start_flask)
    t.daemon = True
    t.start()

    # サーバーの立ち上がりを短時間待機
    time.sleep(0.8)

    # pywebview でデスクトップアプリウィンドウを開く（ブラウザは開かない）
    webview.create_window(
        title='蔵書点検チェックツール Pro',
        url='http://127.0.0.1:5555',
        width=1280,
        height=850,
        min_size=(900, 600),
        resizable=True
    )
    webview.start()
