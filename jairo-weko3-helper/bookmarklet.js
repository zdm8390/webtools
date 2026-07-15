/**
 * JAIRO-Cloud / WEKO3 リポジトリ登録支援ツール - ブックマークレット版
 * 
 * このファイルには、開発用（可読）コードと、ブラウザのブックマークに登録して
 * 即座に使用できるMinify化＆URLエンコードされた「javascript:」形式のコードが格納されています。
 */

// ==========================================
// 1. コピペ用 Minify版コード (ブラウザのURL欄に登録するコード)
// ==========================================
/*
javascript:(async%20function(){const%20escH=s=%3E!s?%22%22:String(s).replace(/%26/g,%22%26amp;%22).replace(/%3C/g,%22%26lt;%22).replace(/%3E/g,%22%26gt;%22).replace(/%22/g,%22%26quot;%22).replace(/%27/g,%22%26%23039;%22);const%20doiRegex=/\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i;let%20selectedText=%22%22;try{selectedText=window.getSelection().toString().trim()}catch(e){}let%20doi=%22%22;if(selectedText){const%20match=selectedText.match(doiRegex);if(match)doi=match[1]}if(!doi){const%20selectors=[%22meta[name='citation_doi']%22,%22meta[name='dc.identifier'][scheme='doi']%22,%22meta[name='prism.doi']%22,%22meta[name='dc.identifier']%22];for(const%20sel%20of%20selectors){const%20el=document.querySelector(sel);if(el){const%20val=(el.getAttribute(%22content%22)||el.getAttribute(%22value%22)||%22%22).trim().replace(/^doi:/i,%22%22).trim();const%20match=val.match(doiRegex);if(match){doi=match[1];break}}}}if(!doi){doi=prompt(%22DOIが自動検出できませんでした。以下に入力してください:%22,%22%22);if(doi){const%20match=doi.match(doiRegex);if(match)doi=match[1];else%20doi=%22%22}}if(!doi){alert(%22DOIの取得をキャンセルしたか、正しい形式ではありません。%22);return}const%20toast=document.createElement(%22div%22);toast.style.cssText=%22position:fixed;top:20px;right:20px;background:#4f46e5;color:#fff;padding:12px%2024px;border-radius:8px;z-index:999999;font-family:sans-serif;box-shadow:0%204px%2012px%20rgba(0,0,0,0.3);font-size:14px;%22;toast.textContent=%22Crossref%20API%20連携中...%22;document.body.appendChild(toast);try{const%20res=await%20fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=academic-micro-saas-dev@example.jp`);if(!res.ok)throw%20new%20Error(%22DOIが見つからないかAPIエラーが発生しました。%22);const%20data=await%20res.json();const%20msg=data.message;const%20title=msg.title&&msg.title.length%3E0?msg.title[0]:%22%22;let%20author=%22%22;if(msg.author&&msg.author.length%3E0){author=msg.author.map(a=%3E{const%20f=a.family?a.family.trim():%22%22;const%20g=a.given?a.given.trim():%22%22;return(f&&g)?`${f},%20${g}`:(f||g||%22%22)}).filter(n=%3En!==%22%22).join(%22|%22)}const%20journal=msg[%22container-title%22]&&msg[%22container-title%22].length%3E0?msg[%22container-title%22][0]:%22%22;const%20volume=msg.volume||%22%22;const%20issue=msg.issue||%22%22;let%20pStart=%22%22,pEnd=%22%22;if(msg.page){const%20p=msg.page.split(/[-–—]+/);pStart=p[0]?p[0].trim():%22%22;pEnd=p[1]?p[1].trim():(p[0]?p[0].trim():%22%22)}let%20pubYear=%22%22;const%20dS=msg[%22published-print%22]||msg[%22published-online%22]||msg[%22issued%22]||msg[%22created%22];if(dS&&dS[%22date-parts%22]&&dS[%22date-parts%22][0]){pubYear=dS[%22date-parts%22][0][0]||%22%22}const%20issn=msg.ISSN&&msg.ISSN.length%3E0?msg.ISSN[0]:%22%22;const%20headers=[[%22%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%22,%22%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%EF%BC%88%E8%8B%B1%EF%BC%89%22,%22%E8%91%97%E8%80%85%E5%90%8D%22,%22%E9%9B%91%E8%AA%8C%E5%90%8D%22,%22%E5%B7%BB%22,%22%E5%8F%B7%22,%22%E9%96%8B%E5%A7%8B%E3%83%9A%E3%83%BC%E3%82%B8%22,%22%E7%B5%82%E4%BA%86%E3%83%9A%E3%83%BC%E3%82%B8%22,%22%E7%99%BA%E8%A1%8C%E5%B9%B4%22,%22ISSN%22,%22DOI%22],[%22title%22,%22alternative%22,%22creator%22,%22sourceTitle%22,%22volume%22,%22issue%22,%22pageStart%22,%22pageEnd%22,%22pubdate%22,%22issn%22,%22doi%22],[%22ja%22,%22en%22,%22ja%22,%22ja%22,%22ja%22,%22ja%22,%22ja%22,%22ja%22,%22ja%22,%22ja%22,%22ja%22]];const%20row=[title,%22%22,author,journal,volume,issue,pStart,pEnd,pubYear,issn,doi];const%20esc=t=%3E`%22${String(t||%22%22).replace(/%22/g,'%22%22')}%22`;let%20csv=%22%22;headers.forEach(r=%3E{csv+=r.map(esc).join(%22,%22)+%22\r\n%22});csv+=row.map(esc).join(%22,%22)+%22\r\n%22;const%20bom=new%20Uint8Array([239,187,191]);const%20blob=new%20Blob([bom,csv],{type:%22text/csv;charset=utf-8;%22});const%20url=URL.createObjectURL(blob);const%20a=document.createElement(%22a%22);a.href=url;a.download=`weko3_import_${doi.replace(/[^a-zA-Z0-9]/g,%22_%22)}.csv`;document.body.appendChild(a);a.click();setTimeout(()=%3E{document.body.removeChild(a);URL.revokeObjectURL(url)},100);document.body.removeChild(toast);const%20overlay=document.createElement(%22div%22);overlay.style.cssText=%22position:fixed;top:0;left:0;width:100%25;height:100%25;background:rgba(15,23,42,0.85);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#f8fafc;padding:20px;%22;const%20modal=document.createElement(%22div%22);modal.style.cssText=%22background:#1e293b;border:1px%20solid%20rgba(255,255,255,0.15);border-radius:16px;padding:24px;width:100%25;max-width:440px;box-shadow:0%2020px%2025px%20-5px%20rgba(0,0,0,0.3);box-sizing:border-box;position:relative;%22;const%20scpjUrl=issn?`https://scpj.nii.ac.jp/scpj/search?issn=${encodeURIComponent(issn)}`:`https://scpj.nii.ac.jp/scpj/search?journal=${encodeURIComponent(journal)}`;const%20sherpaUrl=issn?`https://v2.sherpa.ac.uk/id/publication/${encodeURIComponent(issn)}`:`https://v2.sherpa.ac.uk/id/publication/search?q=${encodeURIComponent(journal)}`;modal.innerHTML=`%3Ch3%20style='margin:0%200%208px%200;font-size:18px;color:#10b981;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;'%3E%E2%9C%94%20WEKO3%20CSV%E3%83%80%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%89%E5%AE%8C%E4%BA%86%3C/h3%3E%3Cp%20style='margin:0%200%2016px%200;font-size:12px;color:#94a3b8;word-break:break-all;'%3E${escH(title)}%3C/p%3E%3Cdiv%20style='background:rgba(15,23,42,0.4);border:1px%20solid%20rgba(255,255,255,0.08);border-radius:8px;padding:12px;margin-bottom:16px;text-align:left;font-size:12px;'%3E%3Cspan%20style='font-weight:bold;color:#f8fafc;'%3E著作権ポリシー確認:%3C/span%3E%3Cbr%3EISSN:%20${escH(issn||'%E3%81%AA%E3%81%97')}%20%E3%81%AE%E3%83%9D%E3%83%AA%E3%82%B7%E3%83%BC%E3%82%92確認してください。%3Cdiv%20style='margin-top:8px;display:flex;gap:12px;'%3E%3Ca%20href='${escH(scpjUrl)}'%20target='_blank'%20style='color:#818cf8;text-decoration:none;font-weight:bold;'%3ESCPJ%E6%A4%9C%E7%B4%A2%20%E2%86%97%3C/a%3E%3Ca%20href='${escH(sherpaUrl)}'%20target='_blank'%20style='color:#818cf8;text-decoration:none;font-weight:bold;'%3ESherpa%20Romeo%20%E2%86%97%3C/a%3E%3C/div%3E%3C/div%3E%3Cdiv%20style='background:linear-gradient(135deg,rgba(255,221,0,0.08)%200%25,rgba(247,183,49,0.08)%20100%25);border:1px%20dashed%20rgba(247,183,49,0.4);border-radius:10px;padding:12px;font-size:12px;margin-bottom:16px;'%3E%3Cspan%20style='color:#f7b731;font-weight:bold;'%3E☕%20業務はスピード解決しましたか？%3C/span%3E%3Cbr%3E%3Cp%20style='margin:4px%200%208px%200;color:#94a3b8;'%3Eもしお役に立ちましたら、コーヒーを1杯奢っていただけると励みになります！%3C/p%3E%3Ca%20href='https://www.buymeacoffee.com/yourusername'%20target='_blank'%20style='display:inline-block;background:linear-gradient(135deg,#ffdd00%200%25,#f7b731%20100%25);color:#1e1b4b;font-weight:bold;text-decoration:none;padding:8px%2016px;border-radius:20px;box-shadow:0%204px%2010px%20rgba(247,183,49,0.3);'%3EBuy%20Me%20a%20Coffee%E3%81%A7%E5%BF%9C%E6%8F%B4%3C/a%3E%3C/div%3E%3Cbutton%20id='weko3-close-btn'%20style='background:rgba(255,255,255,0.08);border:1px%20solid%20rgba(255,255,255,0.1);color:#f8fafc;padding:8px%2016px;border-radius:8px;font-size:12px;cursor:pointer;width:100%25;'%3E閉じる%3C/button%3E`;overlay.appendChild(modal);document.body.appendChild(overlay);document.getElementById(%22weko3-close-btn%22).onclick=()=%3Edocument.body.removeChild(overlay)}catch(err){if(document.body.contains(toast))document.body.removeChild(toast);alert(%22エラーが発生しました:%22+err.message+%22\n\n※Webサイトのセキュリティポリシー(CSP)によって外部API連携がブロックされた可能性があります。その場合はChrome拡張機能版をご利用ください。%22)}})();
*/


