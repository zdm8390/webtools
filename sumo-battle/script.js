/**
 * 超音速スモウバトル～ちゃんこ食わんかい～
 * 爆速アーケードテンポ ＆ 極大爽快感リファクタリング版
 */

(function() {
    'use strict';

    // --- 超大重低音 Sound Engine ---
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
                filter.frequency.setValueAtTime(800, this.ctx.currentTime);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(1.0, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                noise.start();
                this.playTaiko(180, 0.15, 0.9);
            } catch (e) {}
        }

        playParry() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            this.playTaiko(500, 0.1, 1.0);
            setTimeout(() => this.playTaiko(1000, 0.25, 1.0), 40);
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
                        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
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

    const audio = new SoundEngine();

    const imageCache = {};
    function loadAvatarImage(url) {
        if (!url) return null;
        if (imageCache[url]) return imageCache[url];
        const img = new Image();
        img.src = url;
        imageCache[url] = img;
        return img;
    }

    // 💥 敵デザイン：一目で超個性！
    const RANKS = [
        { name: '超高速ウサギ', icon: '🐰', imgUrl: 'assets/rabbit.jpg', enemyName: '音速うさ丸', aiType: 'speed_rush', strength: 2.2, weight: 90, color: '#059669', avatar: '🐰' },
        { name: '超重量クマ', icon: '🐻', imgUrl: null, enemyName: '不動くまごろう', aiType: 'super_heavy', strength: 4.0, weight: 220, color: '#0284c7', avatar: '🐻' },
        { name: '影分身ネコ', icon: '🐱', imgUrl: null, enemyName: '幻影ねこノ海', aiType: 'ninja_dodge', strength: 5.5, weight: 130, color: '#d97706', avatar: '🐱' },
        { name: '塩乱射タカ', icon: '🦅', imgUrl: null, enemyName: '暴風鳳凰丸', aiType: 'salt_master', strength: 7.2, weight: 160, color: '#9333ea', avatar: '🦅' },
        { name: '全部入り双子ボス', icon: '🐲', imgUrl: 'assets/boss_gold.jpg', enemyName: '金龍丸 ＆ 銀龍丸', aiType: 'boss_duo', strength: 9.2, weight: 190, color: '#b45309', avatar: '🐉' }
    ];

    // 🍲 直感成長カード（説明を読ませない！アイコンで理解できる超パワーアップ）
    const ALL_SKILL_CARDS = [
        { id: 'giant', icon: '🍲', title: 'メガ巨大化！', desc: '体格が1.5倍に超巨大化！押し出し力3倍！', apply: (p) => { p.radiusScale *= 1.4; p.powerMultiplier += 2.0; } },
        { id: 'speed', icon: '⚡', title: '超音速ステップ', desc: '移動速度2倍！リング内を光の速さで縦横無尽！', apply: (p) => { p.moveSpeed *= 2.0; } },
        { id: 'shockwave', icon: '💥', title: '爆破衝撃波', desc: '押すたびに超広範囲衝撃波が発生！全員吹き飛ばす！', apply: (p) => { p.hasShockwave = true; } },
        { id: 'auto_parry', icon: '✨', title: '自動ジャストパリィ', desc: '相手の塩飛び道具を自動で黄金反撃弾に跳ね返す！', apply: (p) => { p.hasAutoParry = true; } }
    ];

    const EVENTS = [
        { type: 'chanko_drop', title: '🍲 巨大ちゃんこ鍋降臨！ (先に触ると超メガ化！)', apply: () => {} },
        { type: 'fever', title: '⚡ 爽快フィーバー！ (押し出しパワー10倍！)', apply: () => {} },
        { type: 'banana', title: '🍌 ツルツルバナナ足場！ (超絶滑る爆笑土俵！)', apply: () => {} }
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
    let startTime = 0;
    let isMatchFinished = false;

    let comboP1 = 0;
    let currentEvent = null;
    let eventTimer = 0;

    let shakeTimer = 0;
    let hitStopTimer = 0;
    let selectedCardIndex = 0;

    const keysPressed = {};
    const dpadPressed = { up: false, down: false, left: false, right: false };

    class SaltBullet {
        constructor(x, y, targetX, targetY, isReflected = false) {
            this.x = x;
            this.y = y;
            const angle = Math.atan2(targetY - y, targetX - x);
            const speed = isReflected ? 9.5 : 5.5;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = 10;
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
            ctx.shadowColor = this.isReflected ? 'rgba(253, 224, 71, 0.9)' : 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = this.isReflected ? 12 : 4;
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

    let saltBullets = [];
    let enemySaltTimer = 0;

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
            this.hasShockwave = false;
            this.hasAutoParry = false;
            this.isEliminated = false;

            this.reset();
        }

        reset() {
            this.x = this.startX;
            this.y = this.startY;
            this.vx = 0;
            this.vy = 0;
            this.radius = Math.min(65, (36 + (this.weight * 0.04)) * this.radiusScale);
            this.burstGauge = 0;
            this.isDodging = false;
            this.dodgeTimer = 0;
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

            this.x = Math.max(this.radius, Math.min(900 - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(520 - this.radius, this.y));

            const friction = (currentEvent && currentEvent.type === 'banana') ? 0.985 : 0.80;
            this.vx *= friction;
            this.vy *= friction;

            if (this.dodgeTimer > 0) {
                this.dodgeTimer -= dt;
                if (this.dodgeTimer <= 0) this.isDodging = false;
            }

            if (this.stateTextTimer > 0) {
                this.stateTextTimer -= dt;
            }
        }

        triggerDodge() {
            if (this.dodgeTimer <= 0 && !this.isEliminated) {
                this.isDodging = true;
                this.dodgeTimer = 0.35;
                this.setStateText('見切り！✨');
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
            this.vy += this.text ? -0.8 : 0.2;
            this.life -= dt;
        }
        draw(ctx) {
            ctx.save();
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.globalAlpha = alpha;

            if (this.text) {
                ctx.font = '900 24px "Shippori Mincho", serif';
                ctx.fillStyle = this.color;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 8;
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

    const canvas = document.getElementById('sumo-canvas');
    const ctx = canvas.getContext('2d');

    const uiOverlay = document.getElementById('ui-overlay');
    const screenTitle = document.getElementById('screen-title');
    const screenSkillSelect = document.getElementById('screen-skill-select');
    const screenResult = document.getElementById('screen-result');

    const levelBadge = document.getElementById('level-badge');
    const speedLinesEl = document.getElementById('speed-lines');
    const burstCutinEl = document.getElementById('burst-cutin');
    const eventBanner = document.getElementById('event-banner');
    const eventTitleEl = document.getElementById('event-title');

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
    let particles = [];
    let announceText = '';
    let announceScale = 1;
    let announceTimer = 0;

    const DOHYO = { cx: 450, cy: 260, rx: 340, ry: 160 };

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
            if (gameState === STATE.PLAYING) handlePush(p1);
        });

        btnP1Push.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.init(); handlePush(p1); });
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
                if (e.code === 'Space') handlePush(p1);
                else if (e.code === 'KeyJ') handleDodge(p1);
                else if (e.code === 'KeyK') handleBurst(p1);
            }
        });

        window.addEventListener('keyup', (e) => { keysPressed[e.code] = false; });
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
        saltBullets = [];
        speedLinesEl.classList.remove('active');
        burstCutinEl.classList.add('hidden');
        eventBanner.classList.add('hidden');

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

    // 💥 カウントダウンなし！ボタンを押した瞬間0.5秒で即取組開始！
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
        saltBullets = [];

        p1.reset();
        enemies.forEach(e => e.reset());
        particles = [];
        startTime = performance.now();

        triggerAnnouncement('はっけよい！のこった！💥', 0.8);
        audio.playTaiko(240, 0.3, 1.0);

        if (Math.random() < 0.6) {
            setTimeout(triggerRandomEvent, 1800);
        }
    }

    function setupEnemy() {
        enemies = [];
        const enemyData = RANKS[currentRankIdx];
        if (enemyData.aiType === 'boss_duo') {
            const boss1 = new Rikishi(false, '金龍丸 (兄)', '#b45309', '🐲', 9.2, 190, 'super_heavy', 580, 210, 'assets/boss_gold.jpg');
            const boss2 = new Rikishi(false, '銀龍丸 (弟)', '#1e1b4b', '🐉', 8.5, 175, 'ninja_dodge', 580, 310, 'assets/boss_silver.jpg');
            enemies.push(boss1, boss2);
        } else {
            enemies.push(new Rikishi(false, enemyData.enemyName, enemyData.color, enemyData.avatar, enemyData.strength, enemyData.weight, enemyData.aiType, 560, 260, enemyData.imgUrl));
        }
    }

    function showSkillSelectPopup() {
        gameState = STATE.SKILL_SELECT;
        saltBullets = [];
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
                startNextBattleDirectly(false); // 選び次第即時・次取組開始！
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
        spawnSparks(DOHYO.cx, DOHYO.cy, '#fde047', 30, 'ハプニング！！');
    }

    function finishMatch(isP1Win) {
        if (isMatchFinished) return;
        isMatchFinished = true;

        gameState = STATE.RESULT;
        p1.vx = 0; p1.vy = 0;
        enemies.forEach(e => { e.vx = 0; e.vy = 0; });

        speedLinesEl.classList.remove('active');
        eventBanner.classList.add('hidden');
        saltBullets = [];
        triggerShake(0.8);
        audio.playFanfare(isP1Win);

        if (isP1Win) {
            winsCount++;
            resultTitleEl.textContent = '💥 どすこい大勝利！ 💥';
            winnerNameEl.textContent = `東 ${p1.name} の圧勝！`;

            if (currentRankIdx === RANKS.length - 1) {
                if (yokozunaTitleCard) yokozunaTitleCard.classList.remove('hidden');
                btnNextMatch.textContent = '🏆 全勝制覇！TOPへ';
            } else {
                btnNextMatch.textContent = '🔥 次の敵へ進む [Enter] ➔';
            }
            spawnVictorySparks();
        } else {
            resultTitleEl.textContent = '敗 北 ... 再挑戦！';
            winnerNameEl.textContent = `西 勝利！`;
            btnNextMatch.textContent = '🔄 リベンジする [Enter]';
        }

        updateHeaderUI();

        // 勝利後1.0秒で即画面表示！テンポを絶対に止めない！
        setTimeout(() => {
            try {
                hideAllScreens();
                uiOverlay.classList.add('active');
                screenResult.classList.add('active');
            } catch (e) {}
        }, 1000);
    }

    function updateHeaderUI() {
        if (levelBadge) levelBadge.textContent = `勝数: ${winsCount} (連勝中！)`;

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

    function updatePlayerMovement(dt) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;

        let dx = 0, dy = 0;
        if (keysPressed['KeyW'] || keysPressed['ArrowUp'] || dpadPressed.up) dy -= 1;
        if (keysPressed['KeyS'] || keysPressed['ArrowDown'] || dpadPressed.down) dy += 1;
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft'] || dpadPressed.left) dx -= 1;
        if (keysPressed['KeyD'] || keysPressed['ArrowRight'] || dpadPressed.right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            p1.vx += (dx / len) * 2.8 * p1.moveSpeed;
            p1.vy += (dy / len) * 2.8 * p1.moveSpeed;
        }
    }

    function handleBurst(actor) {
        if (gameState !== STATE.PLAYING || actor.burstGauge < 100) return;

        actor.burstGauge = 0;
        hitStopTimer = 0.25;
        triggerShake(0.8);
        audio.playMegaBurst();

        burstCutinEl.classList.remove('hidden');
        setTimeout(() => burstCutinEl.classList.add('hidden'), 800);

        enemies.forEach(opponent => {
            if (opponent.isEliminated) return;
            const angle = Math.atan2(opponent.y - actor.y, opponent.x - actor.x);
            opponent.vx += Math.cos(angle) * 75; // 超絶吹っ飛び！
            opponent.vy += Math.sin(angle) * 75;
            spawnSparks(opponent.x, opponent.y, '#fde047', 50, '超爆破！！');
        });
    }

    // 💥 押した瞬間が超気持ちいい！大打撃＆土煙＆超振動！
    function handlePush(actor) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;

        if (actor === p1) comboP1++;

        triggerShake(0.12);
        audio.playHit();

        // 💨 豪快な土煙＆衝撃波粒子を発生！
        spawnSparks(actor.x, actor.y, '#d97706', 10, '💨 ドスッ！');

        actor.burstGauge = Math.min(100, actor.burstGauge + 15);

        if (actor.hasShockwave) {
            enemies.forEach(e => {
                const angle = Math.atan2(e.y - actor.y, e.x - actor.x);
                e.vx += Math.cos(angle) * 20;
                e.vy += Math.sin(angle) * 20;
            });
            spawnSparks(actor.x, actor.y, '#c2410c', 20, '💥 衝撃波！');
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

                // 0.08秒の超快感ヒットストップ！
                hitStopTimer = 0.08;
                triggerShake(0.25);

                const pushForce = 8.5 * actor.currentPower;
                const angle = Math.atan2(opponent.y - actor.y, opponent.x - actor.x);
                opponent.vx += Math.cos(angle) * pushForce;
                opponent.vy += Math.sin(angle) * pushForce;

                spawnSparks(opponent.x, opponent.y, '#c2410c', 16, '💥 IMPACT!');
            }
        });
    }

    function handleDodge(actor) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;
        
        const success = actor.triggerDodge();
        if (success && actor === p1) {
            saltBullets.forEach(b => {
                if (!b.isReflected && Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + 70) {
                    b.isReflected = true;
                    const activeEnemies = enemies.filter(e => !e.isEliminated);
                    const target = activeEnemies[0] || p1;
                    const angle = Math.atan2(target.y - b.y, target.x - b.x);
                    b.vx = Math.cos(angle) * 10;
                    b.vy = Math.sin(angle) * 10;

                    p1.setStateText('ジャストパリィ！✨');
                    audio.playParry();
                    triggerShake(0.4);
                    spawnSparks(b.x, b.y, '#fde047', 20, 'パリィ！！');
                }
            });
        }
    }

    // 🎮 超個性敵AI更新
    function updateAI(dt) {
        if (gameState !== STATE.PLAYING || hitStopTimer > 0) return;

        enemySaltTimer += dt;

        enemies.forEach(enemy => {
            if (enemy.isEliminated) return;

            const dx = p1.x - enemy.x;
            const dy = p1.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            // 1. 超高速ウサギ：光の速さで円形爆走！
            if (enemy.aiType === 'speed_rush') {
                const angle = Math.atan2(dy, dx) + Math.sin(performance.now() * 0.01) * 1.5;
                enemy.vx += Math.cos(angle) * 2.2;
                enemy.vy += Math.sin(angle) * 2.2;
            }
            // 2. 超重量クマ：不動の重厚さでドッシリ追撃！
            else if (enemy.aiType === 'super_heavy') {
                const angle = Math.atan2(dy, dx);
                enemy.vx += Math.cos(angle) * 0.8;
                enemy.vy += Math.sin(angle) * 0.8;
            }
            // 3. 影分身ネコ：近寄られると即・見切りワープ！
            else if (enemy.aiType === 'ninja_dodge') {
                if (dist < 180 && Math.random() < 0.1) enemy.triggerDodge();
                const angle = Math.atan2(dy, dx);
                enemy.vx += Math.cos(angle) * 1.5;
                enemy.vy += Math.sin(angle) * 1.5;
            }
            // 4. 塩乱射タカ：離れながら塩弾をガンガン連射！
            else if (enemy.aiType === 'salt_master') {
                const angle = Math.atan2(-dy, -dx);
                enemy.vx += Math.cos(angle) * 1.2;
                enemy.vy += Math.sin(angle) * 1.2;
            }

            // 塩弾発射
            const interval = enemy.aiType === 'salt_master' ? 1.0 : 2.5;
            if (enemySaltTimer >= interval) {
                saltBullets.push(new SaltBullet(enemy.x, enemy.y, p1.x, p1.y));
            }
        });

        if (enemySaltTimer >= 2.5) enemySaltTimer = 0;
    }

    function updateSaltBullets(dt) {
        saltBullets.forEach(b => b.update(dt));

        saltBullets.forEach(b => {
            if (b.isReflected) {
                enemies.forEach(enemy => {
                    if (!enemy.isEliminated && Math.hypot(enemy.x - b.x, enemy.y - b.y) < enemy.radius + b.radius) {
                        b.life = -1;
                        enemy.vx += b.vx * 2.5;
                        enemy.vy += b.vy * 2.5;
                        enemy.setStateText('爆破反撃ヒット！💥');
                        triggerShake(0.4);
                        audio.playHit();
                        spawnSparks(enemy.x, enemy.y, '#fde047', 20, '自爆！');
                    }
                });
            } else {
                if (p1.hasAutoParry && Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + 50) {
                    b.isReflected = true;
                    b.vx = -b.vx * 1.8;
                    b.vy = -b.vy * 1.8;
                    p1.setStateText('自動パリィ！✨');
                    audio.playParry();
                    return;
                }

                if (Math.hypot(p1.x - b.x, p1.y - b.y) < p1.radius + b.radius) {
                    b.life = -1;
                    p1.vx -= b.vx * 1.5;
                    p1.vy -= b.vy * 1.5;
                    triggerShake(0.2);
                    audio.playHit();
                }
            }
        });

        saltBullets = saltBullets.filter(b => b.life > 0);
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
                spawnSparks(enemy.x, enemy.y, '#c2410c', 35, '💥 リングアウト！');
            }
        });

        const activeEnemies = enemies.filter(e => !e.isEliminated);
        if (enemies.length > 0 && activeEnemies.length === 0) {
            finishMatch(true);
        }
    }

    function isOutOfDohyo(x, y) {
        const dx = (x - DOHYO.cx) / DOHYO.rx;
        const dy = (y - DOHYO.cy) / DOHYO.ry;
        return (dx * dx + dy * dy) > 1.0;
    }

    function spawnSparks(x, y, color, count = 10, popText = null) {
        if (particles.length > 150) return;
        if (popText) particles.push(new Particle(x, y - 20, 0, -1.2, color, 0, 0.8, popText));

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 9;
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                4 + Math.random() * 6,
                0.3 + Math.random() * 0.4
            ));
        }
    }

    function spawnVictorySparks() {
        const colors = ['#c2410c', '#b45309', '#1e1b4b', '#ffffff', '#fde047'];
        for (let i = 0; i < 90; i++) {
            particles.push(new Particle(
                DOHYO.cx + (Math.random() * 400 - 200),
                60,
                Math.random() * 6 - 3,
                Math.random() * 6 + 3,
                colors[Math.floor(Math.random() * colors.length)],
                6 + Math.random() * 6,
                2.5
            ));
        }
    }

    function triggerAnnouncement(text, duration = 0.8) {
        announceText = text;
        announceScale = 2.5;
        announceTimer = duration;
    }

    function drawDohyo() {
        ctx.save();

        const bgGrad = ctx.createRadialGradient(DOHYO.cx, DOHYO.cy, 40, DOHYO.cx, DOHYO.cy, 520);
        bgGrad.addColorStop(0, '#fbf9f5');
        bgGrad.addColorStop(1, '#f5f0e6');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 土俵
        ctx.beginPath();
        ctx.ellipse(DOHYO.cx, DOHYO.cy, DOHYO.rx, DOHYO.ry, 0, 0, Math.PI * 2);
        const dohyoGrad = ctx.createRadialGradient(DOHYO.cx, DOHYO.cy, 30, DOHYO.cx, DOHYO.cy, DOHYO.rx);
        dohyoGrad.addColorStop(0, '#fffdfa');
        dohyoGrad.addColorStop(1, '#ebdcc9');
        ctx.fillStyle = dohyoGrad;
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#1e1b4b';
        ctx.stroke();

        // 俵
        ctx.beginPath();
        ctx.ellipse(DOHYO.cx, DOHYO.cy, DOHYO.rx - 10, DOHYO.ry - 5, 0, 0, Math.PI * 2);
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

        if (rikishi.isDodging) {
            ctx.beginPath();
            ctx.arc(x, y, r + 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(194, 65, 12, 0.35)';
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
            ctx.drawImage(rikishi.imageObj, x - r, y - r, r * 2, r * 2);
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = rikishi.color;
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
        ctx.translate(DOHYO.cx, DOHYO.cy - 60);
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

            updateAI(dt);
            checkRingOut();

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

        particles.forEach(p => p.update(dt));
        particles = particles.filter(p => p.life > 0);

        ctx.save();
        if (shakeTimer > 0) {
            const sx = (Math.random() * 12 - 6);
            const sy = (Math.random() * 12 - 6);
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
