// アプリケーションの状態管理
const state = {
    results: [],       // 検索結果の全データ { ncid, status, title, creator, publisher, date, owner_count, owners, has_mie_univ, mie_opac_url, detail_url, message }
    ncidList: [],      // 検索対象のNCIDリスト
    csvData: null,     // ロードされたCSVデータ（二次元配列）
    csvFileName: '',   // ロードされたCSVファイル名
    isRunning: false,  // 検索が実行中かどうか
    cancelRequested: false, // キャンセル要求フラグ
    apiReady: false,   // pywebview.api が使用可能か
    currentIndex: 0    // 現在処理中のインデックス
};

// 一度の検索における最大件数制限 (設定から自動ロード・更新)
let MAX_SEARCH_LIMIT = 200;

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
    mMieStatus: document.getElementById('m-mie-status'),
    mOwnerCount: document.getElementById('m-owner-count'),
    mHoldingsList: document.getElementById('m-holdings-list'),
    btnCiniiLink: document.getElementById('btn-cinii-link'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCloseModalFoot: document.getElementById('btn-close-modal-foot'),

    // ツールチップ
    globalTooltip: document.getElementById('global-tooltip'),
    tooltipList: document.getElementById('tooltip-list'),

    // 設定画面要素
    settingMaxLimit: document.getElementById('setting-max-limit'),
    settingUseProxy: document.getElementById('setting-use-proxy'),
    proxyFields: document.getElementById('proxy-fields'),
    settingProxyHost: document.getElementById('setting-proxy-host'),
    settingProxyPort: document.getElementById('setting-proxy-port'),
    settingProxyUser: document.getElementById('setting-proxy-user'),
    settingProxyPass: document.getElementById('setting-proxy-pass'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    settingsSaveStatus: document.getElementById('settings-save-status'),
    btnRunDiagnostic: document.getElementById('btn-run-diagnostic'),
    diagnosticStatus: document.getElementById('diagnostic-status')
};

// ----------------------------------------------------
// 初期化処理
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    initNavigation();
    initTabs();
    initFileUpload();
    initSearchControls();
    initTableFilters();
    initTooltipAndModal();
    initSettings();
    
    // pywebviewのロード確認
    window.addEventListener('pywebviewready', () => {
        state.apiReady = true;
        console.log('pywebview is ready');
        // Python APIがロードされたら設定を読み込む
        loadSettingsFromBackend();
    });
    
    if (window.pywebview && window.pywebview.api) {
        state.apiReady = true;
        loadSettingsFromBackend();
    }
});

// ----------------------------------------------------
// セキュリティ: HTMLエスケープ処理 (XSS対策)
// ----------------------------------------------------
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

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
                dom.navItems.forEach(nav => nav.classList.remove('active'));
                item.btn.classList.add('active');

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
// 設定および診断ツール制御
// ----------------------------------------------------
async function loadSettingsFromBackend() {
    if (!state.apiReady) return;
    try {
        const settings = await window.pywebview.api.get_settings();
        
        // UIに値をセット
        if (dom.settingMaxLimit) dom.settingMaxLimit.value = settings.max_limit;
        MAX_SEARCH_LIMIT = settings.max_limit || 200;
        
        if (dom.settingUseProxy) {
            dom.settingUseProxy.checked = settings.use_proxy;
            toggleProxyFields(settings.use_proxy);
        }
        
        if (dom.settingProxyHost) dom.settingProxyHost.value = settings.proxy_host || '';
        if (dom.settingProxyPort) dom.settingProxyPort.value = settings.proxy_port || '';
        if (dom.settingProxyUser) dom.settingProxyUser.value = settings.proxy_user || '';
        if (dom.settingProxyPass) dom.settingProxyPass.value = settings.proxy_pass || '';
        
    } catch (e) {
        console.error("Failed to load settings:", e);
    }
}

function toggleProxyFields(show) {
    if (show) {
        dom.proxyFields.classList.remove('hidden');
    } else {
        dom.proxyFields.classList.add('hidden');
    }
}

