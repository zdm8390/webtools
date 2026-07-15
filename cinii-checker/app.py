import webview
import requests
import sys
import os
import traceback
import urllib3

# SSL証明書エラーの警告を抑制
# 学内・社内等のプロキシ環境下（SSL復号化プロキシ）でSSL証明書検証エラーになる現象に対応するため、
# やむを得ず verify=False でリクエストを処理しています。
# 一般公開される本番環境では、不正な中間者攻撃を防ぐために verify=True (SSL検証有効) が推奨されますが、
# クライアント環境の多様なネットワーク形態下での動作安定性を最優先するためのトレードオフ設計です。
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class Api:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def check_ncid(self, ncid):
        """
        指定したNCIDの書誌情報と所蔵情報をCiNiiから取得して返します。
        """
        ncid = ncid.strip()
        if not ncid:
            return {"ncid": ncid, "status": "error", "message": "書誌IDが空です"}
        
        # 安全性: URLに予期せぬインジェクションが発生しないようIDをサニタイズ（念のため英数字に制限）
        # フロントエンド側でもバリデーションしていますが、バックエンド側でも検証します
        if not ncid.isalnum():
            return {"ncid": ncid, "status": "error", "message": "不正な書誌ID形式です"}
            
        url = f"https://ci.nii.ac.jp/ncid/{ncid}.json"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        try:
            # OS/環境変数プロキシを自動利用し、timeoutは20秒、証明書検証はスルー
            response = requests.get(url, headers=headers, verify=False, timeout=20)
            
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

            # タイトルの抽出
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
            
            # 著者の抽出
            creator = book_info.get("dc:creator", "")
            if isinstance(creator, list):
                creator = ", ".join(creator)

            # 出版社の抽出
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

            # 出版年
            date = book_info.get("dc:date", "")

            # 所蔵館数
            owner_count_str = book_info.get("cinii:ownerCount", "0")
            try:
                owner_count = int(owner_count_str)
            except ValueError:
                owner_count = 0

            # 所蔵館リスト
            owners_raw = book_info.get("bibo:owner", [])
            owners = []
            if isinstance(owners_raw, dict):
                owners_raw = [owners_raw]
            
            # 三重大学の所蔵判定用フラグとOPACリンク
            # 三重大学附属図書館: FA002564
            # 三重大学医学部図書館: FA002575
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
            # セキュリティ: 内部システム情報（ファイルパス等）がユーザーに漏洩しないよう
            # 詳細な例外トレースはコンソール（標準エラー）にのみ出力し、フロントには汎用エラーを返す
            print(f"Error checking NCID {ncid}:", file=sys.stderr)
            traceback.print_exc()
            return {
                "ncid": ncid,
                "status": "error",
                "message": "情報の取得に失敗しました"
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
    これにより、WebView がローカルファイルをロードする際の 404 エラーを完全に防ぎます。
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
            
        # HTML 内のスタイルシートとスクリプト読み込みタグをインラインの中身に置換
        html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
        html = html.replace('<script src="script.js"></script>', f'<script>\n{js}\n</script>')
        return html
    except Exception as e:
        print("Failed to bundle HTML assets:", file=sys.stderr)
        traceback.print_exc()
        return "<html><body><h3>アセットの読み込みに失敗しました</h3><p>アプリケーションを再インストールしてください。</p></body></html>"

def main():
    api = Api()
    
    # HTMLとCSS/JSを合体させた単一HTMLデータをロード
    html_content = load_html_with_assets()

    window = webview.create_window(
        title="CiNii 所蔵館チェッカー",
        html=html_content,  # urlの代わりにhtmlデータを直接渡す（404問題を完全回避）
        js_api=api,
        width=1150,
        height=800,
        min_size=(950, 600),
        resizable=True
    )
    api.set_window(window)
    
    # 本番ビルド時は debug=False に設定することを想定
    # 配布時に開発ツール（F12）が露出するのを防ぐため、製品版としては通常 debug=False が推奨されます
    webview.start(debug=False)

if __name__ == '__main__':
    main()
