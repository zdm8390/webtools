/**
 * はっけよい！超速相撲バトル POP - メインJavaScript
 * スマホ・タッチ操作最適化＆マルチタッチフルスクリーン連打
 */

(function() {
    'use strict';

    // --- Sound Engine (Web Audio API) ---
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
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

            const bufferSize = this.ctx.sampleRate * 0.12;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, this.ctx.currentTime);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();
            this.playTaiko(160, 0.12, 0.5);
        }

        playDodge() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);

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
            this.playTaiko(240, 0.5, 1.0);
            setTimeout(() => this.playTaiko(180, 0.4, 0.9), 100);
            setTimeout(() => this.playTaiko(140, 0.4, 0.8), 200);
        }

        playCardSelect() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(300, 0.1, 0.5);
            setTimeout(() => this.playTaiko(600, 0.2, 0.7), 80);
        }

        playFanfare(isWin) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const notes = isWin ? [261.63, 329.63, 392.00, 523.25, 659.25] : [260, 220, 180, 140];
            notes.forEach((freq, idx) => {
                setTimeout(() => {
                    if (!this.ctx) return;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = isWin ? 'triangle' : 'sawtooth';
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.35);
                }, idx * 100);
            });
        }
    }

    const audio = new SoundEngine();

    // --- ゲーム設定 & アーケード番付定義 ---
    const RANKS = [
        { name: '序ノ口', enemyName: '富士ノ山', strength: 2.2, weight: 110, color: '#00e676', avatar: '♨️' },
        { name: '十両', enemyName: '琴ノ海', strength: 3.8, weight: 135, color: '#00f0ff', avatar: '🌊' },
        { name: '幕内', enemyName: '朝日龍', strength: 5.4, weight: 155, color: '#ffe600', avatar: '🐉' },
        { name: '大関', enemyName: '豪快山', strength: 7.2, weight: 175, color: '#ff6b00', avatar: '⛰️' },
        { name: '横綱', enemyName: '武蔵王', strength: 9.2, weight: 200, color: '#ff007f', avatar: '👑' }
    ];

    const RIVAL_NAMES = ['怒涛龍', '金剛丸', '鬼ノ海', '雷神山', '百首王', '超嵐丸', '炎ノ海', '猛牛山', '覇王龍'];
    const RIVAL_AVATARS = ['👹', '🔥', '⚡', '🐂', '🦁', '🌪️', '💥', '⚓'];
    const RIVAL_COLORS = ['#ff007f', '#ffe600', '#00f0ff', '#9d4edd', '#ff6b00', '#00e676'];

    const ALL_SKILL_CARDS = [
        { id: 'push_power', icon: '⚡', title: 'どすこい連打術', desc: '押し出しの攻撃力が 25% アップ！', rarity: 'common', apply: (p) => { p.powerMultiplier += 0.25; } },
        { id: 'iron_wall', icon: '🛡️', title: '鉄壁の構え', desc: 'はたき込みの受付窓 +0.15秒＆カウンター力強化', rarity: 'rare', apply: (p) => { p.dodgeWindow += 0.15; p.counterPower += 0.3; } },
        { id: 'burst_boost', icon: '🔥', title: '気炎万丈', desc: '必殺技ゲージの増加スピードが 1.8倍！', rarity: 'rare', apply: (p) => { p.gaugeRate *= 1.8; } },
        { id: 'chanko_power', icon: '🍲', title: '特製ちゃんこ鍋', desc: '体重 +40kg！相手に押されにくくなる！', rarity: 'common', apply: (p) => { p.weight += 40; } },
        { id: 'swift_foot', icon: '💨', title: '疾風迅雷', desc: '力士の機動力＆押し出しの連打反動を軽減！', rarity: 'common', apply: (p) => { p.moveSpeed += 0.3; } },
        { id: 'clutch_push', icon: '💖', title: '土俵際の一発', desc: '自分が土俵際に追い詰められると推力が 2倍！', rarity: 'rare', apply: (p) => { p.hasClutchPower = true; } },
        { id: 'intimidation', icon: '👑', title: '横綱の気迫', desc: '相手の押し出しパワーを 20% 弱体化！', rarity: 'legendary', apply: (p) => { p.enemyPowerDebuff += 0.2; } },
        { id: 'stun_slap', icon: '💥', title: '雷電ハリケーン', desc: '連打時に 15% の確率で相手をノックバック！', rarity: 'legendary', apply: (p) => { p.hasStunSlap = true; } }
    ];

    const STATE = {
        TITLE: 'TITLE',
        MATCHUP: 'MATCHUP',
        SKILL_SELECT: 'SKILL_SELECT',
        COUNTDOWN: 'COUNTDOWN',
        PLAYING: 'PLAYING',
        RESULT: 'RESULT'
    };

    let gameState = STATE.TITLE;
    let gameMode = 'arcade';
    let currentRankIdx = 0;
    let winsCount = 0;
    let lossesCount = 0;
    let streakCount = 0;
    let startTime = 0;
    let totalClicksP1 = 0;

    class Rikishi {
        constructor(isPlayer, name, color, avatar, power = 5.0, weight = 120) {
            this.isPlayer = isPlayer;
            this.name = name;
            this.color = color;
            this.avatar = avatar;
            this.basePower = power;
            this.weight = weight;

            this.powerMultiplier = 1.0;
            this.dodgeWindow = 0.35;
            this.counterPower = 1.0;
            this.gaugeRate = 1.0;
            this.moveSpeed = 1.0;
            this.hasClutchPower = false;
            this.enemyPowerDebuff = 0;
            this.hasStunSlap = false;
            this.acquiredSkills = [];

            this.reset();
        }

        reset() {
            this.x = this.isPlayer ? 340 : 560;
            this.y = 260;
            this.vx = 0;
            this.radius = Math.min(48, 34 + (this.weight * 0.06));
            this.burstGauge = 0;
            this.isDodging = false;
            this.dodgeTimer = 0;
            this.pushAnim = 0;
            this.stateText = '';
            this.stateTextTimer = 0;
        }

        get currentPower() {
            return this.basePower * this.powerMultiplier;
        }

        update(dt) {
            this.x += this.vx;
            this.vx *= 0.82;

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
                this.dodgeTimer = this.dodgeWindow;
                this.setStateText('見切り構え！');
                audio.playDodge();
                return true;
            }
            return false;
        }

        setStateText(txt) {
            this.stateText = txt;
            this.stateTextTimer = 0.7;
        }
    }

    class Particle {
        constructor(x, y, vx, vy, color, size, life, text = null) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.color = color;
            this.size = size;
            this.maxLife = life;
            this.life = life;
            this.text = text;
        }
        update(dt) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.text ? -0.5 : 0.15;
            this.life -= dt;
        }
        draw(ctx) {
            ctx.save();
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.globalAlpha = alpha;

            if (this.text) {
                ctx.font = '900 20px "Dela Gothic One", sans-serif';
                ctx.fillStyle = this.color;
                ctx.shadowColor = '#000';
                ctx.shadowBlur = 4;
                ctx.fillText(this.text, this.x, this.y);
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // --- DOM要素 ---
    const canvas = document.getElementById('sumo-canvas');
    const ctx = canvas.getContext('2d');

    const uiOverlay = document.getElementById('ui-overlay');
    const screenTitle = document.getElementById('screen-title');
    const screenMatchup = document.getElementById('screen-matchup');
    const screenSkillSelect = document.getElementById('screen-skill-select');
    const screenResult = document.getElementById('screen-result');

    const rankBadge = document.getElementById('rank-badge');
    const winsBadge = document.getElementById('wins-badge');
    const speedLinesEl = document.getElementById('speed-lines');

    const btnTopNav = document.getElementById('btn-top-nav');
    const btnMatchupToTop = document.getElementById('btn-matchup-to-top');
    const btnToTitle = document.getElementById('btn-to-title');

    const btnModeArcade = document.getElementById('btn-mode-arcade');
    const btnModeEndless = document.getElementById('btn-mode-endless');
    const btnModePvp = document.getElementById('btn-mode-pvp');
    const btnStartFight = document.getElementById('btn-start-fight');

    const btnNextMatch = document.getElementById('btn-next-match');
    const btnRetryMatch = document.getElementById('btn-retry-match');
    const btnToggleAudio = document.getElementById('btn-toggle-audio');

    // タッチ操作ボタン
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
    const pWgtBar = document.getElementById('p-wgt-bar');
    const eStrBar = document.getElementById('e-str-bar');
    const eWgtBar = document.getElementById('e-wgt-bar');
    const matchupRankEl = document.getElementById('matchup-rank');
    const acquiredSkillsList = document.getElementById('acquired-skills-list');
    const cardsContainer = document.getElementById('cards-container');

    // リザルト要素
    const resultTitleEl = document.getElementById('result-title');
    const winnerNameEl = document.getElementById('winner-name');
    const resultKimariteEl = document.getElementById('result-kimarite');
    const resTimeEl = document.getElementById('res-time');
    const resCpsEl = document.getElementById('res-cps');
    const resStreakEl = document.getElementById('res-streak');

    let p1 = new Rikishi(true, '雷電丸', '#ff007f', '⚡', 5.5, 130);
    let p2 = new Rikishi(false, '富士ノ山', '#00f0ff', '♨️', 2.2, 110);

    let particles = [];
    let announceText = '';
    let announceScale = 1;
    let announceTimer = 0;
    let aiPushTimer = 0;

    const DOHYO = { cx: 450, cy: 260, rx: 340, ry: 160 };

    // --- 初期化 ---
    function init() {
        setupEventListeners();
        updateHeaderUI();
        requestAnimationFrame(gameLoop);
    }

    // --- イベントリスナー設定 ---
    function setupEventListeners() {
        btnModeArcade.addEventListener('click', () => resetAndStartMode('arcade'));
        btnModeEndless.addEventListener('click', () => resetAndStartMode('endless'));
        btnModePvp.addEventListener('click', () => resetAndStartMode('pvp'));

        btnTopNav.addEventListener('click', showTitle);
        btnMatchupToTop.addEventListener('click', showTitle);
        btnToTitle.addEventListener('click', showTitle);

        btnStartFight.addEventListener('click', startCountdown);

        btnNextMatch.addEventListener('click', () => {
            if (gameMode === 'arcade') {
                currentRankIdx = Math.min(RANKS.length - 1, currentRankIdx + 1);
            }
            startMatchup(gameMode);
        });
        btnRetryMatch.addEventListener('click', () => startMatchup(gameMode));

        btnToggleAudio.addEventListener('click', () => {
            audio.enabled = !audio.enabled;
            btnToggleAudio.textContent = audio.enabled ? '🔊 Sound ON' : '🔇 Sound OFF';
        });

        // スマホ画面タップ連打対応 (キャンバス直接タッチでも連打可能)
        canvas.addEventListener('touchstart', (e) => {
            if (gameState === STATE.PLAYING) {
                e.preventDefault();
                handlePush(p1);
            }
        }, { passive: false });

        canvas.addEventListener('pointerdown', (e) => {
            if (gameState === STATE.PLAYING && e.pointerType !== 'touch') {
                handlePush(p1);
            }
        });

        // 1P タッチ
        btnP1Push.addEventListener('pointerdown', (e) => { e.preventDefault(); handlePush(p1); });
        btnP1Dodge.addEventListener('pointerdown', (e) => { e.preventDefault(); handleDodge(p1); });
        btnP1Burst.addEventListener('pointerdown', (e) => { e.preventDefault(); handleBurst(p1); });

        // 2P タッチ
        btnP2Push.addEventListener('pointerdown', (e) => { e.preventDefault(); handlePush(p2); });
        btnP2Dodge.addEventListener('pointerdown', (e) => { e.preventDefault(); handleDodge(p2); });
        btnP2Burst.addEventListener('pointerdown', (e) => { e.preventDefault(); handleBurst(p2); });

        // キーボード操作
        window.addEventListener('keydown', (e) => {
            if (gameState !== STATE.PLAYING) return;

            if (e.code === 'Space') {
                e.preventDefault();
                handlePush(p1);
            } else if (e.code === 'KeyJ') {
                handleDodge(p1);
            } else if (e.code === 'KeyK') {
                handleBurst(p1);
            }

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
        currentRankIdx = 0;
        streakCount = 0;
        speedLinesEl.classList.remove('active');

        hideAllScreens();
        screenTitle.classList.add('active');
        uiOverlay.classList.add('active');
        p2ControlsGroup.classList.add('hidden');

        updateHeaderUI();
    }

    function hideAllScreens() {
        screenTitle.classList.remove('active');
        screenMatchup.classList.remove('active');
        screenSkillSelect.classList.remove('active');
        screenResult.classList.remove('active');
    }

    function resetAndStartMode(mode) {
        gameMode = mode;
        currentRankIdx = 0;
        streakCount = 0;
        p1 = new Rikishi(true, '雷電丸', '#ff007f', '⚡', 5.5, 130);
        startMatchup(mode);
    }

    function startMatchup(mode) {
        gameState = STATE.MATCHUP;
        hideAllScreens();
        screenMatchup.classList.add('active');
        uiOverlay.classList.add('active');

        if (mode === 'pvp') {
            p2 = new Rikishi(false, '鳳凰丸 (2P)', '#9d4edd', '🦅', 6.0, 140);
            p2ControlsGroup.classList.remove('hidden');
            matchupRankEl.textContent = '【ふたり対戦】 東西直接対決！';
        } else if (mode === 'arcade') {
            p2ControlsGroup.classList.add('hidden');
            const enemyData = RANKS[currentRankIdx];
            p2 = new Rikishi(false, enemyData.enemyName, enemyData.color, enemyData.avatar, enemyData.strength, enemyData.weight);
            matchupRankEl.textContent = `【横綱への道】 幕内 ${enemyData.name} 戦！`;
        } else if (mode === 'endless') {
            p2ControlsGroup.classList.add('hidden');
            const rName = RIVAL_NAMES[streakCount % RIVAL_NAMES.length];
            const rAvatar = RIVAL_AVATARS[streakCount % RIVAL_AVATARS.length];
            const rColor = RIVAL_COLORS[streakCount % RIVAL_COLORS.length];
            const rStrength = 2.5 + (streakCount * 0.75);
            const rWeight = 110 + (streakCount * 12);
            
            p2 = new Rikishi(false, `${rName} (${streakCount + 1}人目)`, rColor, rAvatar, rStrength, rWeight);
            matchupRankEl.textContent = `【連勝サバイバル】 ${streakCount + 1}戦目の刺客！`;
        }

        playerNameEl.textContent = p1.name;
        enemyNameEl.textContent = p2.name;
        playerAvatarEl.textContent = p1.avatar;
        enemyAvatarEl.textContent = p2.avatar;

        pStrBar.style.width = `${Math.min(100, p1.currentPower * 12)}%`;
        pWgtBar.style.width = `${Math.min(100, p1.weight * 0.4)}%`;
        eStrBar.style.width = `${Math.min(100, p2.currentPower * 12)}%`;
        eWgtBar.style.width = `${Math.min(100, p2.weight * 0.4)}%`;

        renderAcquiredSkills();
        audio.playHyoshigi();
    }

    function renderAcquiredSkills() {
        acquiredSkillsList.innerHTML = '';
        if (p1.acquiredSkills.length === 0) {
            acquiredSkillsList.innerHTML = '<span class="no-skill">習得スキルなし</span>';
            return;
        }

        p1.acquiredSkills.forEach(card => {
            const chip = document.createElement('span');
            chip.className = 'skill-chip';
            chip.textContent = `${card.icon} ${card.title}`;
            acquiredSkillsList.appendChild(chip);
        });
    }

    function showSkillSelect() {
        gameState = STATE.SKILL_SELECT;
        hideAllScreens();
        screenSkillSelect.classList.add('active');
        uiOverlay.classList.add('active');

        const shuffled = [...ALL_SKILL_CARDS].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);

        cardsContainer.innerHTML = '';
        choices.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `skill-card rare-${card.rarity}`;
            cardEl.innerHTML = `
                <span class="card-rarity">${card.rarity.toUpperCase()}</span>
                <div class="card-icon">${card.icon}</div>
                <div class="card-info">
                    <div class="card-title">${card.title}</div>
                    <div class="card-desc">${card.desc}</div>
                </div>
            `;

            cardEl.addEventListener('click', () => {
                audio.playCardSelect();
                card.apply(p1);
                p1.acquiredSkills.push(card);
                
                if (gameMode === 'arcade') {
                    currentRankIdx = Math.min(RANKS.length - 1, currentRankIdx + 1);
                }
                startMatchup(gameMode);
            });

            cardsContainer.appendChild(cardEl);
        });
    }

    function startCountdown() {
        uiOverlay.classList.remove('active');
        hideAllScreens();
        gameState = STATE.COUNTDOWN;

        p1.reset();
        p2.reset();
        particles = [];
        totalClicksP1 = 0;

        triggerAnnouncement('見合って！', 1.0);
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
        speedLinesEl.classList.remove('active');
        
        const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);
        const cps = (totalClicksP1 / Math.max(1, durationSec)).toFixed(1);
        const isP1Win = (winner === p1);

        audio.playFanfare(isP1Win);

        if (isP1Win) {
            winsCount++;
            streakCount++;
            resultTitleEl.textContent = '金 星 ！ 勝 負 あ り';
            winnerNameEl.textContent = `東 ${winner.name} の大勝利！`;
            
            if (gameMode !== 'pvp') {
                btnNextMatch.textContent = '秘伝スキル獲得 ➔';
                btnNextMatch.onclick = () => showSkillSelect();
            } else {
                btnNextMatch.textContent = '次の取組へ ➔';
                btnNextMatch.onclick = () => startMatchup(gameMode);
            }

            btnNextMatch.classList.remove('hidden');
            btnRetryMatch.classList.add('hidden');
            spawnVictoryConfetti();
        } else {
            lossesCount++;
            streakCount = 0;
            resultTitleEl.textContent = '敗 北 ... 勝 負 あ り';
            winnerNameEl.textContent = `西 ${winner.name} の勝利！`;
            
            btnNextMatch.classList.add('hidden');
            btnRetryMatch.classList.remove('hidden');
        }

        resultKimariteEl.textContent = `決まり手：${kimarite}`;
        resTimeEl.textContent = `${durationSec}秒`;
        resCpsEl.textContent = `${cps}回/秒`;
        resStreakEl.textContent = `${streakCount}連勝`;

        updateHeaderUI();

        setTimeout(() => {
            hideAllScreens();
            uiOverlay.classList.add('active');
            screenResult.classList.add('active');
        }, 1200);
    }

    function updateHeaderUI() {
        if (gameMode === 'arcade') {
            rankBadge.textContent = `👑 番付: ${RANKS[currentRankIdx].name}`;
        } else if (gameMode === 'endless') {
            rankBadge.textContent = `🔥 サバイバル中`;
        } else {
            rankBadge.textContent = `⚔️ 対戦モード`;
        }

        winsBadge.textContent = `🔥 ${streakCount}連勝中 (通算${winsCount}勝 ${lossesCount}敗)`;
    }

    // --- アクション処理 ---
    function handlePush(actor) {
        if (gameState !== STATE.PLAYING) return;

        const opponent = (actor === p1) ? p2 : p1;
        if (actor === p1) totalClicksP1++;

        actor.pushAnim = 1.0;

        const gInc = 6 * actor.gaugeRate;
        actor.burstGauge = Math.min(100, actor.burstGauge + gInc);
        updateBurstUI();

        if (opponent.isDodging) {
            const shiftVal = 20 * opponent.counterPower;
            actor.vx += (actor === p1) ? -shiftVal : shiftVal;
            opponent.vx += (opponent === p1) ? 14 : -14;
            audio.playHit();
            opponent.setStateText('見切り返し！');
            speedLinesEl.classList.add('active');
            setTimeout(() => speedLinesEl.classList.remove('active'), 400);

            spawnSparks((actor.x + opponent.x)/2, actor.y, '#00f0ff', 15, '見切り！');
            return;
        }

        let clutchMult = 1.0;
        if (actor.hasClutchPower && isOutOfDohyo(actor.x, actor.y, 0.75)) {
            clutchMult = 2.0;
            actor.setStateText('土俵際パワー！');
        }

        const dir = (actor === p1) ? 1 : -1;
        const debuff = (opponent.enemyPowerDebuff || 0);
        let pushForce = (3.5 + (actor.currentPower * 0.45)) * (1 - debuff) * clutchMult;

        if (actor.hasStunSlap && Math.random() < 0.15) {
            pushForce *= 1.8;
            spawnSparks((actor.x + opponent.x)/2, actor.y, '#ffe600', 12, 'ハリケーン！');
        }

        opponent.vx += dir * pushForce;
        actor.vx += dir * (pushForce * 0.25);

        audio.playHit();
        spawnSparks((actor.x + opponent.x)/2, actor.y, actor.color, 6);
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

        speedLinesEl.classList.add('active');
        setTimeout(() => speedLinesEl.classList.remove('active'), 800);

        opponent.vx += dir * 32;
        spawnSparks((actor.x + opponent.x)/2, actor.y, '#ffd700', 35, 'ドゴーン！');
    }

    function updateBurstUI() {
        if (p1.burstGauge >= 100) btnP1Burst.classList.remove('disabled');
        else btnP1Burst.classList.add('disabled');

        if (p2.burstGauge >= 100) btnP2Burst.classList.remove('disabled');
        else btnP2Burst.classList.add('disabled');
    }

    function updateAI(dt) {
        if (gameState !== STATE.PLAYING || gameMode === 'pvp') return;

        aiPushTimer += dt;
        const pushInterval = Math.max(0.06, 0.30 - (p2.currentPower * 0.024));

        if (aiPushTimer >= pushInterval) {
            aiPushTimer = 0;
            if (p1.vx > 6 && Math.random() < 0.18) {
                handleDodge(p2);
            } else {
                handlePush(p2);
            }

            if (p2.burstGauge >= 100 && Math.random() < 0.7) {
                handleBurst(p2);
            }
        }
    }

    function checkRingOut() {
        if (gameState !== STATE.PLAYING) return;

        const p1Out = isOutOfDohyo(p1.x, p1.y);
        const p2Out = isOutOfDohyo(p2.x, p2.y);

        if (p1Out || p2Out) {
            let winner, loser, kimarite;
            if (p1Out && p2Out) {
                winner = p1.x > p2.x ? p1 : p2;
            } else if (p1Out) {
                winner = p2; loser = p1;
            } else {
                winner = p1; loser = p2;
            }

            if (winner.isDodging || loser.stateText.includes('見切り')) {
                kimarite = 'はたき込み';
            } else if (winner.stateText.includes('どすこい')) {
                kimarite = '突き出し';
            } else if (Math.abs(winner.vx) > 10) {
                kimarite = '寄り切り';
            } else {
                kimarite = '押し出し';
            }

            finishMatch(winner, kimarite);
        }
    }

    function isOutOfDohyo(x, y, scale = 1.0) {
        const dx = (x - DOHYO.cx) / (DOHYO.rx * scale);
        const dy = (y - DOHYO.cy) / (DOHYO.ry * scale);
        return (dx * dx + dy * dy) > 1.0;
    }

    function spawnSparks(x, y, color, count = 8, popText = null) {
        if (popText) {
            particles.push(new Particle(x, y - 20, 0, -1, color, 0, 0.8, popText));
        }
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 8;
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                4 + Math.random() * 5,
                0.3 + Math.random() * 0.3
            ));
        }
    }

    function spawnVictoryConfetti() {
        const colors = ['#ff007f', '#ffe600', '#00f0ff', '#ffffff', '#9d4edd'];
        for (let i = 0; i < 90; i++) {
            particles.push(new Particle(
                DOHYO.cx + (Math.random() * 450 - 225),
                80,
                Math.random() * 6 - 3,
                Math.random() * 5 + 3,
                colors[Math.floor(Math.random() * colors.length)],
                5 + Math.random() * 6,
                2.8
            ));
        }
    }

    function triggerAnnouncement(text, duration = 1.0) {
        announceText = text;
        announceScale = 2.4;
        announceTimer = duration;
    }

    function drawDohyo() {
        ctx.save();

        const bgGrad = ctx.createRadialGradient(DOHYO.cx, DOHYO.cy, 40, DOHYO.cx, DOHYO.cy, 520);
        bgGrad.addColorStop(0, '#23153b');
        bgGrad.addColorStop(1, '#0f0919');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.ellipse(DOHYO.cx, DOHYO.cy, DOHYO.rx, DOHYO.ry, 0, 0, Math.PI * 2);
        const dohyoGrad = ctx.createRadialGradient(DOHYO.cx, DOHYO.cy, 30, DOHYO.cx, DOHYO.cy, DOHYO.rx);
        dohyoGrad.addColorStop(0, '#e5a76c');
        dohyoGrad.addColorStop(0.85, '#ca8647');
        dohyoGrad.addColorStop(1, '#945421');
        ctx.fillStyle = dohyoGrad;
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#ffe600';
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(DOHYO.cx, DOHYO.cy, DOHYO.rx - 10, DOHYO.ry - 5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 4;
        ctx.setLineDash([14, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(DOHYO.cx - 50, DOHYO.cy - 24, 10, 48);
        ctx.fillRect(DOHYO.cx + 40, DOHYO.cy - 24, 10, 48);

        ctx.restore();
    }

    function drawRikishi(rikishi) {
        ctx.save();
        const x = rikishi.x;
        const y = rikishi.y;
        const r = rikishi.radius;
        const pushOffset = rikishi.pushAnim * (rikishi.isPlayer ? 12 : -12);

        if (rikishi.isDodging) {
            ctx.beginPath();
            ctx.arc(x, y, r + 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.fill();
        }

        ctx.beginPath();
        ctx.ellipse(x, DOHYO.cy + 25, r * 0.9, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + pushOffset, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe0bd';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = rikishi.color;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x + pushOffset, y, r * 0.82, 0.3, Math.PI - 0.3);
        ctx.fillStyle = rikishi.color;
        ctx.fill();

        ctx.font = `${Math.floor(r * 0.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rikishi.avatar, x + pushOffset, y - 2);

        ctx.font = '900 15px "Dela Gothic One", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(rikishi.name, x, y - r - 14);

        if (rikishi.stateTextTimer > 0) {
            ctx.font = '900 18px "Dela Gothic One", sans-serif';
            ctx.fillStyle = '#ffe600';
            ctx.fillText(rikishi.stateText, x, y - r - 36);
        }

        ctx.restore();
    }

    function drawAnnounce() {
        if (announceTimer <= 0) return;
        ctx.save();
        ctx.translate(DOHYO.cx, DOHYO.cy - 60);
        ctx.scale(announceScale, announceScale);

        ctx.font = '900 52px "Dela Gothic One", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 20;
        ctx.fillText(announceText, 0, 0);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(announceText, 0, 0);

        ctx.restore();
    }

    let lastFrameTime = performance.now();

    function gameLoop(now) {
        const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
        lastFrameTime = now;

        if (gameState === STATE.PLAYING) {
            p1.update(dt);
            p2.update(dt);
            updateAI(dt);
            checkRingOut();
        }

        if (announceTimer > 0) {
            announceTimer -= dt;
            announceScale = Math.max(1.0, announceScale - dt * 2.8);
        }

        particles.forEach(p => p.update(dt));
        particles = particles.filter(p => p.life > 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawDohyo();
        drawRikishi(p1);
        drawRikishi(p2);
        particles.forEach(p => p.draw(ctx));
        drawAnnounce();

        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('DOMContentLoaded', init);

})();