function initSettings() {
    // プロキシチェックボックスの切り替えイベント
    if (dom.settingUseProxy) {
        dom.settingUseProxy.addEventListener('change', (e) => {
            toggleProxyFields(e.target.checked);
        });
    }

    // 設定保存処理
    if (dom.btnSaveSettings) {
        dom.btnSaveSettings.addEventListener('click', async () => {
            dom.btnSaveSettings.disabled = true;
            
            const limitVal = parseInt(dom.settingMaxLimit.value, 10) || 200;
            const settings = {
                max_limit: limitVal,
                use_proxy: dom.settingUseProxy.checked,
                proxy_host: dom.settingProxyHost.value.trim(),
                proxy_port: dom.settingProxyPort.value.trim(),
                proxy_user: dom.settingProxyUser.value.trim(),
                proxy_pass: dom.settingProxyPass.value.trim()
            };

            MAX_SEARCH_LIMIT = limitVal;

            try {
                let res;
                if (state.apiReady) {
                    res = await window.pywebview.api.save_settings(settings);
                } else {
                    res = { status: "success", message: "設定を保存しました(デモ)" };
                }

                if (res.status === 'success') {
                    dom.settingsSaveStatus.style.display = 'inline';
                    dom.settingsSaveStatus.style.color = 'var(--success)';
                    dom.settingsSaveStatus.textContent = '設定を保存しました。';
                    
                    setTimeout(() => {
                        dom.settingsSaveStatus.style.display = 'none';
                    }, 3000);
                } else {
                    alert(`設定の保存に失敗しました: ${res.message}`);
                }
            } catch (err) {
                alert(`システムエラーが発生しました: ${err.message}`);
            } finally {
                dom.btnSaveSettings.disabled = false;
            }
        });
    }

    // 接続診断の実行処理
    if (dom.btnRunDiagnostic) {
        dom.btnRunDiagnostic.addEventListener('click', async () => {
            dom.btnRunDiagnostic.disabled = true;
            dom.btnRunDiagnostic.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i><span>診断実行中...</span>';
            lucide.createIcons();

            dom.diagnosticStatus.classList.remove('hidden');
            dom.diagnosticStatus.style.borderColor = 'var(--border-color)';
            dom.diagnosticStatus.innerHTML = '<span style="color:var(--text-secondary);"><i data-lucide="info" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>診断テスト（DNS、プロキシ、ソケット通信、HTTP接続）を実行しています。しばらくお待ちください...</span>';
            lucide.createIcons();

            try {
                let res;
                if (state.apiReady) {
                    res = await window.pywebview.api.run_network_diagnostic();
                } else {
                    await new Promise(r => setTimeout(r, 1500));
                    res = { 
                        status: "success", 
                        log_path: "C:\\Users\\hana\\Documents\\GitHub\\webtools\\cinii-checker\\cinii_checker_diagnostic.log", 
                        message: "診断テストが完了しました。" 
                    };
                }

                if (res.status === 'success') {
                    dom.diagnosticStatus.style.borderColor = 'var(--success)';
                    dom.diagnosticStatus.innerHTML = `
                        <div style="color:var(--success);font-weight:bold;margin-bottom:6px;"><i data-lucide="check-circle" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>診断完了</div>
                        <p style="margin-bottom:8px;">ネットワークの各診断テストを実行し、診断ログファイルを正常に出力しました。</p>
                        <div style="background:#f1f5f9; padding:8px 12px; border-radius:6px; font-family:monospace; word-break:break-all; border:1px solid #cbd5e1; user-select:all;">
                            ${escapeHtml(res.log_path)}
                        </div>
                        <p style="margin-top:8px; font-size:0.8rem; color:var(--text-secondary);">※タイムアウト問題の原因調査のため、上記のファイルを開発担当者に提供してください。</p>
                    `;
                } else {
                    dom.diagnosticStatus.style.borderColor = 'var(--danger)';
                    dom.diagnosticStatus.innerHTML = `
                        <div style="color:var(--danger);font-weight:bold;margin-bottom:6px;"><i data-lucide="alert-triangle" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>エラー</div>
                        <p>${escapeHtml(res.message)}</p>
                    `;
                }
            } catch (err) {
                dom.diagnosticStatus.style.borderColor = 'var(--danger)';
                dom.diagnosticStatus.innerHTML = `
                    <div style="color:var(--danger);font-weight:bold;margin-bottom:6px;"><i data-lucide="alert-triangle" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"></i>診断システムエラー</div>
                    <p>接続テスト実行中にシステムエラーが発生しました: ${escapeHtml(err.message)}</p>
                `;
            } finally {
                dom.btnRunDiagnostic.disabled = false;
                dom.btnRunDiagnostic.innerHTML = '<i data-lucide="activity"></i><span>接続テスト・診断レポートの出力</span>';
                lucide.createIcons();
            }
        });
    }
}

// ----------------------------------------------------
// CSVファイル読み込み処理
// ----------------------------------------------------
function initFileUpload() {
    dom.btnSelectFile.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.csvFileInput.click();
    });

    dom.csvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

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

