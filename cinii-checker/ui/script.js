// アプリケーションの状態管理
const state = {
    results: [],       // 検索結果の全データ { ncid, status, title, creator, publisher, date, owner_count, owners, detail_url, message }
    ncidList: [],      // 検索対象のNCIDリスト
    csvData: null,     // ロードされたCSVデータ（二次元配列）
    csvFileName: '',   // ロードされたCSVファイル名
    isRunning: false,  // 検索が実行中かどうか
    cancelRequested: false, // キャンセル要求フラグ
    apiReady: false,   // pywebview.api が使用可能か
    currentIndex: 0    // 現在処理中のインデックス
};

// DOM要素の取得
const dom = {
    // ナビゲーション
    btnNavSearch: document.getElementById('btn-nav-search'),
    btnNavHistory: document.getElementById('btn-nav-history'),
    btnNavSettings: document.getElementById('btn-nav-settings'),
    sections: document.querySelectorAll('.content-section'),
    navItems: document.querySelectorAll('.nav-item'),

    // タブ
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),

    // テキスト入力
    ncidInput: document.getElementById('ncid-input'),

    // CSV入力
    dropZone: document.getElementById('drop-zone'),
    btnSelectFile: document.getElementById('btn-select-file'),
    csvFileInput: document.getElementById('csv-file-input'),
    selectedFileInfo: document.getElementById('selected-file-info'),
    fileName: document.getElementById('file-name'),
    btnClearFile: document.getElementById('btn-clear-file'),
    csvColumnSelect: document.getElementById('csv-column-select'),

    // コントロール
    requestDelay: document.getElementById('request-delay'),
    btnStartSearch: document.getElementById('btn-start-search'),
    btnCancelSearch: document.getElementById('btn-cancel-search'),
    btnExportResults: document.getElementById('btn-export-results'),

    // ステータス表示
    progressBar: document.getElementById('progress-bar'),
    progressLabel: document.getElementById('progress-label'),
    progressPercent: document.getElementById('progress-percent'),
    statTotal: document.getElementById('stat-total'),
    statSuccess: document.getElementById('stat-success'),
    statNotfound: document.getElementById('stat-notfound'),
    statError: document.getElementById('stat-error'),

    // テーブル
    tableSearch: document.getElementById('table-search'),
    filterStatus: document.getElementById('filter-status'),
    resultsTable: document.getElementById('results-table'),
    resultsTbody: document.getElementById('results-tbody'),

    // モーダル
    detailModal: document.getElementById('detail-modal'),
    mTitle: document.getElementById('m-title'),
    mNcid: document.getElementById('m-ncid'),
    mCreator: document.getElementById('m-creator'),
    mPublisher: document.getElementById('m-publisher'),
    mDate: document.getElementById('m-date'),
    mOwnerCount: document.getElementById('m-owner-count'),
    mHoldingsList: document.getElementById('m-holdings-list'),
    btnCiniiLink: document.getElementById('btn-cinii-link'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCloseModalFoot: document.getElementById('btn-close-modal-foot'),

    // ツールチップ
    globalTooltip: document.getElementById('global-tooltip'),
    tooltipList: document.getElementById('tooltip-list')
};

// ----------------------------------------------------
// 初期化処理
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Lucideアイコンの初期化
    lucide.createIcons();
    
    // イベントリスナーの登録
    initNavigation();
    initTabs();
    initFileUpload();
    initSearchControls();
    initTableFilters();
    initTooltipAndModal();
    
    // pywebviewのロード確認
    window.addEventListener('pywebviewready', () => {
        state.apiReady = true;
        console.log('pywebview is ready');
    });
    
    // もしすでにロードされている場合
    if (window.pywebview && window.pywebview.api) {
        state.apiReady = true;
    }
});

// ----------------------------------------------------
// ナビゲーションとタブ切り替え
// ----------------------------------------------------
function initNavigation() {
    const menus = [
        { btn: dom.btnNavSearch, sectionId: 'section-search' },
        { btn: dom.btnNavHistory, sectionId: 'section-history' },
        { btn: dom.btnNavSettings, sectionId: 'section-settings' }
    ];

    menus.forEach(item => {
        if (item.btn) {
            item.btn.addEventListener('click', () => {
                // ナビゲーションボタンのアクティブ切り替え
                dom.navItems.forEach(nav => nav.classList.remove('active'));
                item.btn.classList.add('active');

                // セクションの切り替え
                dom.sections.forEach(sec => {
                    if (sec.id === item.sectionId) {
                        sec.classList.add('active');
                    } else {
                        sec.classList.remove('active');
                    }
                });
            });
        }
    });
}

