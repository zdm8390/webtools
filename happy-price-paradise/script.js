/**
 * HAPPY PRICE PARADISE - Complete Application Script
 * Full 15-phrase DAISO Official Song Configuration & Simulation Engine
 */

// ==========================================
// 1. Web Audio API Sound Synthesizer
// ==========================================
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = false; // Default to muted
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playSpinTick() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400 + Math.random() * 200, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.04);
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    playReelStop(reelIndex = 0) {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const freqs = [523.25, 659.25, 783.99];
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freqs[reelIndex % 3] || 600, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.1);
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    playDaisoShout() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            
            // DAI!
            [587.33, 880].forEach(f => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            });

            // SO!
            [659.25, 1046.5].forEach(f => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + 0.13);
                gain.gain.setValueAtTime(0.12, now + 0.13);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + 0.13);
                osc.stop(now + 0.35);
            });
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    playMatchSuccess() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.08, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.12);
            });
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    playCompleteFanfare() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const melody = [
                { f: 523.25, d: 0.12, t: 0 },
                { f: 659.25, d: 0.12, t: 0.12 },
                { f: 783.99, d: 0.12, t: 0.24 },
                { f: 1046.5, d: 0.3, t: 0.36 },
                { f: 880.0, d: 0.15, t: 0.7 },
                { f: 1046.5, d: 0.6, t: 0.88 }
            ];

            melody.forEach(note => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note.f, now + note.t);
                gain.gain.setValueAtTime(0.12, now + note.t);
                gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + note.t);
                osc.stop(now + note.t + note.d);
            });
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    playMiss() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(140, now + 0.18);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }
}

const sound = new SoundEngine();

// ==========================================
// 2. Data & Lyric Presets (Exact DAISO Lyrics)
// ==========================================
const REEL_OPTIONS = [
    { id: 0, words: ['happy', 'hyper'], ja: ['ハッピー', 'ハイパー'] },
    { id: 1, words: ['price', 'prime'], ja: ['プライス', 'プライム'] },
    { id: 2, words: ['paradise', 'paradigm'], ja: ['パラダイス', 'パラダイム'] }
];

