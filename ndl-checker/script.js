/* ==========================================================================
   NDL PUBLIC ACCESS CHECKER - JAVASCRIPT
   Features: Japan Search API direct integration (CORS-friendly JSON API),
             access rights determination, journal issue grouping logic,
             and multiple simultaneous query batch processing with tabs.
   ========================================================================== */

// --- Core Application State ---
const STATE = {
    searchMode: 'single', // 'single' or 'multi'
    
    // Single search data
    results: [],
    groupedResults: [],
    
    // Multi search data
    multiKeywords: [],
    multiActiveKeyword: '',
    multiResults: {}, // { 'keyword': [results], ... }
    
    loading: false
};

const els = {
    // Mode Selectors
    btnModeSingle: document.getElementById('btn-mode-single'),
    btnModeMulti: document.getElementById('btn-mode-multi'),
    formSingle: document.getElementById('search-form-single'),
    formMulti: document.getElementById('search-form-multi'),
    
    // Inputs & Action triggers
    inputSearch: document.getElementById('input-search'),
    btnSearch: document.getElementById('btn-search'),
    inputSearchMulti: document.getElementById('input-search-multi'),
    btnSearchMulti: document.getElementById('btn-search-multi'),
    
    // Checkbox filters
    chkBook: document.getElementById('chk-type-book'),
    chkJournal: document.getElementById('chk-type-journal'),
    chkOnlyDigitized: document.getElementById('chk-only-digitized'),
    chkScopeInternet: document.getElementById('chk-scope-internet'),
    chkDirectConnect: document.getElementById('chk-direct-connect'),
    inputCustomProxy: document.getElementById('input-custom-proxy'),
    
    // Display elements
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    debugLog: document.getElementById('debug-log'),
    multiResultsTabs: document.getElementById('multi-results-tabs'),
    resultsMeta: document.getElementById('results-meta'),
    textHitCount: document.getElementById('text-hit-count'),
    resultsList: document.getElementById('results-list'),
    
    // Login elements
    loginOverlay: document.getElementById('login-overlay'),
    inputLoginPassword: document.getElementById('input-login-password'),
    btnLoginSubmit: document.getElementById('btn-login-submit'),
    loginErrorMsg: document.getElementById('login-error-msg')
};

// Global Debug Log Accumulator
let debugLogs = [];

function logDebug(message) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const msg = `[${timestamp}] ${message}`;
    console.log(msg);
    debugLogs.push(msg);
}

// --- API Helpers (Using CORS-friendly Japan Search API) ---

// Base JSON fetcher from Japan Search API
async function fetchNDLRaw(keyword) {
    let dbParam = '';
    // If "only digitized" is checked, restrict database search to 'dignl' (NDL Digital Collection)
    if (els.chkOnlyDigitized.checked) {
        dbParam = '&f-db=dignl';
    }
    
    // We check if the user is using the Direct NDL API override (requires CORS extensions)
    if (els.chkDirectConnect.checked) {
        logDebug(`Direct Connect: Attempting direct fetch to NDL (OpenSearch XML) for "${keyword}"`);
        const queryUrl = `https://ndlsearch.ndl.go.jp/api/opensearch?any=${encodeURIComponent(keyword)}&cnt=100${els.chkOnlyDigitized.checked ? '&dpid=ndl-dl' : ''}`;
        try {
            const response = await fetch(queryUrl);
            if (response.ok) {
                const xmlText = await response.text();
                if (xmlText && xmlText.trim().length > 0) {
                    logDebug(`Direct Connect: Fetch succeeded! (Returned XML)`);
                    return { format: 'xml', data: xmlText };
                }
            }
            throw new Error(`Direct connection returned HTTP status ${response.status}`);
        } catch (errDirect) {
            logDebug(`Direct Connect Error: ${errDirect.message}`);
            throw new Error(`直接接続での通信に失敗しました。(${errDirect.message})`);
        }
    }
    
    // --- Default Mode: Query Japan Search API (CORS-friendly, returns JSON natively!) ---
    // This completely bypasses third-party public CORS proxies and timeouts.
    const queryUrl = `https://jpsearch.go.jp/api/item/search/jps-cross?keyword=${encodeURIComponent(keyword)}&size=100${dbParam}`;
    logDebug(`Querying Japan Search API: ${queryUrl}`);
    
    const response = await fetch(queryUrl);
    if (!response.ok) {
        throw new Error(`Japan Search API returned HTTP status ${response.status}`);
    }
    
    const resJson = await response.json();
    logDebug(`Japan Search API succeeded! Hit count: ${resJson.hit}`);
    return { format: 'json', data: resJson };
}

