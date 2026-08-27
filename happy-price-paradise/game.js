import { sound } from './audio.js';

// Words pool for the 3 reels
export const REEL_OPTIONS = [
    { id: 0, words: ['happy', 'hyper'], ja: ['ハッピー', 'ハイパー'], colors: ['#ff4081', '#7c4dff'] },
    { id: 1, words: ['price', 'prime'], ja: ['プライス', 'プライム'], colors: ['#00e676', '#ffab00'] },
    { id: 2, words: ['paradise', 'paradigm'], ja: ['パラダイス', 'パラダイム'], colors: ['#00b0ff', '#e040fb'] }
];

// Official Lyrics Sequences
export const LYRIC_PRESETS = {
    official5: {
        name: '公式ソング標準5フレーズ順',
        desc: '公式楽曲で繰り返される代表的な5フレーズの流れ',
        lines: [
            ['happy', 'price', 'paradise'],
            ['hyper', 'price', 'paradise'],
            ['happy', 'prime', 'paradise'],
            ['happy', 'price', 'paradigm'],
            ['hyper', 'prime', 'paradigm']
        ]
    },
    officialFull: {
        name: '公式フルコーラス（6フレーズ・締め付き）',
        desc: '5フレーズ後に再び最初のHappy Price Paradiseで締める完全版',
        lines: [
            ['happy', 'price', 'paradise'],
            ['hyper', 'price', 'paradise'],
            ['happy', 'prime', 'paradise'],
            ['happy', 'price', 'paradigm'],
            ['hyper', 'prime', 'paradigm'],
            ['happy', 'price', 'paradise']
        ]
    },
    all8: {
        name: '全8パターン完全コンプリート（全通り引き当て）',
        desc: '2×2×2 = 全8通りの組み合わせを全て1回以上引き当てるまで',
        lines: [
            ['happy', 'price', 'paradise'],
            ['happy', 'price', 'paradigm'],
            ['happy', 'prime', 'paradise'],
            ['happy', 'prime', 'paradigm'],
            ['hyper', 'price', 'paradise'],
            ['hyper', 'price', 'paradigm'],
            ['hyper', 'prime', 'paradise'],
            ['hyper', 'prime', 'paradigm']
        ]
    }
};

class RouletteApp {
    constructor() {
        this.currentPresetKey = 'official5';
        this.ruleMode = 'sequential_strict'; // 'sequential_strict' (reset on miss) or 'cumulative' (accumulate steps) or 'all8_collect'
        this.currentStep = 0;
        this.totalSpins = 0;
        this.isRunning = false;
        this.isSpinning = false;
        this.spinSpeed = 80; // ms per step in animation
        this.reelValues = ['happy', 'price', 'paradise'];
        this.animInterval = null;
        this.historyLog = [];
        this.collectedPatterns = new Set();
        this.autoSpinTimeout = null;

        // Sound toggle
        this.soundMuted = false;

        this.initDOMElements();
        this.bindEvents();
        this.renderTargetList();
        this.updateStatsDisplay();
    }

