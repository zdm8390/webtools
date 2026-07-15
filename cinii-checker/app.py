import webview
import requests
import sys
import os
import traceback
import urllib3
import socket
import urllib.request
import platform
import json

# SSL証明書エラーの警告を抑制
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

SETTINGS_FILE = "cinii_checker_settings.json"

class Api:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def get_settings(self):
        """
        設定ファイルから設定をロードします。ファイルが存在しない場合はデフォルト値を返します。
        """
        default_settings = {
            "max_limit": 200,
            "use_proxy": False,
            "proxy_host": "",
            "proxy_port": "",
            "proxy_user": "",
            "proxy_pass": ""
        }
        
        # 実行ファイルと同じディレクトリに設定ファイルを配置
        settings_path = os.path.join(os.path.abspath(os.path.dirname(sys.argv[0])), SETTINGS_FILE)
        
        # 開発中のためのフォールバック
        if not os.path.exists(settings_path):
            settings_path = os.path.join(os.path.abspath("."), SETTINGS_FILE)
            
        if os.path.exists(settings_path):
            try:
                with open(settings_path, "r", encoding="utf-8") as f:
                    user_settings = json.load(f)
                    # デフォルト値で補完
                    for k, v in default_settings.items():
                        if k not in user_settings:
                            user_settings[k] = v
                    return user_settings
            except Exception as e:
                print(f"Failed to load settings: {e}", file=sys.stderr)
                
        return default_settings

    def save_settings(self, settings):
        """
        設定をファイルに保存します。
        """
        settings_path = os.path.join(os.path.abspath(os.path.dirname(sys.argv[0])), SETTINGS_FILE)
        
        # 開発用のフォールバック
        if not os.path.exists(os.path.dirname(settings_path)):
            settings_path = os.path.join(os.path.abspath("."), SETTINGS_FILE)
            
        try:
            with open(settings_path, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=4, ensure_ascii=False)
            return {"status": "success", "message": "設定を保存しました。"}
        except Exception as e:
            print(f"Failed to save settings: {e}", file=sys.stderr)
            return {"status": "error", "message": f"設定の保存に失敗しました: {str(e)}"}

    def _get_proxies(self):
        """
        保存された設定に基づいて、requests 用のプロキシ辞書を生成します。
        """
        settings = self.get_settings()
        if settings.get("use_proxy"):
            host = settings.get("proxy_host", "").strip()
            port = settings.get("proxy_port", "").strip()
            user = settings.get("proxy_user", "").strip()
            password = settings.get("proxy_pass", "").strip()
            
            if host and port:
                if user and password:
                    # 認証ありプロキシ
                    proxy_url = f"http://{user}:{password}@{host}:{port}"
                else:
                    # 認証なしプロキシ
                    proxy_url = f"http://{host}:{port}"
                
                return {
                    "http": proxy_url,
                    "https": proxy_url
                }
        return None

    def check_ncid(self, ncid):
        """
        指定したNCIDの書誌情報と所蔵情報をCiNiiから取得して返します。
        """
        ncid = ncid.strip()
        if not ncid:
            return {"ncid": ncid, "status": "error", "message": "書誌IDが空です"}
        
        if not ncid.isalnum():
            return {"ncid": ncid, "status": "error", "message": "不正な書誌ID形式です"}
            
        url = f"https://ci.nii.ac.jp/ncid/{ncid}.json"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        # 設定された手動プロキシを取得
        proxies = self._get_proxies()

        try:
            # プロキシ設定がある場合は適用し、無い場合は requests がOSのプロキシ設定を自動利用します
            response = requests.get(url, headers=headers, verify=False, timeout=20, proxies=proxies)
            
            if response.status_code == 404:
                return {
                    "ncid": ncid,
                    "status": "not_found",
                    "message": "書誌IDが見つかりません"
                }
            elif response.status_code != 200:
                return {
                    "ncid": ncid,
                    "status": "error",
                    "message": f"HTTPエラー: {response.status_code}"
                }

            data = response.json()
            
            graph = data.get("@graph", [])
            book_info = {}
            for item in graph:
                types = item.get("@type", "")
                if isinstance(types, list):
                    is_book = "bibo:Book" in types
                else:
                    is_book = types == "bibo:Book"
                    
                if is_book:
                    book_info = item
                    break
            
            if not book_info:
                return {
                    "ncid": ncid,
                    "status": "not_found",
                    "message": "書誌情報が見つかりませんでした"
                }

            title = book_info.get("dc:title", [])
            title_str = "不明なタイトル"
            if isinstance(title, list):
                for t in title:
                    if isinstance(t, dict):
                        if t.get("@language") == "ja" or "@language" not in t:
                            title_str = t.get("@value", "")
                    else:
                        title_str = t
            elif isinstance(title, dict):
                title_str = title.get("@value", "")
            else:
                title_str = title
            
            creator = book_info.get("dc:creator", "")
            if isinstance(creator, list):
                creator = ", ".join(creator)

            publisher = book_info.get("dc:publisher", [])
            publisher_str = ""
            if isinstance(publisher, list):
                pub_list = []
                for p in publisher:
                    if isinstance(p, dict):
                        pub_list.append(p.get("@value", ""))
                    else:
                        pub_list.append(p)
                publisher_str = ", ".join(pub_list)
            elif isinstance(publisher, dict):
                publisher_str = publisher.get("@value", "")
            else:
                publisher_str = publisher

            date = book_info.get("dc:date", "")
            owner_count_str = book_info.get("cinii:ownerCount", "0")
            try:
                owner_count = int(owner_count_str)
            except ValueError:
                owner_count = 0

            owners_raw = book_info.get("bibo:owner", [])
            owners = []
            if isinstance(owners_raw, dict):
                owners_raw = [owners_raw]
            
            has_mie_univ = False
            mie_opac_url = ""

            for owner in owners_raw:
                name = owner.get("foaf:name", "")
                opac_link = owner.get("rdfs:seeAlso", {}).get("@id", "")
                owner_id = owner.get("@id", "")
                
                owners.append({
                    "name": name,
                    "url": opac_link
                })
                
                if "FA002564" in owner_id or "FA002575" in owner_id:
                    has_mie_univ = True
                    if "FA002564" in owner_id or not mie_opac_url:
                        mie_opac_url = opac_link

            return {
                "ncid": ncid,
                "status": "success",
                "title": title_str,
                "creator": creator,
                "publisher": publisher_str,
                "date": date,
                "owner_count": owner_count,
                "owners": owners,
                "has_mie_univ": has_mie_univ,
                "mie_opac_url": mie_opac_url,
                "detail_url": f"https://ci.nii.ac.jp/ncid/{ncid}"
            }
        except requests.exceptions.Timeout:
            return {
                "ncid": ncid,
                "status": "error",
                "message": "接続タイムアウト（応答なし）"
            }
        except requests.exceptions.ProxyError:
            return {
                "ncid": ncid,
                "status": "error",
                "message": "プロキシ接続エラー"
            }
        except requests.exceptions.ConnectionError:
            return {
                "ncid": ncid,
                "status": "error",
                "message": "接続エラー（通信環境を確認してください）"
            }
        except Exception as e:
            print(f"Error checking NCID {ncid}:", file=sys.stderr)
            traceback.print_exc()
            return {
                "ncid": ncid,
                "status": "error",
                "message": "情報の取得に失敗しました"
            }

    def run_network_diagnostic(self):
        """
        有線LAN環境などで発生するタイムアウト等の接続エラーの原因を特定するための
        診断ログファイルを生成し、結果を返します。
        """
        log_path = os.path.join(os.path.abspath(os.path.dirname(sys.argv[0])), "cinii_checker_diagnostic.log")
        
        # 開発用のフォールバック
        if not os.path.exists(os.path.dirname(log_path)):
            log_path = os.path.join(os.path.abspath("."), "cinii_checker_diagnostic.log")
            
        try:
            with open(log_path, "w", encoding="utf-8") as f:
                f.write("===================================================\n")
                f.write("  CiNii 所蔵館チェッカー ネットワーク診断レポート\n")
                f.write("===================================================\n\n")
                
                # 1. 基本システム情報
                f.write("[1. システム情報]\n")
                f.write(f"OS: {platform.platform()}\n")
                f.write(f"Python Version: {sys.version}\n")
                f.write(f"App version: 1.3.0 (Proxy Support & Diagnostics)\n\n")
                
                # 2. 環境変数プロキシ設定
                f.write("[2. 環境変数プロキシ設定]\n")
                proxy_envs = ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "NO_PROXY", "http_proxy", "https_proxy"]
                found_env = False
                for env in proxy_envs:
                    val = os.environ.get(env)
                    if val:
                        f.write(f"{env}: {val}\n")
                        found_env = True
                if not found_env:
                    f.write("プロキシ関連の環境変数は設定されていません。\n")
                f.write("\n")
                
                # 3. システムプロキシ自動検出結果
                f.write("[3. システムプロキシ自動検出 (urllib.request)]\n")
                try:
                    system_proxies = urllib.request.getproxies()
                    if system_proxies:
                        for k, v in system_proxies.items():
                            f.write(f"{k}: {v}\n")
                    else:
                        f.write("検出されたシステムプロキシはありません（直接接続モード）。\n")
                except Exception as ex:
                    f.write(f"プロキシ検出エラー: {str(ex)}\n")
                f.write("\n")
                
                # 手動設定されたプロキシの確認
                settings = self.get_settings()
                f.write("[3.5 手動プロキシ設定の登録状態]\n")
                f.write(f"手動プロキシを使用: {settings.get('use_proxy')}\n")
                f.write(f"ホスト: {settings.get('proxy_host')}\n")
                f.write(f"ポート: {settings.get('proxy_port')}\n")
                f.write(f"ユーザー指定: {'あり' if settings.get('proxy_user') else 'なし'}\n")
                f.write("\n")
                
                # 4. DNS解決テスト (ci.nii.ac.jp)
                f.write("[4. DNS名前解決テスト (ci.nii.ac.jp)]\n")
                target_host = "ci.nii.ac.jp"
                try:
                    ip = socket.gethostbyname(target_host)
                    f.write(f"{target_host} のIPアドレス: {ip}\n")
                except Exception as ex:
                    f.write(f"名前解決エラー:\n{str(ex)}\n")
                f.write("\n")
                
                # 5. TCP接続テスト (ポート443)
                f.write("[5. TCPソケット接続テスト (ci.nii.ac.jp:443)]\n")
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(5.0)
                    s.connect((target_host, 443))
                    f.write(f"ポート 443 (HTTPS) への直接TCP接続に成功しました。\n")
                    s.close()
                except Exception as ex:
                    f.write(f"TCP接続エラー (ファイアウォールによる外部接続の遮断、またはポート443の不通の可能性があります):\n{str(ex)}\n")
                f.write("\n")
                
                # 6. HTTPリクエストテスト
                f.write("[6. HTTPリクエストテスト (requests)]\n")
                test_url = "https://ci.nii.ac.jp/ncid/BD18195266.json"
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
                proxies = self._get_proxies()
                try:
                    f.write(f"テストURL: {test_url}\n")
                    f.write(f"適用プロキシ: {proxies}\n")
                    f.write("リクエスト送信中 (verify=False, timeout=10)... \n")
                    res = requests.get(test_url, headers=headers, verify=False, timeout=10, proxies=proxies)
                    f.write(f"HTTPステータスコード: {res.status_code}\n")
                    f.write(f"レスポンスサイズ: {len(res.text)} bytes\n")
                    f.write("リクエストの送受信に成功しました。\n")
                except Exception as ex:
                    f.write("HTTPリクエストエラーが発生しました:\n")
                    traceback.print_exc(file=f)
                f.write("\n")
                
                f.write("================ End of Report ================\n")
                
            return {
                "status": "success",
                "log_path": log_path,
                "message": "診断テストが完了しました。"
            }
        except Exception as e:
            print("Failed to run network diagnostic:", file=sys.stderr)
            traceback.print_exc()
            return {
                "status": "error",
                "message": f"診断レポートの生成中に内部エラーが発生しました: {str(e)}"
            }