// Parse Japan Search JSON response to uniform item objects
function parseJsonItems(resData) {
    const items = resData.list || [];
    const results = [];
    
    for (let item of items) {
        const common = item.common || {};
        const title = common.title || 'タイトル不明';
        
        // Contributor list formatting
        let author = '著者不明';
        if (common.contributor) {
            author = Array.isArray(common.contributor) ? common.contributor.join(', ') : common.contributor;
        }
        
        // Extract publisher & issued year from source RDF block
        let publisher = '出版社不明';
        let issued = '出版年不明';
        
        const rdf = item['dignl-rdf:RDF']?.['dcndl:BibResource'] || 
                    item['bibnl-rdf:RDF']?.['dcndl:BibResource'];
                    
        if (rdf) {
            publisher = rdf['dcterms:publisher']?.['foaf:Agent']?.['foaf:name-s'] || 
                        rdf['dcndl:digitizedPublisher-s'] || 
                        '出版社不明';
                        
            issued = rdf['dcterms:issued-s'] || 
                     rdf['dcterms:date-s'] || 
                     (common.temporal ? (Array.isArray(common.temporal) ? common.temporal[0] : common.temporal) : '出版年不明');
        }
        
        const database = common.database || '';
        const isDigitized = database === 'dignl'; // NDL Digital Collection
        
        const link = common.linkUrl || `https://jpsearch.go.jp/item/${item.id || ''}`;
        const dlLink = isDigitized ? common.linkUrl : null;
        
        // Determine Access Scope
        let scope = 'none';
        if (isDigitized) {
            scope = 'library'; // Default fallback
            
            const accessRights = rdf?.['dcterms:accessRights-s'] || '';
            const rights = rdf?.['dcterms:rights-s'] || '';
            const rightsText = (Array.isArray(rights) ? rights.join(' ') : rights) + ' ' + accessRights;
            
            if (common.contentsAccess === 'internet') {
                scope = 'internet';
            } else if (rightsText.includes('送信') || rightsText.includes('個人') || rightsText.includes('参加館')) {
                scope = 'personal';
            }
        }
        
        const category = common.category || [];
        const isJournal = category.includes('periodical') || 
                           category.includes('journal') || 
                           category.includes('serial') ||
                           title.includes('巻') || 
                           title.includes('号') || 
                           /;\d{4}\./.test(title) || 
                           /\d{4}\(\d{1,2}\)/.test(title);
                           
        results.push({
            title,
            author,
            publisher,
            issued,
            isJournal,
            link,
            dlLink,
            scope
        });
    }
    
    return results;
}

// Fallback XML parser (used only if direct connect xml mode is selected)
function parseXmlItems(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
    if (parseError) {
        throw new Error("XMLの解析に失敗しました。");
    }
    
    const items = xmlDoc.getElementsByTagName('item');
    const results = [];
    
    for (let itemEl of items) {
        const title = xmlGetVal(itemEl, 'title') || '';
        const author = xmlGetVal(itemEl, 'author') || xmlGetVal(itemEl, 'creator') || '著者不明';
        const publisher = xmlGetVal(itemEl, 'publisher') || '出版社不明';
        const issued = xmlGetVal(itemEl, 'issued') || xmlGetVal(itemEl, 'date') || '出版年不明';
        const category = xmlGetVal(itemEl, 'category') || '';
        
        const link = xmlFindItemLink(itemEl);
        const dlLink = xmlFindNdlDlLink(itemEl);
        const scope = xmlDetermineAccessScope(itemEl, dlLink);
        
        const isJournal = category.includes('雑誌') || 
                           category.includes('journal') || 
                           category.includes('serial') || 
                           title.includes('巻') || 
                           title.includes('号') || 
                           /;\d{4}\./.test(title) || 
                           /\d{4}\(\d{1,2}\)/.test(title);
        
        results.push({
            title,
            author,
            publisher,
            issued,
            isJournal,
            link,
            dlLink,
            scope
        });
    }
    return results;
}

