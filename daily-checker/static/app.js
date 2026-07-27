document.addEventListener('DOMContentLoaded', () => {
    // Set default date to today
    const dateInput = document.getElementById('target-date-input');
    const today = getTodayDateString();
    dateInput.value = today;

    // Fetch initial config
    loadConfig();

    // Event Listeners
    document.getElementById('btn-today').addEventListener('click', () => {
        const t = getTodayDateString();
        document.getElementById('target-date-input').value = t;
        log(`点検対象日に「今日 (${t})」を設定しました。`, 'info');
    });

    document.getElementById('btn-run-all').addEventListener('click', runAllSteps);
    document.getElementById('btn-clear-log').addEventListener('click', () => {
        document.getElementById('log-output').innerHTML = '';
    });
});

function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success) {
            const cfg = data.config;
            if (cfg.dateStr) {
                document.getElementById('target-date-input').value = cfg.dateStr;
            }
            document.getElementById('cfg-work-file').textContent = cfg.workFileName || '(処理1で自動生成)';
            document.getElementById('cfg-text-path').textContent = cfg.textFilePath || '--';
            document.getElementById('cfg-text-path').title = cfg.textFilePath || '';
            document.getElementById('cfg-backup-path').textContent = cfg.backupPath || '--';
            document.getElementById('cfg-backup-path').title = cfg.backupPath || '';
            document.getElementById('cfg-dest-path').textContent = cfg.destPath || '--';
            document.getElementById('cfg-dest-path').title = cfg.destPath || '';

            // Stats (初期表示は0に統一、値がある場合のみ反映)
            document.getElementById('stat-e1').textContent = cfg.count_E1 ?? 0;
            document.getElementById('stat-f1').textContent = cfg.count_F1 ?? 0;
            document.getElementById('stat-e2').textContent = cfg.count_E2 ?? 0;
            document.getElementById('stat-f2').textContent = cfg.count_F2 ?? 0;
            document.getElementById('stat-g1').textContent = cfg.count_G1 ?? 0;
            document.getElementById('stat-g9').textContent = cfg.count_G9 ?? 0;
        }
    } catch (err) {
        log(`設定読込エラー: ${err.message}`, 'error');
    }
}

function setStepStatus(stepNum, statusText, statusClass) {
    const card = document.getElementById(`step-${stepNum}`);
    if (!card) return;
    const badge = card.querySelector('.step-status');
    badge.textContent = statusText;
    badge.className = `step-status status-${statusClass}`;
}

function log(message, type = 'info') {
    const logBox = document.getElementById('log-output');
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `[${time}] ${message}`;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
}

async function runSingleStep(stepNum) {
    const btnRunAll = document.getElementById('btn-run-all');
    btnRunAll.disabled = true;

    setStepStatus(stepNum, '実行中...', 'running');
    log(`[Step ${stepNum}] 処理を開始します...`, 'info');

    const dateStr = document.getElementById('target-date-input').value;

    try {
        const res = await fetch(`/api/step${stepNum}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dateStr })
        });
        const data = await res.json();

        if (data.success) {
            setStepStatus(stepNum, '完了', 'success');
            log(`[Step ${stepNum} 成功] ${data.message}`, 'success');
            if (data.warnings && data.warnings.length > 0) {
                data.warnings.forEach(w => log(`[Step ${stepNum} 警告] ${w}`, 'warn'));
            }
            await loadConfig();
            btnRunAll.disabled = false;
            return true;
        } else {
            setStepStatus(stepNum, 'エラー', 'error');
            log(`[Step ${stepNum} エラー] ${data.error}`, 'error');
            btnRunAll.disabled = false;
            return false;
        }
    } catch (err) {
        setStepStatus(stepNum, 'エラー', 'error');
        log(`[Step ${stepNum} 例外] ${err.message}`, 'error');
        btnRunAll.disabled = false;
        return false;
    }
}

async function runAllSteps() {
    if (!confirm('すべての蔵書点検チェック処理を一括で実行しますか？')) return;

    log('========================================', 'info');
    log('【全工程一括実行開始】', 'info');
    log('========================================', 'info');

    for (let s = 1; s <= 6; s++) {
        const success = await runSingleStep(s);
        if (!success) {
            log(`[一括実行中断] Step ${s} でエラーが発生したため、後続の処理を停止しました。`, 'error');
            return;
        }
    }

    log('========================================', 'success');
    log('🎉 【全工程一括実行完了】全ステップが正常終了しました！', 'success');
    log('========================================', 'success');
    alert('【一括処理完了】すべての蔵書点検処理が正常に完了しました！');
}
