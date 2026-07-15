// content.js
// ポップアップやブックマークレットからのメッセージを受け取り、DOIの抽出処理を行う

// メッセージリスナーの登録（Chrome拡張機能用）
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "detectDOI") {
      const result = detectDOI();
      sendResponse(result);
    }
    return true; // 非同期レスポンスを有効化
  });
}

/**
 * ページ内からDOIを検出するコアロジック（ハイブリッド検出）
 * 優先度1: 選択テキスト
 * 優先度2: メタタグ
 * @returns {Object} 検出結果オブジェクト
 */
function detectDOI() {
  const doiRegex = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i;

  // 優先度1: ユーザーの選択テキストから抽出
  try {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      const match = selectedText.match(doiRegex);
      if (match) {
        return {
          doi: match[1],
          source: "selection",
          context: selectedText.substring(0, 100) // デバッグ・確認用
        };
      }
    }
  } catch (e) {
    console.error("Selection detection error:", e);
  }

  // 優先度2: メタタグからの自動取得
  const metaSelectors = [
    { selector: 'meta[name="citation_doi"]', attr: 'content' },
    { selector: 'meta[name="dc.identifier"][scheme="doi"]', attr: 'content' },
    { selector: 'meta[name="prism.doi"]', attr: 'content' },
    { selector: 'meta[name="dc.identifier"]', attr: 'content' },
    { selector: 'meta[property="og:doi"]', attr: 'content' },
    { selector: 'meta[name="citation_pdf_url"]', attr: 'content' }, // PDFのURLにDOIが含まれる場合がある
    { selector: 'a[href*="doi.org/"]', attr: 'href' } // DOIリンク
  ];

  for (const item of metaSelectors) {
    try {
      const elements = document.querySelectorAll(item.selector);
      for (const element of elements) {
        const val = element.getAttribute(item.attr);
        if (val) {
          // URL形式や "doi:" 接頭辞のクリーニング
          let cleanVal = val.trim()
            .replace(/https?:\/\/doi\.org\//i, '')
            .replace(/^doi:/i, '')
            .trim();
          
          const match = cleanVal.match(doiRegex);
          if (match) {
            return {
              doi: match[1],
              source: "meta",
              metaName: item.selector
            };
          }
        }
      }
    } catch (e) {
      console.error(`Selector error (${item.selector}):`, e);
    }
  }

  // 見つからなかった場合
  return {
    doi: null,
    source: "none"
  };
}

// ブックマークレットや直下読み込みでグローバルに関数を使えるようにする
window.detectDOIForBookmarklet = detectDOI;