    initDOMElements() {
        this.dom = {
            presetSelect: document.getElementById('preset-select'),
            ruleSelect: document.getElementById('rule-select'),
            speedSelect: document.getElementById('speed-select'),
            targetList: document.getElementById('target-list'),
            currentStepDisplay: document.getElementById('current-step-display'),
            totalSpinsDisplay: document.getElementById('total-spins-display'),
            lastResultBadge: document.getElementById('last-result-badge'),
            reel0: document.getElementById('reel-0'),
            reel1: document.getElementById('reel-1'),
            reel2: document.getElementById('reel-2'),
            daisoShout: document.getElementById('daiso-shout'),
            btnStart: document.getElementById('btn-start'),
            btnStop: document.getElementById('btn-stop'),
            btnSingleSpin: document.getElementById('btn-single-spin'),
            btnReset: document.getElementById('btn-reset'),
            btnFastMonteCarlo: document.getElementById('btn-fast-sim'),
            monteCarloCount: document.getElementById('monte-carlo-count'),
            mcResults: document.getElementById('mc-results'),
            mcChart: document.getElementById('mc-chart'),
            logContainer: document.getElementById('history-log'),
            muteBtn: document.getElementById('btn-mute'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabPanels: document.querySelectorAll('.tab-panel'),
            shareBtn: document.getElementById('btn-share')
        };
    }

    bindEvents() {
        this.dom.presetSelect.addEventListener('change', (e) => {
            this.currentPresetKey = e.target.value;
            this.reset();
            this.renderTargetList();
        });

        this.dom.ruleSelect.addEventListener('change', (e) => {
            this.ruleMode = e.target.value;
            this.reset();
            this.renderTargetList();
        });

        this.dom.speedSelect.addEventListener('change', (e) => {
            this.spinSpeed = parseInt(e.target.value, 10);
        });

        this.dom.btnStart.addEventListener('click', () => this.startAutoRun());
        this.dom.btnStop.addEventListener('click', () => this.stopAutoRun());
        this.dom.btnSingleSpin.addEventListener('click', () => this.executeSingleSpinManual());
        this.dom.btnReset.addEventListener('click', () => this.reset());

        this.dom.btnFastMonteCarlo.addEventListener('click', () => this.runMonteCarloSimulation());

        this.dom.muteBtn.addEventListener('click', () => {
            this.soundMuted = !this.soundMuted;
            sound.enabled = !this.soundMuted;
            this.dom.muteBtn.textContent = this.soundMuted ? '🔇 ミュート中' : '🔊 サウンドON';
            this.dom.muteBtn.classList.toggle('muted', this.soundMuted);
        });

        this.dom.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                this.dom.tabButtons.forEach(b => b.classList.remove('active'));
                this.dom.tabPanels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${targetTab}`).classList.add('active');
            });
        });

        this.dom.shareBtn.addEventListener('click', () => this.shareResult());
    }

    renderTargetList() {
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        if (!preset) return;

        let html = '';
        if (this.currentPresetKey === 'all8') {
            html = `<div class="target-title">🎯 収集目標：全8通りの組み合わせ (${this.collectedPatterns.size}/8 収集済)</div>`;
            html += '<div class="pattern-grid">';
            preset.lines.forEach((line, idx) => {
                const phrase = line.join(' ');
                const isDone = this.collectedPatterns.has(phrase);
                html += `
                    <div class="pattern-badge ${isDone ? 'done' : ''}">
                        <span class="p-check">${isDone ? '✅' : '⬜'}</span>
                        <span class="p-text">${phrase}</span>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html = `<div class="target-title">🎯 再現目標：${preset.name}（全${preset.lines.length}フレーズ）</div>`;
            html += '<ol class="lyric-target-list">';
            preset.lines.forEach((line, idx) => {
                const isCurrent = (idx === this.currentStep);
                const isDone = (idx < this.currentStep);
                const phrase = line.join(' ');
                html += `
                    <li class="target-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
                        <span class="step-num">#${idx + 1}</span>
                        <span class="step-text">${phrase}</span>
                        <span class="step-daiso">（DAISO!）</span>
                        <span class="step-status">${isDone ? '✨ CLEAR' : isCurrent ? '👉 狙い中' : '待機'}</span>
                    </li>
                `;
            });
            html += '</ol>';
        }

        this.dom.targetList.innerHTML = html;
        this.dom.currentStepDisplay.textContent = this.currentPresetKey === 'all8' 
            ? `${this.collectedPatterns.size} / 8 種類` 
            : `${this.currentStep} / ${preset.lines.length} フレーズ`;
    }

    getRandomSpin() {
        const w1 = REEL_OPTIONS[0].words[Math.floor(Math.random() * 2)];
        const w2 = REEL_OPTIONS[1].words[Math.floor(Math.random() * 2)];
        const w3 = REEL_OPTIONS[2].words[Math.floor(Math.random() * 2)];
        return [w1, w2, w3];
    }

    updateReelsDisplay(words, highlightSuccess = false) {
        this.reelValues = words;
        this.dom.reel0.textContent = words[0];
        this.dom.reel1.textContent = words[1];
        this.dom.reel2.textContent = words[2];

        // Apply classes
        this.dom.reel0.className = `reel-box word-${words[0]}`;
        this.dom.reel1.className = `reel-box word-${words[1]}`;
        this.dom.reel2.className = `reel-box word-${words[2]}`;

        if (highlightSuccess) {
            this.dom.reel0.classList.add('match-flash');
            this.dom.reel1.classList.add('match-flash');
            this.dom.reel2.classList.add('match-flash');
            setTimeout(() => {
                this.dom.reel0.classList.remove('match-flash');
                this.dom.reel1.classList.remove('match-flash');
                this.dom.reel2.classList.remove('match-flash');
            }, 300);
        }
    }

    triggerDaisoAnimation() {
        this.dom.daisoShout.classList.remove('show');
        void this.dom.daisoShout.offsetWidth; // trigger reflow
        this.dom.daisoShout.classList.add('show');
        sound.playDaisoShout();
    }

