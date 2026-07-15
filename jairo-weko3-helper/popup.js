// popup.js
// Chrome拡張機能ポップアップのコントロールロジック

document.addEventListener('DOMContentLoaded', () => {
  // DOM要素の取得
  const doiInput = document.getElementById('doi-input');
  const btnScan = document.getElementById('btn-scan');
  const btnFetch = document.getElementById('btn-fetch');
  const doiStatusBadge = document.getElementById('doi-status-badge');
  const doiDesc = document.getElementById('doi-desc');
  const errorBox = document.getElementById('error-box');
  const loader = document.getElementById('loader');
  const metadataSection = document.getElementById('metadata-section');
  const coffeeDonation = document.getElementById('coffee-donation');

  // メタデータ入力フィールド
  const fieldTitle = document.getElementById('field-title');
  const fieldAuthor = document.getElementById('field-author');
  const fieldJournal = document.getElementById('field-journal');
  const fieldVolume = document.getElementById('field-volume');
  const fieldIssue = document.getElementById('field-issue');
  const fieldPageStart = document.getElementById('field-pagestart');
  const fieldPageEnd = document.getElementById('field-pageend');
  const fieldPubDate = document.getElementById('field-pubdate');
  const fieldIssn = document.getElementById('field-issn');

  // ポリシーと外部リンク
  const policyBadge = document.getElementById('policy-badge');
  const policyText = document.getElementById('policy-text');
  const linkScpj = document.getElementById('link-scpj');
  const linkSherpa = document.getElementById('link-sherpa');

  // アクション
  const formatCsvBtn = document.getElementById('format-csv');
  const formatTsvBtn = document.getElementById('format-tsv');
  const btnDownload = document.getElementById('btn-download');

  let currentFormat = 'csv'; // 'csv' or 'tsv'
  let currentDoi = '';

  // 代表的なゴールドOA/オープンアクセスジャーナルの簡易判定用データベース (デモ/プロトタイプ用)
  const OA_JOURNALS = {
    '2041-1723': { name: 'Nature Communications', policy: 'gold', desc: 'ゴールドOA: クリエイティブ・コモンズ(CC BY)ライセンスの下で、即時オープンアクセス登録が可能です。出版社版(VoR)をそのままリポジトリへ登録できます。' },
    '1932-6203': { name: 'PLOS ONE', policy: 'gold', desc: 'ゴールドOA: CC BYライセンスに基づき、制限なしに即時登録・公開が可能です。出版社版(VoR)を使用してください。' },
    '1471-2105': { name: 'BMC Bioinformatics', policy: 'gold', desc: 'ゴールドOA: BioMed Centralのオープンアクセス誌です。CC BYライセンスで即時リポジトリ登録が可能です。' },
    '2050-084X': { name: 'eLife', policy: 'gold', desc: 'ゴールドOA: 即時登録・公開が可能です。出版社版(VoR)を使用できます。' },
    '0022-362X': { name: 'Journal of Physical Chemistry', policy: 'hybrid', desc: 'ハイブリッドOA/グリーンOA: プレプリント(著者投稿原稿)またはポストプリント(査読済著者原稿)の登録が可能です。出版社版(VoR)の登録にはオープンアクセス料金(APC)の支払証明が必要です。エンバゴ期間は通常12ヶ月です。' },
    '0022-5193': { name: 'Journal of Theoretical Biology', policy: 'green', desc: 'グリーンOA: 査読済著者原稿(AAM / ポストプリント)は、一定のエンバゴ期間(12〜24ヶ月)の経過後にリポジトリ登録・公開が可能です。出版社版(VoR)は登録不可です。' }
  };

  // 初期スキャンの実行
  scanTabForDOI();

  // スキャンボタンのクリックイベント
  btnScan.addEventListener('click', () => {
    scanTabForDOI();
  });

  // データ取得ボタンのクリックイベント
  btnFetch.addEventListener('click', () => {
    const doi = doiInput.value.trim();
    if (!doi) {
      showError("DOIを入力してください。");
      return;
    }
    fetchMetadata(doi);
  });

  // フォーマット切り替えボタン
  formatCsvBtn.addEventListener('click', () => {
    formatCsvBtn.classList.add('active');
    formatTsvBtn.classList.remove('active');
    currentFormat = 'csv';
  });

  formatTsvBtn.addEventListener('click', () => {
    formatTsvBtn.classList.add('active');
    formatCsvBtn.classList.remove('active');
    currentFormat = 'tsv';
  });

  // ダウンロードボタンのクリックイベント
  btnDownload.addEventListener('click', () => {
    downloadImportFile();
  });

  /**
   * 現在のアクティブタブからDOIをスキャンする
   */
  function scanTabForDOI() {
    clearError();
    
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      // 拡張機能環境ではない場合のフォールバック（動作確認用）
      handleNoDOI();
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        handleNoDOI();
        return;
      }
      
      const activeTab = tabs[0];
      
      // content.jsへメッセージを送信
      chrome.tabs.sendMessage(activeTab.id, { action: "detectDOI" }, (response) => {
        if (chrome.runtime.lastError) {
          // content.jsが読み込まれていないか、特殊ページ（chrome://など）の場合のフォールバック
          // 動的にcontent.jsを注入して試す
          injectContentScript(activeTab.id);
        } else if (response && response.doi) {
          handleDetectedDOI(response);
        } else {
          handleNoDOI();
        }
      });
    });
  }

  /**
   * content.jsを動的に注入してDOIを検出する（フォールバック）
   */
  function injectContentScript(tabId) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn("Script injection failed:", chrome.runtime.lastError.message);
        handleNoDOI();
        return;
      }
      
      // 注入成功後、再度メッセージ送信
      chrome.tabs.sendMessage(tabId, { action: "detectDOI" }, (response) => {
        if (response && response.doi) {
          handleDetectedDOI(response);
        } else {
          handleNoDOI();
        }
      });
    });
  }

  /**
   * DOIが検出された時のUI処理
   */
  function handleDetectedDOI(result) {
    doiInput.value = result.doi;
    currentDoi = result.doi;
    
    doiStatusBadge.className = "status-indicator status-detected";
    doiStatusBadge.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      検出完了
    `;

    if (result.source === 'selection') {
      doiDesc.textContent = "ページ上の選択範囲からDOIを検出しました。";
    } else if (result.source === 'meta') {
      doiDesc.textContent = "ページのメタデータタグからDOIを検出しました。";
    } else {
      doiDesc.textContent = "DOIが自動検出されました。";
    }
  }

  /**
   * DOIが検出されなかった時のUI処理
   */
  function handleNoDOI() {
    doiStatusBadge.className = "status-indicator status-missing";
    doiStatusBadge.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      未検出
    `;
    doiDesc.textContent = "DOIが自動検出できませんでした。手動で入力してください。";
  }

  /**
   * Crossref API から論文メタデータを取得する
   */
  function fetchMetadata(doi) {
    clearError();
    // クリーニング
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:/i, '');
    
    loader.style.display = 'flex';
    metadataSection.style.display = 'none';
    coffeeDonation.style.display = 'none';

    // politeプール適用のためにダミー連絡先を含める
    const email = "academic-micro-saas-dev@example.jp";
    const apiUrl = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}?mailto=${encodeURIComponent(email)}`;

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("DOIが見つかりませんでした。入力内容を確認してください。");
          }
          throw new Error(`APIエラーが発生しました (Status: ${response.status})`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.message) {
          populateFields(data.message, cleanDoi);
        } else {
          throw new Error("APIレスポンスの形式が正しくありません。");
        }
      })
      .catch(err => {
        showError(err.message);
      })
      .finally(() => {
        loader.style.display = 'none';
      });
  }

  /**
   * 取得データをフォームに流し込む
   */
  function populateFields(msg, cleanDoi) {
    // 1. タイトル
    fieldTitle.value = msg.title && msg.title.length > 0 ? msg.title[0] : '';

    // 2. 著者名 (WEKO3用に "姓, 名|姓, 名" の形式にする)
    if (msg.author && msg.author.length > 0) {
      const authorList = msg.author.map(auth => {
        const family = auth.family ? auth.family.trim() : '';
        const given = auth.given ? auth.given.trim() : '';
        if (family && given) {
          return `${family}, ${given}`;
        }
        return family || given || '';
      }).filter(name => name !== '');
      fieldAuthor.value = authorList.join('|');
    } else {
      fieldAuthor.value = '';
    }

    // 3. 雑誌名
    fieldJournal.value = msg['container-title'] && msg['container-title'].length > 0 ? msg['container-title'][0] : '';

    // 4. 巻・号
    fieldVolume.value = msg.volume || '';
    fieldIssue.value = msg.issue || '';

    // 5. ページ範囲の分解
    if (msg.page) {
      const pages = msg.page.split(/[-–—]+/); // ハイフンやダッシュで分割
      fieldPageStart.value = pages[0] ? pages[0].trim() : '';
      fieldPageEnd.value = pages[1] ? pages[1].trim() : (pages[0] ? pages[0].trim() : '');
    } else {
      fieldPageStart.value = '';
      fieldPageEnd.value = '';
    }

    // 6. 出版年 (最優先: published-print, 次点: published-online, issued, created)
    let pubYear = '';
    const dateSource = msg['published-print'] || msg['published-online'] || msg['issued'] || msg['created'];
    if (dateSource && dateSource['date-parts'] && dateSource['date-parts'][0]) {
      pubYear = dateSource['date-parts'][0][0] || '';
    }
    fieldPubDate.value = pubYear;

    // 7. ISSN
    let issn = '';
    if (msg.ISSN && msg.ISSN.length > 0) {
      issn = msg.ISSN[0]; // 最初のISSNを取得
    }
    fieldIssn.value = issn;

    // 8. 著作権ポリシーチェック
    checkCopyrightPolicy(issn, fieldJournal.value);

    // メタデータセクションを表示
    metadataSection.style.display = 'flex';
    metadataSection.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * 著作権ポリシーの簡易チェック
   */
  function checkCopyrightPolicy(issn, journalName) {
    const cleanIssn = issn ? issn.trim().replace(/[^\d-]/g, '') : '';
    
    // SCPJおよびSherpa Romeo検索リンクの更新
    if (cleanIssn) {
      linkScpj.href = `https://scpj.nii.ac.jp/scpj/search?issn=${encodeURIComponent(cleanIssn)}`;
      linkSherpa.href = `https://v2.sherpa.ac.uk/id/publication/${encodeURIComponent(cleanIssn)}`;
      linkScpj.style.display = 'inline-flex';
      linkSherpa.style.display = 'inline-flex';
    } else {
      // ISSNがない場合は雑誌名で検索をかける（SCPJは雑誌名での簡易検索URLを指定）
      linkScpj.href = `https://scpj.nii.ac.jp/scpj/search?journal=${encodeURIComponent(journalName)}`;
      linkSherpa.href = `https://v2.sherpa.ac.uk/id/publication/search?q=${encodeURIComponent(journalName)}`;
    }

    // 簡易DB照合
    if (cleanIssn && OA_JOURNALS[cleanIssn]) {
      const info = OA_JOURNALS[cleanIssn];
      if (info.policy === 'gold') {
        policyBadge.className = 'policy-badge policy-green';
        policyBadge.textContent = '登録可能';
      } else if (info.policy === 'hybrid') {
        policyBadge.className = 'policy-badge policy-yellow';
        policyBadge.textContent = '条件付き承認';
      } else {
        policyBadge.className = 'policy-badge policy-yellow';
        policyBadge.textContent = '要確認';
      }
      policyText.textContent = `[${info.name}] ${info.desc}`;
    } else {
      // デフォルト（不明なジャーナル）
      policyBadge.className = 'policy-badge policy-yellow';
      policyBadge.textContent = '要確認';
      policyText.textContent = `学協会著作権ポリシーデータベース (SCPJ) または Sherpa Romeo でセルフアーカイブ条件（リポジトリ登録条件）をご確認ください。`;
    }
  }

  /**
   * WEKO3インポート用ファイルの生成と自動ダウンロード
   */
  function downloadImportFile() {
    // 画面の入力値を取得（ユーザー編集結果を反映するため）
    const title = fieldTitle.value.trim();
    const author = fieldAuthor.value.trim();
    const journal = fieldJournal.value.trim();
    const volume = fieldVolume.value.trim();
    const issue = fieldIssue.value.trim();
    const pageStart = fieldPageStart.value.trim();
    const pageEnd = fieldPageEnd.value.trim();
    const pubDate = fieldPubDate.value.trim();
    const issn = fieldIssn.value.trim();
    const doi = doiInput.value.trim();

    // JPCOARスキーマ準拠 WEKO3 インポート形式 3行ヘッダー
    const headers = [
      ['タイトル', 'タイトル（英）', '著者名', '雑誌名', '巻', '号', '開始ページ', '終了ページ', '発行年', 'ISSN', 'DOI'],
      ['title', 'alternative', 'creator', 'sourceTitle', 'volume', 'issue', 'pageStart', 'pageEnd', 'pubdate', 'issn', 'doi'],
      ['ja', 'en', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja', 'ja']
    ];

    // データ行
    const row = [title, '', author, journal, volume, issue, pageStart, pageEnd, pubDate, issn, doi];
    const dataRows = [row];

    const separator = currentFormat === 'tsv' ? '\t' : ',';
    
    // CSV/TSV文字列の生成（ダブルクォーテーションのエスケープ）
    const escapeField = (text) => {
      const str = String(text || "");
      // Excel/WEKO3でのパースエラーを防ぐため、常にダブルクォーテーションで囲み、内部のダブルクォーテーションを二重化エスケープする
      return `"${str.replace(/"/g, '""')}"`;
    };

    let contentString = '';
    
    // ヘッダー追加
    headers.forEach(hRow => {
      contentString += hRow.map(escapeField).join(separator) + '\r\n';
    });

    // データ行追加
    dataRows.forEach(dRow => {
      contentString += dRow.map(escapeField).join(separator) + '\r\n';
    });

    // Excelでの文字化けを防ぐため、UTF-8 with BOM でエンコード
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, contentString], { type: `text/${currentFormat};charset=utf-8;` });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // ファイル名の生成
    const cleanDoiName = doi.replace(/[^a-zA-Z0-9]/g, '_');
    a.href = url;
    a.download = `weko3_import_${cleanDoiName || 'export'}.${currentFormat}`;
    document.body.appendChild(a);
    a.click();
    
    // クリーアップ
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    // 応援導線を表示
    coffeeDonation.style.display = 'block';
    coffeeDonation.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * エラーメッセージの表示
   */
  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }

  /**
   * エラーメッセージの消去
   */
  function clearError() {
    errorBox.textContent = '';
    errorBox.style.display = 'none';
  }
});
