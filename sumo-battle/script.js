/**
 * はっけよい！超速相撲バトル - メインJavaScript
 * HTML5 Canvas / Web Audio API / 物理力学アニメーション
 */

(function() {
    'use strict';

    // --- サウンドエンジン (Web Audio API) ---
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playTaiko(freq = 80, duration = 0.4, vol = 0.8) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + duration);

            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        }

        playHyoshigi() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.1);
        }

        playHit() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            // ノイズ + 低音
            const bufferSize = this.ctx.sampleRate * 0.15;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.9, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();

            // ドンという低音を重ねる
            this.playTaiko(140, 0.15, 0.6);
        }

        playDodge() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        }

        playBurst() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            this.playTaiko(200, 0.5, 1.0);
            setTimeout(() => this.playTaiko(160, 0.4, 0.9), 100);
            setTimeout(() => this.playTaiko(120, 0.4, 0.8), 200);
        }

        playFanfare(isWin) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const notes = isWin ? [261.63, 329.63, 392.00, 523.25] : [300, 260, 220, 180];
            notes.forEach((freq, idx) => {
                setTimeout(() => {
                    if (!this.ctx) return;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = isWin ? 'triangle' : 'sawtooth';
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.3);
                }, idx * 120);
            });
        }
    }

    const audio = new SoundEngine();

    // --- ゲーム設定 & データ ---
    const RANKS = [
        { name: '序ノ口', enemyName: '富士ノ山', strength: 2.2, color: '#4ae3b5', avatar: '♨️' },
        { name: '十両', enemyName: '琴ノ海', strength: 3.5, color: '#38bdf8', avatar: '🌊' },
        { name: '幕内', enemyName: '朝日龍', strength: 5.0, color: '#fbbf24', avatar: '🐉' },
        { name: '大関', enemyName: '豪快山', strength: 6.8, color: '#f97316', avatar: '⛰️' },
        { name: '横綱', enemyName: '武蔵王', strength: 8.8, color: '#ef4444', avatar: '👑' }
    ];

    // ゲーム状態定数
    const STATE = {
        TITLE: 'TITLE',
        MATCHUP: 'MATCHUP',
        COUNTDOWN: 'COUNTDOWN',
        PLAYING: 'PLAYING',
        RESULT: 'RESULT'
    };

    // 主データ
    let gameState = STATE.TITLE;
    let gameMode = 'arcade'; // 'arcade', 'endless', 'pvp'
    let currentRankIdx = 0;
    let winsCount = 0;
    let lossesCount = 0;
    let streakCount = 0;
    let startTime = 0;
    let totalClicksP1 = 0;

    // 力士オブジェクト
    class Rikishi {
        constructor(isPlayer, name, color, avatar, power = 5.0) {
            this.isPlayer = isPlayer;
            this.name = name;
            this.color = color;
            this.avatar = avatar;
            this.power = power;

            this.reset();
        }

        reset() {
            this.x = this.isPlayer ? 350 : 550;
            this.y = 260;
            this.vx = 0;
            this.radius = 36;
            this.weight = 100 + (this.power * 8);
            this.stamina = 100;
            this.burstGauge = 0;
            this.isDodging = false;
            this.dodgeTimer = 0;
            this.pushAnim = 0;
            this.stateText = '';
            this.stateTextTimer = 0;
        }

        update(dt) {
            this.x += this.vx;
            this.vx *= 0.82; // 摩擦

            if (this.dodgeTimer > 0) {
                this.dodgeTimer -= dt;
                if (this.dodgeTimer <= 0) {
                    this.isDodging = false;
                }
            }

            if (this.pushAnim > 0) {
                this.pushAnim -= dt * 5;
            }

            if (this.stateTextTimer > 0) {
                this.stateTextTimer -= dt;
            }
        }

        triggerDodge() {
            if (this.dodgeTimer <= 0) {
                this.isDodging = true;
                this.dodgeTimer = 0.35; // 0.35秒のはたき窓
                this.setStateText('はたき！');
                audio.playDodge();
                return true;
            }
            return false;
        }

        setStateText(txt) {
            this.stateText = txt;
            this.stateTextTimer = 0.6;
        }
    }

    // パーティクルシステム
    class Particle {
        constructor(x, y, vx, vy, color, size, life) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.color = color;
            this.size = size;
            this.maxLife = life;
            this.life = life;
        }
        update(dt) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.1; // 重力
            this.life -= dt;
        }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // --- DOM要素 ---
    const canvas = document.getElementById('sumo-canvas');
    const ctx = canvas.getContext('2d');

    const uiOverlay = document.getElementById('ui-overlay');
    const screenTitle = document.getElementById('screen-title');
    const screenMatchup = document.getElementById('screen-matchup');
    const screenResult = document.getElementById('screen-result');

    const rankBadge = document.getElementById('rank-badge');
    const winsBadge = document.getElementById('wins-badge');

    const btnModeArcade = document.getElementById('btn-mode-arcade');
    const btnModeEndless = document.getElementById('btn-mode-endless');
    const btnModePvp = document.getElementById('btn-mode-pvp');
    const btnStartFight = document.getElementById('btn-start-fight');

    const btnNextMatch = document.getElementById('btn-next-match');
    const btnRetryMatch = document.getElementById('btn-retry-match');
    const btnToTitle = document.getElementById('btn-to-title');
    const btnToggleAudio = document.getElementById('btn-toggle-audio');

    // タッチボタン
    const btnP1Push = document.getElementById('btn-p1-push');
    const btnP1Dodge = document.getElementById('btn-p1-dodge');
    const btnP1Burst = document.getElementById('btn-p1-burst');

    const p2ControlsGroup = document.getElementById('p2-controls-group');
    const btnP2Push = document.getElementById('btn-p2-push');
    const btnP2Dodge = document.getElementById('btn-p2-dodge');
    const btnP2Burst = document.getElementById('btn-p2-burst');

    // マッチアップ要素
    const playerNameEl = document.getElementById('player-name');
    const enemyNameEl = document.getElementById('enemy-name');
    const playerAvatarEl = document.getElementById('player-avatar-preview');
    const enemyAvatarEl = document.getElementById('enemy-avatar-preview');
    const pStrBar = document.getElementById('p-str-bar');
    const eStrBar = document.getElementById('e-str-bar');
    const matchupRankEl = document.getElementById('matchup-rank');

    // リザルト要素
    const resultTitleEl = document.getElementById('result-title');
    const winnerNameEl = document.getElementById('winner-name');
    const resultKimariteEl = document.getElementById('result-kimarite');
    const resTimeEl = document.getElementById('res-time');
    const resCpsEl = document.getElementById('res-cps');
    const resStreakEl = document.getElementById('res-streak');

    // オブジェクト保持
    let p1 = new Rikishi(true, '雷電山', '#e63946', '⚡', 5.5);
    let p2 = new Rikishi(false, '富士ノ山', '#38bdf8', '♨️', 2.2);

    let particles = [];
    let announceText = '';
    let announceScale = 1;
    let announceTimer = 0;

    // AI制御タイマー
    let aiPushTimer = 0;

    // 土俵パラメータ
    const DOHYO = {
        cx: 450,
        cy: 260,
        rx: 340, // 横半径
        ry: 160  // 縦半径（パース表現）
    };

    // --- 初期化 ---
    function init() {
        setupEventListeners();
        updateHeaderUI();
        requestAnimationFrame(gameLoop);
    }

    // --- イベントリスナー設定 ---
    function setupEventListeners() {
        btnModeArcade.addEventListener('click', () => startMatchup('arcade'));
        btnModeEndless.addEventListener('click', () => startMatchup('endless'));
        btnModePvp.addEventListener('click', () => startMatchup('pvp'));

        btnStartFight.addEventListener('click', startCountdown);

        btnNextMatch.addEventListener('click', () => {
            if (gameMode === 'arcade') {
                currentRankIdx = Math.min(RANKS.length - 1, currentRankIdx + 1);
            }
            startMatchup(gameMode);
        });

        btnRetryMatch.addEventListener('click', () => startMatchup(gameMode));
        btnToTitle.addEventListener('click', showTitle);

        btnToggleAudio.addEventListener('click', () => {
            audio.enabled = !audio.enabled;
            btnToggleAudio.textContent = audio.enabled ? '🔊 ON' : '🔇 OFF';
        });

        // 1P 操作
        btnP1Push.addEventListener('pointerdown', (e) => { e.preventDefault(); handlePush(p1); });
        btnP1Dodge.addEventListener('pointerdown', (e) => { e.preventDefault(); handleDodge(p1); });
        btnP1Burst.addEventListener('pointerdown', (e) => { e.preventDefault(); handleBurst(p1); });

        // 2P 操作
        btnP2Push.addEventListener('pointerdown', (e) => { e.preventDefault(); handlePush(p2); });
        btnP2Dodge.addEventListener('pointerdown', (e) => { e.preventDefault(); handleDodge(p2); });
        btnP2Burst.addEventListener('pointerdown', (e) => { e.preventDefault(); handleBurst(p2); });

        // キーボード操作
        window.addEventListener('keydown', (e) => {
            if (gameState !== STATE.PLAYING) return;

            // 1P
            if (e.code === 'Space') {
                e.preventDefault();
                handlePush(p1);
            } else if (e.code === 'KeyJ') {
                handleDodge(p1);
            } else if (e.code === 'KeyK') {
                handleBurst(p1);
            }

            // 2P (PVPモード時)
            if (gameMode === 'pvp') {
                if (e.code === 'Enter') {
                    e.preventDefault();
                    handlePush(p2);
                } else if (e.code === 'Numpad1' || e.code === 'Digit1') {
                    handleDodge(p2);
                } else if (e.code === 'Numpad2' || e.code === 'Digit2') {
                    handleBurst(p2);
                }
            }
        });
    }

    // --- ゲームフロー管理 ---
    function showTitle() {
        gameState = STATE.TITLE;
        uiOverlay.classList.add('active');
        screenTitle.classList.add('active');
        screenMatchup.classList.remove('active');
        screenResult.classList.remove('active');
        p2ControlsGroup.classList.add('hidden');
    }

    function startMatchup(mode) {
        gameMode = mode;
        gameState = STATE.MATCHUP;

        if (mode === 'pvp') {
            p1 = new Rikishi(true, '雷電山 (1P)', '#e63946', '⚡', 6.0);
            p2 = new Rikishi(false, '鳳凰丸 (2P)', '#a855f7', '🦅', 6.0);
            p2ControlsGroup.classList.remove('hidden');
            matchupRankEl.textContent = '【二人対戦】 東西直接対決';
        } else {
            p2ControlsGroup.classList.add('hidden');
            const enemyData = RANKS[currentRankIdx];
            p1 = new Rikishi(true, '雷電山', '#e63946', '⚡', 5.5 + winsCount * 0.2);
            p2 = new Rikishi(false, enemyData.enemyName, enemyData.color, enemyData.avatar, enemyData.strength);

            if (mode === 'arcade') {
                matchupRankEl.textContent = `【大相撲場所】 幕内 ${enemyData.name} 戦`;
            } else {
                matchupRankEl.textContent = `【連勝挑戦】 ${streakCount + 1}人目の刺客 (${enemyData.name}級)`;
            }
        }

        // カード描画更新
        playerNameEl.textContent = p1.name;
        enemyNameEl.textContent = p2.name;
        playerAvatarEl.textContent = p1.avatar;
        enemyAvatarEl.textContent = p2.avatar;
        pStrBar.style.width = `${Math.min(100, p1.power * 10)}%`;
        eStrBar.style.width = `${Math.min(100, p2.power * 10)}%`;

        screenTitle.classList.remove('active');
        screenMatchup.classList.add('active');
        screenResult.classList.remove('active');
        uiOverlay.classList.add('active');

        audio.playHyoshigi();
    }

    function startCountdown() {
        uiOverlay.classList.remove('active');
        screenMatchup.classList.remove('active');
        gameState = STATE.COUNTDOWN;

        p1.reset();
        p2.reset();
        particles = [];
        totalClicksP1 = 0;

        triggerAnnouncement('見合って...', 1.0);
        audio.playHyoshigi();

        setTimeout(() => {
            triggerAnnouncement('はっけよい！', 1.2);
            audio.playTaiko(120, 0.3, 0.9);
        }, 1000);

        setTimeout(() => {
            triggerAnnouncement('のこった！', 1.5);
            audio.playTaiko(200, 0.4, 1.0);
            gameState = STATE.PLAYING;
            startTime = performance.now();
        }, 2000);
    }

    function finishMatch(winner, kimarite) {
        gameState = STATE.RESULT;
        const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);
        const cps = (totalClicksP1 / Math.max(1, durationSec)).toFixed(1);

        const isP1Win = (winner === p1);
        audio.playFanfare(isP1Win);

        if (isP1Win) {
            winsCount++;
            streakCount++;
            resultTitleEl.textContent = '金 星 ！ 勝 負 あ り';
            resultTitleEl.style.color = 'var(--gold-primary)';
            winnerNameEl.textContent = `東 ${winner.name} の勝ち！`;
            btnNextMatch.classList.remove('hidden');
            btnRetryMatch.classList.add('hidden');
            spawnVictoryConfetti();
        } else {
            lossesCount++;
            streakCount = 0;
            resultTitleEl.textContent = '敗 北 ... 勝 負 あ り';
            resultTitleEl.style.color = 'var(--vermilion)';
            winnerNameEl.textContent = `西 ${winner.name} の勝ち！`;
            btnNextMatch.classList.add('hidden');
            btnRetryMatch.classList.remove('hidden');
        }

        resultKimariteEl.textContent = `決まり手：${kimarite}`;
        resTimeEl.textContent = `${durationSec}秒`;
        resCpsEl.textContent = `${cps}回/秒`;
        resStreakEl.textContent = `${streakCount}連勝`;

        updateHeaderUI();

        setTimeout(() => {
            uiOverlay.classList.add('active');
            screenResult.classList.add('active');
        }, 1200);
    }

    function updateHeaderUI() {
        rankBadge.textContent = `番付: ${RANKS[currentRankIdx].name}`;
        winsBadge.textContent = `通算: ${winsCount}勝 ${lossesCount}敗 (${streakCount}連勝)`;
    }

    // --- アクション処理 ---
    function handlePush(actor) {
        if (gameState !== STATE.PLAYING) return;

        const opponent = (actor === p1) ? p2 : p1;
        if (actor === p1) totalClicksP1++;

        actor.pushAnim = 1.0;
        actor.burstGauge = Math.min(100, actor.burstGauge + 6);

        // UI ゲージ更新
        updateBurstUI();

        // カウンター(はたき込み)判定！
        if (opponent.isDodging) {
            // 相手がはたき込み構え中の時に押すと、押し手が一気に前に滑って体勢崩壊！
            actor.vx += (actor === p1) ? -18 : 18;
            opponent.vx += (opponent === p1) ? 12 : -12;
            audio.playHit();
            opponent.setStateText('見切り！');
            spawnSparks((actor.x + opponent.x)/2, actor.y, '#00f0ff');
            return;
        }

        // 通常の押し合い
        const dir = (actor === p1) ? 1 : -1;
        const pushForce = 3.2 + (actor.power * 0.4);
        opponent.vx += dir * pushForce;
        actor.vx += dir * (pushForce * 0.3); // 反動

        audio.playHit();
        spawnSparks((actor.x + opponent.x)/2, actor.y, actor.color);
    }

    function handleDodge(actor) {
        if (gameState !== STATE.PLAYING) return;
        actor.triggerDodge();
    }

    function handleBurst(actor) {
        if (gameState !== STATE.PLAYING) return;
        if (actor.burstGauge < 100) return;

        actor.burstGauge = 0;
        updateBurstUI();

        const opponent = (actor === p1) ? p2 : p1;
        const dir = (actor === p1) ? 1 : -1;

        actor.setStateText('どすこいバースト！');
        audio.playBurst();

        // 強烈な猛突進ラッシュ！
        opponent.vx += dir * 28;
        spawnSparks((actor.x + opponent.x)/2, actor.y, '#ffd700', 30);
    }

    function updateBurstUI() {
        if (p1.burstGauge >= 100) {
            btnP1Burst.classList.remove('disabled');
        } else {
            btnP1Burst.classList.add('disabled');
        }

        if (p2.burstGauge >= 100) {
            btnP2Burst.classList.remove('disabled');
        } else {
            btnP2Burst.classList.add('disabled');
        }
    }

    // --- AIロジック (CPU対戦時) ---
    function updateAI(dt) {
        if (gameState !== STATE.PLAYING || gameMode === 'pvp') return;

        aiPushTimer += dt;
        // 連打速度 (パワーが高いほど短い間隔で連打)
        const pushInterval = Math.max(0.08, 0.32 - (p2.power * 0.028));

        if (aiPushTimer >= pushInterval) {
            aiPushTimer = 0;
            // 低確率で「はたき込み」を使ってくる
            if (p1.vx > 5 && Math.random() < 0.15) {
                handleDodge(p2);
            } else {
                handlePush(p2);
            }

            // ゲージ溜まったら必殺技
            if (p2.burstGauge >= 100 && Math.random() < 0.6) {
                handleBurst(p2);
            }
        }
    }

    // --- 決まり手 & 勝負判定 ---
    function checkRingOut() {
        if (gameState !== STATE.PLAYING) return;

        // 土俵楕円判定
        const p1Out = isOutOfDohyo(p1.x, p1.y);
        const p2Out = isOutOfDohyo(p2.x, p2.y);

        if (p1Out || p2Out) {
            let winner, loser, kimarite;
            if (p1Out && p2Out) {
                // 両者足が出た場合は後ろにいた方が負け
                winner = p1.x > p2.x ? p1 : p2;
            } else if (p1Out) {
                winner = p2;
                loser = p1;
            } else {
                winner = p1;
                loser = p2;
            }

            // 決まり手の判定
            if (winner.isDodging || loser.stateText === '見切り！') {
                kimarite = 'はたき込み';
            } else if (winner.burstGauge === 0 && winner.stateText === 'どすこいバースト！') {
                kimarite = '突き出し';
            } else if (Math.abs(winner.vx) > 8) {
                kimarite = '寄り切り';
            } else {
                kimarite = '押し出し';
            }

            finishMatch(winner, kimarite);
        }
    }

    function isOutOfDohyo(x, y) {
        const dx = (x - DOHYO.cx) / DOHYO.rx;
        const dy = (y - DOHYO.cy) / DOHYO.ry;
        return (dx * dx + dy * dy) > 1.0;
    }

    // --- エフェクト処理 ---
    function spawnSparks(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                3 + Math.random() * 4,
                0.4 + Math.random() * 0.3
            ));
        }
    }

    function spawnVictoryConfetti() {
        const colors = ['#f3c644', '#e63946', '#00f0ff', '#ffffff', '#a855f7'];
        for (let i = 0; i < 80; i++) {
            particles.push(new Particle(
                DOHYO.cx + (Math.random() * 400 - 200),
                100,
                Math.random() * 4 - 2,
                Math.random() * 4 + 2,
                colors[Math.floor(Math.random() * colors.length)],
                4 + Math.random() * 6,
                2.5
            ));
        }
    }

    function triggerAnnouncement(text, duration = 1.0) {
        announceText = text;
        announceScale = 2.2;
        announceTimer = duration;
    }

    // --- 描画ロジック ---
    function drawDohyo() {
        ctx.save();

        // 観客・背景グラデーション
        const bgGrad = ctx.createRadialGradient(DOHYO.cx, DOHYO.cy, 50, DOHYO.cx, DOHYO.cy, 500);
        bgGrad.addColorStop(0, '#1c2430');
        bgGrad.addColorStop(1, '#0b0e14');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 吊り屋根風の和風装飾・紙吹雪背景効果
        ctx.strokeStyle = 'rgba(243, 198, 68, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(DOHYO.cx, DOHYO.cy, DOHYO.rx + 25, 0, Math.PI * 2);
        ctx.stroke();

        // 土俵本体（土の質感）
        ctx.beginPath();
        ctx.ellipse(DOHYO.cx, DOHYO.cy, DOHYO.rx, DOHYO.ry, 0, 0, Math.PI * 2);
        const dohyoGrad = ctx.createRadialGradient(DOHYO.cx, DOHYO.cy, 20, DOHYO.cx, DOHYO.cy, DOHYO.rx);
        dohyoGrad.addColorStop(0, '#d4a373');
        dohyoGrad.addColorStop(0.85, '#bc8a5f');
        dohyoGrad.addColorStop(1, '#8c5a3c');
        ctx.fillStyle = dohyoGrad;
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#52331c';
        ctx.stroke();

        // 俵 (俵のサークル表現)
        ctx.beginPath();
        ctx.ellipse(DOHYO.cx, DOHYO.cy, DOHYO.rx - 8, DOHYO.ry - 4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 235, 180, 0.8)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 仕切り線 (Shikirisen)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(DOHYO.cx - 50, DOHYO.cy - 20, 8, 40);
        ctx.fillRect(DOHYO.cx + 42, DOHYO.cy - 20, 8, 40);

        ctx.restore();
    }

    function drawRikishi(rikishi) {
        ctx.save();

        const x = rikishi.x;
        const y = rikishi.y;
        const r = rikishi.radius;

        // 押し出しアニメーションオフセット
        const pushOffset = rikishi.pushAnim * (rikishi.isPlayer ? 10 : -10);

        // オーラエフェクト (はたき込み構え時)
        if (rikishi.isDodging) {
            ctx.beginPath();
            ctx.arc(x, y, r + 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
            ctx.fill();
        }

        // 影
        ctx.beginPath();
        ctx.ellipse(x, DOHYO.cy + 25, r * 0.9, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fill();

        // 体（肌色ベース）
        ctx.beginPath();
        ctx.arc(x + pushOffset, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdfba';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = rikishi.color;
        ctx.stroke();

        // まわし (Mawashi)
        ctx.beginPath();
        ctx.arc(x + pushOffset, y, r * 0.82, 0.4, Math.PI - 0.4);
        ctx.fillStyle = rikishi.color;
        ctx.fill();

        // アバター絵文字
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rikishi.avatar, x + pushOffset, y - 4);

        // 名前タグ
        ctx.font = '14px "Kiwi Maru", serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(rikishi.name, x, y - r - 14);

        // 吹き出し・アクションテキスト
        if (rikishi.stateTextTimer > 0) {
            ctx.font = 'bold 16px "Yuji Syuku", serif';
            ctx.fillStyle = '#ffd700';
            ctx.fillText(rikishi.stateText, x, y - r - 34);
        }

        ctx.restore();
    }

    function drawAnnounce() {
        if (announceTimer <= 0) return;

        ctx.save();
        ctx.translate(DOHYO.cx, DOHYO.cy - 60);
        ctx.scale(announceScale, announceScale);

        ctx.font = '900 48px "Yuji Syuku", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#f3c644';
        ctx.shadowColor = 'rgba(230, 57, 70, 0.8)';
        ctx.shadowBlur = 20;
        ctx.fillText(announceText, 0, 0);

        ctx.strokeStyle = '#e63946';
        ctx.lineWidth = 2;
        ctx.strokeText(announceText, 0, 0);

        ctx.restore();
    }

    // --- メインループ ---
    let lastFrameTime = performance.now();

    function gameLoop(now) {
        const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
        lastFrameTime = now;

        // 物理 & AI アップデート
        if (gameState === STATE.PLAYING) {
            p1.update(dt);
            p2.update(dt);
            updateAI(dt);
            checkRingOut();
        }

        // アナウンスアニメーション更新
        if (announceTimer > 0) {
            announceTimer -= dt;
            announceScale = Math.max(1.0, announceScale - dt * 2.5);
        }

        // パーティクル更新
        particles.forEach(p => p.update(dt));
        particles = particles.filter(p => p.life > 0);

        // 描画
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawDohyo();
        drawRikishi(p1);
        drawRikishi(p2);
        particles.forEach(p => p.draw(ctx));
        drawAnnounce();

        requestAnimationFrame(gameLoop);
    }

    // ゲーム起動
    window.addEventListener('DOMContentLoaded', init);

})();