    processSpinResult(resultWords) {
        this.totalSpins++;
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const resultPhrase = resultWords.join(' ');
        let isMatch = false;
        let isComplete = false;

        if (this.currentPresetKey === 'all8') {
            const newlyAdded = !this.collectedPatterns.has(resultPhrase);
            this.collectedPatterns.add(resultPhrase);
            if (newlyAdded) {
                isMatch = true;
                sound.playMatchSuccess();
                this.triggerDaisoAnimation();
            } else {
                sound.playReelStop(2);
            }
            if (this.collectedPatterns.size === 8) {
                isComplete = true;
            }
        } else {
            const targetLine = preset.lines[this.currentStep];
            const targetPhrase = targetLine.join(' ');

            if (resultPhrase === targetPhrase) {
                isMatch = true;
                this.currentStep++;
                sound.playMatchSuccess();
                this.triggerDaisoAnimation();

                if (this.currentStep >= preset.lines.length) {
                    isComplete = true;
                }
            } else {
                if (this.ruleMode === 'sequential_strict') {
                    // Strict mode: if missed, restart sequence!
                    if (this.currentStep > 0) {
                        this.addLog(`❌ [${resultPhrase}] → 外れ！リセット (到達: #${this.currentStep})`, 'miss');
                    }
                    this.currentStep = 0;
                    sound.playMiss();
                } else {
                    // Cumulative mode: keep step until matched
                    sound.playReelStop(2);
                }
            }
        }

        this.updateReelsDisplay(resultWords, isMatch);
        this.updateStatsDisplay(resultPhrase, isMatch);
        this.renderTargetList();

        if (isComplete) {
            this.onSequenceComplete();
        }

        return { isMatch, isComplete };
    }

    updateStatsDisplay(lastResult = '', isMatch = false) {
        this.dom.totalSpinsDisplay.textContent = this.totalSpins.toLocaleString();
        if (lastResult) {
            this.dom.lastResultBadge.textContent = `${lastResult} ${isMatch ? '🎯 HIT!' : '🎲'}`;
            this.dom.lastResultBadge.className = `result-badge ${isMatch ? 'hit' : 'miss'}`;
        }
    }

    addLog(msg, type = 'normal') {
        const item = document.createElement('div');
        item.className = `log-entry ${type}`;
        item.textContent = `[Spin #${this.totalSpins}] ${msg}`;
        this.dom.logContainer.prepend(item);
        if (this.dom.logContainer.children.length > 50) {
            this.dom.logContainer.removeChild(this.dom.logContainer.lastChild);
        }
    }

    executeSingleSpinManual() {
        if (this.isSpinning) return;
        const result = this.getRandomSpin();
        this.processSpinResult(result);
    }

    startAutoRun() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.dom.btnStart.disabled = true;
        this.dom.btnStop.disabled = false;
        this.dom.btnSingleSpin.disabled = true;

