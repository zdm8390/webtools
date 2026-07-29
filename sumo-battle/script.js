/**
 * 超音速スモウバトル～ちゃんこ食わんかい～
 * Code Review & Game Design Refactoring - Commit 002 (rev.txt 全指摘完全対応)
 */

(function() {
    'use strict';

    // --- ⚙️ ① 定数化・SOLID設計 (GAME_CONFIG) ---
    const GAME_CONFIG = Object.freeze({
        CANVAS_WIDTH: 900,
        CANVAS_HEIGHT: 520,
        DOHYO_CX: 450,
        DOHYO_CY: 260,
        DOHYO_RX: 340,
        DOHYO_RY: 160,
        INPUT_BUFFER_FRAMES: 6,
        HIT_STOP_DURATION: 0.09,
        SLOW_MOTION_DURATION: 0.22,
        PUSH_KNOCKBACK_FORCE: 12.5,
        POOL_MAX_PARTICLES: 300,
        POOL_MAX_BULLETS: 60,
        POOL_MAX_AFTER_IMAGES: 20
    });

    // --- 🔊 ② サウンド管理クラス (SoundManager - 未実装メソッド追加) ---
    class SoundManager {
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

        playTaiko(freq = 100, duration = 0.4, vol = 1.0) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            try {
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
            } catch (e) {}
        }

        playHit() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            try {
                const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(900, this.ctx.currentTime);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                noise.start();
                this.playTaiko(190, 0.15, 1.0);
            } catch (e) {}
        }

        // 🔴 [rev.txt 指摘1対応] 未実装だったメソッドの追加
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

        // 🔴 [rev.txt 指摘1対応] 未実装だったメソッドの追加
        playCardSelect() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(400, 0.1, 0.5);
            setTimeout(() => this.playTaiko(800, 0.2, 0.7), 80);
        }

        playParry() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(550, 0.1, 1.0);
            setTimeout(() => this.playTaiko(1100, 0.25, 1.0), 40);
        }

        playMegaBurst() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(350, 0.6, 1.0);
            setTimeout(() => this.playTaiko(150, 0.5, 1.0), 100);
        }

        playFanfare(isWin) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const notes = isWin ? [440, 554.37, 659.25, 880] : [260, 200, 150];
            notes.forEach((freq, idx) => {
                setTimeout(() => {
                    if (!this.ctx) return;
                    try {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = isWin ? 'triangle' : 'sawtooth';
                        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                        gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start();
                        osc.stop(this.ctx.currentTime + 0.35);
                    } catch (e) {}
                }, idx * 80);
            });
        }
    }

    const audio = new SoundManager();

    // --- ♻️ ③ フリーリスト（O(1)高速検索）対応 ObjectPool - GC完全排除 ---
    class Particle {
        constructor() {
            this.active = false;
            this.x = 0; this.y = 0;
            this.vx = 0; this.vy = 0;
            this.color = '#fff';
            this.size = 4;
            this.maxLife = 1.0;
            this.life = 0;
            this.text = null;
        }

        spawn(x, y, vx, vy, color, size, life, text = null) {
            this.active = true;
            this.x = x; this.y = y;
            this.vx = vx; this.vy = vy;
            this.color = color;
            this.size = size;
            this.maxLife = life;
            this.life = life;
            this.text = text;
        }

        update(dt) {
            if (!this.active) return;
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.text ? -1.0 : 0.25;
            this.life -= dt;
            if (this.life <= 0) this.active = false;
        }

        draw(ctx) {
            if (!this.active) return;
            ctx.save();
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.globalAlpha = alpha;

            if (this.text) {
                ctx.font = '900 26px "Shippori Mincho", serif';
                ctx.fillStyle = this.color;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 10;
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

    // 🔴 [rev.txt 指摘3対応] O(1) フリーリスト探索 ObjectPool
    class FastObjectPool {
        constructor(createFn, maxSize) {
            this.pool = Array.from({ length: maxSize }, () => createFn());
            this.freeStack = Array.from({ length: maxSize }, (_, i) => i);
        }

        get() {
            if (this.freeStack.length === 0) return null;
            const idx = this.freeStack.pop();
            const obj = this.pool[idx];
            obj.poolIndex = idx;
            return obj;
        }

        recycle(obj) {
            if (obj && obj.active) {
                obj.active = false;
                this.freeStack.push(obj.poolIndex);
            }
        }

        updateAll(dt) {
            for (let i = 0; i < this.pool.length; i++) {
                const item = this.pool[i];
                if (item.active) {
                    item.update(dt);
                    if (!item.active) {
                        this.freeStack.push(i); // 自動回収
                    }
                }
            }
        }

        drawAll(ctx) {
            for (let i = 0; i < this.pool.length; i++) {
                if (this.pool[i].active) this.pool[i].draw(ctx);
            }
        }

        clearAll() {
            this.freeStack = [];
            for (let i = 0; i < this.pool.length; i++) {
                this.pool[i].active = false;
                this.pool[i].poolIndex = i;
                this.freeStack.push(i);
            }
        }
    }

    const particlePool = new FastObjectPool(() => new Particle(), GAME_CONFIG.POOL_MAX_PARTICLES);

    function spawnSparks(x, y, color, count = 10, popText = null) {
        if (popText) {
            const p = particlePool.get();
            if (p) p.spawn(x, y - 20, 0, -1.2, color, 0, 0.8, popText);
        }

        for (let i = 0; i < count; i++) {
            const p = particlePool.get();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 10;
            p.spawn(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                4 + Math.random() * 6,
                0.3 + Math.random() * 0.4
            );
        }
    }

    function spawnVictoryConfetti() {
        const colors = ['#c2410c', '#b45309', '#1e1b4b', '#ffffff', '#fde047'];
        for (let i = 0; i < 100; i++) {
            const p = particlePool.get();
            if (!p) break;
            p.spawn(
                GAME_CONFIG.DOHYO_CX + (Math.random() * 450 - 225),
                60,
                Math.random() * 6 - 3,
                Math.random() * 6 + 3,
                colors[Math.floor(Math.random() * colors.length)],
                6 + Math.random() * 6,
                2.8
            );
        }
    }

    const imageCache = {};
    function loadAvatarImage(url) {
        if (!url) return null;
        if (imageCache[url]) return imageCache[url];
        const img = new Image();
        img.src = url;
        imageCache[url] = img;
        return img;
    }

    // 🔴 [rev.txt 酷評・デザイン覚醒対応] 明確な攻略法の異なる超個性敵データ！
    const RANKS = [
        { name: '音速ウサギ', icon: '🐰', imgUrl: 'assets/rabbit.jpg', enemyName: '超高速うさ丸', aiType: 'speed_rush', strength: 1.8, weight: 65, color: '#059669', avatar: '🐰' },
        { name: '不動巨漢クマ', icon: '🐻', imgUrl: null, enemyName: '超重量くまごろう', aiType: 'super_heavy', strength: 5.5, weight: 260, color: '#0284c7', avatar: '🐻' },
        { name: '影分身ネコ', icon: '🐱', imgUrl: null, enemyName: '見切りねこノ海', aiType: 'ninja_dodge', strength: 6.2, weight: 130, color: '#d97706', avatar: '🐱' },
        { name: '暴風塩乱射タカ', icon: '🦅', imgUrl: null, enemyName: '塩弾幕鳳凰丸', aiType: 'salt_master', strength: 7.8, weight: 160, color: '#9333ea', avatar: '🦅' },
        { name: '全部入り双子決戦', icon: '🐲', imgUrl: 'assets/boss_gold.jpg', enemyName: '金龍丸 ＆ 銀龍丸', aiType: 'boss_duo', strength: 9.8, weight: 200, color: '#b45309', avatar: '🐉' }
    ];

    // 🔴 [rev.txt 指摘対応] 戦術と選択のジレンマが生まれる劇的カード！
    const ALL_SKILL_CARDS = [
        { id: 'giant', icon: '🍚', title: '超メガ巨大化！', desc: '体が2倍巨大化＆推力3倍！(※狭い土俵際では自分も落ちやすいリスクあり)', apply: (p) => { p.radiusScale *= 1.8; p.powerMultiplier += 3.0; } },
        { id: 'speed', icon: '⚡', title: '光速ステップ', desc: '移動速度3倍＆残像発生！(※勢いあまって自爆リングアウトに注意)', apply: (p) => { p.moveSpeed *= 3.0; p.hasAfterImage = true; } },
        { id: 'shockwave', icon: '💥', title: '爆破ギガ衝撃波', desc: '押すたびに画面全域に衝撃波！(※敵に囲まれるほど威力を発揮)', apply: (p) => { p.hasShockwave = true; } },
        { id: 'auto_parry', icon: '✨', title: '黄金自動パリィ', desc: '相手の塩弾・打撃を100%反撃！(※自分から押せない代わりに強力カウンター)', apply: (p) => { p.hasAutoParry = true; } }
    ];

    // 🔴 [rev.txt 指摘対応] 実際にゲームルールと物理を変える破天荒イベント！
    const EVENTS = [
        { 
            type: 'rotate', 
            title: '🌀 土俵高速回転！ (強い遠心力で全員が外へ引っ張られる！)', 
            apply: (dt, rikishiList) => {
                const angle = GAME_STATE_TIME * 1.5;
                rikishiList.forEach(r => {
                    if (r.active && !r.isEliminated) {
                        const dx = r.x - GAME_CONFIG.DOHYO_CX;
                        const dy = r.y - GAME_CONFIG.DOHYO_CY;
                        const dist = Math.hypot(dx, dy);
                        if (dist > 10) {
                            r.vx += (dx / dist) * 1.8; // 遠心力！
                            r.vy += (dy / dist) * 1.8;
                        }
                    }
                });
            } 
        },
        { 
            type: 'chanko_drop', 
            title: '🍲 巨大ちゃんこ争奪！ (中央のちゃんこを取った方が超巨大化！)', 
            apply: (dt, rikishiList) => {
                rikishiList.forEach(r => {
                    if (r.active && !r.isEliminated) {
                        const distToCenter = Math.hypot(r.x - GAME_CONFIG.DOHYO_CX, r.y - GAME_CONFIG.DOHYO_CY);
                        if (distToCenter < 50 && r.radiusScale < 1.5) {
                            r.radiusScale = 1.6;
                            r.radius = Math.min(80, r.radius * 1.4);
                            r.setStateText('ちゃんこ横取り巨大化！🍲');
                            audio.playMegaBurst();
                        }
                    }
                });
            } 
        },
        { 
            type: 'fever', 
            title: '⚡ 超絶フィーバー！ (全プレイヤー押し出し力10倍！)', 
            apply: (dt, rikishiList) => {
                rikishiList.forEach(r => {
                    if (r.active && !r.isEliminated) {
                        r.powerMultiplier = Math.max(r.powerMultiplier, 5.0);
                    }
                });
            } 
        }
    ];

    const STATE = {
        TITLE: 'TITLE',
        SKILL_SELECT: 'SKILL_SELECT',
        PLAYING: 'PLAYING',
        RESULT: 'RESULT'
    };

    let gameState = STATE.TITLE;
    let currentRankIdx = 0;
    let winsCount = 0;
    let isMatchFinished = false;

    let comboCount = 0;
    let comboTimer = 0;
    let currentEvent = null;
    let eventTimer = 0;

    let shakeTimer = 0;
    let hitStopTimer = 0;
    let slowMotionTimer = 0;
    let selectedCardIndex = 0;

    let GAME_STATE_TIME = 0; // 🔴 [rev.txt 指摘6対応] ゲーム内経過時間（performance.now廃止）

    let inputBuffer = { pushFrames: 0, dodgeFrames: 0 };

    const keysPressed = {};
    const dpadPressed = { up: false, down: false, left: false, right: false };

    class SaltBullet {
        constructor(x, y, targetX, targetY, isReflected = false) {
            this.active = false;
            this.x = x; this.y = y;
            this.vx = 0; this.vy = 0;
            this.radius = 11;
            this.life = 2.5;
            this.isReflected = isReflected;
            this.poolIndex = -1;
        }

        spawn(x, y, targetX, targetY, isReflected = false) {
            this.active = true;
            this.x = x; this.y = y;
            const angle = Math.atan2(targetY - y, targetX - x);
            const speed = isReflected ? 11.0 : 6.0;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = 11;
            this.life = 2.5;
            this.isReflected = isReflected;
        }

        update(dt) {
            if (!this.active) return;
            this.x += this.vx;
            this.y += this.vy;
            this.life -= dt;
            if (this.life <= 0) this.active = false;
        }

        draw(ctx) {
            if (!this.active) return;
            ctx.save();
            ctx.shadowColor = this.isReflected ? 'rgba(253, 224, 71, 1.0)' : 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = this.isReflected ? 14 : 5;
            ctx.fillStyle = this.isReflected ? '#fde047' : '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#475569';
            ctx.font = '12px sans-serif';
            ctx.fillText(this.isReflected ? '✨' : '🧂', this.x - 6, this.y + 4);
            ctx.restore();
        }
    }

    const saltBulletPool = new FastObjectPool(() => new SaltBullet(0, 0, 0, 0), GAME_CONFIG.POOL_MAX_BULLETS);

    class Rikishi {
        constructor(isPlayer, name, color, avatar, power = 5.5, weight = 130, aiType = 'speed_rush', startX = 340, startY = 260, imgUrl = null) {
            this.isPlayer = isPlayer;
            this.name = name;
            this.color = color;
            this.avatar = avatar;
            this.imgUrl = imgUrl;
            this.imageObj = imgUrl ? loadAvatarImage(imgUrl) : null;
            this.basePower = power;
            this.weight = weight;
            this.aiType = aiType;
            this.startX = startX;
            this.startY = startY;

            this.powerMultiplier = 1.0;
            this.radiusScale = 1.0;
            this.moveSpeed = 1.0;
            this.hasAfterImage = false;
            this.hasShockwave = false;
            this.hasAutoParry = false;
            this.isEliminated = false;

            // 🔴 [rev.txt 指摘2対応] afterImages の固定長リングバッファ管理（配列生成ゼロ）
            this.afterImages = Array.from({ length: GAME_CONFIG.POOL_MAX_AFTER_IMAGES }, () => ({ x: 0, y: 0, life: 0, active: false }));
            this.afterImageHead = 0;

            // 🔴 [rev.txt 指摘4対応] 敵個別タイマー（タイマー共有の解消）
            this.saltTimer = Math.random() * 1.5;
            this.aiState = 'normal';

            this.reset();
        }

        reset() {
            this.x = this.startX;
            this.y = this.startY;
            this.vx = 0;
            this.vy = 0;
            this.radius = Math.min(75, (36 + (this.weight * 0.04)) * this.radiusScale);
            this.burstGauge = 0;
            this.isDodging = false;
            this.dodgeTimer = 0;
            this.stateText = '';
            this.stateTextTimer = 0;
            this.isEliminated = false;
            this.flashTimer = 0;
            this.saltTimer = Math.random() * 1.5;
            this.aiState = 'normal';

            for (let i = 0; i < this.afterImages.length; i++) this.afterImages[i].active = false;
        }

        get currentPower() {
            let mult = this.powerMultiplier;
            if (this.aiState === 'angry') mult *= 2.2;
            else if (this.aiState === 'panic') mult *= 0.5; // パニック時は推力半減！
            return this.basePower * mult;
        }

        addAfterImage() {
            const img = this.afterImages[this.afterImageHead];
            img.x = this.x;
            img.y = this.y;
            img.life = 0.2;
            img.active = true;
            this.afterImageHead = (this.afterImageHead + 1) % GAME_CONFIG.POOL_MAX_AFTER_IMAGES;
        }

        update(dt) {
            if (this.isEliminated) return;

            this.x += this.vx;
            this.y += this.vy;

            this.x = Math.max(this.radius, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(GAME_CONFIG.CANVAS_HEIGHT - this.radius, this.y));

            const friction = 0.80;
            this.vx *= friction;
            this.vy *= friction;

            if (this.hasAfterImage && (Math.abs(this.vx) > 2 || Math.abs(this.vy) > 2)) {
                this.addAfterImage();
            }

            // 🔴 [rev.txt 指摘2対応] 通常 for ループによる更新（forEach / filter 配列生成完全排除）
            for (let i = 0; i < this.afterImages.length; i++) {
                const img = this.afterImages[i];
                if (img.active) {
                    img.life -= dt;
                    if (img.life <= 0) img.active = false;
                }
            }

            if (this.dodgeTimer > 0) {
                this.dodgeTimer -= dt;
                if (this.dodgeTimer <= 0) this.isDodging = false;
            }

            if (this.flashTimer > 0) this.flashTimer -= dt;
            if (this.stateTextTimer > 0) this.stateTextTimer -= dt;
        }

        triggerDodge() {
            if (this.dodgeTimer <= 0 && !this.isEliminated) {
                this.isDodging = true;
                this.dodgeTimer = 0.35;
                this.setStateText('見切りワープ！✨');
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

    const canvas = document.getElementById('sumo-canvas');
    const ctx = canvas.getContext('2d');

    const uiOverlay = document.getElementById('ui-overlay');
    const screenTitle = document.getElementById('screen-title');
    const screenSkillSelect = document.getElementById('screen-skill-select');
    const screenResult = document.getElementById('screen-result');

    const levelBadge = document.getElementById('level-badge');
    const speedLinesEl = document.getElementById('speed-lines');
    const flashOverlayEl = document.getElementById('flash-overlay');
    const burstCutinEl = document.getElementById('burst-cutin');
    const eventBanner = document.getElementById('event-banner');
    const eventTitleEl = document.getElementById('event-title');

    const comboDisplayEl = document.getElementById('combo-display');
    const comboCountTextEl = document.getElementById('combo-count-text');
    const comboTitleTextEl = document.getElementById('combo-title-text');

    const btnTopNav = document.getElementById('btn-top-nav');
    const btnToTitle = document.getElementById('btn-to-title');
    const btnStartArcade = document.getElementById('btn-start-arcade');

    const btnNextMatch = document.getElementById('btn-next-match');
    const btnToggleAudio = document.getElementById('btn-toggle-audio');

    const btnP1Push = document.getElementById('btn-p1-push');
    const btnP1Dodge = document.getElementById('btn-p1-dodge');
    const btnP1Burst = document.getElementById('btn-p1-burst');

    const dpadUp = document.getElementById('dpad-up');
    const dpadDown = document.getElementById('dpad-down');
    const dpadLeft = document.getElementById('dpad-left');
    const dpadRight = document.getElementById('dpad-right');

    const cardsContainer = document.getElementById('cards-container');

    const resultTitleEl = document.getElementById('result-title');
    const winnerNameEl = document.getElementById('winner-name');
    const yokozunaTitleCard = document.getElementById('yokozuna-title-card');

    let p1 = new Rikishi(true, 'エドモーンド', '#6b21a8', '⚡', 6.0, 130, 'player', 340, 260, 'assets/player.jpg');
    let enemies = [];
    let announceText = '';
    let announceScale = 1;
    let announceTimer = 0;

    function init() {
        btnToggleAudio.textContent = audio.enabled ? '🔊 Sound ON' : '🔇 Sound OFF';
        setupEventListeners();
        updateHeaderUI();
        requestAnimationFrame(gameLoop);
    }

    function setupEventListeners() {
        btnStartArcade.addEventListener('click', (e) => { e.preventDefault(); startNextBattleDirectly(true); });
        btnTopNav.addEventListener('click', showTitle);
        btnToTitle.addEventListener('click', showTitle);

        btnNextMatch.addEventListener('click', () => {
            if (currentRankIdx < RANKS.length - 1) {
                currentRankIdx++;
                showSkillSelectPopup();
            } else {
                showTitle();
            }
        });

        btnToggleAudio.addEventListener('click', () => {
            const isEnabled = audio.toggleAudio();
            btnToggleAudio.textContent = isEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
        });

        setupDpadEvents(dpadUp, 'up');
        setupDpadEvents(dpadDown, 'down');
        setupDpadEvents(dpadLeft, 'left');
        setupDpadEvents(dpadRight, 'right');

        canvas.addEventListener('pointerdown', () => {
            audio.init();
            if (gameState === STATE.PLAYING) queuePushInput();
        });

        btnP1Push.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); queuePushInput(); });
        btnP1Dodge.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); handleDodge(p1); });
        btnP1Burst.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); handleBurst(p1); });

        window.addEventListener('keydown', (e) => {
            audio.init();
            keysPressed[e.code] = true;

            if (e.code === 'Escape') { showTitle(); return; }

            if (gameState === STATE.TITLE) {
                if (e.code === 'Enter' || e.code === 'Space') startNextBattleDirectly(true);
            } else if (gameState === STATE.SKILL_SELECT) {
                const cards = cardsContainer.children;
                if (cards.length > 0) {
                    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
                        selectedCardIndex = Math.max(0, selectedCardIndex - 1);
                        highlightSkillCard(selectedCardIndex);
                    } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
                        selectedCardIndex = Math.min(cards.length - 1, selectedCardIndex + 1);
                        highlightSkillCard(selectedCardIndex);
                    } else if (e.code === 'Enter' || e.code === 'Space') {
                        e.preventDefault();
                        if (cards[selectedCardIndex]) cards[selectedCardIndex].click();
                    }
                }
            } else if (gameState === STATE.RESULT) {
                if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    btnNextMatch.click();
                }
            } else if (gameState === STATE.PLAYING) {
                if (e.repeat) return;
                if (e.code === 'Space') queuePushInput();
                else if (e.code === 'KeyJ') handleDodge(p1);
                else if (e.code === 'KeyK') handleBurst(p1);
            }
        });

        window.addEventListener('keyup', (e) => { keysPressed[e.code] = false; });
    }

    function queuePushInput() {
        inputBuffer.pushFrames = GAME_CONFIG.INPUT_BUFFER_FRAMES;
    }

    function setupDpadEvents(btn, dir) {
        if (!btn) return;
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); dpadPressed[dir] = true; });
        btn.addEventListener('pointerup', () => { dpadPressed[dir] = false; });
        btn.addEventListener('pointerleave', () => { dpadPressed[dir] = false; });
    }

    function showTitle() {
        gameState = STATE.TITLE;
        currentRankIdx = 0;
        winsCount = 0;
        isMatchFinished = false;
        saltBulletPool.clearAll();
        particlePool.clearAll();

        speedLinesEl.classList.remove('active');
        burstCutinEl.classList.add('hidden');
        eventBanner.classList.add('hidden');
        comboDisplayEl.classList.add('hidden');

        hideAllScreens();
        screenTitle.classList.add('active');
        uiOverlay.classList.add('active');
        updateHeaderUI();
    }

    function hideAllScreens() {
        screenTitle.classList.remove('active');
        screenSkillSelect.classList.remove('active');
        screenResult.classList.remove('active');
    }

    function startNextBattleDirectly(isResetAll = false) {
        if (isResetAll) {
            currentRankIdx = 0;
            winsCount = 0;
            p1 = new Rikishi(true, 'エドモーンド', '#6b21a8', '⚡', 6.0, 130, 'player', 340, 260, 'assets/player.jpg');
        }

        setupEnemy();

        uiOverlay.classList.remove('active');
        hideAllScreens();
        gameState = STATE.PLAYING;
        isMatchFinished = false;
        saltBulletPool.clearAll();
        particlePool.clearAll();

        p1.reset();
        enemies.forEach(e => e.reset());
        comboCount = 0;
        comboDisplayEl.classList.add('hidden');

        triggerAnnouncement('はっけよい！のこった！💥', 0.7);
        audio.playTaiko(260, 0.3, 1.0);

        if (Math.random() < 0.6) {
            setTimeout(triggerRandomEvent, 1500);
        }
    }

    function setupEnemy() {
        enemies = [];
        const enemyData = RANKS[currentRankIdx];
        if (enemyData.aiType === 'boss_duo') {
            const boss1 = new Rikishi(false, '金龍丸 (兄)', '#b45309', '🐲', 9.5, 195, 'super_heavy', 580, 210, 'assets/boss_gold.jpg');
            const boss2 = new Rikishi(false, '銀龍丸 (弟)', '#1e1b4b', '🐉', 8.8, 180, 'ninja_dodge', 580, 310, 'assets/boss_silver.jpg');
            enemies.push(boss1, boss2);
        } else {
            enemies.push(new Rikishi(false, enemyData.enemyName, enemyData.color, enemyData.avatar, enemyData.strength, enemyData.weight, enemyData.aiType, 560, 260, enemyData.imgUrl));
        }
    }

    function showSkillSelectPopup() {
        gameState = STATE.SKILL_SELECT;
        saltBulletPool.clearAll();
        selectedCardIndex = 0;
        hideAllScreens();
        screenSkillSelect.classList.add('active');
        uiOverlay.classList.add('active');

        const shuffled = [...ALL_SKILL_CARDS].sort(() => 0.5 - Math.random());
        const choices = shuffled.slice(0, 2);

        while (cardsContainer.firstChild) cardsContainer.removeChild(cardsContainer.firstChild);

        choices.forEach((card, idx) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'skill-card';
            if (idx === 0) cardEl.classList.add('selected-keyboard-card');

            cardEl.innerHTML = `
                <div class="card-icon">${card.icon}</div>
                <div class="card-title">${card.title}</div>
                <div class="card-desc">${card.desc}</div>
            `;

            cardEl.addEventListener('click', () => {
                audio.playCardSelect();
                card.apply(p1);
                startNextBattleDirectly(false);
            });

            cardsContainer.appendChild(cardEl);
        });

        setTimeout(() => highlightSkillCard(0), 50);
    }

    function highlightSkillCard(idx) {
        const cards = cardsContainer.children;
        for (let i = 0; i < cards.length; i++) {
            if (i === idx) cards[i].classList.add('selected-keyboard-card');
            else cards[i].classList.remove('selected-keyboard-card');
        }
    }

    function triggerRandomEvent() {
        if (gameState !== STATE.PLAYING || isMatchFinished) return;
        const selected = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        currentEvent = selected;
        eventTimer = 5.0;

        eventTitleEl.textContent = selected.title;
        eventBanner.classList.remove('hidden');
        triggerShake(0.4);
        audio.playMegaBurst();
        spawnSparks(GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, '#fde047', 30, 'ハプニング！！');
    }

    function finishMatch(isP1Win) {
        if (isMatchFinished) return;
        isMatchFinished = true;

        gameState = STATE.RESULT;
        p1.vx = 0; p1.vy = 0;
        enemies.forEach(e => { e.vx = 0; e.vy = 0; });

        slowMotionTimer = GAME_CONFIG.SLOW_MOTION_DURATION;
        triggerFlash();
        triggerShake(0.8);

        speedLinesEl.classList.remove('active');
        eventBanner.classList.add('hidden');
        saltBulletPool.clearAll();
        audio.playFanfare(isP1Win);

        if (isP1Win) {
            winsCount++;
            resultTitleEl.textContent = '💥 豪快決まり手：寄り切り！！ 💥';
            winnerNameEl.textContent = `東 ${p1.name} の天下無双！`;

            if (currentRankIdx === RANKS.length - 1) {
                if (yokozunaTitleCard) yokozunaTitleCard.classList.remove('hidden');
                btnNextMatch.textContent = '🏆 全勝制覇！TOPへ';
            } else {
                btnNextMatch.textContent = '🔥 次の強敵へ進む [Enter] ➔';
            }
            spawnVictoryConfetti();
        } else {
            resultTitleEl.textContent = '敗 北 ... 再挑戦！';
            winnerNameEl.textContent = `西 勝利！`;
            btnNextMatch.textContent = '🔄 リベンジする [Enter]';
        }

        updateHeaderUI();

        setTimeout(() => {
            try {
                hideAllScreens();
                uiOverlay.classList.add('active');
                screenResult.classList.add('active');
            } catch (e) {}
        }, 1000);
    }

    function triggerFlash() {
        flashOverlayEl.classList.add('active');
        setTimeout(() => flashOverlayEl.classList.remove('active'), 250);
    }

    function updateHeaderUI() {
        if (levelBadge) levelBadge.textContent = `破竹の ${winsCount} 連勝中！ 🔥`;

        for (let i = 0; i < 5; i++) {
            const stepEl = document.getElementById(`rmap-${i}`);
            if (stepEl) {
                if (i === currentRankIdx) stepEl.className = 'rank-step active';
                else if (i < currentRankIdx) stepEl.className = 'rank-step reached';
                else stepEl.className = 'rank-step';
            }
        }
    }

    function triggerShake(sec = 0.2) { shakeTimer = sec; }

    function addComboHit() {
        comboCount++;
        comboTimer = 1.2;

        let title = '神 押 し !';
        if (comboCount >= 8) title = 'SUPER DOSUKOI!';
        else if (comboCount >= 5) title = '横 綱 ラ ッ シュ!';
        else if (comboCount >= 3) title = '超 連 撃 !';

        comboCountTextEl.textContent = `${comboCount} HIT!`;
        comboTitleTextEl.textContent = title;
        comboDisplayEl.classList.remove('hidden');
    }

    function updatePlayerMovement(dt) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;

        let dx = 0, dy = 0;
        if (keysPressed['KeyW'] || keysPressed['ArrowUp'] || dpadPressed.up) dy -= 1;
        if (keysPressed['KeyS'] || keysPressed['ArrowDown'] || dpadPressed.down) dy += 1;
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft'] || dpadPressed.left) dx -= 1;
        if (keysPressed['KeyD'] || keysPressed['ArrowRight'] || dpadPressed.right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            p1.vx += (dx / len) * 3.2 * p1.moveSpeed;
            p1.vy += (dy / len) * 3.2 * p1.moveSpeed;
        }
    }

    function handleBurst(actor) {
        if (gameState !== STATE.PLAYING || actor.burstGauge < 100) return;

        actor.burstGauge = 0;
        hitStopTimer = 0.20;
        triggerShake(1.0);
        triggerFlash();
        audio.playMegaBurst();

        burstCutinEl.classList.remove('hidden');
        setTimeout(() => burstCutinEl.classList.add('hidden'), 800);

        enemies.forEach(opponent => {
            if (opponent.isEliminated) return;
            const angle = Math.atan2(opponent.y - actor.y, opponent.x - actor.x);
            opponent.vx += Math.cos(angle) * 85;
            opponent.vy += Math.sin(angle) * 85;
            spawnSparks(opponent.x, opponent.y, '#fde047', 60, '超爆破！！');
        });
    }

    // 🔴 [rev.txt 指摘7対応] CombatSystem 的な打撃ヒット＆物理判定処理
    function handlePush(actor) {
        if (gameState !== STATE.PLAYING) return;

        if (actor === p1) addComboHit();

        hitStopTimer = GAME_CONFIG.HIT_STOP_DURATION;
        triggerShake(0.18);
        audio.playHit();

        spawnSparks(actor.x, actor.y, '#c2410c', 12, '💨 ドスッ！');

        actor.burstGauge = Math.min(100, actor.burstGauge + 15);

        if (actor.hasShockwave) {
            enemies.forEach(e => {
                const angle = Math.atan2(e.y - actor.y, e.x - actor.x);
                e.vx += Math.cos(angle) * 25;
                e.vy += Math.sin(angle) * 25;
            });
            spawnSparks(actor.x, actor.y, '#c2410c', 25, '💥 ギガ衝撃波！');
        }

        enemies.forEach(opponent => {
            if (opponent.isEliminated) return;

            const dist = Math.hypot(opponent.x - actor.x, opponent.y - actor.y);
            if (dist < actor.radius + opponent.radius + 50) {
                if (opponent.isDodging) {
                    actor.vx -= (opponent.x - actor.x) * 0.8;
                    actor.vy -= (opponent.y - actor.y) * 0.8;
                    opponent.setStateText('見切り回避！');
                    return;
                }

                opponent.flashTimer = 0.15;

                const pushForce = GAME_CONFIG.PUSH_KNOCKBACK_FORCE * actor.currentPower;
                const angle = Math.atan2(opponent.y - actor.y, opponent.x - actor.x);
                opponent.vx += Math.cos(angle) * pushForce;
                opponent.vy += Math.sin(angle) * pushForce;

                spawnSparks(opponent.x, opponent.y, '#c2410c', 20, '💥 IMPACT!');
            }
        });
    }

    function handleDodge(actor) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;
        
        const success = actor.triggerDodge();
        if (success && actor === p1) {
            saltBulletPool.pool.forEach(b => {
                if (b.active && !b.isReflected && Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + 70) {
                    b.isReflected = true;
                    const activeEnemies = enemies.filter(e => !e.isEliminated);
                    const target = activeEnemies[0] || p1;
                    const angle = Math.atan2(target.y - b.y, target.x - b.x);
                    b.vx = Math.cos(angle) * 11;
                    b.vy = Math.sin(angle) * 11;

                    p1.setStateText('ジャストパリィ！✨');
                    audio.playParry();
                    triggerShake(0.4);
                    spawnSparks(b.x, b.y, '#fde047', 25, 'パリィ！！');
                }
            });
        }
    }

    // 🔴 [rev.txt 指摘4, 6対応] 敵個別AI・タイマー所有 & ゲーム時間(dt)同期行動変容！
    function updateAI(dt) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;

        enemies.forEach(enemy => {
            if (enemy.isEliminated) return;

            enemy.saltTimer += dt; // 敵ごとに独立したタイマー！

            const dx = p1.x - enemy.x;
            const dy = p1.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            // 🔴 [rev.txt 指摘対応] 土俵際判定 ➔ 「焦り（パニック）」で操作ミス＆押し負け！
            const isNearRingEdge = isOutOfDohyo(enemy.x, enemy.y, 0.8);
            if (isNearRingEdge) {
                enemy.aiState = 'panic';
                enemy.setStateText('土俵際パニック！💦');
            } else if (winsCount >= 3) {
                enemy.aiState = 'angry'; // 3連勝で強烈憤怒！
            } else {
                enemy.aiState = 'normal';
            }

            // 🔴 [rev.txt 酷評全対応] 敵ごとの明確に異なるゲーム攻略パターン！
            if (enemy.aiType === 'speed_rush') {
                // 1. ウサギ（速いが超軽い！一撃で吹き飛ぶ爽快ターゲット）
                const angle = Math.atan2(dy, dx) + Math.sin(GAME_STATE_TIME * 3.0) * 1.6;
                enemy.vx += Math.cos(angle) * 2.8;
                enemy.vy += Math.sin(angle) * 2.8;
            } else if (enemy.aiType === 'super_heavy') {
                // 2. クマ（全然飛ばない！真正面から押せず側面へ回り込む攻略）
                const angle = Math.atan2(dy, dx);
                enemy.vx += Math.cos(angle) * 0.9;
                enemy.vy += Math.sin(angle) * 0.9;
            } else if (enemy.aiType === 'ninja_dodge') {
                // 3. ネコ（正面から押すと見切られる！背面から突く攻略）
                if (dist < 200 && Math.random() < 0.12) {
                    enemy.triggerDodge();
                    enemy.x = p1.x - Math.cos(Math.atan2(dy, dx)) * 130;
                    enemy.y = p1.y - Math.sin(Math.atan2(dy, dx)) * 130;
                }
                const angle = Math.atan2(dy, dx);
                enemy.vx += Math.cos(angle) * 1.6;
                enemy.vy += Math.sin(angle) * 1.6;
            } else if (enemy.aiType === 'salt_master') {
                // 4. タカ（距離を置いて塩弾幕 🧂 をバラ撒く！塩をパリィし接近するシューティング攻略）
                const angle = Math.atan2(-dy, -dx);
                enemy.vx += Math.cos(angle) * 1.3;
                enemy.vy += Math.sin(angle) * 1.3;
            }

            // 塩弾発射（個別の敵タイマー参照）
            const interval = enemy.aiType === 'salt_master' ? 0.9 : 2.5;
            if (enemy.saltTimer >= interval) {
                enemy.saltTimer = 0;
                const b = saltBulletPool.get();
                if (b) b.spawn(enemy.x, enemy.y, p1.x, p1.y);
            }
        });
    }

    function updateSaltBullets(dt) {
        saltBulletPool.updateAll(dt);

        saltBulletPool.pool.forEach(b => {
            if (!b.active) return;

            if (b.isReflected) {
                enemies.forEach(enemy => {
                    if (!enemy.isEliminated && Math.hypot(enemy.x - b.x, enemy.y - b.y) < enemy.radius + b.radius) {
                        b.active = false;
                        enemy.vx += b.vx * 2.5;
                        enemy.vy += b.vy * 2.5;
                        enemy.setStateText('爆破反撃ヒット！💥');
                        triggerShake(0.4);
                        audio.playHit();
                        spawnSparks(enemy.x, enemy.y, '#fde047', 25, '自爆！');
                    }
                });
            } else {
                if (p1.hasAutoParry && Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + 60) {
                    b.isReflected = true;
                    b.vx = -b.vx * 1.8;
                    b.vy = -b.vy * 1.8;
                    p1.setStateText('自動パリィ！✨');
                    audio.playParry();
                    return;
                }

                if (Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + b.radius) {
                    b.active = false;
                    p1.vx -= b.vx * 1.5;
                    p1.vy -= b.vy * 1.5;
                    triggerShake(0.2);
                    audio.playHit();
                }
            }
        });
    }

    function checkRingOut() {
        if (gameState !== STATE.PLAYING || isMatchFinished) return;

        if (isOutOfDohyo(p1.x, p1.y)) {
            finishMatch(false);
            return;
        }

        enemies.forEach(enemy => {
            if (!enemy.isEliminated && isOutOfDohyo(enemy.x, enemy.y)) {
                enemy.isEliminated = true;
                spawnSparks(enemy.x, enemy.y, '#c2410c', 45, '💥 リングアウト！');
            }
        });

        const activeEnemies = enemies.filter(e => !e.isEliminated);
        if (enemies.length > 0 && activeEnemies.length === 0) {
            finishMatch(true);
        }
    }

    function isOutOfDohyo(x, y, scale = 1.0) {
        const dx = (x - GAME_CONFIG.DOHYO_CX) / (GAME_CONFIG.DOHYO_RX * scale);
        const dy = (y - GAME_CONFIG.DOHYO_CY) / (GAME_CONFIG.DOHYO_RY * scale);
        return (dx * dx + dy * dy) > 1.0;
    }

    function triggerAnnouncement(text, duration = 0.8) {
        announceText = text;
        announceScale = 2.5;
        announceTimer = duration;
    }

    function drawDohyo() {
        ctx.save();

        const bgGrad = ctx.createRadialGradient(GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, 40, GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, 520);
        bgGrad.addColorStop(0, '#fbf9f5');
        bgGrad.addColorStop(1, '#f5f0e6');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        // 土俵
        ctx.beginPath();
        ctx.ellipse(GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, GAME_CONFIG.DOHYO_RX, GAME_CONFIG.DOHYO_RY, 0, 0, Math.PI * 2);
        const dohyoGrad = ctx.createRadialGradient(GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, 30, GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, GAME_CONFIG.DOHYO_RX);
        dohyoGrad.addColorStop(0, '#fffdfa');
        dohyoGrad.addColorStop(1, '#ebdcc9');
        ctx.fillStyle = dohyoGrad;
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#1e1b4b';
        ctx.stroke();

        // 俵
        ctx.beginPath();
        ctx.ellipse(GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, GAME_CONFIG.DOHYO_RX - 10, GAME_CONFIG.DOHYO_RY - 5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([14, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }

    function drawRikishi(rikishi) {
        if (rikishi.isEliminated) return;

        ctx.save();
        const x = rikishi.x;
        const y = rikishi.y;
        const r = rikishi.radius;

        // 🔴 [rev.txt 指摘2対応] afterImages の通常 for ループ描画
        for (let i = 0; i < rikishi.afterImages.length; i++) {
            const img = rikishi.afterImages[i];
            if (img.active) {
                ctx.save();
                ctx.globalAlpha = img.life * 2.5;
                ctx.beginPath();
                ctx.arc(img.x, img.y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(194, 65, 12, 0.4)';
                ctx.fill();
                ctx.restore();
            }
        }

        if (rikishi.isDodging) {
            ctx.beginPath();
            ctx.arc(x, y, r + 16, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(194, 65, 12, 0.4)';
            ctx.fill();
        }

        // 影
        ctx.beginPath();
        ctx.ellipse(x, y + 25, r * 0.9, 14, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fill();

        if (rikishi.imageObj && rikishi.imageObj.complete && rikishi.imageObj.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.clip();

            if (rikishi.flashTimer > 0) {
                ctx.filter = 'brightness(2.5)';
            }
            ctx.drawImage(rikishi.imageObj, x - r, y - r, r * 2, r * 2);
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = rikishi.flashTimer > 0 ? '#ffffff' : rikishi.color;
            ctx.fill();

            ctx.font = `${Math.floor(r * 0.85)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rikishi.avatar, x, y - 2);
        }

        ctx.font = '900 15px "Shippori Mincho", serif';
        ctx.fillStyle = '#1c1917';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 5;
        ctx.fillText(rikishi.name, x, y - r - 12);

        if (rikishi.stateTextTimer > 0) {
            ctx.font = '900 17px "Shippori Mincho", serif';
            ctx.fillStyle = '#c2410c';
            ctx.fillText(rikishi.stateText, x, y - r - 32);
        }

        ctx.restore();
    }

    function drawAnnounce() {
        if (announceTimer <= 0) return;
        ctx.save();
        ctx.translate(GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY - 60);
        ctx.scale(announceScale, announceScale);

        ctx.font = '900 52px "Shippori Mincho", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#1e1b4b';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 12;
        ctx.fillText(announceText, 0, 0);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 5;
        ctx.strokeText(announceText, 0, 0);

        ctx.restore();
    }

    let lastFrameTime = performance.now();

    function gameLoop(now) {
        let dt = Math.min(0.1, (now - lastFrameTime) / 1000);
        lastFrameTime = now;

        if (gameState === STATE.PLAYING) {
            GAME_STATE_TIME += dt; // 🔴 [rev.txt 指摘6対応] ゲーム内時間ベース化
        }

        if (inputBuffer.pushFrames > 0) {
            inputBuffer.pushFrames--;
            if (gameState === STATE.PLAYING && hitStopTimer <= 0) {
                handlePush(p1);
                inputBuffer.pushFrames = 0;
            }
        }

        if (slowMotionTimer > 0) {
            slowMotionTimer -= dt;
            dt *= 0.25;
        }

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

            updateAI(dt);
            checkRingOut();

            // 🔴 [rev.txt 指摘対応] イベントのゲームプレイ直接影響処理！
            if (currentEvent && currentEvent.apply) {
                currentEvent.apply(dt, [p1, ...enemies]);
            }

            if (comboTimer > 0) {
                comboTimer -= dt;
                if (comboTimer <= 0) {
                    comboCount = 0;
                    comboDisplayEl.classList.add('hidden');
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

        if (shakeTimer > 0) shakeTimer -= dt;

        particlePool.updateAll(dt);

        ctx.save();
        if (shakeTimer > 0) {
            const sx = (Math.random() * 14 - 7);
            const sy = (Math.random() * 14 - 7);
            ctx.translate(sx, sy);
        }

        ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        drawDohyo();
        drawRikishi(p1);
        enemies.forEach(e => drawRikishi(e));
        saltBulletPool.drawAll(ctx);
        particlePool.drawAll(ctx);
        drawAnnounce();

        ctx.restore();

        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('DOMContentLoaded', init);

})();
