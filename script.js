/**
 * 超音速スモウバトル～ちゃんこ食わんかい～
 * メインJavaScript (フリーズ完全根絶・塩弾パリィ反射・プロゲーマーバランス)
 */

(function() {
    'use strict';

    // --- Sound Engine (Web Audio API) ---
    class SoundEngine {
        constructor() {
            this.ctx = null;
            const savedState = localStorage.getItem('sumo_pop_audio_enabled');
            this.enabled = savedState !== null ? (savedState === 'true') : true;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        }

        toggleAudio() {
            this.enabled = !this.enabled;
            localStorage.setItem('sumo_pop_audio_enabled', String(this.enabled));
            return this.enabled;
        }

        playTaiko(freq = 120, duration = 0.35, vol = 0.8) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

                gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {}
        }

        playHyoshigi() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(2600, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.1);

                gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + 0.1);
            } catch (e) {}
        }

        playHit() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            try {
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, this.ctx.currentTime);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                noise.start();
                this.playTaiko(200, 0.1, 0.6);
            } catch (e) {}
        }

        playDodge() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1040, this.ctx.currentTime + 0.15);

                gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.15);
            } catch (e) {}
        }

        playParry() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(600, 0.1, 1.0);
            setTimeout(() => this.playTaiko(1200, 0.2, 1.0), 50);
        }

        playMegaBurst() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(400, 0.6, 1.0);
            setTimeout(() => this.playTaiko(300, 0.5, 0.9), 100);
            setTimeout(() => this.playTaiko(200, 0.4, 0.8), 200);
            setTimeout(() => this.playTaiko(100, 0.5, 1.0), 300);
        }

        playCardSelect() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(400, 0.1, 0.5);
            setTimeout(() => this.playTaiko(800, 0.2, 0.7), 80);
        }

        playFanfare(isWin) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            const notes = isWin ? [349.23, 440.00, 523.25, 698.46] : [300, 260, 220, 180];
            notes.forEach((freq, idx) => {
                setTimeout(() => {
                    if (!this.ctx) return;
                    try {
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
                    } catch (e) {}
                }, idx * 100);
            });
        }
    }

    const audio = new SoundEngine();

    // ランク階級システム
    const RANKS = [
        { name: 'ブロンズ', icon: '🥉', enemyName: 'うさ丸', aiType: 'rush', strength: 2.0, weight: 110, color: '#059669', avatar: '🐰' },
        { name: 'シルバー', icon: '🥈', enemyName: 'くまごろう', aiType: 'heavy', strength: 3.4, weight: 130, color: '#0284c7', avatar: '🐻' },
        { name: 'ゴールド', icon: '🥇', enemyName: 'ねこノ海', aiType: 'counter', strength: 4.8, weight: 145, color: '#d97706', avatar: '🐱' },
        { name: 'プラチナ', icon: '💎', enemyName: 'ぺんぎん山', aiType: 'rush', strength: 6.2, weight: 165, color: '#0284c7', avatar: '🐧' },
        { name: 'ダイヤ', icon: '👑', enemyName: '鳳凰丸', aiType: 'counter', strength: 7.6, weight: 185, color: '#9333ea', avatar: '🦅' },
        { name: 'マスター (ラスボス)', icon: '🐲', enemyName: '金龍丸 ＆ 銀龍丸 (双子2体)', aiType: 'boss_duo', strength: 8.8, weight: 190, color: '#b45309', avatar: '🐉' }
    ];

    const RIVAL_NAMES = ['ぽんちゃん', 'もち丸', 'わたがし山', 'いちご龍', 'みるく丸', 'キャンディ海', 'ぷりん山', 'そら丸'];
    const RIVAL_AVATARS = ['🍓', '🍡', '🐥', '🐰', '🐻', '🐱', '🦄', '🐼'];
    const RIVAL_COLORS = ['#7e6b8f', '#b45309', '#0284c7', '#9333ea', '#059669', '#d977a5'];

    const ALL_SKILL_CARDS = [
        { id: 'push_power', icon: '🍲', title: '特上ちゃんこ', desc: '押し出し攻撃力 +30% (腕力成長！)', rarity: 'common', apply: (p) => { p.powerMultiplier += 0.3; } },
        { id: 'iron_wall', icon: '🛡️', title: '鉄壁の構え', desc: 'はたき受付 +0.15秒＆カウンター力 1.5倍', rarity: 'rare', apply: (p) => { p.dodgeWindow += 0.15; p.counterPower += 0.5; } },
        { id: 'burst_boost', icon: '🔥', title: '激辛どすこい鍋', desc: '必殺技ゲージの増加スピード 2倍！', rarity: 'rare', apply: (p) => { p.gaugeRate *= 2.0; } },
        { id: 'chanko_power', icon: '🍚', title: '超大盛りメガ飯', desc: '体重 +50kg！超安定ド迫力ボディ！', rarity: 'common', apply: (p) => { p.weight += 50; } },
        { id: 'swift_foot', icon: '💨', title: '音速ステップ', desc: '自由移動の移動スピード 1.5倍！', rarity: 'common', apply: (p) => { p.moveSpeed += 0.5; } },
        { id: 'clutch_push', icon: '💖', title: '土俵際の一発', desc: '土俵際に追い詰められると推力が 2.5倍！', rarity: 'rare', apply: (p) => { p.hasClutchPower = true; } },
        { id: 'intimidation', icon: '👑', title: '横綱の気迫', desc: '相手の押し出しパワーを 25% 弱体化！', rarity: 'legendary', apply: (p) => { p.enemyPowerDebuff += 0.25; } },
        { id: 'stun_slap', icon: '💥', title: '雷電ハリケーン', desc: '連打時に 20% の確実ノックバック！', rarity: 'legendary', apply: (p) => { p.hasStunSlap = true; } }
    ];

    const EVENTS = [
        { type: 'ice', title: '🧊 ツルツル氷土俵！ (摩擦ゼロ！超スライド！)', apply: () => {} },
        { type: 'fever', title: '⚡ 音速フィーバー！ (押す力3倍！)', apply: () => {} },
        { type: 'wind', title: '🌪️ 強烈な突風！ (横風が吹き荒れる！)', apply: () => {} },
        { type: 'chanko', title: '🍲 ちゃんこタイム！ (先に押した方が必殺技満タン)', apply: () => {} }
    ];

    const STATE = {
        TITLE: 'TITLE',
        MATCHUP: 'MATCHUP',
        SKILL_SELECT: 'SKILL_SELECT',
        RANK_UP: 'RANK_UP',
        COUNTDOWN: 'COUNTDOWN',
        PLAYING: 'PLAYING',
        RESULT: 'RESULT'
    };

    let gameState = STATE.TITLE;
    let gameMode = 'arcade';
    let currentRankIdx = 0;
    let totalMatchesCount = 0;
    let playerLevel = 1;
    let playerExp = 0;
    let winsCount = 0;
    let lossesCount = 0;
    let streakCount = 0;
    let startTime = 0;
    let totalClicksP1 = 0;
    let isMatchFinished = false;

    let comboP1 = 0;
    let maxComboP1 = 0;
    let comboTimerP1 = 0;
    let currentEvent = null;
    let eventTimer = 0;
    let windDir = 1;

    let shakeTimer = 0;
    let hitStopTimer = 0;

    const keysPressed = {};
    const dpadPressed = { up: false, down: false, left: false, right: false };

    // 塩飛び道具（パリィ跳ね返し属性 isReflected 対応）
    class SaltBullet {
        constructor(x, y, targetX, targetY, isReflected = false) {
            this.x = x;
            this.y = y;
            const angle = Math.atan2(targetY - y, targetX - x);
            const speed = isReflected ? 8.0 : 4.2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = 9;
            this.life = 2.5;
            this.isReflected = isReflected;
        }
        update(dt) {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= dt;
        }
        draw(ctx) {
            ctx.save();
            ctx.shadowColor = this.isReflected ? 'rgba(253, 224, 71, 0.8)' : 'rgba(45, 38, 51, 0.4)';
            ctx.shadowBlur = this.isReflected ? 10 : 4;
            ctx.fillStyle = this.isReflected ? '#fde047' : '#ffffff';
            ctx.strokeStyle = this.isReflected ? '#b45309' : '#475569';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#475569';
            ctx.font = '10px sans-serif';
            ctx.fillText(this.isReflected ? '✨' : '🧂', this.x - 5, this.y + 4);
            ctx.restore();
        }
    }

    let saltBullets = [];
    let enemySaltTimer = 0;

    class Rikishi {
        constructor(isPlayer, name, color, avatar, power = 5.5, weight = 130, aiType = 'rush', startX = 340, startY = 260) {
            this.isPlayer = isPlayer;
            this.name = name;
            this.color = color;
            this.avatar = avatar;
            this.basePower = power;
            this.weight = weight;
            this.aiType = aiType;
            this.startX = startX;
            this.startY = startY;

            this.powerMultiplier = 1.0;
            this.dodgeWindow = 0.35;
            this.counterPower = 1.0;
            this.gaugeRate = 1.0;
            this.moveSpeed = 1.0;
            this.hasClutchPower = false;
            this.enemyPowerDebuff = 0;
            this.hasStunSlap = false;
            this.acquiredSkills = [];
            this.isEliminated = false;

            this.reset();
        }

        reset() {
            this.x = this.startX;
            this.y = this.startY;
            this.vx = 0;
            this.vy = 0;
            this.radius = Math.min(48, 32 + (this.weight * 0.05));
            this.burstGauge = 0;
            this.isDodging = false;
            this.dodgeTimer = 0;
            this.pushAnim = 0;
            this.stateText = '';
            this.stateTextTimer = 0;
            this.isEliminated = false;
        }

        get currentPower() {
            return this.basePower * this.powerMultiplier;
        }

        update(dt) {
            if (this.isEliminated) return;

            this.x += this.vx;
            this.y += this.vy;

            // キャンバス境界防護
            this.x = Math.max(this.radius, Math.min(900 - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(520 - this.radius, this.y));

            const friction = (currentEvent && currentEvent.type === 'ice') ? 0.98 : 0.82;
            this.vx *= friction;
            this.vy *= friction;

            if (currentEvent && currentEvent.type === 'wind') {
                this.vx += windDir * 0.45;
            }

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
            if (this.dodgeTimer <= 0 && !this.isEliminated) {
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
                ctx.font = '700 20px "Zen Maru Gothic", sans-serif';
                ctx.fillStyle = this.color;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 6;
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

    // DOM要素
    const canvas = document.getElementById('sumo-canvas');
    const ctx = canvas.getContext('2d');

    const uiOverlay = document.getElementById('ui-overlay');
    const screenTitle = document.getElementById('screen-title');
    const screenMatchup = document.getElementById('screen-matchup');
    const screenSkillSelect = document.getElementById('screen-skill-select');
    const screenRankUp = document.getElementById('screen-rank-up');
    const screenResult = document.getElementById('screen-result');

    const levelBadge = document.getElementById('level-badge');
    const winsBadge = document.getElementById('wins-badge');
    const speedLinesEl = document.getElementById('speed-lines');
    const burstCutinEl = document.getElementById('burst-cutin');
    const eventBanner = document.getElementById('event-banner');
    const eventTitleEl = document.getElementById('event-title');

    const btnTopNav = document.getElementById('btn-top-nav');
    const btnMatchupToTop = document.getElementById('btn-matchup-to-top');
    const btnToTitle = document.getElementById('btn-to-title');

    const btnModeArcade = document.getElementById('btn-mode-arcade');
    const btnModeEndless = document.getElementById('btn-mode-endless');
    const btnModePvp = document.getElementById('btn-mode-pvp');
    const btnStartFight = document.getElementById('btn-start-fight');
    const btnRankupContinue = document.getElementById('btn-rankup-continue');

    const btnNextMatch = document.getElementById('btn-next-match');
    const btnRetryMatch = document.getElementById('btn-retry-match');
    const btnToggleAudio = document.getElementById('btn-toggle-audio');

    const btnP1Push = document.getElementById('btn-p1-push');
    const btnP1Dodge = document.getElementById('btn-p1-dodge');
    const btnP1Burst = document.getElementById('btn-p1-burst');

    const p2ControlsGroup = document.getElementById('p2-controls-group');
    const btnP2Push = document.getElementById('btn-p2-push');
    const btnP2Dodge = document.getElementById('btn-p2-dodge');
    const btnP2Burst = document.getElementById('btn-p2-burst');

    const dpadUp = document.getElementById('dpad-up');
    const dpadDown = document.getElementById('dpad-down');
    const dpadLeft = document.getElementById('dpad-left');
    const dpadRight = document.getElementById('dpad-right');

    const playerLvlTag = document.getElementById('player-lvl-tag');
    const playerNameEl = document.getElementById('player-name');
    const enemyNameEl = document.getElementById('enemy-name');
    const pStrBar = document.getElementById('p-str-bar');
    const pWgtBar = document.getElementById('p-wgt-bar');
    const pStrNum = document.getElementById('p-str-num');
    const pWgtNum = document.getElementById('p-wgt-num');
    const eStrBar = document.getElementById('e-str-bar');
    const eWgtBar = document.getElementById('e-wgt-bar');
    const eStrNum = document.getElementById('e-str-num');
    const eWgtNum = document.getElementById('e-wgt-num');

    const matchupRankEl = document.getElementById('matchup-rank');
    const enemyTypeBadge = document.getElementById('enemy-type-badge');
    const acquiredSkillsList = document.getElementById('acquired-skills-list');
    const cardsContainer = document.getElementById('cards-container');

    const rankupTitle = document.getElementById('rankup-title');
    const rankupIcon = document.getElementById('rankup-icon');
    const rankupDesc = document.getElementById('rankup-desc');

    const resultTitleEl = document.getElementById('result-title');
    const winnerNameEl = document.getElementById('winner-name');
    const resultKimariteEl = document.getElementById('result-kimarite');
    const resTimeEl = document.getElementById('res-time');
    const resExpEl = document.getElementById('res-exp');
    const resLevelEl = document.getElementById('res-level');

    let p1 = new Rikishi(true, '雷電丸', '#7e6b8f', '⚡', 5.5, 130, 'player', 340, 260);
    let enemies = [];

    let particles = [];
    let announceText = '';
    let announceScale = 1;
    let announceTimer = 0;
    let aiPushTimer = 0;

    const DOHYO = { cx: 450, cy: 260, rx: 340, ry: 160 };

    // --- 初期化 ---
    function init() {
        btnToggleAudio.textContent = audio.enabled ? '🔊 Sound ON' : '🔇 Sound OFF';
        setupEventListeners();
        updateHeaderUI();
        requestAnimationFrame(gameLoop);
    }

    function setupEventListeners() {
        btnModeArcade.addEventListener('click', (e) => { e.preventDefault(); resetAndStartMode('arcade'); });
        btnModeEndless.addEventListener('click', (e) => { e.preventDefault(); resetAndStartMode('endless'); });
        btnModePvp.addEventListener('click', (e) => { e.preventDefault(); resetAndStartMode('pvp'); });

        btnTopNav.addEventListener('click', showTitle);
        btnMatchupToTop.addEventListener('click', showTitle);
        btnToTitle.addEventListener('click', showTitle);

        btnStartFight.addEventListener('click', startCountdown);

        btnRankupContinue.addEventListener('click', () => {
            showSkillSelect();
        });

        btnNextMatch.addEventListener('click', () => {
            if (gameMode === 'arcade' && winsCount > 0 && winsCount % 2 === 0 && currentRankIdx < RANKS.length - 1) {
                currentRankIdx++;
                showRankUpDialog();
            } else {
                showSkillSelect();
            }
        });

        btnRetryMatch.addEventListener('click', () => startCountdown());

        btnToggleAudio.addEventListener('click', () => {
            const isEnabled = audio.toggleAudio();
            btnToggleAudio.textContent = isEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
        });

        setupDpadEvents(dpadUp, 'up');
        setupDpadEvents(dpadDown, 'down');
        setupDpadEvents(dpadLeft, 'left');
        setupDpadEvents(dpadRight, 'right');

        canvas.addEventListener('touchstart', (e) => {
            audio.init();
            if (gameState === STATE.PLAYING) {
                e.preventDefault();
                handlePush(p1);
            }
        }, { passive: false });

        canvas.addEventListener('pointerdown', (e) => {
            audio.init();
            if (gameState === STATE.PLAYING && e.pointerType !== 'touch') {
                handlePush(p1);
            }
        });

        btnP1Push.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); handlePush(p1); });
        btnP1Dodge.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); handleDodge(p1); });
        btnP1Burst.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); handleBurst(p1); });

        window.addEventListener('keydown', (e) => {
            audio.init();
            keysPressed[e.code] = true;

            if (e.code === 'KeyM') {
                const isEnabled = audio.toggleAudio();
                btnToggleAudio.textContent = isEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
            }

            if (gameState === STATE.PLAYING) {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) {
                    e.preventDefault();
                }

                if (e.repeat) return;

                if (e.code === 'Space') {
                    handlePush(p1);
                } else if (e.code === 'KeyJ') {
                    handleDodge(p1);
                } else if (e.code === 'KeyK') {
                    handleBurst(p1);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            keysPressed[e.code] = false;
        });
    }

    function setupDpadEvents(btn, dir) {
        if (!btn) return;
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); dpadPressed[dir] = true; });
        btn.addEventListener('pointerup', () => { dpadPressed[dir] = false; });
        btn.addEventListener('pointerleave', () => { dpadPressed[dir] = false; });
        btn.addEventListener('touchend', () => { dpadPressed[dir] = false; });
    }

    function showTitle() {
        gameState = STATE.TITLE;
        currentRankIdx = 0;
        totalMatchesCount = 0;
        playerLevel = 1;
        playerExp = 0;
        streakCount = 0;
        isMatchFinished = false;
        saltBullets = [];
        speedLinesEl.classList.remove('active');
        burstCutinEl.classList.add('hidden');
        eventBanner.classList.add('hidden');

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
        screenRankUp.classList.remove('active');
        screenResult.classList.remove('active');
    }

    function resetAndStartMode(mode) {
        gameMode = mode;
        currentRankIdx = 0;
        totalMatchesCount = 0;
        playerLevel = 1;
        playerExp = 0;
        streakCount = 0;
        p1 = new Rikishi(true, '雷電丸', '#7e6b8f', '⚡', 5.5, 130, 'player', 340, 260);
        
        setupEnemy(mode);
        showMatchupScreen();
    }

    function showMatchupScreen() {
        gameState = STATE.MATCHUP;
        hideAllScreens();
        uiOverlay.classList.add('active');
        screenMatchup.classList.add('active');

        if (playerLvlTag) playerLvlTag.textContent = `⭐ Lv.${playerLevel} (あなた)`;
        if (playerNameEl) playerNameEl.textContent = p1.name;

        const mainEnemy = enemies[0] || new Rikishi(false, 'うさ丸', '#059669', '🐰', 2.0, 110);
        if (enemyNameEl) enemyNameEl.textContent = (enemies.length > 1) ? `${mainEnemy.name} (2体タッグ)` : mainEnemy.name;

        const pStrVal = Math.floor(p1.currentPower * 10);
        if (pStrBar) pStrBar.style.width = `${Math.min(100, Math.max(0, pStrVal))}%`;
        if (pStrNum) pStrNum.textContent = pStrVal;

        if (pWgtBar) pWgtBar.style.width = `${Math.min(100, Math.max(0, (p1.weight / 250) * 100))}%`;
        if (pWgtNum) pWgtNum.textContent = `${p1.weight}kg`;

        const eStrVal = Math.floor(mainEnemy.currentPower * 10);
        if (eStrBar) eStrBar.style.width = `${Math.min(100, Math.max(0, eStrVal))}%`;
        if (eStrNum) eStrNum.textContent = eStrVal;

        if (eWgtBar) eWgtBar.style.width = `${Math.min(100, Math.max(0, (mainEnemy.weight / 250) * 100))}%`;
        if (eWgtNum) eWgtNum.textContent = `${mainEnemy.weight}kg`;

        if (matchupRankEl) {
            matchupRankEl.textContent = `【第 ${totalMatchesCount + 1} 取組】 ランク: ${RANKS[currentRankIdx].name}`;
        }

        renderAcquiredSkills();
        updateHeaderUI();
    }

    function setupEnemy(mode) {
        enemies = [];
        p2ControlsGroup.classList.add('hidden');

        if (mode === 'arcade') {
            const enemyData = RANKS[currentRankIdx];
            if (enemyData.aiType === 'boss_duo') {
                const boss1 = new Rikishi(false, '金龍丸 (兄)', '#b45309', '🐲', 8.8, 190, 'rush', 580, 210);
                const boss2 = new Rikishi(false, '銀龍丸 (弟)', '#4a5568', '🐉', 8.2, 180, 'counter', 580, 310);
                enemies.push(boss1, boss2);
            } else {
                const singleEnemy = new Rikishi(false, enemyData.enemyName, enemyData.color, enemyData.avatar, enemyData.strength, enemyData.weight, enemyData.aiType, 560, 260);
                enemies.push(singleEnemy);
            }
        } else if (mode === 'endless') {
            const rName = RIVAL_NAMES[streakCount % RIVAL_NAMES.length];
            const rAvatar = RIVAL_AVATARS[streakCount % RIVAL_AVATARS.length];
            const rColor = RIVAL_COLORS[streakCount % RIVAL_COLORS.length];
            const rStrength = 2.4 + (streakCount * 0.7);
            const rWeight = 110 + (streakCount * 12);
            const aiTypes = ['rush', 'counter', 'heavy'];
            const rAiType = aiTypes[streakCount % 3];

            enemies.push(new Rikishi(false, `${rName} (${streakCount + 1}人目)`, rColor, rAvatar, rStrength, rWeight, rAiType, 560, 260));
        }

        if (enemyTypeBadge) {
            if (enemies.length > 1) {
                enemyTypeBadge.textContent = `西 (双子タッグ！)`;
            } else {
                const aiLabelMap = { 'rush': '⚡ 超突進', 'counter': '🌀 見切り巧者', 'heavy': '⛰️ 超重戦車' };
                enemyTypeBadge.textContent = `西 (${aiLabelMap[enemies[0].aiType] || 'ライバル'})`;
            }
        }
    }

    function renderAcquiredSkills() {
        while (acquiredSkillsList.firstChild) {
            acquiredSkillsList.removeChild(acquiredSkillsList.firstChild);
        }

        if (p1.acquiredSkills.length === 0) {
            const noSkill = document.createElement('span');
            noSkill.className = 'no-skill';
            noSkill.textContent = 'なし';
            acquiredSkillsList.appendChild(noSkill);
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
        eventBanner.classList.add('hidden');
        saltBullets = [];
        hideAllScreens();
        screenSkillSelect.classList.add('active');
        uiOverlay.classList.add('active');

        const shuffled = [...ALL_SKILL_CARDS].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 3);

        while (cardsContainer.firstChild) {
            cardsContainer.removeChild(cardsContainer.firstChild);
        }

        choices.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = `skill-card rare-${card.rarity}`;
            cardEl.setAttribute('role', 'option');
            cardEl.setAttribute('tabindex', '0');

            const rarityEl = document.createElement('span');
            rarityEl.className = 'card-rarity';
            rarityEl.textContent = card.rarity.toUpperCase();

            const iconEl = document.createElement('div');
            iconEl.className = 'card-icon';
            iconEl.textContent = card.icon;

            const infoEl = document.createElement('div');
            infoEl.className = 'card-info';

            const titleEl = document.createElement('div');
            titleEl.className = 'card-title';
            titleEl.textContent = card.title;

            const descEl = document.createElement('div');
            descEl.className = 'card-desc';
            descEl.textContent = card.desc;

            infoEl.appendChild(titleEl);
            infoEl.appendChild(descEl);

            cardEl.appendChild(rarityEl);
            cardEl.appendChild(iconEl);
            cardEl.appendChild(infoEl);

            const selectHandler = () => {
                audio.playCardSelect();
                card.apply(p1);
                p1.acquiredSkills.push(card);
                
                setupEnemy(gameMode);
                showMatchupScreen();
            };

            cardEl.addEventListener('click', selectHandler);
            cardEl.addEventListener('keydown', (e) => {
                if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    selectHandler();
                }
            });

            cardsContainer.appendChild(cardEl);
        });
    }

    function showRankUpDialog() {
        gameState = STATE.RANK_UP;
        hideAllScreens();
        uiOverlay.classList.add('active');
        screenRankUp.classList.add('active');

        const curR = RANKS[currentRankIdx];
        const prevR = RANKS[currentRankIdx - 1];

        rankupTitle.textContent = `${prevR.name} ➔ ${curR.name} 昇格！`;
        rankupIcon.textContent = curR.icon;

        if (curR.aiType === 'boss_duo') {
            rankupDesc.textContent = `最高峰マスターランク到達！最終決戦は『双子力士 金龍丸＆銀龍丸』の2体同時バトル！！`;
        } else {
            rankupDesc.textContent = `ランク【${curR.name}】に到達！ライバル「${curR.enemyName}」が待っている！全能力ボーナス+20%！`;
        }

        p1.powerMultiplier += 0.2;
        p1.weight += 15;

        audio.playFanfare(true);
        spawnVictoryConfetti();
        updateHeaderUI();
    }

    function startCountdown() {
        uiOverlay.classList.remove('active');
        hideAllScreens();
        gameState = STATE.COUNTDOWN;
        isMatchFinished = false;

        totalMatchesCount++;
        comboP1 = 0;
        maxComboP1 = 0;
        comboTimerP1 = 0;
        currentEvent = null;
        eventTimer = 0;

        saltBullets = [];
        enemySaltTimer = 0;
        eventBanner.classList.add('hidden');
        burstCutinEl.classList.add('hidden');

        p1.reset();
        enemies.forEach(e => e.reset());
        particles = [];
        totalClicksP1 = 0;

        triggerAnnouncement('見合って！', 1.0);
        audio.playHyoshigi();

        setTimeout(() => {
            triggerAnnouncement('はっけよい！', 1.2);
            audio.playTaiko(140, 0.3, 0.9);
        }, 900);

        setTimeout(() => {
            triggerAnnouncement('のこった！', 1.5);
            audio.playTaiko(220, 0.4, 1.0);
            gameState = STATE.PLAYING;
            startTime = performance.now();

            if (Math.random() < 0.75) {
                setTimeout(triggerRandomEvent, 2200 + Math.random() * 2000);
            }
        }, 1800);
    }

    function triggerRandomEvent() {
        if (gameState !== STATE.PLAYING || isMatchFinished) return;
        const selected = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        currentEvent = selected;
        eventTimer = 6.0;
        windDir = Math.random() < 0.5 ? 1 : -1;

        eventTitleEl.textContent = selected.title;
        eventBanner.classList.remove('hidden');
        triggerShake(0.3);
        audio.playMegaBurst();

        spawnSparks(DOHYO.cx, DOHYO.cy, '#fde047', 20, 'ハプニング！');
    }

    // 🚨 [重大バグ修正] 勝敗決着時フリーズ根絶・強制物理停止
    function finishMatch(isP1Win, kimarite) {
        if (isMatchFinished) return;
        isMatchFinished = true;

        gameState = STATE.RESULT;
        
        // 全力士の物理速度を強制ゼロ停止！
        p1.vx = 0; p1.vy = 0;
        enemies.forEach(e => { e.vx = 0; e.vy = 0; });

        speedLinesEl.classList.remove('active');
        eventBanner.classList.add('hidden');
        saltBullets = [];
        triggerShake(0.6);
        
        const durationSec = ((performance.now() - startTime) / 1000).toFixed(1);
        const cps = (totalClicksP1 / Math.max(1, durationSec)).toFixed(1);

        audio.playFanfare(isP1Win);

        if (isP1Win) {
            winsCount++;
            streakCount++;
            playerExp += 150;
            
            if (playerExp >= playerLevel * 200) {
                playerLevel++;
                p1.basePower += 0.4;
                p1.weight += 5;
            }

            resultTitleEl.textContent = (enemies.length > 1) ? '🐉 ラスボス双子完全撃破！ 🐉' : '金 星 ！ 勝 負 あ り 🍲';
            winnerNameEl.textContent = `東 ${p1.name} の大勝利！`;
            
            btnNextMatch.textContent = '✨ 次の取組へ (ちゃんこ獲得) ➔';
            btnNextMatch.classList.remove('hidden');
            btnRetryMatch.classList.add('hidden');
            spawnVictoryConfetti();
        } else {
            lossesCount++;
            streakCount = 0;
            resultTitleEl.textContent = '敗 北 ... 勝 負 あ り';
            winnerNameEl.textContent = `西 勝利！`;
            
            btnNextMatch.classList.add('hidden');
            btnRetryMatch.classList.remove('hidden');
        }

        resultKimariteEl.textContent = `決まり手：${kimarite}`;
        resTimeEl.textContent = `${durationSec}秒`;
        resCpsEl.textContent = `${cps}回`;
        if (resExpEl) resExpEl.textContent = isP1Win ? `+150 EXP` : `0 EXP`;
        if (resLevelEl) resLevelEl.textContent = `Lv.${playerLevel}`;

        updateHeaderUI();

        // 画面切り替えの安全タイマー
        setTimeout(() => {
            try {
                hideAllScreens();
                uiOverlay.classList.add('active');
                screenResult.classList.add('active');
            } catch (err) {}
        }, 1200);
    }

    function updateHeaderUI() {
        if (levelBadge) levelBadge.textContent = `⭐ Lv.${playerLevel} ${p1.name}`;

        for (let i = 0; i < 6; i++) {
            const stepEl = document.getElementById(`rmap-${i}`);
            if (stepEl) {
                if (i === currentRankIdx) {
                    stepEl.className = 'rank-step active';
                } else if (i < currentRankIdx) {
                    stepEl.className = 'rank-step reached';
                } else {
                    stepEl.className = 'rank-step';
                }
            }
        }

        if (winsBadge) {
            winsBadge.textContent = `第 ${totalMatchesCount + 1} 取組 (${streakCount}連勝中)`;
        }
    }

    function triggerShake(sec = 0.2) {
        shakeTimer = sec;
    }

    function updatePlayerMovement(dt) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;

        let dx = 0;
        let dy = 0;

        if (keysPressed['KeyW'] || keysPressed['ArrowUp'] || dpadPressed.up) dy -= 1;
        if (keysPressed['KeyS'] || keysPressed['ArrowDown'] || dpadPressed.down) dy += 1;
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft'] || dpadPressed.left) dx -= 1;
        if (keysPressed['KeyD'] || keysPressed['ArrowRight'] || dpadPressed.right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            const speed = 2.2 * p1.moveSpeed;
            p1.vx += dx * speed;
            p1.vy += dy * speed;
        }
    }

    function resolveRikishiCollisions(dt) {
        const allRikishi = [p1, ...enemies.filter(e => !e.isEliminated)];
        const frameScale = dt * 60;

        for (let i = 0; i < allRikishi.length; i++) {
            for (let j = i + 1; j < allRikishi.length; j++) {
                const r1 = allRikishi[i];
                const r2 = allRikishi[j];

                const dx = r2.x - r1.x;
                const dy = r2.y - r1.y;
                const dist = Math.hypot(dx, dy);
                const minDist = r1.radius + r2.radius;

                if (dist < minDist && dist > 0) {
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const separateFactor = 0.5;
                    r1.x -= nx * overlap * separateFactor;
                    r1.y -= ny * overlap * separateFactor;
                    r2.x += nx * overlap * separateFactor;
                    r2.y += ny * overlap * separateFactor;

                    const bounceForce = 1.8 * frameScale;
                    r1.vx -= nx * bounceForce;
                    r1.vy -= ny * bounceForce;
                    r2.vx += nx * bounceForce;
                    r2.vy += ny * bounceForce;
                }
            }
        }
    }

    function handleBurst(actor) {
        if (gameState !== STATE.PLAYING) return;
        if (actor.burstGauge < 100) return;

        actor.burstGauge = 0;
        updateBurstUI();

        hitStopTimer = 0.25;
        burstCutinEl.classList.remove('hidden');
        setTimeout(() => burstCutinEl.classList.add('hidden'), 900);

        actor.setStateText('極大どすこい！！');
        audio.playMegaBurst();
        triggerShake(0.7);

        speedLinesEl.classList.add('active');
        setTimeout(() => speedLinesEl.classList.remove('active'), 1000);

        enemies.forEach(opponent => {
            if (opponent.isEliminated) return;
            const angle = Math.atan2(opponent.y - actor.y, opponent.x - actor.x);
            opponent.vx += Math.cos(angle) * 55;
            opponent.vy += Math.sin(angle) * 55;
            spawnSparks((actor.x + opponent.x)/2, (actor.y + opponent.y)/2, '#fde047', 45, '超爆破！！');
        });
    }

    function handlePush(actor) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;

        if (actor === p1) {
            totalClicksP1++;
            comboP1++;
            comboTimerP1 = 0.8;
            if (comboP1 > maxComboP1) maxComboP1 = comboP1;

            if (comboP1 % 4 === 0) {
                spawnSparks(p1.x, p1.y - 30, '#7e6b8f', 6, `${comboP1} COMBO!`);
            }
        }

        actor.pushAnim = 1.0;
        triggerShake(0.08);

        if (currentEvent && currentEvent.type === 'chanko') {
            actor.burstGauge = 100;
            updateBurstUI();
            currentEvent = null;
            eventBanner.classList.add('hidden');
            actor.setStateText('ちゃんこ横取り！');
            audio.playMegaBurst();
        }

        const gInc = 6 * actor.gaugeRate;
        actor.burstGauge = Math.min(100, actor.burstGauge + gInc);
        updateBurstUI();

        enemies.forEach(opponent => {
            if (opponent.isEliminated) return;

            const dist = Math.hypot(opponent.x - actor.x, opponent.y - actor.y);
            if (dist < actor.radius + opponent.radius + 40) {
                if (opponent.isDodging) {
                    actor.vx -= (opponent.x - actor.x) * 0.4;
                    actor.vy -= (opponent.y - actor.y) * 0.4;
                    audio.playHit();
                    opponent.setStateText('見切り返し！');
                    triggerShake(0.3);
                    spawnSparks(opponent.x, opponent.y, '#0284c7', 15, '見切り！');
                    return;
                }

                let clutchMult = 1.0;
                if (actor.hasClutchPower && isOutOfDohyo(actor.x, actor.y, 0.75)) {
                    clutchMult = 2.5;
                    actor.setStateText('土俵際パワー！');
                }

                const feverMult = (currentEvent && currentEvent.type === 'fever') ? 2.5 : 1.0;
                const debuff = (opponent.enemyPowerDebuff || 0);
                let pushForce = (3.5 + (actor.currentPower * 0.45)) * (1 - debuff) * clutchMult * feverMult;

                const angle = Math.atan2(opponent.y - actor.y, opponent.x - actor.x);
                opponent.vx += Math.cos(angle) * pushForce;
                opponent.vy += Math.sin(angle) * pushForce;

                audio.playHit();
                spawnSparks(opponent.x, opponent.y, actor.color, 6);
            }
        });
    }

    // 🎮 [プロゲーマー機能] 「はたき」で塩飛び道具を反射（ジャストパリィ！）
    function handleDodge(actor) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;
        
        const successDodge = actor.triggerDodge();

        if (successDodge && actor === p1) {
            // 近隣の塩飛び道具を検索して敵へ打ち返す！
            saltBullets.forEach(b => {
                if (!b.isReflected) {
                    const dist = Math.hypot(p1.x - b.x, p1.y - b.y);
                    if (dist < p1.radius + 60) {
                        b.isReflected = true;
                        
                        // 一番近い敵に向かって跳ね返す！
                        const activeEnemies = enemies.filter(e => !e.isEliminated);
                        const target = activeEnemies[0] || p1;
                        const angle = Math.atan2(target.y - b.y, target.x - b.x);
                        b.vx = Math.cos(angle) * 8.5;
                        b.vy = Math.sin(angle) * 8.5;

                        p1.setStateText('ジャストパリィ！✨');
                        audio.playParry();
                        triggerShake(0.3);
                        spawnSparks(b.x, b.y, '#fde047', 15, 'パリィ！！');
                    }
                }
            });
        }
    }

    function updateBurstUI() {
        if (p1.burstGauge >= 100) {
            btnP1Burst.classList.remove('disabled');
            btnP1Burst.disabled = false;
        } else {
            btnP1Burst.classList.add('disabled');
            btnP1Burst.disabled = true;
        }
    }

    function updateAI(dt) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;

        aiPushTimer += dt;
        enemySaltTimer += dt;

        enemies.forEach(enemy => {
            if (enemy.isEliminated) return;

            const angle = Math.atan2(p1.y - enemy.y, p1.x - enemy.x);
            const speed = 1.2 * enemy.moveSpeed;
            enemy.vx += Math.cos(angle) * speed * 0.5;
            enemy.vy += Math.sin(angle) * speed * 0.5;

            // 敵の塩飛び道具（プロバランス：難易度に応じた発射間隔）
            const saltInterval = (currentRankIdx >= 4) ? 2.0 : 3.0;
            if (enemySaltTimer >= saltInterval) {
                saltBullets.push(new SaltBullet(enemy.x, enemy.y, p1.x, p1.y));
                enemy.setStateText('卑怯な塩投げ！🧂');
                audio.playHit();
            }

            const pushInterval = Math.max(0.08, 0.32 - (enemy.currentPower * 0.02));
            if (aiPushTimer >= pushInterval) {
                const dist = Math.hypot(p1.x - enemy.x, p1.y - enemy.y);
                if (dist < enemy.radius + p1.radius + 35) {
                    if (p1.vx > 6 && Math.random() < 0.2) {
                        enemy.triggerDodge();
                    } else {
                        p1.vx -= Math.cos(angle) * (2.8 + enemy.currentPower * 0.3);
                        p1.vy -= Math.sin(angle) * (2.8 + enemy.currentPower * 0.3);
                        audio.playHit();
                    }
                }
            }
        });

        if (enemySaltTimer >= 3.0) enemySaltTimer = 0;
        if (aiPushTimer >= 0.3) aiPushTimer = 0;
    }

    // 塩飛び道具更新 ＆ 反射判定
    function updateSaltBullets(dt) {
        saltBullets.forEach(b => b.update(dt));

        saltBullets.forEach(b => {
            if (b.isReflected) {
                // 反射弾が敵に当たった場合！
                enemies.forEach(enemy => {
                    if (!enemy.isEliminated) {
                        const dist = Math.hypot(enemy.x - b.x, enemy.y - b.y);
                        if (dist < enemy.radius + b.radius) {
                            b.life = -1;
                            enemy.vx += b.vx * 2.0;
                            enemy.vy += b.vy * 2.0;
                            enemy.setStateText('自爆ノックバック！💥');
                            triggerShake(0.3);
                            audio.playHit();
                            spawnSparks(enemy.x, enemy.y, '#fde047', 16, '反射ヒット！');
                        }
                    }
                });
            } else {
                // 通常弾がプレイヤーに当たった場合
                const dist = Math.hypot(p1.x - b.x, p1.y - b.y);
                if (dist < p1.radius + b.radius) {
                    b.life = -1;
                    p1.vx -= b.vx * 1.5;
                    p1.vy -= b.vy * 1.5;
                    p1.setStateText('目くらまし塩！🧂😵');
                    triggerShake(0.2);
                    audio.playHit();
                    spawnSparks(p1.x, p1.y, '#ffffff', 12, '塩！');
                }
            }
        });

        saltBullets = saltBullets.filter(b => b.life > 0);
    }

    function checkRingOut() {
        if (gameState !== STATE.PLAYING || isMatchFinished) return;

        const p1Out = isOutOfDohyo(p1.x, p1.y);

        enemies.forEach(enemy => {
            if (!enemy.isEliminated && isOutOfDohyo(enemy.x, enemy.y)) {
                enemy.isEliminated = true;
                spawnSparks(enemy.x, enemy.y, '#7e6b8f', 25, 'リングアウト！');
            }
        });

        const activeEnemies = enemies.filter(e => !e.isEliminated);

        if (p1Out) {
            finishMatch(false, '押し出し');
        } else if (enemies.length > 0 && activeEnemies.length === 0) {
            const kimarite = (enemies.length > 1) ? '双子連撃寄り切り' : '寄り切り';
            finishMatch(true, kimarite);
        }
    }

    function isOutOfDohyo(x, y, scale = 1.0) {
        const dx = (x - DOHYO.cx) / (DOHYO.rx * scale);
        const dy = (y - DOHYO.cy) / (DOHYO.ry * scale);
        return (dx * dx + dy * dy) > 1.0;
    }

    function spawnSparks(x, y, color, count = 8, popText = null) {
        if (particles.length > 120) return;

        if (popText) {
            particles.push(new Particle(x, y - 20, 0, -1, color, 0, 0.8, popText));
        }
        for (let i = 0; i < count; i++) {
            if (particles.length >= 120) break;
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
        const colors = ['#7e6b8f', '#b45309', '#0284c7', '#ffffff', '#9333ea'];
        for (let i = 0; i < 80; i++) {
            if (particles.length >= 120) break;
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

        let bg1 = '#faf7fc', bg2 = '#efe8f5';
        if (currentEvent && currentEvent.type === 'ice') {
            bg1 = '#e0f2fe'; bg2 = '#bae6fd';
        } else if (currentEvent && currentEvent.type === 'fever') {
            bg1 = '#fef3c7'; bg2 = '#fde68a';
        }

        const bgGrad = ctx.createRadialGradient(DOHYO.cx, DOHYO.cy, 40, DOHYO.cx, DOHYO.cy, 520);
        bgGrad.addColorStop(0, bg1);
        bgGrad.addColorStop(1, bg2);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 土俵
        ctx.beginPath();
        ctx.ellipse(DOHYO.cx, DOHYO.cy, DOHYO.rx, DOHYO.ry, 0, 0, Math.PI * 2);
        const dohyoGrad = ctx.createRadialGradient(DOHYO.cx, DOHYO.cy, 30, DOHYO.cx, DOHYO.cy, DOHYO.rx);
        
        if (currentEvent && currentEvent.type === 'ice') {
            dohyoGrad.addColorStop(0, '#f0f9ff');
            dohyoGrad.addColorStop(0.85, '#e0f2fe');
            dohyoGrad.addColorStop(1, '#7dd3fc');
        } else {
            dohyoGrad.addColorStop(0, '#fffdfa');
            dohyoGrad.addColorStop(0.85, '#f7eeea');
            dohyoGrad.addColorStop(1, '#efe8f5');
        }
        ctx.fillStyle = dohyoGrad;
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#7e6b8f';
        ctx.stroke();

        // 俵
        ctx.beginPath();
        ctx.ellipse(DOHYO.cx, DOHYO.cy, DOHYO.rx - 10, DOHYO.ry - 5, 0, 0, Math.PI * 2);
        const p1Danger = isOutOfDohyo(p1.x, p1.y, 0.85);

        if (p1Danger) {
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 5;
        } else {
            ctx.strokeStyle = '#7e6b8f';
            ctx.lineWidth = 3;
        }
        ctx.setLineDash([14, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (p1Danger) {
            ctx.font = '700 22px "Zen Maru Gothic", sans-serif';
            ctx.fillStyle = '#dc2626';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ DANGER!', DOHYO.cx, DOHYO.cy - 120);
        }

        // 仕切り線
        ctx.fillStyle = '#7e6b8f';
        ctx.fillRect(DOHYO.cx - 50, DOHYO.cy - 24, 8, 48);
        ctx.fillRect(DOHYO.cx + 42, DOHYO.cy - 24, 8, 48);

        ctx.restore();
    }

    function drawRikishi(rikishi) {
        if (rikishi.isEliminated) return;

        ctx.save();
        const x = rikishi.x;
        const y = rikishi.y;
        const r = rikishi.radius;

        if (rikishi.isDodging) {
            ctx.beginPath();
            ctx.arc(x, y, r + 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(2, 132, 199, 0.3)';
            ctx.fill();
        }

        ctx.beginPath();
        ctx.ellipse(x, y + 25, r * 0.9, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff4e6';
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = rikishi.color;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, r * 0.82, 0.3, Math.PI - 0.3);
        ctx.fillStyle = rikishi.color;
        ctx.fill();

        ctx.font = `${Math.floor(r * 0.8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rikishi.avatar, x, y - 2);

        ctx.font = '700 14px "Zen Maru Gothic", sans-serif';
        ctx.fillStyle = '#2d2633';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 4;
        ctx.fillText(rikishi.name, x, y - r - 14);

        if (rikishi.stateTextTimer > 0) {
            ctx.font = '700 16px "Zen Maru Gothic", sans-serif';
            ctx.fillStyle = '#7e6b8f';
            ctx.fillText(rikishi.stateText, x, y - r - 34);
        }

        ctx.restore();
    }

    function drawAnnounce() {
        if (announceTimer <= 0) return;
        ctx.save();
        ctx.translate(DOHYO.cx, DOHYO.cy - 60);
        ctx.scale(announceScale, announceScale);

        ctx.font = '900 48px "Zen Maru Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#7e6b8f';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.fillText(announceText, 0, 0);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.strokeText(announceText, 0, 0);

        ctx.restore();
    }

    let lastFrameTime = performance.now();

    function gameLoop(now) {
        const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
        lastFrameTime = now;

        if (hitStopTimer > 0) {
            hitStopTimer -= dt;
            requestAnimationFrame(gameLoop);
            return;
        }

        if (gameState === STATE.PLAYING) {
            updatePlayerMovement(dt);

            p1.update(dt);
            enemies.forEach(e => e.update(dt));
            updateSaltBullets(dt);

            resolveRikishiCollisions(dt);

            updateAI(dt);
            checkRingOut();

            if (comboTimerP1 > 0) {
                comboTimerP1 -= dt;
                if (comboTimerP1 <= 0) {
                    comboP1 = 0;
                }
            }

            if (eventTimer > 0) {
                eventTimer -= dt;
                if (eventTimer <= 0) {
                    currentEvent = null;
                    eventBanner.classList.add('hidden');
                }
            }
        }

        if (announceTimer > 0) {
            announceTimer -= dt;
            announceScale = Math.max(1.0, announceScale - dt * 2.8);
        }

        if (shakeTimer > 0) {
            shakeTimer -= dt;
        }

        particles.forEach(p => p.update(dt));
        particles = particles.filter(p => p.life > 0);

        ctx.save();
        if (shakeTimer > 0) {
            const sx = (Math.random() * 8 - 4);
            const sy = (Math.random() * 8 - 4);
            ctx.translate(sx, sy);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawDohyo();
        drawRikishi(p1);
        enemies.forEach(e => drawRikishi(e));
        saltBullets.forEach(b => b.draw(ctx));
        particles.forEach(p => p.draw(ctx));
        drawAnnounce();

        ctx.restore();

        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('DOMContentLoaded', init);

})();