        const loop = () => {
            if (!this.isRunning) return;
            const result = this.getRandomSpin();
            const { isComplete } = this.processSpinResult(result);
            if (!isComplete && this.isRunning) {
                this.autoSpinTimeout = setTimeout(loop, this.spinSpeed);
            }
        };
        loop();
    }

    stopAutoRun() {
        this.isRunning = false;
        clearTimeout(this.autoSpinTimeout);
        this.dom.btnStart.disabled = false;
        this.dom.btnStop.disabled = true;
        this.dom.btnSingleSpin.disabled = false;
    }

    reset() {
        this.stopAutoRun();
        this.currentStep = 0;
        this.totalSpins = 0;
        this.collectedPatterns.clear();
        this.dom.logContainer.innerHTML = '';
        this.updateStatsDisplay();
        this.renderTargetList();
        this.updateReelsDisplay(['happy', 'price', 'paradise']);
        this.dom.lastResultBadge.textContent = '待機中';
        this.dom.lastResultBadge.className = 'result-badge';
    }

    onSequenceComplete() {
        this.stopAutoRun();
        sound.playCompleteFanfare();
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const msg = `🎉 完走達成！！ 合計 ${this.totalSpins.toLocaleString()} 回のスピンで歌詞の完全再現に成功しました！`;
        this.addLog(msg, 'complete');
        alert(`🎊 おめでとうございます！！\n${preset.name} を完全再現しました！\n\n総スピン回数: ${this.totalSpins.toLocaleString()} 回`);
    }

    // High Speed Monte Carlo Engine
    runMonteCarloSimulation() {
        const trials = parseInt(this.dom.monteCarloCount.value, 10) || 10000;
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const targetLines = preset.lines;
        const mode = this.ruleMode;
        const isAll8 = (this.currentPresetKey === 'all8');

        this.dom.mcResults.innerHTML = '<div class="loading-spinner">⚡ 超高速計算中...</div>';

        setTimeout(() => {
            const spinCounts = new Int32Array(trials);
            let totalSpinsSum = 0;
            let minSpins = Infinity;
            let maxSpins = 0;

            for (let t = 0; t < trials; t++) {
                let spins = 0;

                if (isAll8) {
                    // Collector simulation for 8 items with equal probability 1/8
                    let mask = 0;
                    while (mask !== 0xFF) {
                        spins++;
                        const pick = Math.floor(Math.random() * 8);
                        mask |= (1 << pick);
                    }
                } else if (mode === 'sequential_strict') {
                    // Markov chain: must hit line 0, then 1, ..., then N-1 consecutively
                    let step = 0;
                    const len = targetLines.length;
                    
                    // Precompute line index (0 to 7) for each target
                    const targetIdxs = targetLines.map(line => {
                        const b1 = line[0] === 'hyper' ? 1 : 0;
                        const b2 = line[1] === 'prime' ? 1 : 0;
                        const b3 = line[2] === 'paradigm' ? 1 : 0;
                        return (b1 << 2) | (b2 << 1) | b3;
                    });

                    while (step < len) {
                        spins++;
                        const currentPick = Math.floor(Math.random() * 8);
                        if (currentPick === targetIdxs[step]) {
                            step++;
                        } else {
                            step = (currentPick === targetIdxs[0]) ? 1 : 0; // if the miss happens to match step 0, we can be at step 1
                        }
                    }
                } else {
                    // Cumulative mode: geometric distribution sum
                    const len = targetLines.length;
                    for (let s = 0; s < len; s++) {
                        while (true) {
                            spins++;
                            if (Math.floor(Math.random() * 8) === 0) break; // 1/8 prob each
                        }
                    }
                }

                spinCounts[t] = spins;
                totalSpinsSum += spins;
                if (spins < minSpins) minSpins = spins;
                if (spins > maxSpins) maxSpins = spins;
            }

            // Calculate statistics
            spinCounts.sort();
            const mean = totalSpinsSum / trials;
            const median = spinCounts[Math.floor(trials / 2)];
            const p95 = spinCounts[Math.floor(trials * 0.95)];
            const p99 = spinCounts[Math.floor(trials * 0.99)];

            // Standard deviation
            let varianceSum = 0;
            for (let i = 0; i < trials; i++) {
                varianceSum += Math.pow(spinCounts[i] - mean, 2);
            }
            const stdDev = Math.sqrt(varianceSum / trials);

            // Theoretical Expected Value
            let theoreticalEV = '計算中';
            if (isAll8) {
                // Coupon Collector for 8 items: 8 * (1 + 1/2 + 1/3 + ... + 1/8) = 8 * 2.717857 = 21.74
                theoreticalEV = (8 * (1 + 1/2 + 1/3 + 1/4 + 1/5 + 1/6 + 1/7 + 1/8)).toFixed(2) + ' 回 (8×H₈)';
            } else if (mode === 'sequential_strict') {
                // For N distinct non-overlapping patterns: (8^N - 1) / (8 - 1) * 8 or approx 8 + 8^2 + ... + 8^N
                // For N=5: 8 + 64 + 512 + 4096 + 32768 = 37,448 回 (厳密Markov値)
                const N = targetLines.length;
                let sum = 0;
                for (let k = 1; k <= N; k++) sum += Math.pow(8, k);
                theoreticalEV = `約 ${sum.toLocaleString()} 回 (Σ 8ᵏ)`;
            } else {
                // Cumulative: N * 8
                theoreticalEV = `${targetLines.length * 8} 回 (${targetLines.length} × 8)`;
            }

            // Render Results HTML
            this.dom.mcResults.innerHTML = `
                <div class="stats-card-grid">
                    <div class="stat-box primary">
                        <div class="s-label">平均試行回数 (実測)</div>
                        <div class="s-val">${mean.toFixed(1).toLocaleString()} 回</div>
                        <div class="s-sub">理論期待値: ${theoreticalEV}</div>
                    </div>
                    <div class="stat-box">
                        <div class="s-label">中央値 (50%の人が達成)</div>
                        <div class="s-val">${median.toLocaleString()} 回</div>
                        <div class="s-sub">半分はこの回数以下で達成</div>
                    </div>
                    <div class="stat-box">
                        <div class="s-label">最速ラッキー記録 (MIN)</div>
                        <div class="s-val text-green">${minSpins.toLocaleString()} 回</div>
                        <div class="s-sub">最短理論限界: ${targetLines.length} 回</div>
                    </div>
                    <div class="stat-box">
                        <div class="s-label">ワースト泥沼記録 (MAX)</div>
                        <div class="s-val text-red">${maxSpins.toLocaleString()} 回</div>
                        <div class="s-sub">95%点: ${p95.toLocaleString()}回 / 99%点: ${p99.toLocaleString()}回</div>
                    </div>
                </div>
                <div class="stat-summary-text">
                    💡 <strong>分析解説:</strong> 
                    1フレーズが出る確率は <code>1/2 × 1/2 × 1/2 = 1/8 (12.5%)</code> です。<br>
                    ${mode === 'sequential_strict' ? `
                        5連続で順番通りに当てる厳密連続モードでは、途中で一度でも外れると最初に戻るため、
                        期待値は <strong>約37,448回</strong>（スロットを1秒に1回回し続けて約10.4時間）という超高難易度になります！
                    ` : `
                        各行を累積して揃えるモードなら、平均 <strong>${targetLines.length * 8}回</strong> で達成できます！
                    `}
                </div>
            `;

            this.drawHistogram(spinCounts, trials, minSpins, maxSpins, mean);
        }, 30);
    }

    drawHistogram(sortedSpins, trials, minVal, maxVal, mean) {
        const canvas = this.dom.mcChart;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.parentElement.clientWidth || 600;
        const h = canvas.height = 240;

        ctx.clearRect(0, 0, w, h);

        const binsCount = 40;
        const p99 = sortedSpins[Math.floor(trials * 0.98)];
        const effectiveMax = Math.max(p99, minVal + 10);
        const binWidth = (effectiveMax - minVal) / binsCount;
        const bins = new Array(binsCount).fill(0);

        for (let i = 0; i < trials; i++) {
            const val = sortedSpins[i];
            if (val <= effectiveMax) {
                const binIdx = Math.min(binsCount - 1, Math.floor((val - minVal) / binWidth));
                bins[binIdx]++;
            }
        }

        const maxBinVal = Math.max(...bins, 1);

        // Draw background grid
        ctx.strokeStyle = 'rgba(255, 64, 129, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const y = h - (h - 40) * (i / 4) - 20;
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(w - 20, y);
            ctx.stroke();
        }

        // Draw Bars
        const chartLeft = 45;
        const chartRight = w - 20;
        const chartBottom = h - 25;
        const chartHeight = h - 50;
        const barPixelWidth = (chartRight - chartLeft) / binsCount;

        for (let b = 0; b < binsCount; b++) {
            const count = bins[b];
            const barH = (count / maxBinVal) * chartHeight;
            const x = chartLeft + b * barPixelWidth;
            const y = chartBottom - barH;

            const grad = ctx.createLinearGradient(0, y, 0, chartBottom);
            grad.addColorStop(0, '#ff4081');
            grad.addColorStop(1, '#ff80ab');

            ctx.fillStyle = grad;
            ctx.fillRect(x + 1, y, barPixelWidth - 2, barH);
        }

        // Mean Line
        if (mean <= effectiveMax) {
            const meanX = chartLeft + ((mean - minVal) / (effectiveMax - minVal)) * (chartRight - chartLeft);
            ctx.strokeStyle = '#7c4dff';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(meanX, 10);
            ctx.lineTo(meanX, chartBottom);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#7c4dff';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`平均: ${mean.toFixed(0)}回`, meanX + 4, 20);
        }

        // Axis labels
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${minVal.toLocaleString()}回`, chartLeft, h - 8);
        ctx.fillText(`${effectiveMax.toLocaleString()}回 (上位98%)`, chartRight - 80, h - 8);
    }

    shareResult() {
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const text = `🛒『HAPPY PRICE PARADISE 歌詞ルーレットシミュレーター』🎶\n` +
            `【${preset.name}】を完全再現するまでに【${this.totalSpins.toLocaleString()}回】スピンしました！\n` +
            `ハッピー・ハイパー × プライス・プライム × パラダイス・パラダイム (DAISO!)\n` +
            `#ダイソー #ハッピープライスパラダイス #Webtools`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('📋 結果をクリップボードにコピーしました！SNSに貼り付けてシェアできます。');
            });
        } else {
            prompt('以下のテキストをコピーして共有してください：', text);
        }
    }
}

// Instantiate when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.app = new RouletteApp();
});
