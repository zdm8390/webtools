/**
 * 超音速スモウバトル～ちゃんこ食わんかい～
 * 1. Cボタン／[C/L]キーを「踏みとどまる（粘り足ストッパー）」に変更！
 * 2. 踏みとどまる発動後は3秒間のクールダウンタイマーを管理！
 */

(function() {
    'use strict';

    const GAME_CONFIG = Object.freeze({
        CANVAS_WIDTH: 900,
        CANVAS_HEIGHT: 520,
        DOHYO_CX: 450,
        DOHYO_CY: 260,
        INPUT_BUFFER_FRAMES: 6,
        HIT_STOP_DURATION: 0.09,
        SLOW_MOTION_DURATION: 0.22,
        PARRY_SLOW_DURATION: 0.45,
        PUSH_KNOCKBACK_FORCE: 4.0,
        LATCH_COOLDOWN_MAX: 3.0, // 🔴 踏みとどまるクールダウン 3.0秒
        POOL_MAX_PARTICLES: 300,
        POOL_MAX_BULLETS: 100,
        POOL_MAX_AFTER_IMAGES: 20
    });

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

        playTaiko(freq = 240, duration = 0.3, vol = 0.8) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;

            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

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
                // ポップでピコッとする可愛いヒット音
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);

                gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.1);
                
                this.playTaiko(300, 0.12, 0.8);
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
                osc.frequency.setValueAtTime(600, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.18);

                gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.18);
            } catch (e) {}
        }

        playCardSelect() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(520, 0.08, 0.5);
            setTimeout(() => this.playTaiko(1040, 0.15, 0.7), 70);
        }

        playParry() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(800, 0.1, 1.0);
            setTimeout(() => this.playTaiko(1600, 0.25, 1.0), 30);
        }

        playMegaBurst() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(500, 0.4, 0.9);
            setTimeout(() => this.playTaiko(250, 0.4, 0.9), 90);
        }

        playFanfare(isWin) {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const notes = isWin ? [523.25, 659.25, 783.99, 1046.50] : [349.23, 311.13, 261.63];
            notes.forEach((freq, idx) => {
                setTimeout(() => {
                    if (!this.ctx) return;
                    try {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = isWin ? 'triangle' : 'sine';
                        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                        gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start();
                        osc.stop(this.ctx.currentTime + 0.35);
                    } catch (e) {}
                }, idx * 90);
            });
        }
    }

    const audio = new SoundManager();

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
            this.vy += this.text ? -0.8 : 0.2;
            this.life -= dt;
            if (this.life <= 0) this.active = false;
        }

        draw(ctx) {
            if (!this.active) return;
            ctx.save();
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.globalAlpha = alpha;

            if (this.text) {
                ctx.font = '900 26px "M PLUS Rounded 1c", sans-serif';
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
                        this.freeStack.push(i);
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
            if (p) p.spawn(x, y - 24, 0, -1.5, '#ff3377', 0, 0.85, popText);
        }

        const cuteColors = ['#ff6b9d', '#ffb3c6', '#ffe66d', '#70d6ff', '#6ee7b7', '#c77dff'];
        const cuteIcons = ['⭐', '✨', '💖', '🌸', '🍬'];

        for (let i = 0; i < count; i++) {
            const p = particlePool.get();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 8.5;
            const pickColor = cuteColors[Math.floor(Math.random() * cuteColors.length)];
            const iconText = Math.random() < 0.25 ? cuteIcons[Math.floor(Math.random() * cuteIcons.length)] : null;
            
            p.spawn(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                pickColor,
                iconText ? 0 : (5 + Math.random() * 6),
                0.35 + Math.random() * 0.45,
                iconText
            );
        }
    }

    function spawnVictoryConfetti() {
        const colors = ['#ff6b9d', '#ffb3c6', '#ffe66d', '#70d6ff', '#6ee7b7', '#c77dff', '#ffffff'];
        const icons = ['💖', '⭐', '🍬', '✨', '🎉', '🌸', '🍡'];
        
        for (let i = 0; i < 110; i++) {
            const p = particlePool.get();
            if (!p) break;
            const iconText = Math.random() < 0.35 ? icons[Math.floor(Math.random() * icons.length)] : null;
            p.spawn(
                GAME_CONFIG.DOHYO_CX + (Math.random() * 500 - 250),
                50,
                Math.random() * 7 - 3.5,
                Math.random() * 6 + 3,
                colors[Math.floor(Math.random() * colors.length)],
                iconText ? 0 : (6 + Math.random() * 6),
                3.0,
                iconText
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

    const RANKS = [
        { name: 'シルバー', icon: '🥈', imgUrl: 'assets/rabbit_cute.jpg', enemyName: '音速うさ丸', aiType: 'rookie_rabbit', strength: 1.8, weight: 70, color: '#059669', avatar: '🐰' },
        { name: 'ゴールド', icon: '🥇', imgUrl: 'assets/bear_cute.jpg', enemyName: '金剛くまごろう', aiType: 'super_heavy', strength: 4.8, weight: 260, color: '#0284c7', avatar: '🐻' },
        { name: 'ダイヤ', icon: '💎', imgUrl: 'assets/cat_cute.jpg', enemyName: '閃光ねこノ海', aiType: 'ninja_dodge', strength: 7.2, weight: 140, color: '#d97706', avatar: '🐱' },
        { name: 'プラチナ', icon: '👑', imgUrl: 'assets/phoenix_cute.jpg', enemyName: '暴風鳳凰丸', aiType: 'salt_master', strength: 9.2, weight: 170, color: '#9333ea', avatar: '🦅' },
        { name: 'マスター', icon: '🏆', imgUrl: 'assets/boss_gold_cute.jpg', enemyName: '覇王金龍丸 ＆ 銀龍丸', aiType: 'boss_duo', strength: 12.0, weight: 210, color: '#b45309', avatar: '🐉' }
    ];

    const ALL_SKILL_CARDS = [
        { id: 'giant', icon: '🍚', title: 'ちゃんこ微増', desc: '体格1.25倍＆推力微増(+0.8)', apply: (p) => { p.radiusScale *= 1.25; p.powerMultiplier += 0.8; } },
        { id: 'speed', icon: '⚡', title: 'ちょっと快速', desc: '移動速度1.25倍＆残像微発生', apply: (p) => { p.moveSpeed *= 1.25; p.hasAfterImage = true; } },
        { id: 'shockwave', icon: '💥', title: 'プチ衝撃波', desc: '押した時に小さな衝撃波が発生', apply: (p) => { p.hasShockwave = true; } },
        { id: 'auto_parry', icon: '✨', title: 'たまにオートパリィ', desc: '至近距離の塩弾を低確率で判定オートカウンター', apply: (p) => { p.hasAutoParry = true; } }
    ];

    const EVENTS = [
        { 
            type: 'rotate', 
            title: '🌀 土俵高速回転！ (強い遠心力で全員が外へ引っ張られる！)', 
            apply: (dt, rikishiList) => {
                rikishiList.forEach(r => {
                    if (r.active && !r.isEliminated) {
                        const dx = r.x - GAME_CONFIG.DOHYO_CX;
                        const dy = r.y - GAME_CONFIG.DOHYO_CY;
                        const dist = Math.hypot(dx, dy);
                        if (dist > 10) {
                            r.vx += (dx / dist) * 1.8;
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
                            r.radiusScale = 1.4;
                            r.radius = Math.min(80, r.radius * 1.25);
                            r.setStateText('ちゃんこ横取り！🍲');
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
                        r.powerMultiplier = Math.max(r.powerMultiplier, 4.0);
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

    let timeAttackTimer = 0;
    let isTimerRunning = false;

    // 🔴 踏みとどまるクールダウンタイマー
    let latchCooldownTimer = 0;

    let statsCollisionCount = 0;
    let statsPushCount = 0;
    let statsParryCount = 0;
    let statsContinueCount = 0;

    let currentDohyoShape = 'circle';
    let currentDohyoRadius = 230;

    let comboCount = 0;
    let comboTimer = 0;
    let currentEvent = null;
    let eventTimer = 0;

    let shakeTimer = 0;
    let hitStopTimer = 0;
    let slowMotionTimer = 0;
    let parryGlowTimer = 0;
    let selectedCardIndex = 0;

    let GAME_STATE_TIME = 0;

    let inputBuffer = { pushFrames: 0, dodgeFrames: 0 };

    const keysPressed = {};
    const dpadPressed = { up: false, down: false, left: false, right: false };

    class SaltBullet {
        constructor(x, y, targetX, targetY, isReflected = false, speed = 8.5) {
            this.active = false;
            this.x = x; this.y = y;
            this.vx = 0; this.vy = 0;
            this.radius = 12;
            this.life = 2.5;
            this.isReflected = isReflected;
            this.poolIndex = -1;
            this.speed = speed;
        }

        spawn(x, y, targetX, targetY, isReflected = false, customSpeed = null) {
            this.active = true;
            this.x = x; this.y = y;
            const angle = Math.atan2(targetY - y, targetX - x);
            const speed = customSpeed ? customSpeed : (isReflected ? 13.5 : 8.5);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = 12;
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

            if (parryGlowTimer > 0 && this.isReflected) {
                ctx.shadowColor = '#ffe66d';
                ctx.shadowBlur = 30;
            } else {
                ctx.shadowColor = this.isReflected ? 'rgba(255, 230, 109, 0.9)' : 'rgba(255, 107, 157, 0.8)';
                ctx.shadowBlur = this.isReflected ? 16 : 8;
            }

            ctx.fillStyle = this.isReflected ? '#ffe66d' : '#ff6b9d';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.isReflected ? '⭐' : '🍬', this.x, this.y + 1);
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

            this.pushStock = 3;
            this.stunTimer = 0;
            this.edgeLatchTimer = 0;
            this.parryBoostTimer = 0;
            this.parryBoostCount = 0;

            this.afterImages = Array.from({ length: GAME_CONFIG.POOL_MAX_AFTER_IMAGES }, () => ({ x: 0, y: 0, life: 0, active: false }));
            this.afterImageHead = 0;

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
            this.pushStock = 3;
            this.isDodging = false;
            this.dodgeTimer = 0;
            this.stunTimer = 0;
            this.edgeLatchTimer = 0;
            this.parryBoostTimer = 0;
            this.parryBoostCount = 0;
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
            if (this.aiState === 'angry') mult *= 2.4;
            else if (this.aiState === 'panic') mult *= 0.7;
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

            if (this.stunTimer > 0) {
                this.stunTimer -= dt;
                this.vx *= 0.1;
                this.vy *= 0.1;
                this.setStateText('💫 眩暈スタンス！');
                return;
            }

            if (this.edgeLatchTimer > 0) {
                this.edgeLatchTimer -= dt;
                this.vx *= 0.03;
                this.vy *= 0.03;
            }

            this.x += this.vx;
            this.y += this.vy;

            this.x = Math.max(this.radius, Math.min(GAME_CONFIG.CANVAS_WIDTH - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(GAME_CONFIG.CANVAS_HEIGHT - this.radius, this.y));

            const friction = 0.70;
            this.vx *= friction;
            this.vy *= friction;

            if (this.hasAfterImage && (Math.abs(this.vx) > 2 || Math.abs(this.vy) > 2)) {
                this.addAfterImage();
            }

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

            if (this.parryBoostTimer > 0) {
                this.parryBoostTimer -= dt;
                if (this.parryBoostTimer <= 0 && this.parryBoostCount === 0) {
                    if (typeof updatePushStockUI === 'function') updatePushStockUI();
                }
            }

            if (this.flashTimer > 0) this.flashTimer -= dt;
            if (this.stateTextTimer > 0) this.stateTextTimer -= dt;
        }

        triggerDodge() {
            if (this.dodgeTimer <= 0 && !this.isEliminated) {
                this.isDodging = true;
                this.dodgeTimer = 0.38;
                this.setStateText('見切りパリィ構え！✨');
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
    const timerBadge = document.getElementById('timer-badge');

    const speedLinesEl = document.getElementById('speed-lines');
    const flashOverlayEl = document.getElementById('flash-overlay');
    const parryDimOverlayEl = document.getElementById('parry-dim-overlay');
    const burstCutinEl = document.getElementById('burst-cutin');
    const cutinTextContent = document.getElementById('cutin-text-content');
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
    const pushBtnLabel = document.getElementById('push-btn-label');
    const btnP1Dodge = document.getElementById('btn-p1-dodge');
    
    // 🔴 Cボタン（踏みとどまる）の要素参照
    const btnP1Latch = document.getElementById('btn-p1-latch');
    const latchBtnLabel = document.getElementById('latch-btn-label');

    const dpadUp = document.getElementById('dpad-up');
    const dpadDown = document.getElementById('dpad-down');
    const dpadLeft = document.getElementById('dpad-left');
    const dpadRight = document.getElementById('dpad-right');

    const cardsContainer = document.getElementById('cards-container');

    const winnerNameEl = document.getElementById('winner-name');
    const finalTimeTextEl = document.getElementById('final-time-text');
    const finalScoreTextEl = document.getElementById('final-score-text');
    
    const statCollisionsEl = document.getElementById('stat-collisions');
    const statPushesEl = document.getElementById('stat-pushes');
    const statParriesEl = document.getElementById('stat-parries');
    const statContinuesEl = document.getElementById('stat-continues');

    const yokozunaTitleCard = document.getElementById('yokozuna-title-card');

    let p1 = new Rikishi(true, 'エドモーンド', '#ff3377', '⚡', 6.0, 130, 'player', 340, 260, 'assets/player_cute.jpg');
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
            if (isMatchFinished && winnerNameEl.textContent.includes('西 勝利')) {
                statsContinueCount++;
                startNextBattleDirectly(false, false);
            } else if (currentRankIdx < RANKS.length - 1) {
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
            if (canPlayerControl()) queuePushInput();
        });

        btnP1Push.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); if (canPlayerControl()) queuePushInput(); });
        btnP1Dodge.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); if (canPlayerControl()) handleDodge(p1); });
        if (btnP1Latch) {
            btnP1Latch.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); if (canPlayerControl()) handleManualLatch(); });
        }

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
            } else if (gameState === STATE.PLAYING && canPlayerControl()) {
                if (e.repeat) return;
                
                if (e.code === 'KeyZ') {
                    queuePushInput();
                } 
                else if (e.code === 'KeyX' || e.code === 'KeyK' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                    handleDodge(p1);
                } 
                else if (e.code === 'KeyC' || e.code === 'KeyL') {
                    handleManualLatch();
                }
            }
        });

        window.addEventListener('keyup', (e) => { keysPressed[e.code] = false; });
    }

    function canPlayerControl() {
        return (gameState === STATE.PLAYING && announceTimer <= 0 && !isMatchFinished);
    }

    function queuePushInput() {
        if (canPlayerControl()) {
            inputBuffer.pushFrames = GAME_CONFIG.INPUT_BUFFER_FRAMES;
        }
    }

    function setupDpadEvents(btn, dir) {
        if (!btn) return;
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); dpadPressed[dir] = true; });
        btn.addEventListener('pointerup', () => { dpadPressed[dir] = false; });
        btn.addEventListener('pointerleave', () => { dpadPressed[dir] = false; });
    }

    function hideAllScreens() {
        [screenTitle, screenSkillSelect, screenResult].forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
                screen.classList.add('hidden');
            }
        });
    }

    function showScreenPanel(targetPanel) {
        hideAllScreens();
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
            targetPanel.classList.add('active');
        }
    }

    function showTitle() {
        gameState = STATE.TITLE;
        currentRankIdx = 0;
        winsCount = 0;
        isMatchFinished = false;
        isTimerRunning = false;
        timeAttackTimer = 0;
        latchCooldownTimer = 0;

        statsCollisionCount = 0;
        statsPushCount = 0;
        statsParryCount = 0;
        statsContinueCount = 0;

        saltBulletPool.clearAll();
        particlePool.clearAll();

        speedLinesEl.classList.remove('active');
        burstCutinEl.classList.add('hidden');
        eventBanner.classList.add('hidden');
        comboDisplayEl.classList.add('hidden');
        if (parryDimOverlayEl) parryDimOverlayEl.classList.remove('active');
        if (yokozunaTitleCard) yokozunaTitleCard.classList.add('hidden');

        showScreenPanel(screenTitle);
        uiOverlay.classList.add('active');
        updateHeaderUI();
        updateTimerDisplay();
        updateLatchBtnUI();
    }

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 100);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        if (timerBadge) {
            timerBadge.textContent = `⏱️ TIME: ${formatTime(timeAttackTimer)}`;
        }
    }

    function updatePushStockUI() {
        if (pushBtnLabel) {
            if (p1.parryBoostTimer > 0 || p1.parryBoostCount > 0) {
                pushBtnLabel.textContent = `インパクト [Z] (${p1.pushStock}) 🔥超極太!`;
            } else {
                pushBtnLabel.textContent = `インパクト [Z] (${p1.pushStock})`;
            }
        }
    }

    // 🔴 踏みとどまるボタンのリアルタイムUI＆クールダウン秒数更新
    function updateLatchBtnUI() {
        if (!latchBtnLabel || !btnP1Latch) return;
        if (latchCooldownTimer > 0) {
            latchBtnLabel.textContent = `踏みとどまる (CD:${latchCooldownTimer.toFixed(1)}s)`;
            btnP1Latch.classList.add('disabled');
            btnP1Latch.disabled = true;
        } else {
            latchBtnLabel.textContent = `踏みとどまる [C]`;
            btnP1Latch.classList.remove('disabled');
            btnP1Latch.disabled = false;
        }
    }

    function randomizeDohyo() {
        currentDohyoShape = Math.random() < 0.25 ? 'square' : 'circle';
        currentDohyoRadius = 200 + Math.floor(Math.random() * 50);
    }

    function startNextBattleDirectly(isResetAll = false, isFullReset = false) {
        if (isResetAll) {
            currentRankIdx = 0;
            winsCount = 0;
            timeAttackTimer = 0;
            latchCooldownTimer = 0;
            statsCollisionCount = 0;
            statsPushCount = 0;
            statsParryCount = 0;
            statsContinueCount = 0;
            isTimerRunning = true;
            p1 = new Rikishi(true, 'エドモーンド', '#ff3377', '⚡', 6.0, 130, 'player', 340, 260, 'assets/player_cute.jpg');
        }

        randomizeDohyo();
        setupEnemy();

        uiOverlay.classList.remove('active');
        hideAllScreens();
        gameState = STATE.PLAYING;
        isMatchFinished = false;
        isTimerRunning = true;
        latchCooldownTimer = 0;
        saltBulletPool.clearAll();
        particlePool.clearAll();

        p1.reset();
        enemies.forEach(e => e.reset());
        comboCount = 0;
        comboDisplayEl.classList.add('hidden');
        burstCutinEl.classList.add('hidden');
        if (parryDimOverlayEl) parryDimOverlayEl.classList.remove('active');
        if (yokozunaTitleCard) yokozunaTitleCard.classList.add('hidden');

        updatePushStockUI();
        updateLatchBtnUI();

        let announcement = 'はっけよい！のこった！💥';
        if (currentDohyoShape === 'square') announcement = '🔳 変形四角土俵！のこった！💥';
        triggerAnnouncement(announcement, 0.8);
        audio.playTaiko(260, 0.3, 1.0);

        if (Math.random() < 0.6) {
            setTimeout(triggerRandomEvent, 1600);
        }
    }

    function setupEnemy() {
        enemies = [];
        const enemyData = RANKS[currentRankIdx];
        if (enemyData.aiType === 'boss_duo') {
            const boss1 = new Rikishi(false, '金龍丸 (兄)', '#b45309', '🐲', 12.0, 210, 'boss_duo', 580, 210, 'assets/boss_gold_cute.jpg');
            const boss2 = new Rikishi(false, '銀龍丸 (弟)', '#1e1b4b', '🐉', 10.5, 190, 'boss_duo', 580, 310, 'assets/boss_silver_cute.jpg');
            enemies.push(boss1, boss2);
        } else {
            enemies.push(new Rikishi(false, enemyData.enemyName, enemyData.color, enemyData.avatar, enemyData.strength, enemyData.weight, enemyData.aiType, 560, 260, enemyData.imgUrl));
        }
    }

    function showSkillSelectPopup() {
        gameState = STATE.SKILL_SELECT;
        saltBulletPool.clearAll();
        selectedCardIndex = 0;
        showScreenPanel(screenSkillSelect);
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
        burstCutinEl.classList.add('hidden');
        saltBulletPool.clearAll();
        if (parryDimOverlayEl) parryDimOverlayEl.classList.remove('active');
        if (yokozunaTitleCard) yokozunaTitleCard.classList.add('hidden');

        audio.playFanfare(isP1Win);

        if (finalTimeTextEl) finalTimeTextEl.textContent = formatTime(timeAttackTimer);

        if (statCollisionsEl) statCollisionsEl.textContent = statsCollisionCount;
        if (statPushesEl) statPushesEl.textContent = statsPushCount;
        if (statParriesEl) statParriesEl.textContent = statsParryCount;
        if (statContinuesEl) statContinuesEl.textContent = statsContinueCount;

        const calculatedScore = Math.max(100, Math.floor(
            winsCount * 3000 + 
            statsParryCount * 350 + 
            statsCollisionCount * 30 + 
            statsPushCount * 50 - 
            timeAttackTimer * 10 - 
            statsContinueCount * 500
        ));
        if (finalScoreTextEl) finalScoreTextEl.textContent = `${calculatedScore.toLocaleString()} PTS`;

        if (isP1Win) {
            winsCount++;
            winnerNameEl.textContent = `東 ${p1.name} の天下無双！`;

            if (currentRankIdx === RANKS.length - 1) {
                isTimerRunning = false;
                if (yokozunaTitleCard) yokozunaTitleCard.classList.remove('hidden');
                btnNextMatch.textContent = '🏆 全階級制覇！TOPへ';
            } else {
                btnNextMatch.textContent = '🔥 次の階級へ進む [Enter] ➔';
            }
            spawnVictoryConfetti();
        } else {
            isTimerRunning = false;
            winnerNameEl.textContent = `西 勝利！`;
            btnNextMatch.textContent = '🔄 同じステージからコンティニュー [Enter]';
        }

        updateHeaderUI();

        setTimeout(() => {
            try {
                showScreenPanel(screenResult);
                uiOverlay.classList.add('active');
            } catch (e) {}
        }, 1000);
    }

    function triggerFlash() {
        flashOverlayEl.classList.add('active');
        setTimeout(() => flashOverlayEl.classList.remove('active'), 250);
    }

    function triggerParrySpecialEffect() {
        slowMotionTimer = GAME_CONFIG.PARRY_SLOW_DURATION;
        parryGlowTimer = 0.45;
        triggerShake(0.3);

        if (cutinTextContent) cutinTextContent.textContent = 'ジャストパリィ！';
        burstCutinEl.classList.remove('hidden');
        setTimeout(() => burstCutinEl.classList.add('hidden'), 700);
    }

    function updateHeaderUI() {
        if (levelBadge) levelBadge.textContent = `🔥 ${winsCount} 連勝中！`;

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
        if (!canPlayerControl() || hitStopTimer > 0) return;

        let dx = 0, dy = 0;
        if (keysPressed['KeyW'] || keysPressed['ArrowUp'] || dpadPressed.up) dy -= 1;
        if (keysPressed['KeyS'] || keysPressed['ArrowDown'] || dpadPressed.down) dy += 1;
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft'] || dpadPressed.left) dx -= 1;
        if (keysPressed['KeyD'] || keysPressed['ArrowRight'] || dpadPressed.right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            p1.vx += (dx / len) * 3.4 * p1.moveSpeed;
            p1.vy += (dy / len) * 3.4 * p1.moveSpeed;
        }

        const isNearEdge = isOutOfDohyo(p1.x, p1.y, 0.94);
        if (isNearEdge && p1.edgeLatchTimer <= 0) {
            p1.edgeLatchTimer = 0.22;
            p1.setStateText('土俵際自動踏み止まり！🦶');
            spawnSparks(p1.x, p1.y, '#fde047', 10);
        }
    }

    // 🔴 新機能：Cキー／ボタン「踏みとどまる（粘り足ストッパー）」＆ 3秒間クールダウン
    function handleManualLatch() {
        if (!canPlayerControl() || latchCooldownTimer > 0) return;

        p1.edgeLatchTimer = 0.60; // 0.60秒の強力踏みとどまり足粘り！
        p1.setStateText('🦶 踏みとどまり発動！');
        latchCooldownTimer = GAME_CONFIG.LATCH_COOLDOWN_MAX; // 3秒間クールダウンセット！
        
        audio.playHit();
        spawnSparks(p1.x, p1.y, '#10b981', 25, '踏みとどまり！');
        updateLatchBtnUI();
    }

    function handlePush(actor) {
        if (!canPlayerControl()) return;

        let parryPushMultiplier = 1.0;

        if (actor === p1) {
            if (p1.pushStock <= 0) {
                p1.setStateText('弾切れ！パリィで回復');
                return;
            }
            p1.pushStock--;
            statsPushCount++;

            // ⚡ ジャストパリィ成功時はインパクトの強度を大幅アップ！
            if (p1.parryBoostCount > 0 || p1.parryBoostTimer > 0) {
                parryPushMultiplier = 2.8; // 強度2.8倍！
                p1.parryBoostCount = Math.max(0, p1.parryBoostCount - 1);
                p1.parryBoostTimer = 0;
                spawnSparks(p1.x, p1.y, '#ff3377', 35, '💥 超インパクト！');
                triggerShake(0.35);
                audio.playMegaBurst();
            }

            updatePushStockUI();
            addComboHit();
        }

        hitStopTimer = GAME_CONFIG.HIT_STOP_DURATION;
        triggerShake(parryPushMultiplier > 1.0 ? 0.32 : 0.18);
        audio.playHit();

        spawnSparks(actor.x, actor.y, parryPushMultiplier > 1.0 ? '#ff3377' : '#c2410c', 12, '💨 ドスッ！');

        if (actor.hasShockwave) {
            enemies.forEach(e => {
                const angle = Math.atan2(e.y - actor.y, e.x - actor.x);
                e.vx += Math.cos(angle) * 10 * parryPushMultiplier;
                e.vy += Math.sin(angle) * 10 * parryPushMultiplier;
            });
            spawnSparks(actor.x, actor.y, '#c2410c', 15, '💥 衝撃波');
        }

        enemies.forEach(opponent => {
            if (opponent.isEliminated) return;

            const dist = Math.hypot(opponent.x - actor.x, opponent.y - actor.y);
            if (dist < actor.radius + opponent.radius + 55) {
                if (opponent.isDodging) {
                    audio.playParry();
                    actor.vx -= (opponent.x - actor.x) * 2.2;
                    actor.vy -= (opponent.y - actor.y) * 2.2;
                    opponent.setStateText('見切りカウンター返送！✨');
                    spawnSparks(actor.x, actor.y, '#fde047', 30, '💥 カウンター！');
                    return;
                }

                opponent.flashTimer = 0.15;

                const pushForce = GAME_CONFIG.PUSH_KNOCKBACK_FORCE * actor.currentPower * parryPushMultiplier;
                const angle = Math.atan2(opponent.y - actor.y, opponent.x - actor.x);
                opponent.vx += Math.cos(angle) * pushForce;
                opponent.vy += Math.sin(angle) * pushForce;

                spawnSparks(opponent.x, opponent.y, parryPushMultiplier > 1.0 ? '#ff3377' : '#c2410c', 20, parryPushMultiplier > 1.0 ? '💥 MEGA IMPACT!' : '💥 IMPACT!');
            }
        });
    }

    function handleDodge(actor) {
        if (!canPlayerControl() || hitStopTimer > 0) return;
        
        const success = actor.triggerDodge();
        if (success && actor === p1) {
            let parryTriggered = false;

            saltBulletPool.pool.forEach(b => {
                if (b.active && !b.isReflected && Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + 80) {
                    b.isReflected = true;
                    const activeEnemies = enemies.filter(e => !e.isEliminated);
                    const target = activeEnemies[0] || p1;
                    const angle = Math.atan2(target.y - b.y, target.x - b.x);
                    b.vx = Math.cos(angle) * 14;
                    b.vy = Math.sin(angle) * 14;

                    target.stunTimer = 1.2;
                    parryTriggered = true;
                }
            });

            if (parryTriggered) {
                statsParryCount++;
                p1.pushStock = Math.min(5, p1.pushStock + 1);
                p1.parryBoostCount = Math.min(3, p1.parryBoostCount + 1);
                p1.parryBoostTimer = 6.0;
                updatePushStockUI();
                p1.setStateText('🌟 パリィ成功！インパクト超強化！✨');
                audio.playParry();
                triggerParrySpecialEffect();
                spawnSparks(p1.x, p1.y, '#ffe66d', 40, '✨ ジャストパリィ！');
            }
        }
    }

    function checkCharacterCollisions() {
        const allRikishi = [p1, ...enemies].filter(r => r && !r.isEliminated);
        
        for (let i = 0; i < allRikishi.length; i++) {
            for (let j = i + 1; j < allRikishi.length; j++) {
                const r1 = allRikishi[i];
                const r2 = allRikishi[j];

                const dx = r2.x - r1.x;
                const dy = r2.y - r1.y;
                const dist = Math.hypot(dx, dy);
                const minDist = r1.radius + r2.radius;

                if (dist < minDist && dist > 0.001) {
                    if (r1.isPlayer || r2.isPlayer) {
                        statsCollisionCount++;
                    }

                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const pushFactor = 0.55;
                    r1.x -= nx * overlap * pushFactor;
                    r1.y -= ny * overlap * pushFactor;
                    r2.x += nx * overlap * pushFactor;
                    r2.y += ny * overlap * pushFactor;

                    const bounceImpulse = 14.0;
                    r1.vx -= nx * bounceImpulse;
                    r1.vy -= ny * bounceImpulse;
                    r2.vx += nx * bounceImpulse;
                    r2.vy += ny * bounceImpulse;

                    triggerShake(0.12);
                    audio.playHit();
                    spawnSparks((r1.x + r2.x) / 2, (r1.y + r2.y) / 2, '#c2410c', 8, '💥 ドンッ！');
                }
            }
        }
    }

    function updateAI(dt) {
        if (gameState !== STATE.PLAYING || announceTimer > 0 || hitStopTimer > 0) return;

        enemies.forEach(enemy => {
            if (enemy.isEliminated || enemy.stunTimer > 0) return;

            enemy.saltTimer += dt;

            const dx = p1.x - enemy.x;
            const dy = p1.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            const isNearEdge = isOutOfDohyo(enemy.x, enemy.y, 0.75);

            let moveX = 0;
            let moveY = 0;

            if (isNearEdge) {
                const centerAngle = Math.atan2(GAME_CONFIG.DOHYO_CY - enemy.y, GAME_CONFIG.DOHYO_CX - enemy.x);
                moveX += Math.cos(centerAngle) * 4.5;
                moveY += Math.sin(centerAngle) * 4.5;
                enemy.aiState = 'panic';
            } else if (winsCount >= 2) {
                enemy.aiState = 'angry';
            } else {
                enemy.aiState = 'normal';
            }

            if (enemy.aiType === 'rookie_rabbit') {
                const angle = Math.atan2(dy, dx);
                moveX += Math.cos(angle) * 1.5;
                moveY += Math.sin(angle) * 1.5;
            } 
            else if (enemy.aiType === 'super_heavy') {
                const angle = Math.atan2(dy, dx);
                moveX += Math.cos(angle) * 1.6;
                moveY += Math.sin(angle) * 1.6;
            } 
            else if (enemy.aiType === 'ninja_dodge') {
                if (Math.abs(p1.vx) > 5 && dist < 220) {
                    moveY += (p1.y > enemy.y ? -3.5 : 3.5);
                }
                if (dist < 180 && Math.random() < 0.20) {
                    enemy.triggerDodge();
                    enemy.x = p1.x - Math.cos(Math.atan2(dy, dx)) * 140;
                    enemy.y = p1.y - Math.sin(Math.atan2(dy, dx)) * 140;
                }
                const angle = Math.atan2(dy, dx);
                moveX += Math.cos(angle) * 2.5;
                moveY += Math.sin(angle) * 2.5;
            } 
            else if (enemy.aiType === 'salt_master') {
                if (dist < 160) {
                    moveY += (p1.y > enemy.y ? -4.0 : 4.0);
                }
                const angle = Math.atan2(-dy, -dx);
                moveX += Math.cos(angle) * 2.0;
                moveY += Math.sin(angle) * 2.0;
            }
            else if (enemy.aiType === 'boss_duo') {
                const angle = Math.atan2(dy, dx) + Math.sin(GAME_STATE_TIME * 5.0) * 1.5;
                moveX += Math.cos(angle) * 2.8;
                moveY += Math.sin(angle) * 2.8;
            }

            enemy.vx += moveX;
            enemy.vy += moveY;

            let interval = 1.8;
            if (enemy.aiType === 'salt_master') interval = 0.7;
            else if (enemy.aiType === 'rookie_rabbit') interval = 3.0;
            else if (enemy.aiType === 'boss_duo') interval = 0.22;

            if (enemy.saltTimer >= interval) {
                enemy.saltTimer = 0;
                
                if (enemy.aiType === 'boss_duo') {
                    const baseAngle = Math.atan2(p1.y - enemy.y, p1.x - enemy.x);
                    const spreadAngles = [-0.35, 0, 0.35];
                    spreadAngles.forEach(offset => {
                        const b = saltBulletPool.get();
                        if (b) {
                            const targetX = enemy.x + Math.cos(baseAngle + offset) * 200;
                            const targetY = enemy.y + Math.sin(baseAngle + offset) * 200;
                            b.spawn(enemy.x, enemy.y, targetX, targetY, false, 9.5);
                        }
                    });
                } else {
                    const b = saltBulletPool.get();
                    if (b) b.spawn(enemy.x, enemy.y, p1.x, p1.y);
                }
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
                        enemy.stunTimer = 1.2;
                        enemy.setStateText('爆破スタンヒット！💥');
                        triggerShake(0.4);
                        audio.playHit();
                        spawnSparks(enemy.x, enemy.y, '#fde047', 25, '自爆！');
                    }
                });
            } else {
                if (p1.hasAutoParry && Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + 20 && Math.random() < 0.4) {
                    b.isReflected = true;
                    b.vx = -b.vx * 1.5;
                    b.vy = -b.vy * 1.5;
                    p1.setStateText('自動パリィ！✨');
                    audio.playParry();
                    triggerParrySpecialEffect();
                    return;
                }

                if (Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + b.radius) {
                    b.active = false;
                    p1.vx -= b.vx * 1.8;
                    p1.vy -= b.vy * 1.8;
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
        const rad = currentDohyoRadius * scale;
        if (currentDohyoShape === 'square') {
            return (Math.abs(x - GAME_CONFIG.DOHYO_CX) > rad || Math.abs(y - GAME_CONFIG.DOHYO_CY) > rad);
        } else {
            const dist = Math.hypot(x - GAME_CONFIG.DOHYO_CX, y - GAME_CONFIG.DOHYO_CY);
            return dist > rad;
        }
    }

    function triggerAnnouncement(text, duration = 0.8) {
        announceText = text;
        announceScale = 2.5;
        announceTimer = duration;
    }

    function drawDohyo() {
        ctx.save();

        // 🌸 ポップ＆キュートなキャンディ背景
        const bgGrad = ctx.createRadialGradient(GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, 40, GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY, 520);
        bgGrad.addColorStop(0, '#fffdf9');
        bgGrad.addColorStop(0.6, '#fff0f5');
        bgGrad.addColorStop(1, '#ffe4e6');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        // 浮遊背景アイコン（星やハート）
        const decors = [
            { icon: '🌸', x: 80, y: 70 },
            { icon: '⭐', x: 820, y: 80 },
            { icon: '💖', x: 70, y: 440 },
            { icon: '🍬', x: 830, y: 450 },
            { icon: '✨', x: 450, y: 40 }
        ];
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        decors.forEach((d, idx) => {
            const offsetY = Math.sin(GAME_STATE_TIME * 2 + idx) * 8;
            ctx.fillText(d.icon, d.x, d.y + offsetY);
        });

        const cx = GAME_CONFIG.DOHYO_CX;
        const cy = GAME_CONFIG.DOHYO_CY;
        const rad = currentDohyoRadius;

        // 外枠グラデーション土俵（マカロンキャンディリング）
        ctx.beginPath();
        if (currentDohyoShape === 'square') {
            ctx.rect(cx - rad, cy - rad, rad * 2, rad * 2);
        } else {
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        }

        const dohyoGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, rad);
        dohyoGrad.addColorStop(0, '#ffffff');
        dohyoGrad.addColorStop(0.7, '#fff5f8');
        dohyoGrad.addColorStop(1, '#ffb3c6');
        ctx.fillStyle = dohyoGrad;
        ctx.fill();
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#ff6b9d';
        ctx.stroke();

        // 内側パステルストライプライン
        ctx.beginPath();
        if (currentDohyoShape === 'square') {
            ctx.rect(cx - rad + 12, cy - rad + 12, (rad - 12) * 2, (rad - 12) * 2);
        } else {
            ctx.arc(cx, cy, rad - 12, 0, Math.PI * 2);
        }
        ctx.strokeStyle = '#ff3377';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 10]);
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

        if (parryGlowTimer > 0) {
            ctx.shadowColor = '#ffe66d';
            ctx.shadowBlur = 35;
        }

        // 残像
        for (let i = 0; i < rikishi.afterImages.length; i++) {
            const img = rikishi.afterImages[i];
            if (img.active) {
                ctx.save();
                ctx.globalAlpha = img.life * 2.2;
                ctx.beginPath();
                ctx.arc(img.x, img.y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 107, 157, 0.4)';
                ctx.fill();
                ctx.restore();
            }
        }

        // パリィ構えバリア
        if (rikishi.isDodging) {
            ctx.beginPath();
            ctx.arc(x, y, r + 18, 0, Math.PI * 2);
            ctx.fillStyle = parryGlowTimer > 0 ? 'rgba(255, 230, 109, 0.85)' : 'rgba(112, 214, 255, 0.55)';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = parryGlowTimer > 0 ? '#ff3377' : '#38bdf8';
            ctx.stroke();
        }

        // 影（ぷにぷにピンク影）
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.8, r * 0.85, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 107, 157, 0.2)';
        ctx.fill();

        // アバター画像がある場合
        if (rikishi.imageObj && rikishi.imageObj.complete && rikishi.imageObj.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.clip();

            if (parryGlowTimer > 0) {
                ctx.filter = 'brightness(2.0) drop-shadow(0 0 15px #ffe66d)';
            } else if (rikishi.flashTimer > 0) {
                ctx.filter = 'brightness(2.4)';
            }
            ctx.drawImage(rikishi.imageObj, x - r, y - r, r * 2, r * 2);
            ctx.restore();

            // キュート枠線
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = rikishi.isPlayer ? '#ff3377' : '#70d6ff';
            ctx.stroke();
        } else {
            // アバター画像がない場合：キュート力士キャラクター
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = parryGlowTimer > 0 ? '#ffe66d' : (rikishi.flashTimer > 0 ? '#ffffff' : rikishi.color);
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.font = `${Math.floor(r * 0.85)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rikishi.avatar, x, y - 2);
        }

        if (rikishi.stunTimer > 0) {
            ctx.font = '26px sans-serif';
            ctx.fillText('💫', x, y - r - 26);
        }

        // キャラクター名
        ctx.font = '900 16px "M PLUS Rounded 1c", sans-serif';
        ctx.fillStyle = '#2d3748';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.fillText(rikishi.name, x, y - r - 12);

        // 状態テキスト
        if (rikishi.stateTextTimer > 0) {
            ctx.font = '900 17px "M PLUS Rounded 1c", sans-serif';
            ctx.fillStyle = parryGlowTimer > 0 ? '#ff3377' : '#ff8000';
            ctx.fillText(rikishi.stateText, x, y - r - 34);
        }

        ctx.restore();
    }

    function drawAnnounce() {
        if (announceTimer <= 0) return;
        ctx.save();
        ctx.translate(GAME_CONFIG.DOHYO_CX, GAME_CONFIG.DOHYO_CY - 60);
        ctx.scale(announceScale, announceScale);

        ctx.font = '900 50px "M PLUS Rounded 1c", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#ff3377';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fillText(announceText, 0, 0);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeText(announceText, 0, 0);

        ctx.restore();
    }

    let lastFrameTime = performance.now();

    function gameLoop(now) {
        let dt = Math.min(0.1, (now - lastFrameTime) / 1000);
        lastFrameTime = now;

        if (gameState === STATE.PLAYING) {
            GAME_STATE_TIME += dt;
            if (isTimerRunning) {
                timeAttackTimer += dt;
                updateTimerDisplay();
            }

            // 🔴 踏みとどまるの 3秒間クールダウンタイマー減算
            if (latchCooldownTimer > 0) {
                latchCooldownTimer -= dt;
                if (latchCooldownTimer < 0) latchCooldownTimer = 0;
                updateLatchBtnUI();
            }
        }

        if (inputBuffer.pushFrames > 0) {
            inputBuffer.pushFrames--;
            if (canPlayerControl() && hitStopTimer <= 0) {
                handlePush(p1);
                inputBuffer.pushFrames = 0;
            }
        }

        if (parryGlowTimer > 0) {
            parryGlowTimer -= dt;
            if (parryGlowTimer <= 0 && parryDimOverlayEl) {
                parryDimOverlayEl.classList.remove('active');
            }
        }

        if (slowMotionTimer > 0) {
            slowMotionTimer -= dt;
            dt *= 0.18;
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
            
            checkCharacterCollisions();

            updateSaltBullets(dt);
            updateAI(dt);
            checkRingOut();

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