function initTabs() {
    dom.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            dom.tabButtons.forEach(b => b.classList.remove('active'));
            dom.tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ----------------------------------------------------
// CSVファイル読み込み処理
// ----------------------------------------------------
function initFileUpload() {
    // ファイルダイアログを開く
    dom.btnSelectFile.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.csvFileInput.click();
    });

    dom.csvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // ドラッグ＆ドロップ
    dom.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropZone.classList.add('dragover');
    });

    dom.dropZone.addEventListener('dragleave', () => {
        dom.dropZone.classList.remove('dragover');
    });

    dom.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // 選択ファイルをクリア
    dom.btnClearFile.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFileSelection();
    });
}

function handleFile(file) {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        alert('CSVファイルまたはテキストファイルを選択してください。');
        return;
    }

    state.csvFileName = file.name;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        state.csvData = parseCSV(text);
        
        // UI表示の更新
        dom.fileName.textContent = file.name;
        dom.selectedFileInfo.classList.remove('hidden');
        dom.btnSelectFile.classList.add('hidden');
        dom.dropZone.querySelector('p').classList.add('hidden');
        dom.dropZone.querySelector('span').classList.add('hidden');
    };
    reader.readAsText(file, 'utf-8');
}

function clearFileSelection() {
    state.csvData = null;
    state.csvFileName = '';
    dom.csvFileInput.value = '';
    
    dom.selectedFileInfo.classList.add('hidden');
    dom.btnSelectFile.classList.remove('hidden');
    dom.dropZone.querySelector('p').classList.remove('hidden');
    dom.dropZone.querySelector('span').classList.remove('hidden');
}

// 簡易CSVパース
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }).filter(row => row.length > 0 && row.some(cell => cell !== ''));
}

// ----------------------------------------------------
// 検索実行・中断処理
// ----------------------------------------------------
function initSearchControls() {
    dom.btnStartSearch.addEventListener('click', startSearch);
    dom.btnCancelSearch.addEventListener('click', cancelSearch);
    dom.btnExportResults.addEventListener('click', exportCSV);
}