def get_resource_path(relative_path):
    """ PyInstaller の 1ファイル化に対応するためのパス解決 """
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath(os.path.dirname(__file__)), relative_path)

def load_html_with_assets():
    """
    ui/index.html を読み込み、同じ階層にある style.css と script.js を
    HTML 内にインラインで埋め込んで単一の HTML 文字列を生成します。
    """
    ui_dir = get_resource_path("ui")
    
    index_path = os.path.join(ui_dir, "index.html")
    css_path = os.path.join(ui_dir, "style.css")
    js_path = os.path.join(ui_dir, "script.js")
    
    if not os.path.exists(index_path):
        base = os.path.abspath(os.path.dirname(__file__))
        index_path = os.path.join(base, "ui", "index.html")
        css_path = os.path.join(base, "ui", "style.css")
        js_path = os.path.join(base, "ui", "script.js")
        
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
            
        with open(css_path, "r", encoding="utf-8") as f:
            css = f.read()
            
        with open(js_path, "r", encoding="utf-8") as f:
            js = f.read()
            
        html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
        html = html.replace('<script src="script.js"></script>', f'<script>\n{js}\n</script>')
        return html
    except Exception as e:
        print("Failed to bundle HTML assets:", file=sys.stderr)
        traceback.print_exc()
        return "<html><body><h3>アセットの読み込みに失敗しました</h3><p>アプリケーションを再インストールしてください。</p></body></html>"

def main():
    api = Api()
    html_content = load_html_with_assets()

    window = webview.create_window(
        title="CiNii 所蔵館チェッカー",
        html=html_content,
        js_api=api,
        width=1150,
        height=800,
        min_size=(950, 600),
        resizable=True
    )
    api.set_window(window)
    webview.start(debug=False)

if __name__ == '__main__':
    main()