// XML Parsing Sub-Helpers (Strictly for fallback Direct mode)
function xmlGetVal(element, localName) {
    const nsList = ['http://purl.org/dc/elements/1.1/', 'http://purl.org/dc/terms/', 'http://ndl.go.jp/dcndl/terms/', 'http://www.w3.org/2000/01/rdf-schema#'];
    for (let ns of nsList) {
        const els = element.getElementsByTagNameNS(ns, localName);
        if (els && els.length > 0) return els[0].textContent;
    }
    const fallback = element.getElementsByTagName('dc:' + localName)[0] || 
                     element.getElementsByTagName('dcterms:' + localName)[0] ||
                     element.getElementsByTagName('dcndl:' + localName)[0] ||
                     element.getElementsByTagName('rdfs:' + localName)[0] ||
                     element.getElementsByTagName(localName)[0];
    return fallback ? fallback.textContent : '';
}

function xmlFindNdlDlLink(itemEl) {
    const seeAlsoEls = itemEl.getElementsByTagName('rdfs:seeAlso') || itemEl.getElementsByTagName('seeAlso');
    for (let s of seeAlsoEls) {
        const resource = s.getAttribute('rdf:resource') || s.getAttribute('resource');
        if (resource && resource.includes('dl.ndl.go.jp')) return resource;
    }
    const idEls = itemEl.getElementsByTagName('dc:identifier') || itemEl.getElementsByTagName('identifier');
    for (let id of idEls) {
        const txt = id.textContent;
        if (txt) {
            if (txt.includes('dl.ndl.go.jp')) return txt;
            if (txt.startsWith('info:ndljp/pid/')) return 'https://dl.ndl.go.jp/' + txt.replace('info:ndljp/', '');
        }
    }
    const linkEl = itemEl.getElementsByTagName('link')[0];
    if (linkEl && linkEl.textContent.includes('dl.ndl.go.jp')) return linkEl.textContent;
    return null;
}

function xmlFindItemLink(itemEl) {
    const linkEl = itemEl.getElementsByTagName('link')[0];
    if (linkEl) {
        const url = linkEl.textContent || linkEl.innerHTML || '';
        if (url.trim().length > 0) return url.trim();
    }
    const seeAlsoEls = itemEl.getElementsByTagName('rdfs:seeAlso') || itemEl.getElementsByTagName('seeAlso');
    for (let s of seeAlsoEls) {
        const resource = s.getAttribute('rdf:resource') || s.getAttribute('resource');
        if (resource) return resource;
    }
    const guidEl = itemEl.getElementsByTagName('guid')[0];
    if (guidEl) {
        const guidText = guidEl.textContent || '';
        if (guidText.startsWith('http')) return guidText.trim();
    }
    return '';
}

function xmlDetermineAccessScope(itemEl, dlLink) {
    if (!dlLink) return 'none';
    const textSources = [];
    const addText = (localName) => {
        const txt = xmlGetVal(itemEl, localName);
        if (txt) textSources.push(txt.toLowerCase());
    };
    addText('rights'); addText('accessRights'); addText('description');
    const fullText = textSources.join(' ');
    
    if (fullText.includes('インターネット公開') || fullText.includes('インターネットで公開') || fullText.includes('オープンアクセス')) {
        return 'internet';
    }
    if (fullText.includes('送信サービス') || fullText.includes('個人送信') || fullText.includes('図書館送信') || fullText.includes('送信参加館')) {
        return 'personal';
    }
    return 'library';
}


// --- Pipelines ---