const LYRIC_PRESETS = {
    officialSong15: {
        name: '公式完全歌詞（全15フレーズ・3回連呼×5ブロック）',
        desc: 'ダイソー店内・カラオケ公式音源の全15フレーズ完全再現構成',
        blocks: [
            { label: '第1ブロック (原形×3)', lines: [0, 1, 2] },
            { label: '第2ブロック (hyper×3)', lines: [3, 4, 5] },
            { label: '第3ブロック (prime×3)', lines: [6, 7, 8] },
            { label: '第4ブロック (paradigm×3)', lines: [9, 10, 11] },
            { label: '第5ブロック (全変異×2＋原点締め×1)', lines: [12, 13, 14] }
        ],
        lines: [
            ['happy', 'price', 'paradise'], // 1
            ['happy', 'price', 'paradise'], // 2
            ['happy', 'price', 'paradise'], // 3
            ['hyper', 'price', 'paradise'], // 4
            ['hyper', 'price', 'paradise'], // 5
            ['hyper', 'price', 'paradise'], // 6
            ['happy', 'prime', 'paradise'], // 7
            ['happy', 'prime', 'paradise'], // 8
            ['happy', 'prime', 'paradise'], // 9
            ['happy', 'price', 'paradigm'], // 10
            ['happy', 'price', 'paradigm'], // 11
            ['happy', 'price', 'paradigm'], // 12
            ['hyper', 'prime', 'paradigm'], // 13
            ['hyper', 'prime', 'paradigm'], // 14
            ['happy', 'price', 'paradise']  // 15 (締め)
        ]
    },
    official5: {
        name: '代表5フレーズ順（ショート版）',
        desc: '5つの変異フレーズを順番に1回ずつ狙う基本モード',
        lines: [
            ['happy', 'price', 'paradise'],
            ['hyper', 'price', 'paradise'],
            ['happy', 'prime', 'paradise'],
            ['happy', 'price', 'paradigm'],
            ['hyper', 'prime', 'paradigm']
        ]
    },
    all8: {
        name: '全8パターン完全コンプリート（全種類引く）',
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

// ==========================================
// 3. Roulette & Simulation Core Engine
// ==========================================
class RouletteApp {
    constructor() {
        this.currentPresetKey = 'officialSong15'; // Default to full 15-phrase song
        this.ruleMode = 'sequential_strict'; // Default to sequential_strict (reset on miss)
        this.currentStep = 0;
        this.maxStepReached = 0; // Track maximum progress reached
        this.totalSpins = 0;
        this.isRunning = false;
        this.spinSpeed = -100; // Default to Light-Speed Batch (100 spins/frame)
        this.reelValues = ['happy', 'price', 'paradise'];
        this.historyLog = [];
        this.collectedPatterns = new Set();
        this.autoSpinTimeout = null;
        this.soundMuted = true; // Default to muted

        // Monte Carlo async controller
        this.isMcRunning = false;
        this.mcCancelRequested = false;

        this.initDOMElements();
        this.bindEvents();
        this.renderTargetList();
        this.updateStatsDisplay();
        setTimeout(() => this.drawInfographic(), 50);
    }

    initDOMElements() {
        this.dom = {
            presetSelect: document.getElementById('preset-select'),
            ruleSelect: document.getElementById('rule-select'),
            speedSelect: document.getElementById('speed-select'),
            targetList: document.getElementById('target-list'),
            currentStepDisplay: document.getElementById('current-step-display'),
            maxStepDisplay: document.getElementById('max-step-display'),
            totalSpinsDisplay: document.getElementById('total-spins-display'),
            lastResultBadge: document.getElementById('last-result-badge'),
            reel0: document.getElementById('reel-0'),
            reel1: document.getElementById('reel-1'),
            reel2: document.getElementById('reel-2'),
            daisoShout: document.getElementById('daiso-shout'),
            btnStart: document.getElementById('btn-start'),
            btnStop: document.getElementById('btn-stop'),
            btnSingleSpin: document.getElementById('btn-single-spin'),
            btnSkipGoal: document.getElementById('btn-skip-goal'),
            btnReset: document.getElementById('btn-reset'),
            btnFastMonteCarlo: document.getElementById('btn-fast-sim'),
            btnCancelMonteCarlo: document.getElementById('btn-cancel-sim'),
            monteCarloCount: document.getElementById('monte-carlo-count'),
            mcResults: document.getElementById('mc-results'),
            mcChart: document.getElementById('mc-chart'),
            logContainer: document.getElementById('history-log'),
            muteBtn: document.getElementById('btn-mute'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabPanels: document.querySelectorAll('.tab-panel'),
            shareBtn: document.getElementById('btn-share'),
            btnDownloadInfographic: document.getElementById('btn-download-infographic'),
            btnCopyInfographic: document.getElementById('btn-copy-infographic'),
            infographicCanvas: document.getElementById('infographic-canvas')
        };
    }

    bindEvents() {
        if (this.dom.presetSelect) {
            this.dom.presetSelect.value = this.currentPresetKey;
            this.dom.presetSelect.addEventListener('change', (e) => {
                this.currentPresetKey = e.target.value;
                this.reset();
                this.renderTargetList();
                this.drawInfographic();
            });
        }

        if (this.dom.ruleSelect) {
            this.dom.ruleSelect.value = this.ruleMode;
            this.dom.ruleSelect.addEventListener('change', (e) => {
                this.ruleMode = e.target.value;
                this.reset();
                this.renderTargetList();
                this.drawInfographic();
            });
        }

        if (this.dom.speedSelect) {
            this.dom.speedSelect.value = this.spinSpeed;
            this.dom.speedSelect.addEventListener('change', (e) => {
                this.spinSpeed = parseInt(e.target.value, 10);
            });
        }

        if (this.dom.btnStart) {
            this.dom.btnStart.addEventListener('click', () => {
                sound.init();
                this.startAutoRun();
            });
        }

        if (this.dom.btnStop) {
            this.dom.btnStop.addEventListener('click', () => this.stopAutoRun());
        }

        if (this.dom.btnSingleSpin) {
            this.dom.btnSingleSpin.addEventListener('click', () => {
                sound.init();
                this.executeSingleSpinManual();
            });
        }

        if (this.dom.btnSkipGoal) {
            this.dom.btnSkipGoal.addEventListener('click', () => {
                sound.init();
                this.skipToGoal();
            });
        }

        if (this.dom.btnReset) {
            this.dom.btnReset.addEventListener('click', () => this.reset());
        }

        if (this.dom.btnFastMonteCarlo) {
            this.dom.btnFastMonteCarlo.addEventListener('click', () => {
                sound.init();
                this.runMonteCarloSimulation();
            });
        }

        if (this.dom.btnCancelMonteCarlo) {
            this.dom.btnCancelMonteCarlo.addEventListener('click', () => {
                this.mcCancelRequested = true;
            });
        }

        if (this.dom.muteBtn) {
            this.dom.muteBtn.textContent = '🔇 サウンドOFF';
            this.dom.muteBtn.classList.add('muted');
            this.dom.muteBtn.addEventListener('click', () => {
                sound.init();
                this.soundMuted = !this.soundMuted;
                sound.enabled = !this.soundMuted;
                this.dom.muteBtn.textContent = this.soundMuted ? '🔇 サウンドOFF' : '🔊 サウンドON';
                this.dom.muteBtn.classList.toggle('muted', this.soundMuted);
            });
        }

        if (this.dom.tabButtons) {
            this.dom.tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetTab = btn.dataset.tab;
                    this.dom.tabButtons.forEach(b => b.classList.remove('active'));
                    this.dom.tabPanels.forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    const targetPanel = document.getElementById(`tab-${targetTab}`);
                    if (targetPanel) {
                        targetPanel.classList.add('active');
                    }
                    if (targetTab === 'sim') {
                        setTimeout(() => this.drawInfographic(), 30);
                    }
                });
            });
        }

        if (this.dom.shareBtn) {
            this.dom.shareBtn.addEventListener('click', () => this.shareResult());
        }

        if (this.dom.btnDownloadInfographic) {
            this.dom.btnDownloadInfographic.addEventListener('click', () => this.downloadInfographic());
        }

        if (this.dom.btnCopyInfographic) {
            this.dom.btnCopyInfographic.addEventListener('click', () => this.copyInfographic());
        }
    }

    renderTargetList() {
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        if (!preset || !this.dom.targetList) return;

        let html = '';
        if (this.currentPresetKey === 'all8') {
            html = `<div class="target-title">🎯 収集目標：全8通りの組み合わせ (${this.collectedPatterns.size}/8 収集済)</div>`;
            html += '<div class="pattern-grid">';
            preset.lines.forEach((line) => {
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
        } else if (preset.blocks) {
            // Blocked view for full 15-phrase song
            html = `<div class="target-title">🎯 再現目標：${preset.name}</div>`;
            html += '<div class="blocks-container">';
            preset.blocks.forEach((block) => {
                const isBlockDone = block.lines.every(idx => idx < this.currentStep);
                const isBlockActive = block.lines.includes(this.currentStep);
                html += `
                    <div class="lyric-block-card ${isBlockDone ? 'block-done' : ''} ${isBlockActive ? 'block-active' : ''}">
                        <div class="block-header">${block.label}</div>
                        <ol class="lyric-target-list">
                `;
                block.lines.forEach((idx) => {
                    const line = preset.lines[idx];
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
                html += '        </ol></div>';
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
        if (this.dom.currentStepDisplay) {
            this.dom.currentStepDisplay.textContent = this.currentPresetKey === 'all8' 
                ? `${this.collectedPatterns.size} / 8 種類` 
                : `${this.currentStep} / ${preset.lines.length} フレーズ`;
        }
    }

    getRandomSpin() {
        const w1 = REEL_OPTIONS[0].words[Math.floor(Math.random() * 2)];
        const w2 = REEL_OPTIONS[1].words[Math.floor(Math.random() * 2)];
        const w3 = REEL_OPTIONS[2].words[Math.floor(Math.random() * 2)];
        return [w1, w2, w3];
    }

    updateReelsDisplay(words, highlightSuccess = false) {
        this.reelValues = words;
        if (this.dom.reel0) {
            this.dom.reel0.textContent = words[0];
            this.dom.reel0.className = `reel-box word-${words[0]}`;
        }
        if (this.dom.reel1) {
            this.dom.reel1.textContent = words[1];
            this.dom.reel1.className = `reel-box word-${words[1]}`;
        }
        if (this.dom.reel2) {
            this.dom.reel2.textContent = words[2];
            this.dom.reel2.className = `reel-box word-${words[2]}`;
        }

        if (highlightSuccess) {
            [this.dom.reel0, this.dom.reel1, this.dom.reel2].forEach(r => {
                if (r) {
                    r.classList.add('match-flash');
                    setTimeout(() => r.classList.remove('match-flash'), 300);
                }
            });
        }
    }

    triggerDaisoAnimation() {
        if (!this.dom.daisoShout) return;
        this.dom.daisoShout.classList.remove('show');
        void this.dom.daisoShout.offsetWidth;
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
                if (this.currentStep > this.maxStepReached) {
                    this.maxStepReached = this.currentStep;
                }
                sound.playMatchSuccess();
                this.triggerDaisoAnimation();

                if (this.currentStep >= preset.lines.length) {
                    isComplete = true;
                }
            } else {
                if (this.ruleMode === 'sequential_strict') {
                    const firstPhrase = preset.lines[0].join(' ');
                    if (this.currentStep > 0) {
                        this.addLog(`❌ [${resultPhrase}] → 外れ！リセット (到達: #${this.currentStep})`, 'miss');
                    }
                    // If the missed spin happens to match phrase 1, transition to step 1, else 0
                    this.currentStep = (resultPhrase === firstPhrase) ? 1 : 0;
                    if (this.currentStep > this.maxStepReached) {
                        this.maxStepReached = this.currentStep;
                    }
                    sound.playMiss();
                } else if (this.ruleMode === 'block_strict') {
                    // Reset to beginning of current block
                    const blockStart = Math.floor(this.currentStep / 3) * 3;
                    const blockFirstPhrase = preset.lines[blockStart].join(' ');
                    if (this.currentStep > blockStart) {
                        this.addLog(`❌ [${resultPhrase}] → ブロック先頭(#${blockStart + 1})へリセット`, 'miss');
                    }
                    this.currentStep = (resultPhrase === blockFirstPhrase) ? blockStart + 1 : blockStart;
                    if (this.currentStep > this.maxStepReached) {
                        this.maxStepReached = this.currentStep;
                    }
                    sound.playMiss();
                } else {
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
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const totalNeeded = (this.currentPresetKey === 'all8') ? 8 : (preset ? preset.lines.length : 15);
        const currentCount = (this.currentPresetKey === 'all8') ? this.collectedPatterns.size : this.currentStep;
        const maxCount = (this.currentPresetKey === 'all8') ? this.collectedPatterns.size : this.maxStepReached;
        const unit = (this.currentPresetKey === 'all8') ? '種類' : 'フレーズ';

        if (this.dom.currentStepDisplay) {
            this.dom.currentStepDisplay.textContent = `${currentCount} / ${totalNeeded} ${unit}`;
        }
        if (this.dom.maxStepDisplay) {
            this.dom.maxStepDisplay.textContent = `${maxCount} / ${totalNeeded} ${unit}`;
        }
        if (this.dom.totalSpinsDisplay) {
            this.dom.totalSpinsDisplay.textContent = this.totalSpins.toLocaleString();
        }
        if (lastResult && this.dom.lastResultBadge) {
            this.dom.lastResultBadge.textContent = `${lastResult} ${isMatch ? '🎯 HIT!' : '🎲'}`;
            this.dom.lastResultBadge.className = `result-badge ${isMatch ? 'hit' : 'miss'}`;
        }
    }

    addLog(msg, type = 'normal') {
        if (!this.dom.logContainer) return;
        const item = document.createElement('div');
        item.className = `log-entry ${type}`;
        item.textContent = `[Spin #${this.totalSpins}] ${msg}`;
        this.dom.logContainer.prepend(item);
        if (this.dom.logContainer.children.length > 50) {
            this.dom.logContainer.removeChild(this.dom.logContainer.lastChild);
        }
    }

    checkAndAutoResetIfCompleted() {
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        if (this.currentPresetKey === 'all8') {
            if (this.collectedPatterns.size >= 8) {
                this.reset();
            }
        } else {
            if (this.currentStep >= preset.lines.length) {
                this.reset();
            }
        }
    }

    executeSingleSpinManual() {
        if (this.isRunning) return;
        this.checkAndAutoResetIfCompleted();
        const result = this.getRandomSpin();
        this.processSpinResult(result);
    }

    processSpinResultQuiet(resultWords) {
        this.totalSpins++;
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const resultPhrase = resultWords.join(' ');
        let isMatch = false;
        let isComplete = false;

        if (this.currentPresetKey === 'all8') {
            this.collectedPatterns.add(resultPhrase);
            if (this.collectedPatterns.size === 8) {
                isComplete = true;
            }
        } else {
            const targetLine = preset.lines[this.currentStep];
            const targetPhrase = targetLine.join(' ');

            if (resultPhrase === targetPhrase) {
                isMatch = true;
                this.currentStep++;
                if (this.currentStep > this.maxStepReached) {
                    this.maxStepReached = this.currentStep;
                }
                if (this.currentStep >= preset.lines.length) {
                    isComplete = true;
                }
            } else {
                if (this.ruleMode === 'sequential_strict') {
                    const firstPhrase = preset.lines[0].join(' ');
                    this.currentStep = (resultPhrase === firstPhrase) ? 1 : 0;
                    if (this.currentStep > this.maxStepReached) {
                        this.maxStepReached = this.currentStep;
                    }
                } else if (this.ruleMode === 'block_strict') {
                    const blockStart = Math.floor(this.currentStep / 3) * 3;
                    const blockFirstPhrase = preset.lines[blockStart].join(' ');
                    this.currentStep = (resultPhrase === blockFirstPhrase) ? blockStart + 1 : blockStart;
                    if (this.currentStep > this.maxStepReached) {
                        this.maxStepReached = this.currentStep;
                    }
                }
            }
        }
        return { isMatch, isComplete, resultPhrase };
    }

    startAutoRun() {
        if (this.isRunning) return;
        this.checkAndAutoResetIfCompleted();
        this.isRunning = true;
        if (this.dom.btnStart) this.dom.btnStart.disabled = true;
        if (this.dom.btnStop) this.dom.btnStop.disabled = false;
        if (this.dom.btnSingleSpin) this.dom.btnSingleSpin.disabled = true;
        if (this.dom.btnSkipGoal) this.dom.btnSkipGoal.disabled = true;

        const isBatch = (this.spinSpeed < 0);
        const batchCount = isBatch ? Math.abs(this.spinSpeed) : 1;

        const loop = () => {
            if (!this.isRunning) return;

            if (isBatch) {
                let isComplete = false;
                let lastResult = null;
                let hitInBatch = false;

                for (let i = 0; i < batchCount; i++) {
                    const resWords = this.getRandomSpin();
                    const res = this.processSpinResultQuiet(resWords);
                    lastResult = resWords;
                    if (res.isMatch) hitInBatch = true;
                    if (res.isComplete) {
                        isComplete = true;
                        break;
                    }
                }

                this.updateStatsDisplay(lastResult ? lastResult.join(' ') : '', hitInBatch);
                this.renderTargetList();
                if (lastResult) {
                    this.updateReelsDisplay(lastResult, hitInBatch);
                }

                if (isComplete) {
                    this.onSequenceComplete();
                    return;
                }

                this.autoSpinTimeout = requestAnimationFrame(loop);
            } else {
                const result = this.getRandomSpin();
                const { isComplete } = this.processSpinResult(result);
                if (!isComplete && this.isRunning) {
                    this.autoSpinTimeout = setTimeout(loop, this.spinSpeed);
                }
            }
        };

        if (isBatch) {
            this.autoSpinTimeout = requestAnimationFrame(loop);
        } else {
            loop();
        }
    }

    stopAutoRun() {
        this.isRunning = false;
        clearTimeout(this.autoSpinTimeout);
        cancelAnimationFrame(this.autoSpinTimeout);
        if (this.dom.btnStart) this.dom.btnStart.disabled = false;
        if (this.dom.btnStop) this.dom.btnStop.disabled = true;
        if (this.dom.btnSingleSpin) this.dom.btnSingleSpin.disabled = false;
        if (this.dom.btnSkipGoal) this.dom.btnSkipGoal.disabled = false;
    }

    skipToGoal() {
        this.stopAutoRun();
        this.checkAndAutoResetIfCompleted();

        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const isAll8 = (this.currentPresetKey === 'all8');
        const mode = this.ruleMode;

        // If 15-phrase strict sequential, EV is 35 trillion. Cap at 1,000,000 spins for instant demo
        const maxSpins = (mode === 'sequential_strict' && preset.lines.length >= 8) ? 500000 : 50000000;
        let spinsDone = 0;
        let maxStepReached = this.currentStep;
        let isComplete = false;
        let lastResultWords = ['happy', 'price', 'paradise'];

        while (spinsDone < maxSpins) {
            spinsDone++;
            const words = this.getRandomSpin();
            lastResultWords = words;
            const res = this.processSpinResultQuiet(words);
            if (this.currentStep > maxStepReached) {
                maxStepReached = this.currentStep;
            }
            if (res.isComplete) {
                isComplete = true;
                break;
            }
        }

        this.updateStatsDisplay(lastResultWords.join(' '), isComplete);
        this.renderTargetList();
        this.updateReelsDisplay(lastResultWords, isComplete);

        if (isComplete) {
            this.onSequenceComplete();
        } else {
            this.addLog(`⚡ 瞬間スキップ (${spinsDone.toLocaleString()}回スピン実行): 最高 #${maxStepReached} フレーズまで到達！ (35兆回中)`, 'miss');
            alert(`⚡ 瞬間スキップで ${spinsDone.toLocaleString()} 回スピンしました！\n\n最高到達: 第 ${maxStepReached} フレーズ\n※15フレーズ完全連続の達成期待値は約35兆回です。`);
        }
    }

    reset() {
        this.stopAutoRun();
        this.currentStep = 0;
        this.maxStepReached = 0;
        this.totalSpins = 0;
        this.collectedPatterns.clear();
        if (this.dom.logContainer) this.dom.logContainer.innerHTML = '';
        this.updateStatsDisplay();
        this.renderTargetList();
        this.updateReelsDisplay(['happy', 'price', 'paradise']);
        if (this.dom.lastResultBadge) {
            this.dom.lastResultBadge.textContent = '待機中';
            this.dom.lastResultBadge.className = 'result-badge';
        }
        if (this.dom.btnStart) {
            this.dom.btnStart.textContent = '▶ 自動ルーレット開始';
        }
    }

    onSequenceComplete() {
        this.stopAutoRun();
        sound.playCompleteFanfare();
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const msg = `🎉 全15フレーズ完走達成！！ 合計 ${this.totalSpins.toLocaleString()} 回のスピンで公式歌詞の完全再現に成功しました！`;
        this.addLog(msg, 'complete');
        if (this.dom.btnStart) {
            this.dom.btnStart.textContent = '🎉 もう一度最初から回す';
        }
        setTimeout(() => {
            alert(`🎊 おめでとうございます！！\n${preset.name} を完全再現しました！\n\n総スピン回数: ${this.totalSpins.toLocaleString()} 回\n\n「自動ルーレット開始」または「1回だけ回す」を押すと再度最初から挑戦できます！`);
        }, 100);
    }

    // =========================================================================
    // Ultra-Fast Async Chunked Monte Carlo Engine (with Xorshift32 PRNG)
    // =========================================================================
    runMonteCarloSimulation() {
        if (this.isMcRunning) return;

        const trials = parseInt(this.dom.monteCarloCount ? this.dom.monteCarloCount.value : '1000', 10) || 1000;
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const targetLines = preset.lines;
        const mode = this.ruleMode;
        const isAll8 = (this.currentPresetKey === 'all8');

        this.isMcRunning = true;
        this.mcCancelRequested = false;

        if (this.dom.btnFastMonteCarlo) this.dom.btnFastMonteCarlo.disabled = true;
        if (this.dom.btnCancelMonteCarlo) {
            this.dom.btnCancelMonteCarlo.style.display = 'inline-flex';
            this.dom.btnCancelMonteCarlo.disabled = false;
        }

        if (this.dom.mcResults) {
            this.dom.mcResults.innerHTML = `
                <div class="progress-box">
                    <div class="progress-header">
                        <span id="mc-prog-text">⚡ シミュレーション計算中... (0 / ${trials.toLocaleString()} 回)</span>
                        <span id="mc-prog-pct" class="prog-pct">0%</span>
                    </div>
                    <div class="progress-bar-track">
                        <div id="mc-prog-bar" class="progress-bar-fill" style="width: 0%;"></div>
                    </div>
                    <div class="prog-subtext">💡 画面はフリーズしません。バックグラウンドで高速計算しています。</div>
                </div>
            `;
        }

        // Special case: If 15-phrase strict sequential is selected, mathematical exact EV is 8^15 = 35.18 trillion
        // Running 35 trillion iterations in browser would take weeks, so we present exact mathematical solution & max streak simulation
        if (mode === 'sequential_strict' && targetLines.length >= 8) {
            const evExact = Math.pow(8, 15);
            setTimeout(() => {
                this.isMcRunning = false;
                if (this.dom.btnFastMonteCarlo) this.dom.btnFastMonteCarlo.disabled = false;
                if (this.dom.btnCancelMonteCarlo) this.dom.btnCancelMonteCarlo.style.display = 'none';
                sound.playMatchSuccess();

                if (this.dom.mcResults) {
                    this.dom.mcResults.innerHTML = `
                        <div class="stats-card-grid">
                            <div class="stat-box primary">
                                <div class="s-label">理論期待値 (厳密数学解)</div>
                                <div class="s-val text-red">35兆 1,843億 回</div>
                                <div class="s-sub">8¹⁵ = 35,184,372,088,832 回</div>
                            </div>
                            <div class="stat-box">
                                <div class="s-label">1回で成功する理論確率</div>
                                <div class="s-val">約 35兆分の1</div>
                                <div class="s-sub">0.0000000000028 %</div>
                            </div>
                            <div class="stat-box">
                                <div class="s-label">秒速100回スピン時の所要時間</div>
                                <div class="s-val text-red">約 11,156 年</div>
                                <div class="s-sub">人類の有史を超える年月</div>
                            </div>
                            <div class="stat-box">
                                <div class="s-label">最短理論限界</div>
                                <div class="s-val text-green">15 回</div>
                                <div class="s-sub">奇跡の15連続一発揃い</div>
                            </div>
                        </div>
                        <div class="lottery-compare-box god-tier">
                            <div class="lot-badge gold">🎫 宝くじ当選率との比較（極限の奇跡）</div>
                            <div class="lot-text">
                                <strong>全15フレーズ完全連続（期待値 約35兆回）</strong>は、
                                <strong>年末ジャンボ宝くじ1等 7億円（2,000万分の1）を「約175万回連続で当選させる」</strong>レベルの宇宙規模の超奇跡です！<br>
                                ※ 実践的なシミュレーションを楽しみたい場合は、判定ルールを<strong>「ブロック別3連呼連続（平均 約2,920回）」</strong>または<strong>「累積一致（平均 120回）」</strong>に切り替えてお試しください！
                            </div>
                        </div>
                        <div class="stat-summary-text">
                            💡 <strong>数学的証明:</strong> 
                            1フレーズが出る確率 <code>p = 1/8</code>。途中で一度も外れずに15回連続で正解する確率は <code>(1/8)¹⁵ = 1 / 35,184,372,088,832</code> です。<br>
                            Markov連鎖における幾何分布の待ち時間期待値は <code>Σ(8ᵏ) ≈ 35兆1,843億7,208万8,832回</code> となります。
                        </div>
                    `;
                }

                // Draw special theoretical distribution curve on canvas
                this.drawTheoreticalCurve(evExact);
            }, 300);
            return;
        }

        let rng = ((Date.now() & 0xFFFFFFFF) ^ (Math.random() * 0x100000000)) >>> 0;
        if (rng === 0) rng = 0x12345678;

        const spinCounts = new Int32Array(trials);
        let totalSpinsSum = 0;
        let minSpins = Infinity;
        let maxSpins = 0;

        const len = targetLines.length;
        const targetIdxs = targetLines.map(line => {
            const b1 = line[0] === 'hyper' ? 1 : 0;
            const b2 = line[1] === 'prime' ? 1 : 0;
            const b3 = line[2] === 'paradigm' ? 1 : 0;
            return (b1 << 2) | (b2 << 1) | b3;
        });

        let currentTrial = 0;
        const startTime = performance.now();

        const processChunk = () => {
            if (this.mcCancelRequested) {
                this.isMcRunning = false;
                if (this.dom.btnFastMonteCarlo) this.dom.btnFastMonteCarlo.disabled = false;
                if (this.dom.btnCancelMonteCarlo) this.dom.btnCancelMonteCarlo.style.display = 'none';
                if (this.dom.mcResults) {
                    this.dom.mcResults.innerHTML = '<div class="sim-placeholder">⚠️ 計算がキャンセルされました。</div>';
                }
                return;
            }

            const chunkDeadline = performance.now() + 25;

            while (currentTrial < trials && performance.now() < chunkDeadline) {
                let spins = 0;

                if (isAll8) {
                    let mask = 0;
                    while (mask !== 0xFF) {
                        spins++;
                        rng ^= (rng << 13) >>> 0;
                        rng ^= (rng >>> 17);
                        rng ^= (rng << 5) >>> 0;
                        mask |= (1 << (rng & 7));
                    }
                } else if (mode === 'sequential_strict') {
                    let step = 0;
                    while (step < len) {
                        spins++;
                        rng ^= (rng << 13) >>> 0;
                        rng ^= (rng >>> 17);
                        rng ^= (rng << 5) >>> 0;
                        const pick = rng & 7;

                        if (pick === targetIdxs[step]) {
                            step++;
                        } else {
                            step = (pick === targetIdxs[0]) ? 1 : 0;
                        }

                        // Safety check inside inner loop to prevent freezing
                        if ((spins & 0xFFFF) === 0 && performance.now() > chunkDeadline) {
                            break;
                        }
                    }
                } else if (mode === 'block_strict') {
                    let block = 0;
                    const numBlocks = Math.ceil(len / 3);
                    while (block < numBlocks) {
                        const bStart = block * 3;
                        const bEnd = Math.min(bStart + 3, len);
                        let inBlockStep = 0;
                        const needed = bEnd - bStart;

                        while (inBlockStep < needed) {
                            spins++;
                            rng ^= (rng << 13) >>> 0;
                            rng ^= (rng >>> 17);
                            rng ^= (rng << 5) >>> 0;
                            const pick = rng & 7;

                            if (pick === targetIdxs[bStart + inBlockStep]) {
                                inBlockStep++;
                            } else {
                                inBlockStep = (pick === targetIdxs[bStart]) ? 1 : 0;
                            }
                        }
                        block++;
                    }
                } else {
                    for (let s = 0; s < len; s++) {
                        const targetVal = targetIdxs[s];
                        while (true) {
                            spins++;
                            rng ^= (rng << 13) >>> 0;
                            rng ^= (rng >>> 17);
                            rng ^= (rng << 5) >>> 0;
                            if ((rng & 7) === targetVal) break;
                        }
                    }
                }

                spinCounts[currentTrial] = spins;
                totalSpinsSum += spins;
                if (spins < minSpins) minSpins = spins;
                if (spins > maxSpins) maxSpins = spins;

                currentTrial++;
            }

            const pct = Math.floor((currentTrial / trials) * 100);
            const progBar = document.getElementById('mc-prog-bar');
            const progText = document.getElementById('mc-prog-text');
            const progPct = document.getElementById('mc-prog-pct');

            if (progBar) progBar.style.width = `${pct}%`;
            if (progText) progText.textContent = `⚡ シミュレーション計算中... (${currentTrial.toLocaleString()} / ${trials.toLocaleString()} 回)`;
            if (progPct) progPct.textContent = `${pct}%`;

            if (currentTrial < trials) {
                setTimeout(processChunk, 0);
            } else {
                this.isMcRunning = false;
                if (this.dom.btnFastMonteCarlo) this.dom.btnFastMonteCarlo.disabled = false;
                if (this.dom.btnCancelMonteCarlo) this.dom.btnCancelMonteCarlo.style.display = 'none';
                sound.playMatchSuccess();

                const elapsedMs = Math.round(performance.now() - startTime);
                this.finalizeMonteCarlo(spinCounts, trials, totalSpinsSum, minSpins, maxSpins, elapsedMs);
            }
        };

        setTimeout(processChunk, 0);
    }

    finalizeMonteCarlo(spinCounts, trials, totalSpinsSum, minSpins, maxSpins, elapsedMs) {
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const targetLines = preset.lines;
        const mode = this.ruleMode;
        const isAll8 = (this.currentPresetKey === 'all8');

        spinCounts.sort();
        const mean = totalSpinsSum / trials;
        const median = spinCounts[Math.floor(trials / 2)];
        const p95 = spinCounts[Math.floor(trials * 0.95)];
        const p99 = spinCounts[Math.floor(trials * 0.99)];

        let theoreticalEV = '';
        if (isAll8) {
            theoreticalEV = (8 * (1 + 1/2 + 1/3 + 1/4 + 1/5 + 1/6 + 1/7 + 1/8)).toFixed(2) + ' 回 (8×H₈)';
        } else if (mode === 'sequential_strict') {
            const N = targetLines.length;
            theoreticalEV = `約 8^${N} 回 (超天文学的数値)`;
        } else if (mode === 'block_strict') {
            // (8 + 64 + 512) * 5 blocks = 584 * 5 = 2,920
            theoreticalEV = `約 2,920 回 ((8+64+512) × 5ブロック)`;
        } else {
            theoreticalEV = `${targetLines.length * 8} 回 (${targetLines.length}フレーズ × 8)`;
        }

        let lotteryComparisonHtml = '';
        if (mode === 'cumulative') {
            lotteryComparisonHtml = `
                <div class="lottery-compare-box">
                    <div class="lot-badge">🎫 宝くじ当選率との比較</div>
                    <div class="lot-text">
                        全15フレーズを累積で揃える平均 <strong>120回</strong> は、<strong>年末ジャンボ6等（3,000円・1/100）</strong>とほぼ同等の難易度です。
                        コツコツ回せば誰でも確実に完走できます！
                    </div>
                </div>
            `;
        } else if (mode === 'block_strict') {
            lotteryComparisonHtml = `
                <div class="lottery-compare-box">
                    <div class="lot-badge">🎫 宝くじ当選率との比較</div>
                    <div class="lot-text">
                        各ブロック3連呼を揃えて進む平均 <strong>約2,920回</strong> は、<strong>ナンバーズ4ストレート（約100万円・1/10,000）</strong>の当選率に匹敵する手応えある難関です！
                    </div>
                </div>
            `;
        } else if (mode === 'sequential_strict') {
            if (targetLines.length <= 5) {
                lotteryComparisonHtml = `
                    <div class="lottery-compare-box high-tier">
                        <div class="lot-badge gold">🎫 宝くじ当選率との比較</div>
                        <div class="lot-text">
                            5フレーズ完全連続（期待値 <strong>37,448回 / 確率 1/32,768</strong>）は、<strong>ミニロト1等（約1,000万円・1/17万）</strong>や<strong>年末ジャンボ3等（100万円・1/10万）</strong>に迫る超プレミアムな奇跡です！
                        </div>
                    </div>
                `;
            } else {
                lotteryComparisonHtml = `
                    <div class="lottery-compare-box god-tier">
                        <div class="lot-badge gold">🎫 宝くじ当選率との比較</div>
                        <div class="lot-text">
                            15フレーズ完全連続（期待値 <strong>約35兆回 / 確率 1/35,184,372,088,832</strong>）は、
                            <strong>年末ジャンボ宝くじ1等 7億円（2000万分の1）を「約175万回連続で当選させる」</strong>レベルの宇宙規模の超奇跡です！
                        </div>
                    </div>
                `;
            }
        }

        if (this.dom.mcResults) {
            this.dom.mcResults.innerHTML = `
                <div class="stats-card-grid">
                    <div class="stat-box primary">
                        <div class="s-label">平均試行回数 (実測)</div>
                        <div class="s-val">${Math.round(mean).toLocaleString()} 回</div>
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
                ${lotteryComparisonHtml}
                <div class="stat-summary-text">
                    ⏱️ <strong>計算完了 (${elapsedMs} ms / ${trials.toLocaleString()} 試行)</strong><br>
                    💡 <strong>分析解説:</strong> 
                    1フレーズが出る確率は <code>1/2 × 1/2 × 1/2 = 1/8 (12.5%)</code> です。<br>
                    ${mode === 'cumulative' ? `
                        全15フレーズを累積して揃える場合、平均 <strong>120回 (15 × 8)</strong> のスピンで公式ソングを完全再現できます！
                    ` : mode === 'block_strict' ? `
                        各ブロック（3回連続）を揃えて進むブロック別連続モードでは、平均 <strong>約2,920回</strong> で達成できます！
                    ` : `
                        15フレーズすべてを一度も外さず完全連続で当てる場合、期待値は <strong>約35兆回</strong> の奇跡となります！
                    `}
                </div>
            `;
        }

        this.drawHistogram(spinCounts, trials, minSpins, maxSpins, mean);
    }

    drawHistogram(sortedSpins, trials, minVal, maxVal, mean) {
        const canvas = this.dom.mcChart;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const containerWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
        const w = canvas.width = containerWidth - 32 || 600;
        const h = canvas.height = 240;

        ctx.clearRect(0, 0, w, h);

        const binsCount = 40;
        const p98 = sortedSpins[Math.floor(trials * 0.98)];
        const effectiveMax = Math.max(p98, minVal + 10);
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

        ctx.strokeStyle = 'rgba(255, 64, 129, 0.12)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const y = h - (h - 40) * (i / 4) - 20;
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(w - 20, y);
            ctx.stroke();
        }

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
            ctx.fillText(`平均: ${Math.round(mean).toLocaleString()}回`, meanX + 4, 20);
        }

        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${minVal.toLocaleString()}回`, chartLeft, h - 8);
        ctx.fillText(`${effectiveMax.toLocaleString()}回 (上位98%)`, chartRight - 85, h - 8);
    }

    drawTheoreticalCurve(evExact) {
        const canvas = this.dom.mcChart;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const containerWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
        const w = canvas.width = containerWidth - 32 || 600;
        const h = canvas.height = 240;

        ctx.clearRect(0, 0, w, h);

        // Draw background grid
        ctx.strokeStyle = 'rgba(255, 64, 129, 0.12)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const y = h - (h - 40) * (i / 4) - 20;
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(w - 20, y);
            ctx.stroke();
        }

        const chartLeft = 45;
        const chartRight = w - 20;
        const chartBottom = h - 25;
        const chartHeight = h - 50;

        // Draw Exponential / Geometric Theoretical Curve
        ctx.beginPath();
        ctx.strokeStyle = '#ff1493';
        ctx.lineWidth = 3;

        for (let px = 0; px <= (chartRight - chartLeft); px++) {
            const x = chartLeft + px;
            const normX = px / (chartRight - chartLeft); // 0 to 1
            // Theoretical exponential decay curve
            const normY = Math.exp(-3 * normX);
            const y = chartBottom - normY * chartHeight;
            if (px === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Fill area under curve
        ctx.lineTo(chartRight, chartBottom);
        ctx.lineTo(chartLeft, chartBottom);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 20, 0, chartBottom);
        grad.addColorStop(0, 'rgba(255, 20, 147, 0.3)');
        grad.addColorStop(1, 'rgba(255, 20, 147, 0.02)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Marker for theoretical EV
        ctx.fillStyle = '#ff1493';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`⚡ 理論期待値: 35兆1,843億回 (超幾何分布・Markov厳密解)`, chartLeft + 10, 30);

        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.fillText(`0 回`, chartLeft, h - 8);
        ctx.fillText(`∞ 回（天文学的スケール）`, chartRight - 120, h - 8);
    }

    shareResult() {
        const preset = LYRIC_PRESETS[this.currentPresetKey];
        const total = (this.currentPresetKey === 'all8') ? 8 : preset.lines.length;
        const text = `🛒『HAPPY PRICE PARADISE 歌詞ルーレットシミュレーター』🎶\n` +
            `【${preset.name}】に挑戦中！\n` +
            `🔥 最大進行記録: 第 ${this.maxStepReached} / ${total} フレーズ到達！\n` +
            `総スピン回数: ${this.totalSpins.toLocaleString()} 回\n` +
            `ハッピー・ハイパー × プライス・プライム × パラダイス・パラダイム (DAISO!)\n` +
            `#ダイソー #ハッピープライスパラダイス #Webtools`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('📋 結果をクリップボードにコピーしました！SNSに貼り付けてシェアできます。');
            }).catch(() => {
                prompt('以下のテキストをコピーして共有してください：', text);
            });
        } else {
            prompt('以下のテキストをコピーして共有してください：', text);
        }
    }

    drawInfographic() {
        const canvas = this.dom.infographicCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width = 1200;
        const H = canvas.height = 780;

        // Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#150311');
        bgGrad.addColorStop(0.5, '#28061f');
        bgGrad.addColorStop(1, '#11020e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Gold Outer Border
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, W - 12, H - 12);

        // Inner decorative border
        ctx.strokeStyle = 'rgba(255, 64, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(14, 14, W - 28, H - 28);

        // 1. Header Banner
        ctx.fillStyle = '#ff1493';
        ctx.font = '900 32px "Outfit", sans-serif';
        ctx.fillText('🛒 DAISO STORE SONG : HAPPY PRICE PARADISE', 36, 52);

        ctx.fillStyle = '#ffd1dc';
        ctx.font = 'bold 16px "Zen Kaku Gothic New", sans-serif';
        ctx.fillText('〜 歌詞ルーレット状態遷移図 ＆ 数理確率モデル (Markov Chain Analysis) 〜', 38, 78);

        ctx.fillStyle = '#ffb300';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('★ Webtools Infographic 2026', W - 230, 48);

        // Header Divider
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(36, 92);
        ctx.lineTo(W - 36, 92);
        ctx.stroke();

        // 2. Left Panel: Roulette Slots Structure (x: 36, y: 110, w: 340, h: 480)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 64, 129, 0.5)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 36, 110, 340, 480, 14, true, true);

        ctx.fillStyle = '#ff4081';
        ctx.font = '900 18px "Outfit", sans-serif';
        ctx.fillText('🎰 3連スロット構造 (全8通り)', 54, 140);

        const slotData = [
            { label: 'Slot 1 (形容詞)', w1: 'happy', w2: 'hyper', c1: '#ff1493', c2: '#7c4dff' },
            { label: 'Slot 2 (名詞1)', w1: 'price', w2: 'prime', c1: '#00e676', c2: '#ffab00' },
            { label: 'Slot 3 (名詞2)', w1: 'paradise', w2: 'paradigm', c1: '#00b0ff', c2: '#e040fb' }
        ];

        slotData.forEach((s, idx) => {
            const sy = 160 + idx * 82;
            ctx.fillStyle = '#bbb';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(s.label, 54, sy);

            // Box 1
            ctx.fillStyle = '#fff';
            this.roundRect(ctx, 54, sy + 6, 140, 38, 8, true, false);
            ctx.fillStyle = s.c1;
            ctx.font = '900 14px "Outfit", sans-serif';
            ctx.fillText(s.w1.toUpperCase(), 75, sy + 30);

            // Box 2
            ctx.fillStyle = '#fff';
            this.roundRect(ctx, 206, sy + 6, 140, 38, 8, true, false);
            ctx.fillStyle = s.c2;
            ctx.font = '900 14px "Outfit", sans-serif';
            ctx.fillText(s.w2.toUpperCase(), 228, sy + 30);
        });

        // Shout Box
        ctx.fillStyle = 'rgba(255, 23, 68, 0.2)';
        ctx.strokeStyle = '#ff1744';
        this.roundRect(ctx, 54, 415, 304, 40, 8, true, true);
        ctx.fillStyle = '#ff5252';
        ctx.font = '900 15px "Outfit", sans-serif';
        ctx.fillText('サビ掛け声 : ＼ DAISO! ／ (固定)', 95, 440);

        // Slot Probability Note
        ctx.fillStyle = '#ffd1dc';
        ctx.font = 'bold 13px "Zen Kaku Gothic New", sans-serif';
        ctx.fillText('組み合わせ数 : 2 × 2 × 2 = 全8パターン', 54, 485);
        ctx.fillStyle = '#ffeb3b';
        ctx.font = '900 14px "Zen Kaku Gothic New", sans-serif';
        ctx.fillText('1フレーズ当選確率 : 1/8 (12.5%)', 54, 510);
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.fillText('※どの出目も同様に確からしい等確率 (p=0.125)', 54, 532);

        // 3. Right Panel: State Transition Diagram (x: 396, y: 110, w: 768, h: 480)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 396, 110, 768, 480, 14, true, true);

        ctx.fillStyle = '#00e676';
        ctx.font = '900 18px "Outfit", sans-serif';
        ctx.fillText('🎯 歌詞の完全再現 状態遷移フロー (全15フレーズ・5ブロック)', 416, 140);

        const flowBlocks = [
            { step: '①', name: '第1ブロック (原形連呼)', text: 'happy price paradise (DAISO!)', count: '× 3回', color: '#ff1493', border: '#ff4081' },
            { step: '②', name: '第2ブロック (1語目 hyper 変異)', text: 'hyper price paradise (DAISO!)', count: '× 3回', color: '#7c4dff', border: '#b388ff' },
            { step: '③', name: '第3ブロック (2語目 prime 変異)', text: 'happy prime paradise (DAISO!)', count: '× 3回', color: '#00e676', border: '#69f0ae' },
            { step: '④', name: '第4ブロック (3語目 paradigm 変異)', text: 'happy price paradigm (DAISO!)', count: '× 3回', color: '#00b0ff', border: '#40c4ff' },
            { step: '⑤', name: '第5ブロック (全変異×2 ＋ 原点締め×1)', text: 'hyper prime paradigm ×2 ＋ happy price paradise ×1', count: '全3回', color: '#e040fb', border: '#ea80fc' }
        ];

        flowBlocks.forEach((b, idx) => {
            const by = 160 + idx * 72;
            ctx.fillStyle = '#1c0517';
            ctx.strokeStyle = b.border;
            ctx.lineWidth = 1.5;
            this.roundRect(ctx, 416, by, 728, 54, 10, true, true);

            // Step Badge
            ctx.fillStyle = b.color;
            this.roundRect(ctx, 426, by + 10, 36, 34, 8, true, false);
            ctx.fillStyle = '#fff';
            ctx.font = '900 15px sans-serif';
            ctx.fillText(b.step, 436, by + 33);

            // Block Name
            ctx.fillStyle = '#fff';
            ctx.font = '900 13px "Zen Kaku Gothic New", sans-serif';
            ctx.fillText(b.name, 474, by + 24);

            // Lyrics Text
            ctx.fillStyle = '#ffd1dc';
            ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.fillText(b.text, 474, by + 42);

            // Count Badge
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this.roundRect(ctx, 1060, by + 12, 70, 30, 6, true, false);
            ctx.fillStyle = '#ffeb3b';
            ctx.font = '900 12px sans-serif';
            ctx.fillText(b.count, 1074, by + 32);

            // Arrow down (if not last)
            if (idx < flowBlocks.length - 1) {
                ctx.fillStyle = '#ffeb3b';
                ctx.font = 'bold 13px sans-serif';
                ctx.fillText('↓  正解 (p = 1/8)', 730, by + 66);
            }
        });

        // Goal Badge
        ctx.fillStyle = '#ffd700';
        this.roundRect(ctx, 416, 526, 728, 48, 10, true, false);
        ctx.fillStyle = '#1a0412';
        ctx.font = '900 16px "Zen Kaku Gothic New", sans-serif';
        ctx.fillText('🏆 【GOAL !!】公式ソング全15フレーズ 完全再現達成！！', 550, 556);

        // 4. Bottom Panel: Expectations & Lottery Comparison (x: 36, y: 605, w: 1128, h: 145)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.strokeStyle = '#ffb300';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 36, 605, 1128, 145, 14, true, true);

        ctx.fillStyle = '#ffb300';
        ctx.font = '900 16px "Zen Kaku Gothic New", sans-serif';
        ctx.fillText('📊 判定ルール別 期待値 ＆ 宝くじ当選確率との比較スケール', 54, 630);

        const rulesData = [
            {
                title: '① 累積一致モード',
                ev: '期待値 : 120 回',
                prob: '15行 × 各8回',
                lottery: '🎫 年末ジャンボ6等 (3,000円・1/100) 相当',
                badgeBg: '#2e7d32',
                badgeText: '誰でも完走可能'
            },
            {
                title: '② ブロック別3連呼連続',
                ev: '期待値 : 約 2,920 回',
                prob: '584回 × 5ブロック',
                lottery: '🎫 ナンバーズ4ストレート (100万円・1/1万) 相当',
                badgeBg: '#e65100',
                badgeText: '手応えある難関'
            },
            {
                title: '③ 全15行完全連続',
                ev: '期待値 : 約 35 兆回',
                prob: '8¹⁵ = 35,184,372,088,832',
                lottery: '🌌 年末ジャンボ1等(7億円・2000万分の1) × 175万回当選',
                badgeBg: '#c2185b',
                badgeText: '極限の宇宙奇跡'
            }
        ];

        rulesData.forEach((r, idx) => {
            const rx = 54 + idx * 370;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            this.roundRect(ctx, rx, 642, 355, 96, 8, true, true);

            ctx.fillStyle = '#fff';
            ctx.font = '900 13px sans-serif';
            ctx.fillText(r.title, rx + 12, 662);

            ctx.fillStyle = r.badgeBg;
            this.roundRect(ctx, rx + 240, 648, 100, 20, 10, true, false);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText(r.badgeText, rx + 252, 662);

            ctx.fillStyle = '#ffeb3b';
            ctx.font = '900 14px sans-serif';
            ctx.fillText(r.ev, rx + 12, 684);

            ctx.fillStyle = '#ffd1dc';
            ctx.font = '11px sans-serif';
            ctx.fillText(r.lottery, rx + 12, 706);

            ctx.fillStyle = '#aaa';
            ctx.font = '10px sans-serif';
            ctx.fillText(`(計算基礎: ${r.prob})`, rx + 12, 724);
        });

        // 5. Watermark Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '11px sans-serif';
        ctx.fillText('#ダイソー #ハッピープライスパラダイス #HAPPY_PRICE_PARADISE #Webtools', W - 490, H - 12);
    }

    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    downloadInfographic() {
        this.drawInfographic();
        const canvas = this.dom.infographicCanvas;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'daiso_happy_price_paradise_infographic.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    copyInfographic() {
        this.drawInfographic();
        const canvas = this.dom.infographicCanvas;
        if (!canvas) return;
        if (canvas.toBlob) {
            canvas.toBlob(blob => {
                try {
                    navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]).then(() => {
                        alert('📋 インフォグラフィック画像をクリップボードにコピーしました！TwitterやSNSにそのままペースト(Ctrl+V)できます。');
                    }).catch(() => {
                        this.downloadInfographic();
                    });
                } catch (e) {
                    this.downloadInfographic();
                }
            });
        } else {
            this.downloadInfographic();
        }
    }
}

// Global bootstrap
function initApp() {
    if (!window.rouletteAppInstance) {
        window.rouletteAppInstance = new RouletteApp();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
