import webview
import urllib.request
import json
import ssl
import sys
import os

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
        
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        url = f"https://ci.nii.ac.jp/ncid/{ncid}.json"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

        try:
            with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
                charset = res.headers.get_content_charset() or 'utf-8'
                data = json.loads(res.read().decode(charset))
                
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
                
                for owner in owners_raw:
                    name = owner.get("foaf:name", "")
                    opac_link = owner.get("rdfs:seeAlso", {}).get("@id", "")
                    owners.append({
                        "name": name,
                        "url": opac_link
                    })

                return {
                    "ncid": ncid,
                    "status": "success",
                    "title": title_str,
                    "creator": creator,
                    "publisher": publisher_str,
                    "date": date,
                    "owner_count": owner_count,
                    "owners": owners,
                    "detail_url": f"https://ci.nii.ac.jp/ncid/{ncid}"
                }
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return {
                    "ncid": ncid,
                    "status": "not_found",
                    "message": "書誌IDが見つかりません"
                }
            return {
                "ncid": ncid,
                "status": "error",
                "message": f"HTTPエラー: {e.code}"
            }
        except Exception as e:
            return {
                "ncid": ncid,
                "status": "error",
                "message": f"エラー: {str(e)}"
            }

def get_resource_path(relative_path):
    """ PyInstaller の 1ファイル化に対応するためのパス解決 """
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath(os.path.dirname(__file__)), relative_path)

def main():
    api = Api()
    
    ui_dir = get_resource_path("ui")
    index_html = os.path.join(ui_dir, "index.html")
    
    # UIディレクトリが存在しない場合のフォールバック（開発時のカレントディレクトリなど）
    if not os.path.exists(index_html):
        index_html = os.path.abspath(os.path.join(os.path.dirname(__file__), "ui", "index.html"))

    window = webview.create_window(
        title="CiNii 所蔵館チェッカー",
        url=index_html,
        js_api=api,
        width=1100,
        height=800,
        min_size=(900, 600),
        resizable=True
    )
    api.set_window(window)
    webview.start(debug=True)

if __name__ == '__main__':
    main()
