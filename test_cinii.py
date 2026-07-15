import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://ci.nii.ac.jp/ncid/BD18195266.json"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

try:
    with urllib.request.urlopen(req, context=ctx) as res:
        raw_data = res.read()
        charset = res.headers.get_content_charset() or 'utf-8'
        data = json.loads(raw_data.decode(charset))
        
        graph = data.get("@graph", [])
        book_info = {}
        for item in graph:
            if "bibo:Book" in item.get("@type", "") or item.get("@type") == "bibo:Book":
                book_info = item
                break
        
        title = book_info.get("dc:title", [])
        title_str = ""
        if isinstance(title, list):
            for t in title:
                if isinstance(t, dict):
                    if t.get("@language") == "ja" or "@language" not in t:
                        title_str = t.get("@value", "")
                else:
                    title_str = t
        else:
            title_str = title
            
        owner_count = book_info.get("cinii:ownerCount", "0")
        owners = book_info.get("bibo:owner", [])
        
        # ファイルに書き出す
        with open("output_test.txt", "w", encoding="utf-8") as f:
            f.write(f"Title: {title_str}\n")
            f.write(f"Owner Count: {owner_count}\n")
            f.write(f"Actual owners list size: {len(owners)}\n")
            f.write("Owners:\n")
            for owner in owners:
                name = owner.get("foaf:name", "")
                opac_link = owner.get("rdfs:seeAlso", {}).get("@id", "")
                f.write(f"- {name} (URL: {opac_link})\n")
                
        print("Success! Written to output_test.txt")
except Exception as e:
    import traceback
    traceback.print_exc()