// 1. Single Query Pipeline
async function searchNDL() {
    const query = els.inputSearch.value.trim();
    if (!query) {
        alert("検索キーワードを入力してください。");
        return;
    }
    
    debugLogs = [];
    
    els.loadingState.style.display = 'flex';
    els.loadingState.querySelector('p').textContent = "API からデータを取得中...";
    els.errorState.style.display = 'none';
    els.resultsMeta.style.display = 'none';
    els.multiResultsTabs.style.display = 'none';
    els.resultsList.innerHTML = '';
    
    STATE.loading = true;
    STATE.results = [];
    STATE.groupedResults = [];
    STATE.searchMode = 'single';
    
    try {
        const responseData = await fetchNDLRaw(query);
        if (!responseData || !responseData.data) {
            throw new Error("APIからデータが返されませんでした。");
        }
        
        if (responseData.format === 'json') {
            STATE.results = parseJsonItems(responseData.data);
        } else {
            STATE.results = parseXmlItems(responseData.data);
        }
        
        processAndRenderResults();
    } catch (err) {
        console.error("NDL Checker Error:", err);
        els.errorMessage.textContent = `接続エラーが発生しました: NDLへの接続タイムアウトか、CORS接続不良の可能性があります。`;
        els.debugLog.textContent = debugLogs.join('\n');
        els.errorState.style.display = 'block';
    } finally {
        els.loadingState.style.display = 'none';
        STATE.loading = false;
    }
}

// 2. Multi Query Pipeline
async function searchNDLMulti() {
    const rawInput = els.inputSearchMulti.value;
    let keywords = rawInput.split('\n')
                           .map(k => k.trim())
                           .filter(k => k.length > 0);
                           
    if (keywords.length === 0) {
        alert("検索キーワードを入力してください（改行区切り）。");
        return;
    }
    
    debugLogs = [];
    
    if (keywords.length > 10) {
        alert(`同時に検索できるのは最大10件までです。最初の10件のみ検索を実行します。`);
        keywords = keywords.slice(0, 10);
        els.inputSearchMulti.value = keywords.join('\n');
    }
    
    els.loadingState.style.display = 'flex';
    els.errorState.style.display = 'none';
    els.resultsMeta.style.display = 'none';
    els.multiResultsTabs.style.display = 'none';
    els.resultsList.innerHTML = '';
    
    STATE.loading = true;
    STATE.searchMode = 'multi';
    STATE.multiKeywords = keywords;
    STATE.multiResults = {};
    STATE.multiActiveKeyword = keywords[0];
    
    const delay = ms => new Promise(res => setTimeout(res, ms));
    
    try {
        for (let i = 0; i < keywords.length; i++) {
            const kw = keywords[i];
            els.loadingState.querySelector('p').textContent = `「${kw}」を検索中... (${i + 1}/${keywords.length}件目)`;
            
            try {
                const responseData = await fetchNDLRaw(kw);
                if (responseData && responseData.data) {
                    if (responseData.format === 'json') {
                        STATE.multiResults[kw] = parseJsonItems(responseData.data);
                    } else {
                        STATE.multiResults[kw] = parseXmlItems(responseData.data);
                    }
                } else {
                    STATE.multiResults[kw] = [];
                }
            } catch (err) {
                logDebug(`Error searching for "${kw}": ${err.message}`);
                STATE.multiResults[kw] = [];
            }
            
            if (i < keywords.length - 1) {
                await delay(600);
            }
        }
        
        renderMultiSearchTabs();
        switchMultiTab(STATE.multiActiveKeyword);
        
    } catch (err) {
        console.error("NDL Multi-Checker Error:", err);
        els.errorMessage.textContent = `一括検索中にエラーが発生しました。`;
        els.debugLog.textContent = debugLogs.join('\n');
        els.errorState.style.display = 'block';
    } finally {
        els.loadingState.style.display = 'none';
        STATE.loading = false;
    }
}

// Render multi search tab bar
function renderMultiSearchTabs() {
    els.multiResultsTabs.innerHTML = '';
    
    STATE.multiKeywords.forEach(kw => {
        const rawResults = STATE.multiResults[kw] || [];
        
        const tempFiltered = rawResults.filter(item => {
            if (item.isJournal && !els.chkJournal.checked) return false;
            if (!item.isJournal && !els.chkBook.checked) return false;
            if (els.chkOnlyDigitized.checked && item.scope === 'none') return false;
            if (els.chkScopeInternet.checked && item.scope !== 'internet') return false;
            return true;
        });
        const tempGrouped = groupIssues(tempFiltered);
        const count = tempGrouped.length;
        
        const tabBtn = document.createElement('button');
        tabBtn.className = `tab-btn ${kw === STATE.multiActiveKeyword ? 'active' : ''}`;
        tabBtn.setAttribute('data-keyword', kw);
        tabBtn.innerHTML = `
            <span>${escapeHTML(kw)}</span>
            <span class="tab-badge">${count}</span>
        `;
        
        tabBtn.addEventListener('click', () => {
            switchMultiTab(kw);
        });
        
        els.multiResultsTabs.appendChild(tabBtn);
    });
    
    els.multiResultsTabs.style.display = 'flex';
}