function getNcidsToSearch() {
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    let ids = [];

    if (activeTab === 'tab-text') {
        const text = dom.ncidInput.value;
        ids = text.split(/[\n,\s]+/).map(id => id.trim()).filter(id => id.length > 0);
    } else {
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

    ids = [...new Set(ids)];
    ids = ids.map(id => id.replace(/["']/g, ''));

    if (ids.length > MAX_SEARCH_LIMIT) {
        alert(`一度に検索できる最大件数は ${MAX_SEARCH_LIMIT} 件に制限されています。\n入力された ${ids.length} 件のうち、最初の ${MAX_SEARCH_LIMIT} 件のみを検索します。`);
        ids = ids.slice(0, MAX_SEARCH_LIMIT);
    }

    return ids;
}

function isValidNcid(ncid) {
    const ncidRegex = /^[A-Z0-9]{3,12}$/i;
    return ncidRegex.test(ncid);
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

    dom.btnStartSearch.disabled = true;
    dom.btnCancelSearch.disabled = false;
    dom.btnExportResults.disabled = true;
    dom.btnCancelSearch.innerHTML = '<i data-lucide="square"></i><span>一時停止</span>';
    lucide.createIcons();
    
    dom.resultsTbody.innerHTML = '';
    
    updateStatsUI(0, 0, 0, 0, list.length);
    updateProgressUI(0, list.length, '処理を開始しています...');

    let delay = parseFloat(dom.requestDelay.value) * 1000;
    if (isNaN(delay) || delay < 200) {
        delay = 200;
        dom.requestDelay.value = "0.2";
    }

    for (let i = 0; i < list.length; i++) {
        if (state.cancelRequested) {
            updateProgressUI(i, list.length, '一時停止しました');
            break;
        }

        state.currentIndex = i;
        const ncid = list[i];
        
        updateProgressUI(i, list.length, `検索中: ${escapeHtml(ncid)} (${i + 1}/${list.length})`);
        
        let result;

        if (!isValidNcid(ncid)) {
            result = {
                ncid: ncid,
                status: 'error',
                message: '不正な書誌ID形式です'
            };
        } else if (state.apiReady) {
            try {
                result = await window.pywebview.api.check_ncid(ncid);
            } catch (err) {
                result = { ncid, status: 'error', message: '通信処理でエラーが発生しました' };
            }
        } else {
            result = getDummyData(ncid);
            await new Promise(r => setTimeout(r, 200)); 
        }

        state.results.push(result);
        appendResultToTable(result, i + 1);
        
        const successCount = state.results.filter(r => r.status === 'success').length;
        const notfoundCount = state.results.filter(r => r.status === 'not_found').length;
        const errorCount = state.results.filter(r => r.status === 'error').length;
        updateStatsUI(successCount, notfoundCount, errorCount, i + 1, list.length);

        if (i < list.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

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
    dom.progressLabel.innerHTML = escapeHtml(message);
}

function updateStatsUI(success, notfound, error, processed, total) {
    dom.statTotal.textContent = `${processed} / ${total}`;
    dom.statSuccess.textContent = success;
    dom.statNotfound.textContent = notfound;
    dom.statError.textContent = error;
}

function appendResultToTable(result, index) {
    const emptyRow = dom.resultsTbody.querySelector('.empty-state');
    if (emptyRow) {
        dom.resultsTbody.innerHTML = '';
    }

    const tr = document.createElement('tr');
    tr.dataset.ncid = result.ncid;
    tr.dataset.index = index - 1;
    tr.dataset.status = result.status;

    let statusBadge = '';
    if (result.status === 'success') {
        statusBadge = '<span class="badge badge-success">成功</span>';
    } else if (result.status === 'not_found') {
        statusBadge = '<span class="badge badge-warning">該当なし</span>';
    } else {
        statusBadge = `<span class="badge badge-danger">エラー</span>`;
    }

    const escTitle = escapeHtml(result.title);
    const escMsg = escapeHtml(result.message);
    const titleText = result.status === 'success' ? escTitle : `<span class="text-light">${escMsg || 'データなし'}</span>`;
    
    const escCreator = escapeHtml(result.creator);
    const escPublisher = escapeHtml(result.publisher);
    const creatorText = result.creator || result.publisher ? `${escCreator} / ${escPublisher}` : '-';
    const escDate = escapeHtml(result.date);
    const escNcid = escapeHtml(result.ncid);
    
    let mieCell = '-';
    if (result.status === 'success') {
        if (result.has_mie_univ) {
            const escMieUrl = escapeHtml(result.mie_opac_url);
            mieCell = `<a href="${escMieUrl || '#'}" target="_blank" class="badge badge-success" style="text-decoration:none; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="external-link" style="width:10px;height:10px;"></i>あり</a>`;
        } else {
            mieCell = `<span class="badge" style="background-color:#e2e8f0;color:#64748b;">なし</span>`;
        }
    }

    let ownerCell = '-';
    if (result.status === 'success') {
        ownerCell = `<span class="holding-count" data-ncid="${escNcid}">${result.owner_count} 館</span>`;
    }

    tr.innerHTML = `
        <td>${index}</td>
        <td class="code-font">${escNcid}</td>
        <td title="${escTitle}">${titleText}</td>
        <td title="${creatorText}">${creatorText}</td>
        <td>${escDate || '-'}</td>
        <td>${mieCell}</td>
        <td>${ownerCell}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-secondary btn-sm btn-show-detail" style="padding: 4px 8px; font-size: 0.75rem;">詳細</button>
        </td>
    `;

    dom.resultsTbody.appendChild(tr);
    
    lucide.createIcons({
        attrs: {
            class: ["lucide"]
        },
        nameAttr: "data-lucide"
    });
    
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
    dom.resultsTable.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.holding-count');
        if (!target) return;

        const ncid = target.dataset.ncid;
        const result = state.results.find(r => r.ncid === ncid);
        if (!result || !result.owners || result.owners.length === 0) return;

        dom.tooltipList.innerHTML = '';
        const limitOwners = result.owners.slice(0, 3);
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

    const closeActions = [dom.btnCloseModal, dom.btnCloseModalFoot, dom.detailModal];
    closeActions.forEach(element => {
        if (element) {
            element.addEventListener('click', (e) => {
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

    if (result.status === 'success') {
        if (result.has_mie_univ) {
            const escMieUrl = escapeHtml(result.mie_opac_url);
            dom.mMieStatus.innerHTML = `<span class="badge badge-success">あり</span>${escMieUrl ? ` <a href="${escMieUrl}" target="_blank" style="font-size:0.85rem;margin-left:8px;display:inline-flex;align-items:center;gap:4px;"><i data-lucide="external-link" style="width:14px;height:14px;"></i>OPACリンク</a>` : ''}`;
        } else {
            dom.mMieStatus.innerHTML = `<span class="badge" style="background-color:#e2e8f0;color:#64748b;">なし</span>`;
        }
    } else {
        dom.mMieStatus.textContent = '-';
    }

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
            const escOwnerName = escapeHtml(owner.name);
            const escOwnerUrl = escapeHtml(owner.url);
            li.innerHTML = `
                <span>${escOwnerName}</span>
                ${owner.url ? `<a href="${escOwnerUrl}" target="_blank"><i data-lucide="external-link" style="width:14px;height:14px;"></i>OPAC</a>` : ''}
            `;
            dom.mHoldingsList.appendChild(li);
        });
    }
    
    lucide.createIcons();

    const escDetailUrl = escapeHtml(result.detail_url);
    dom.btnCiniiLink.href = escDetailUrl || `https://ci.nii.ac.jp/ncid/${escapeHtml(result.ncid)}`;
    dom.detailModal.classList.add('active');
}

// ----------------------------------------------------
// CSVエクスポート処理
// ----------------------------------------------------
function exportCSV() {
    if (state.results.length === 0) return;

    let csvContent = '\uFEFF'; // BOM
    csvContent += 'No.,書誌ID(NCID),タイトル,著者/出版社,出版年,三重大所蔵,所蔵館数,ステータス,メッセージ\n';

    state.results.forEach((r, idx) => {
        const no = idx + 1;
        const ncid = escapeCSVField(r.ncid);
        const title = escapeCSVField(r.title || '');
        const creatorAndPub = escapeCSVField(`${r.creator || ''} / ${r.publisher || ''}`);
        const date = escapeCSVField(r.date || '');
        const mieUniv = r.status === 'success' ? (r.has_mie_univ ? 'あり' : 'なし') : '';
        const count = r.status === 'success' ? r.owner_count : '';
        const status = r.status === 'success' ? '成功' : (r.status === 'not_found' ? '該当なし' : 'エラー');
        const msg = escapeCSVField(r.message || '');

        csvContent += `${no},${ncid},${title},${creatorAndPub},${date},${mieUniv},${count},${status},${msg}\n`;
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
    const success = hash % 7 !== 0;
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
    
    const schools = ["東京大学", "京都大学", "大阪大学", "東北大学", "名古屋大学", "九州大学", "北海道大学", "早稲田大学", "慶應義塾大学", "筑波大学"];
    
    const hasMie = hash % 3 === 0;
    const mieOpac = hasMie ? `https://opac.example.ac.jp/record/mie/${ncid}` : '';

    const owners = [];
    if (hasMie) {
        owners.push({
            name: "三重大学 附属図書館",
            url: mieOpac
        });
    }

    for (let i = 0; i < count; i++) {
        const sch = schools[(hash + i) % schools.length];
        const lib = (i % 2 === 0) ? "附属図書館" : "総合図書館";
        owners.push({
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
        owner_count: count + (hasMie ? 1 : 0),
        owners: owners,
        has_mie_univ: hasMie,
        mie_opac_url: mieOpac,
        detail_url: `https://ci.nii.ac.jp/ncid/${ncid}`
    };
}