// ==========================================
// 2. 開発用・高可読性ソースコード
// ==========================================
(async function weko3ImporterBookmarklet() {
  // DOMベースのXSS対策のためのHTMLエスケープ関数
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i;
  let doi = "";

  // 優先度1: 選択テキストから抽出
  try {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      const match = selectedText.match(doiRegex);
      if (match) {
        doi = match[1];
      }
    }
  } catch (e) {
    console.error("Failed to read selection:", e);
  }

  // 優先度2: メタタグから自動取得
  if (!doi) {
    const selectors = [
      "meta[name='citation_doi']",
      "meta[name='dc.identifier'][scheme='doi']",
      "meta[name='prism.doi']",
      "meta[name='dc.identifier']",
      "meta[property='og:doi']"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const val = (element.getAttribute("content") || element.getAttribute("value") || "").trim()
          .replace(/^doi:/i, "")
          .trim();
        const match = val.match(doiRegex);
        if (match) {
          doi = match[1];
          break;
        }
      }
    }
  }

  // 優先度3: 手動入力（フォールバック）
  if (!doi) {
    const userInput = prompt("DOIが自動検出できませんでした。登録したい論文のDOIを入力してください:", "");
    if (userInput) {
      const match = userInput.match(doiRegex);
      if (match) {
        doi = match[1];
      } else {
        doi = "";
      }
    }
  }

  // キャンセルまたは不正な入力の場合の終了
  if (!doi) {
    alert("DOIの取得をキャンセルしたか、正しいDOI形式ではありません。");
    return;
  }

  // ローディングトーストの作成
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4f46e5;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 14px;
    pointer-events: none;
    transition: opacity 0.3s ease;
  `;
  toast.textContent = "Crossref API 連携中...";
  document.body.appendChild(toast);

  try {
    // Crossref REST API 連携
    const politeMailto = "academic-micro-saas-dev@example.jp";
    const apiUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=${encodeURIComponent(politeMailto)}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`DOIが見つからないかAPIエラーが発生しました (Status: ${response.status})`);
    }

    const data = await response.json();
    const msg = data.message;

    // メタデータの抽出
    const title = msg.title && msg.title.length > 0 ? msg.title[0] : "";
    
    // 著者名整形
    let author = "";
    if (msg.author && msg.author.length > 0) {
      author = msg.author.map(auth => {
        const family = auth.family ? auth.family.trim() : "";
        const given = auth.given ? auth.given.trim() : "";
        return (family && given) ? `${family}, ${given}` : (family || given || "");
      }).filter(name => name !== "").join("|");
    }

    const journal = msg["container-title"] && msg["container-title"].length > 0 ? msg["container-title"][0] : "";
    const volume = msg.volume || "";
    const issue = msg.issue || "";
    
    // ページ
    let pageStart = "";
    let pageEnd = "";
    if (msg.page) {
      const pages = msg.page.split(/[-–—]+/);
      pageStart = pages[0] ? pages[0].trim() : "";
      pageEnd = pages[1] ? pages[1].trim() : (pages[0] ? pages[0].trim() : "");
    }

    // 発行年
    let pubYear = "";
    const dateSource = msg["published-print"] || msg["published-online"] || msg["issued"] || msg["created"];
    if (dateSource && dateSource["date-parts"] && dateSource["date-parts"][0]) {
      pubYear = dateSource["date-parts"][0][0] || "";
    }

    // ISSN
    const issn = msg.ISSN && msg.ISSN.length > 0 ? msg.ISSN[0] : "";

    // CSVの生成 (JPCOAR準拠 3行ヘッダー)
    const headers = [
      ['タイトル', 'タイトル（英）', '著者名', '雑誌名', '巻', '号', '開始ページ', '終了ページ', '発行年', 'ISSN', 'DOI'],
      ['title', 'alternative', 'creator', 'sourceTitle', 'volume', 'issue', 'pageStart', 'pageEnd', 'pubdate', 'issn', 'doi'],
      ['ja', 'en', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja']
    ];
    
    const row = [title, '', author, journal, volume, issue, pageStart, pageEnd, pubYear, issn, doi];
    
    const escapeField = (text) => {
      const str = String(text || "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    let csvContent = "";
    headers.forEach(hRow => {
      csvContent += hRow.map(escapeField).join(",") + "\r\n";
    });
    csvContent += row.map(escapeField).join(",") + "\r\n";

    // UTF-8 with BOM でダウンロード
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weko3_import_${doi.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();

    // ダウンロード後クリーンアップ
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    // トースト削除
    document.body.removeChild(toast);

    // 登録完了通知と「Buy Me a Coffee」導線を含むモーダルの動的生成
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
      color: #f8fafc;
      padding: 20px;
      box-sizing: border-box;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 24px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
      box-sizing: border-box;
      position: relative;
      animation: weko3PopIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;

    // アニメーション用キーフレームの注入
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes weko3PopIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
    `;
    document.head.appendChild(styleSheet);

    const scpjUrl = issn 
      ? `https://scpj.nii.ac.jp/scpj/search?issn=${encodeURIComponent(issn)}`
      : `https://scpj.nii.ac.jp/scpj/search?journal=${encodeURIComponent(journal)}`;
    const sherpaUrl = issn
      ? `https://v2.sherpa.ac.uk/id/publication/${encodeURIComponent(issn)}`
      : `https://v2.sherpa.ac.uk/id/publication/search?q=${encodeURIComponent(journal)}`;

    // すべての変数出力を `escapeHtml` を用いてXSSから保護する
    modal.innerHTML = `
      <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #10b981; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">
        ✔ WEKO3 CSVダウンロード完了
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8; line-height: 1.4; word-break: break-all; text-align: center;">
        ${escapeHtml(title)}
      </p>
      
      <!-- ポリシー検索 -->
      <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: left; font-size: 12px; line-height: 1.5;">
        <span style="font-weight: bold; color: #f8fafc;">著作権ポリシー確認:</span><br>
        ISSN: ${escapeHtml(issn) || 'なし'} のセルフアーカイブポリシーを確認してください。
        <div style="margin-top: 8px; display: flex; gap: 12px;">
          <a href="${escapeHtml(scpjUrl)}" target="_blank" style="color: #818cf8; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 3px;">
            SCPJ検索 ↗
          </a>
          <a href="${escapeHtml(sherpaUrl)}" target="_blank" style="color: #818cf8; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 3px;">
            Sherpa Romeo ↗
          </a>
        </div>
      </div>

      <!-- Buy Me a Coffee -->
      <div style="background: linear-gradient(135deg, rgba(255, 221, 0, 0.08) 0%, rgba(247, 183, 49, 0.08) 100%); border: 1px dashed rgba(247, 183, 49, 0.4); border-radius: 10px; padding: 12px; font-size: 12px; margin-bottom: 16px; text-align: center; line-height: 1.5;">
        <span style="color: #f7b731; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; font-size: 13px;">☕ 業務はスピード解決しましたか？</span><br>
        <p style="margin: 4px 0 8px 0; color: #94a3b8;">もしお役に立ちましたら、コーヒーを1杯奢っていただけると励みになります！</p>
        <a href="https://www.buymeacoffee.com/yourusername" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #ffdd00 0%, #f7b731 100%); color: #1e1b4b; font-weight: bold; text-decoration: none; padding: 8px 16px; border-radius: 20px; box-shadow: 0 4px 10px rgba(247, 183, 49, 0.3); transition: transform 0.2s;">
          Buy Me a Coffeeで応援
        </a>
      </div>

      <button id="weko3-close-btn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.1); color: #f8fafc; padding: 8px 16px; border-radius: 8px; font-size: 12px; cursor: pointer; width: 100%; font-weight: 500;">
        閉じる
      </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 閉じるアクション
    document.getElementById("weko3-close-btn").onclick = () => {
      document.body.removeChild(overlay);
      document.head.removeChild(styleSheet);
    };

  } catch (err) {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
    // CSP制限について言及した親切なエラー表示
    alert("エラーが発生しました: " + err.message + "\n\n※Webサイトのセキュリティポリシー（CSP）によって外部API連携がブロックされた可能性があります。その場合はブロック影響を受けない「Chrome拡張機能版」をご利用ください。");
  }
})();