// Switch between active keyword tabs
function switchMultiTab(keyword) {
    STATE.multiActiveKeyword = keyword;
    
    const buttons = els.multiResultsTabs.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-keyword') === keyword) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    STATE.results = STATE.multiResults[keyword] || [];
    processAndRenderResults();
}

// Apply checked filter options and group journal volumes
function processAndRenderResults() {
    const filtered = STATE.results.filter(item => {
        if (item.isJournal && !els.chkJournal.checked) return false;
        if (!item.isJournal && !els.chkBook.checked) return false;
        if (els.chkOnlyDigitized.checked && item.scope === 'none') return false;
        if (els.chkScopeInternet.checked && item.scope !== 'internet') return false;
        return true;
    });
    
    STATE.groupedResults = groupIssues(filtered);
    renderCards();
}

// Core Grouping Logic: Aggregate single journal issues under main parent title
function groupIssues(resultsArray) {
    const grouped = [];
    const journalMap = {};
    
    resultsArray.forEach(item => {
        if (item.isJournal) {
            const match = item.title.match(/^(.*?)\s+([\d().・\-\/;:；：巻号年月?？]+)$/);
            let parentTitle = item.title;
            let issueName = '巻号情報なし';
            
            if (match) {
                parentTitle = match[1].trim();
                issueName = match[2].trim();
            } else {
                const colonIdx = item.title.lastIndexOf(' ');
                if (colonIdx > 0) {
                    parentTitle = item.title.substring(0, colonIdx).trim();
                    issueName = item.title.substring(colonIdx + 1).trim();
                }
            }
            
            if (!journalMap[parentTitle]) {
                journalMap[parentTitle] = {
                    title: parentTitle,
                    author: item.author,
                    publisher: item.publisher,
                    issued: item.issued,
                    isJournal: true,
                    issues: []
                };
                grouped.push(journalMap[parentTitle]);
            }
            
            if (!journalMap[parentTitle].issues.some(iss => iss.name === issueName)) {
                journalMap[parentTitle].issues.push({
                    name: issueName,
                    dlLink: item.dlLink,
                    link: item.link,
                    scope: item.scope
                });
            }
        } else {
            grouped.push(item);
        }
    });
    
    return grouped;
}