// 書誌IDの抽出
function getNcidsToSearch() {
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    let ids = [];

    if (activeTab === 'tab-text') {
        const text = dom.ncidInput.value;
        // 改行やカンマ、スペース区切りで分割
        ids = text.split(/[\n,\s]+/).map(id => id.trim()).filter(id => id.length > 0);
    } else {
        // CSVからの抽出
        if (!state.csvData) {
            alert('CSVファイルが読み込まれていません。');
            return null;
        }
        const columnIndex = parseInt(dom.csvColumnSelect.value, 10) || 0;
        ids = state.csvData.map(row => {
            if (row.length > columnIndex) {
                return row[columnIndex].trim();
            }
            return '';
        }).filter(id => id.length > 0);
    }

    // 書誌ID（NCID）は通常 B または A、C 等で始まる英数字。簡易バリデーション
    // CiNiiのID体系: 通常は10桁（例: BA89617462, BD18195266）
    return ids.map(id => {
        // 余計な記号やパスワードなどを除去
        return id.replace(/["']/g, '');
    });
}

async function startSearch() {
    if (state.isRunning) return;

    const list = getNcidsToSearch();
    if (!list || list.length === 0) {
        alert('検索対象の書誌IDが見つかりません。入力内容を確認してください。');
        return;
    }

    state.ncidList = list;
    state.results = [];
    state.isRunning = true;
    state.cancelRequested = false;
    state.currentIndex = 0;

    // UI初期化
    dom.btnStartSearch.disabled = true;
    dom.btnCancelSearch.disabled = false;
    dom.btnExportResults.disabled = true;
    dom.btnCancelSearch.innerHTML = '<i data-lucide="square"></i><span>一時停止</span>';
    lucide.createIcons();
    
    // テーブルの初期化
    dom.resultsTbody.innerHTML = '';
    
    updateStatsUI(0, 0, 0, 0, list.length);
    updateProgressUI(0, list.length, '処理を開始しています...');

    const delay = parseFloat(dom.requestDelay.value) * 1000 || 200;

    for (let i = 0; i < list.length; i++) {
        if (state.cancelRequested) {
            updateProgressUI(i, list.length, '一時停止しました');
            break;
        }

        state.currentIndex = i;
        const ncid = list[i];
        
        updateProgressUI(i, list.length, `検索中: ${ncid} (${i + 1}/${list.length})`);
        
        let result;
        if (state.apiReady) {
            try {
                // Python API呼び出し
                result = await window.pywebview.api.check_ncid(ncid);
            } catch (err) {
                result = { ncid, status: 'error', message: `システムエラー: ${err.message}` };
            }
        } else {
            // テストダミーデータ (APIがロードされていないブラウザでの確認用)
            result = getDummyData(ncid);
            await new Promise(r => setTimeout(r, 200)); 
        }

        state.results.push(result);
        appendResultToTable(result, i + 1);
        
        // 統計情報の更新
        const successCount = state.results.filter(r => r.status === 'success').length;
        const notfoundCount = state.results.filter(r => r.status === 'not_found').length;
        const errorCount = state.results.filter(r => r.status === 'error').length;
        updateStatsUI(successCount, notfoundCount, errorCount, i + 1, list.length);

        // ディレイ（最後の要素以外）
        if (i < list.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // 検索完了
    state.isRunning = false;
    dom.btnStartSearch.disabled = false;
    dom.btnCancelSearch.disabled = true;
    dom.btnExportResults.disabled = state.results.length === 0;

    if (!state.cancelRequested) {
        updateProgressUI(list.length, list.length, 'すべての処理が完了しました');
    }
}

function cancelSearch() {
    if (!state.isRunning) return;
    state.cancelRequested = true;
    dom.btnCancelSearch.disabled = true;
    dom.btnCancelSearch.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i><span>停止中...</span>';
    lucide.createIcons();
}

// ----------------------------------------------------
// UI更新関数
// ----------------------------------------------------
function updateProgressUI(current, total, message) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    dom.progressBar.style.width = `${percent}%`;
    dom.progressPercent.textContent = `${percent}%`;
    dom.progressLabel.textContent = message;
}

function updateStatsUI(success, notfound, error, processed, total) {
    dom.statTotal.textContent = `${processed} / ${total}`;
    dom.statSuccess.textContent = success;
    dom.statNotfound.textContent = notfound;
    dom.statError.textContent = error;
}

function appendResultToTable(result, index) {
    // 空白状態の行があれば削除
    const emptyRow = dom.resultsTbody.querySelector('.empty-state');
    if (emptyRow) {
        dom.resultsTbody.innerHTML = '';
    }

    const tr = document.createElement('tr');
    tr.dataset.ncid = result.ncid;
    tr.dataset.index = index - 1; // メモリ内インデックス
    tr.dataset.status = result.status;

    let statusBadge = '';
    if (result.status === 'success') {
        statusBadge = '<span class="badge badge-success">成功</span>';
    } else if (result.status === 'not_found') {
        statusBadge = '<span class="badge badge-warning">該当なし</span>';
    } else {
        statusBadge = `<span class="badge badge-danger">エラー</span>`;
    }

    const titleText = result.title || `<span class="text-light">${result.message || 'データなし'}</span>`;
    const creatorText = result.creator || result.publisher ? `${result.creator || ''} / ${result.publisher || ''}` : '-';
    
    let ownerCell = '-';
    if (result.status === 'success') {
        ownerCell = `<span class="holding-count" data-ncid="${result.ncid}">${result.owner_count} 館</span>`;
    }

    tr.innerHTML = `
        <td>${index}</td>
        <td class="code-font">${result.ncid}</td>
        <td title="${result.title || ''}">${titleText}</td>
        <td title="${creatorText}">${creatorText}</td>
        <td>${result.date || '-'}</td>
        <td>${ownerCell}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-secondary btn-sm btn-show-detail" style="padding: 4px 8px; font-size: 0.75rem;">詳細</button>
        </td>
    `;

    dom.resultsTbody.appendChild(tr);
    // スクロールを最下部に移動（処理の追跡をしやすくする）
    dom.resultsTbody.parentElement.scrollTop = dom.resultsTbody.parentElement.scrollHeight;
}

// ----------------------------------------------------
// テーブル検索・フィルター
// ----------------------------------------------------
function initTableFilters() {
    dom.tableSearch.addEventListener('input', filterTable);
    dom.filterStatus.addEventListener('change', filterTable);
}

function filterTable() {
    const query = dom.tableSearch.value.toLowerCase();
    const statusFilter = dom.filterStatus.value;
    const rows = dom.resultsTbody.querySelectorAll('tr:not(.empty-state)');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const status = row.dataset.status;
        
        const matchesQuery = text.includes(query);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;

        if (matchesQuery && matchesStatus) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}

// ----------------------------------------------------
// ツールチップ & モーダル制御
// ----------------------------------------------------
function initTooltipAndModal() {
    // ツールチップのホバー制御（イベントデリゲーションを使用）
    dom.resultsTable.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.holding-count');
        if (!target) return;

        const ncid = target.dataset.ncid;
        const result = state.results.find(r => r.ncid === ncid);
        if (!result || !result.owners || result.owners.length === 0) return;

        // ツールチップの中身を構築
        dom.tooltipList.innerHTML = '';
        const limitOwners = result.owners.slice(0, 3); // 上位3館
        limitOwners.forEach(owner => {
            const li = document.createElement('li');
            li.textContent = owner.name || '不明な図書館';
            dom.tooltipList.appendChild(li);
        });

        if (result.owners.length > 3) {
            const li = document.createElement('li');
            li.style.fontStyle = 'italic';
            li.style.color = '#94a3b8';
            li.textContent = `他 ${result.owners.length - 3} 館...`;
            dom.tooltipList.appendChild(li);
        }

        // 表示
        dom.globalTooltip.style.display = 'block';
        positionTooltip(e);
    });

    dom.resultsTable.addEventListener('mousemove', (e) => {
        if (dom.globalTooltip.style.display === 'block') {
            positionTooltip(e);
        }
    });

    dom.resultsTable.addEventListener('mouseout', (e) => {
        const target = e.target.closest('.holding-count');
        if (target) {
            dom.globalTooltip.style.display = 'none';
        }
    });

    // 詳細ボタン・所蔵館クリックでモーダルを開く
    dom.resultsTable.addEventListener('click', (e) => {
        const detailBtn = e.target.closest('.btn-show-detail');
        const countLink = e.target.closest('.holding-count');
        
        if (detailBtn || countLink) {
            const tr = e.target.closest('tr');
            const index = parseInt(tr.dataset.index, 10);
            const result = state.results[index];
            if (result) {
                showDetailModal(result);
            }
        }
    });

    // モーダルを閉じる
    const closeActions = [dom.btnCloseModal, dom.btnCloseModalFoot, dom.detailModal];
    closeActions.forEach(element => {
        if (element) {
            element.addEventListener('click', (e) => {
                // 背景クリックか、閉じるボタンの場合のみ閉じる
                if (e.target === element || e.target.closest('.btn-close') || e.target.id === 'btn-close-modal-foot') {
                    dom.detailModal.classList.remove('active');
                }
            });
        }
    });
}

function positionTooltip(e) {
    const tooltipWidth = dom.globalTooltip.offsetWidth;
    const tooltipHeight = dom.globalTooltip.offsetHeight;
    
    // マウスカーソルの右下付近に配置（画面外にはみ出さないように調整）
    let x = e.pageX + 15;
    let y = e.pageY + 15;

    if (x + tooltipWidth > window.innerWidth) {
        x = e.pageX - tooltipWidth - 15;
    }
    if (y + tooltipHeight > window.innerHeight) {
        y = e.pageY - tooltipHeight - 15;
    }

    dom.globalTooltip.style.left = `${x}px`;
    dom.globalTooltip.style.top = `${y}px`;
}

function showDetailModal(result) {
    dom.mTitle.textContent = result.title || 'データなし';
    dom.mNcid.textContent = result.ncid;
    dom.mCreator.textContent = result.creator || '-';
    dom.mPublisher.textContent = result.publisher || '-';
    dom.mDate.textContent = result.date || '-';
    dom.mOwnerCount.textContent = `${result.owner_count || 0} 館`;

    // 所蔵館リストのクリアと構築
    dom.mHoldingsList.innerHTML = '';
    
    if (result.status !== 'success') {
        const li = document.createElement('li');
        li.style.color = '#ef4444';
        li.textContent = result.message || '情報の取得に失敗しています。';
        dom.mHoldingsList.appendChild(li);
    } else if (!result.owners || result.owners.length === 0) {
        const li = document.createElement('li');
        li.style.color = '#64748b';
        li.textContent = '所蔵館の情報はありません。';
        dom.mHoldingsList.appendChild(li);
    } else {
        result.owners.forEach(owner => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${owner.name}</span>
                ${owner.url ? `<a href="${owner.url}" target="_blank"><i data-lucide="external-link" style="width:14px;height:14px;"></i>OPAC</a>` : ''}
            `;
            dom.mHoldingsList.appendChild(li);
        });
        lucide.createIcons();
    }

    // CiNiiリンクの更新
    dom.btnCiniiLink.href = result.detail_url || `https://ci.nii.ac.jp/ncid/${result.ncid}`;

    // モーダル表示
    dom.detailModal.classList.add('active');
}

// ----------------------------------------------------
// CSVエクスポート処理
// ----------------------------------------------------
function exportCSV() {
    if (state.results.length === 0) return;

    let csvContent = '\uFEFF'; // BOM (UTF-8) でExcelでの文字化けを防ぐ
    
    // ヘッダー行
    csvContent += 'No.,書誌ID(NCID),タイトル,著者/出版社,出版年,所蔵館数,ステータス,メッセージ\n';

    state.results.forEach((r, idx) => {
        const no = idx + 1;
        const ncid = escapeCSVField(r.ncid);
        const title = escapeCSVField(r.title || '');
        const creatorAndPub = escapeCSVField(`${r.creator || ''} / ${r.publisher || ''}`);
        const date = escapeCSVField(r.date || '');
        const count = r.status === 'success' ? r.owner_count : '';
        const status = r.status === 'success' ? '成功' : (r.status === 'not_found' ? '該当なし' : 'エラー');
        const msg = escapeCSVField(r.message || '');

        csvContent += `${no},${ncid},${title},${creatorAndPub},${date},${count},${status},${msg}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.setAttribute('href', url);
    link.setAttribute('download', `cinii_results_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeCSVField(field) {
    if (field === null || field === undefined) return '';
    let stringField = String(field);
    // ダブルクォーテーションが含まれる場合はエスケープし、全体をダブルクォーテーションで囲む
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
        stringField = stringField.replace(/"/g, '""');
        return `"${stringField}"`;
    }
    return stringField;
}

// ----------------------------------------------------
// ブラウザ検証用のダミーデータ生成器 (Pythonが起動していない時用)
// ----------------------------------------------------
function getDummyData(ncid) {
    const titles = [
        "こころは遺伝する : DNAはいかに「わたし」を形づくるか",
        "人体の不思議 : 解剖学から見る生命のメカニズム",
        "Pythonプログラミング現代アプローチ",
        "近代文学の光と影 : 夏目漱石から太宰治まで",
        "データサイエンスと統計モデリング"
    ];
    const creators = ["ロバート・プラミン", "鈴木 一郎", "Alan Turing", "夏目 漱石", "山田 花子"];
    const publishers = ["白揚社", "東京大学出版会", "O'Reilly", "岩波書店", "技術評論社"];
    
    const hash = ncid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const success = hash % 7 !== 0; // 7の倍数ならエラーか該当なし
    const found = hash % 5 !== 0;

    if (!success) {
        return {
            ncid,
            status: 'error',
            message: 'ネットワーク接続エラーが発生しました。'
        };
    }

    if (!found) {
        return {
            ncid,
            status: 'not_found',
            message: '書誌IDが見つかりません。'
        };
    }

    const titleIdx = hash % titles.length;
    const count = (hash % 85) + 1;
    
    // 偽の所蔵館リスト
    const schools = ["東京大学", "京都大学", "大阪大学", "東北大学", "名古屋大学", "九州大学", "北海道大学", "早稲田大学", "慶應義塾大学", "筑波大学"];
    const owners = [];
    for (let i = 0; i < count; i++) {
        const sch = schools[(hash + i) % schools.length];
        const lib = (i % 2 === 0) ? "附属図書館" : "総合図書館";
        owners.append ? owners.push({
            name: `${sch} ${lib}`,
            url: `https://opac.example.ac.jp/record/${ncid}`
        }) : owners.push({
            name: `${sch} ${lib}`,
            url: `https://opac.example.ac.jp/record/${ncid}`
        });
    }

    return {
        ncid,
        status: 'success',
        title: titles[titleIdx],
        creator: creators[titleIdx],
        publisher: publishers[titleIdx],
        date: String(2000 + (hash % 27)),
        owner_count: count,
        owners: owners,
        detail_url: `https://ci.nii.ac.jp/ncid/${ncid}`
    };
}