// Render dynamic HTML output
function renderCards() {
    els.resultsList.innerHTML = '';
    
    if (STATE.groupedResults.length === 0) {
        els.resultsMeta.style.display = 'none';
        els.resultsList.innerHTML = `
            <div class="welcome-placeholder">
                <div class="placeholder-icon">🔍</div>
                <h3>条件に一致する結果が見つかりませんでした</h3>
                <p>フィルター設定を緩めるか、別のキーワードでお試しください。</p>
            </div>
        `;
        return;
    }
    
    els.textHitCount.textContent = `判定結果: ${STATE.groupedResults.length}件表示中`;
    els.resultsMeta.style.display = 'flex';
    
    STATE.groupedResults.forEach(item => {
        const card = document.createElement('div');
        card.className = 'result-card-item';
        
        if (item.isJournal) {
            const scopes = new Set(item.issues.map(iss => iss.scope));
            let scopeBadgeHTML = '';
            
            if (scopes.has('internet')) {
                scopeBadgeHTML += '<span class="access-badge internet">インターネット公開あり</span> ';
            }
            if (scopes.has('personal')) {
                scopeBadgeHTML += '<span class="access-badge personal">個人送信あり</span> ';
            }
            if (scopes.has('library')) {
                scopeBadgeHTML += '<span class="access-badge library">館内限定あり</span> ';
            }
            if (scopeBadgeHTML === '') {
                scopeBadgeHTML = '<span class="access-badge none">デジタル化未対応</span>';
            }
            
            item.issues.sort((a, b) => a.name.localeCompare(b.name, 'ja-JP', { numeric: true }));
            
            card.innerHTML = `
                <div class="card-top">
                    <div>
                        <span class="card-type-badge journal">雑誌</span>
                        <h2 class="book-title">${item.title}</h2>
                    </div>
                    <div class="badge-container">
                        ${scopeBadgeHTML}
                    </div>
                </div>
                
                <div class="meta-info">
                    <div class="meta-field">作成者: <span>${item.author}</span></div>
                    <div class="meta-field">出版社: <span>${item.publisher}</span></div>
                </div>
                
                <div class="journal-issues-section">
                    <div class="section-label">
                        <span>電子化巻号一覧 (${item.issues.length}件):</span>
                        <button class="volume-toggle-btn" onclick="toggleIssues(this)">リストを折りたたむ</button>
                    </div>
                    <div class="issues-grid">
                        ${item.issues.map(issue => `
                            <a href="${issue.dlLink || issue.link}" target="_blank" rel="noopener noreferrer" class="issue-chip ${issue.scope}" title="${getScopeToolTip(issue.scope)}">
                                <span class="issue-name">${issue.name}</span>
                                <span class="issue-scope-dot"></span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
            
        } else {
            let badgeHTML = '';
            let actionBtnHTML = '';
            
            if (item.scope === 'internet') {
                badgeHTML = '<span class="access-badge internet">インターネット公開</span>';
            } else if (item.scope === 'personal') {
                badgeHTML = '<span class="access-badge personal">個人送信・送信参加館</span>';
            } else if (item.scope === 'library') {
                badgeHTML = '<span class="access-badge library">国立国会図書館内限定</span>';
            } else {
                badgeHTML = '<span class="access-badge none">デジタル化未対応</span>';
            }
            
            if (item.dlLink) {
                actionBtnHTML += `<a href="${item.dlLink}" target="_blank" rel="noopener noreferrer" class="action-link ndl-dl">📖 NDLデジコレで読む</a>`;
            }
            actionBtnHTML += `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="action-link ndl-search">🔍 NDLサーチ詳細</a>`;
            
            card.innerHTML = `
                <div class="card-top">
                    <div>
                        <span class="card-type-badge book">図書</span>
                        <h2 class="book-title">${item.title}</h2>
                    </div>
                    <div>
                        ${badgeHTML}
                    </div>
                </div>
                
                <div class="meta-info">
                    <div class="meta-field">著者: <span>${item.author}</span></div>
                    <div class="meta-field">出版社: <span>${item.publisher}</span></div>
                    <div class="meta-field">出版年: <span>${item.issued}</span></div>
                </div>
                
                <div class="card-actions">
                    ${actionBtnHTML}
                </div>
            `;
        }
        
        els.resultsList.appendChild(card);
    });
}

// Tooltip helper
function getScopeToolTip(scope) {
    if (scope === 'internet') return 'インターネット公開 (誰でも自宅から閲覧可能)';
    if (scope === 'personal') return '個人送信・送信参加館限定 (ログインまたは参加図書館で閲覧可能)';
    if (scope === 'library') return '国立国会図書館内限定 (NDL館内の端末でのみ閲覧可能)';
    return 'デジタル化未対応';
}

// Toggle folding/unfolding of journal issue grids
window.toggleIssues = function(btn) {
    const grid = btn.closest('.journal-issues-section').querySelector('.issues-grid');
    if (grid.style.display === 'none') {
        grid.style.display = 'grid';
        btn.textContent = 'リストを折りたたむ';
    } else {
        grid.style.display = 'none';
        btn.textContent = 'リストを展開する';
    }
};

// HTML Escaper
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Event Bindings
function bindEvents() {
    // Mode switcher buttons
    els.btnModeSingle.addEventListener('click', () => {
        STATE.searchMode = 'single';
        els.btnModeSingle.classList.add('active');
        els.btnModeMulti.classList.remove('active');
        els.formSingle.style.display = 'flex';
        els.formMulti.style.display = 'none';
        
        els.multiResultsTabs.style.display = 'none';
        els.resultsMeta.style.display = 'none';
        els.resultsList.innerHTML = `
            <div class="welcome-placeholder">
                <div class="placeholder-icon">📖</div>
                <h3>検索を開始してください</h3>
                <p>上の検索窓にタイトルを入力して検索ボタンを押すと、国会図書館から電子化および公開範囲のステータスを自動判定してリストアップします。</p>
            </div>
        `;
    });
    
    els.btnModeMulti.addEventListener('click', () => {
        STATE.searchMode = 'multi';
        els.btnModeMulti.classList.add('active');
        els.btnModeSingle.classList.remove('active');
        els.formMulti.style.display = 'flex';
        els.formSingle.style.display = 'none';
        
        els.multiResultsTabs.style.display = 'none';
        els.resultsMeta.style.display = 'none';
        els.resultsList.innerHTML = `
            <div class="welcome-placeholder">
                <div class="placeholder-icon">📋</div>
                <h3>一括検索を開始してください</h3>
                <p>上のテキストエリアに検索したいキーワードを改行区切りで入力（最大10件）して一括検索ボタンを押すと、キーワードごとの結果がタブで表示されます。</p>
            </div>
        `;
    });

    // Search triggers
    els.btnSearch.addEventListener('click', searchNDL);
    els.inputSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchNDL();
        }
    });
    
    els.btnSearchMulti.addEventListener('click', searchNDLMulti);
    
    // Realtime filters re-application on checkboxes check change
    const refilter = () => {
        if (STATE.searchMode === 'single') {
            if (STATE.results.length > 0) {
                processAndRenderResults();
            }
        } else {
            if (STATE.multiKeywords.length > 0) {
                renderMultiSearchTabs();
                switchMultiTab(STATE.multiActiveKeyword);
            }
        }
    };
    els.chkBook.addEventListener('change', refilter);
    els.chkJournal.addEventListener('change', refilter);
    els.chkOnlyDigitized.addEventListener('change', refilter);
    els.chkScopeInternet.addEventListener('change', refilter);
}

// Window Startup
window.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    
    // Set default personal proxy URL, or restore from localStorage if overridden
    const defaultProxy = 'https://script.google.com/macros/s/AKfycbwnN5_AE6-ph1tiPdhUX9pdDGu9WJp8vArP5KqBhrBmeGsDtInfJNWgH55Tl7ySL4LvKA/exec';
    const savedProxy = localStorage.getItem('ndl_checker_custom_proxy');
    
    if (els.inputCustomProxy) {
        els.inputCustomProxy.value = savedProxy !== null ? savedProxy : defaultProxy;
    }
    
    // Initialize simple login
    initLogin();
});

// --- Obfuscated Password & Simple Login Pipeline ---

// Obfuscated representation of password "mie" (each character XORed with 42)
const OBFUSCATED_SECRET = [71, 67, 79]; 

function checkPassword(input) {
    if (input.length !== OBFUSCATED_SECRET.length) return false;
    for (let i = 0; i < input.length; i++) {
        if ((input.charCodeAt(i) ^ 0x2A) !== OBFUSCATED_SECRET[i]) {
            return false;
        }
    }
    return true;
}

function handleLogin() {
    const inputVal = els.inputLoginPassword.value;
    if (checkPassword(inputVal)) {
        els.loginErrorMsg.textContent = '';
        els.loginOverlay.classList.add('hidden');
        sessionStorage.setItem('ndl_checker_logged_in', 'true');
        
        // Focus on search input for immediate query
        setTimeout(() => {
            if (els.inputSearch) els.inputSearch.focus();
        }, 400);
    } else {
        els.loginErrorMsg.textContent = 'パスワードが正しくありません。';
        els.inputLoginPassword.value = '';
        els.inputLoginPassword.focus();
    }
}

function initLogin() {
    // Check session storage
    if (sessionStorage.getItem('ndl_checker_logged_in') === 'true') {
        els.loginOverlay.classList.add('hidden');
        return;
    }
    
    // Bind login event triggers
    els.btnLoginSubmit.addEventListener('click', handleLogin);
    els.inputLoginPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Auto-focus on login input
    setTimeout(() => {
        if (els.inputLoginPassword) els.inputLoginPassword.focus();
    }, 100);
}
