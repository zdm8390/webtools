/**
 * 10-Minute Survivors (10分サバイバーズ)
 * Pure HTML5 Canvas & Vanilla JavaScript Vampire Survivors-like game.
 */

// --- Sound Synthesizer via Web Audio API ---
class SoundSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playShoot() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playHit() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playGem() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playLevelUp() {
        if (this.muted || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.08);
            osc.stop(this.ctx.currentTime + idx * 0.08 + 0.2);
        });
    }

    playExplosion() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    playPlayerHurt() {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
}

// --- High Score Leaderboard Manager ---
class HighScoreManager {
    static STORAGE_KEY = '10min_survivors_scores';

    static getScores() {
        try {
            const raw = localStorage.getItem(HighScoreManager.STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static saveScore(scoreData) {
        const scores = HighScoreManager.getScores();
        scores.push({
            score: scoreData.score,
            timeStr: scoreData.timeStr,
            kills: scoreData.kills,
            level: scoreData.level,
            charIcon: scoreData.charIcon,
            date: new Date().toLocaleDateString()
        });
        scores.sort((a, b) => b.score - a.score);
        const top5 = scores.slice(0, 5);
        try {
            localStorage.setItem(HighScoreManager.STORAGE_KEY, JSON.stringify(top5));
        } catch (e) {}
        
        // Check if the current entry was added to top 5
        return top5.some(s => s.score === scoreData.score && s.timeStr === scoreData.timeStr && s.kills === scoreData.kills);
    }

    static renderLeaderboard(elementId) {
        const listEl = document.getElementById(elementId);
        if (!listEl) return;
        const scores = HighScoreManager.getScores();
        listEl.innerHTML = '';
        if (scores.length === 0) {
            listEl.innerHTML = '<li class="leaderboard-item" style="justify-content:center; color:#94a3b8;">記録がまだありません</li>';
            return;
        }

        scores.forEach((s, idx) => {
            const li = document.createElement('li');
            li.className = `leaderboard-item rank-${idx + 1}`;
            li.innerHTML = `
                <span><strong>#${idx + 1}</strong> ${s.charIcon || '🧙‍♂️'} Lv.${s.level} (${s.timeStr})</span>
                <span><strong>${s.score.toLocaleString()}</strong> pts / ${s.kills} kills</span>
            `;
            listEl.appendChild(li);
        });
    }
}

// --- Floating Damage Popup Text ---
class DamagePopup {
    constructor(x, y, damage, isCrit = false) {
        this.x = x + (Math.random() - 0.5) * 16;
        this.y = y + (Math.random() - 0.5) * 10;
        this.damage = Math.round(damage);
        this.isCrit = isCrit;
        this.life = 1.0; // Life from 1.0 to 0
        this.vy = -1.5 - Math.random() * 0.8;
        this.vx = (Math.random() - 0.5) * 0.8;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.025;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = this.isCrit ? '900 18px "Outfit", sans-serif' : '700 14px "Outfit", sans-serif';
        ctx.fillStyle = this.isCrit ? '#f59e0b' : '#ef4444';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(this.damage, this.x, this.y);
        ctx.restore();
    }
}

// --- Visual Particle ---
class Particle {
    constructor(x, y, symbol, color, size, duration = 20) {
        this.x = x;
        this.y = y;
        this.symbol = symbol;
        this.color = color;
        this.size = size;
        this.life = duration;
        this.maxLife = duration;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        if (this.symbol) {
            ctx.font = `${this.size}px sans-serif`;
            ctx.fillText(this.symbol, this.x, this.y);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// --- Experience Gem ---
class Gem {
    constructor(x, y, value = 1) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.symbol = value >= 5 ? '✨' : '💎';
        this.radius = 12;
        this.beingAttracted = false;
        this.speed = 0;
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < player.magnetRadius) {
            this.beingAttracted = true;
        }

        if (this.beingAttracted) {
            this.speed += 0.5;
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = this.value >= 5 ? '#f59e0b' : '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fillText(this.symbol, this.x, this.y);
        ctx.restore();
    }
}

// --- Enemy Class ---
class Enemy {
    constructor(x, y, type, gameTimeSec) {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Base Stats scaling with elapsed time
        const timeScale = 1 + (gameTimeSec / 120); // Scale up every 2 minutes
        
        switch (type) {
            case 'bat': // Fast, low HP
                this.symbol = '🦇';
                this.hp = Math.round(15 * timeScale);
                this.maxHp = this.hp;
                this.speed = 2.2 + Math.random() * 0.4;
                this.size = 20;
                this.damage = 8;
                this.xpValue = 1;
                break;
            case 'imp': // Standard
                this.symbol = '👾';
                this.hp = Math.round(30 * timeScale);
                this.maxHp = this.hp;
                this.speed = 1.6;
                this.size = 22;
                this.damage = 12;
                this.xpValue = 2;
                break;
            case 'skeleton': // Tanky
                this.symbol = '💀';
                this.hp = Math.round(75 * timeScale);
                this.maxHp = this.hp;
                this.speed = 1.1;
                this.size = 26;
                this.damage = 18;
                this.xpValue = 4;
                break;
            case 'boss': // Elite / Mid Boss
                this.symbol = gameTimeSec > 400 ? '🐉' : '👹';
                this.hp = Math.round(350 * timeScale);
                this.maxHp = this.hp;
                this.speed = 0.9;
                this.size = 36;
                this.damage = 30;
                this.xpValue = 15;
                break;
        }

        this.hitFlash = 0;
        this.vx = 0;
        this.vy = 0;
    }

    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Knockback decay
        this.vx *= 0.8;
        this.vy *= 0.8;

        this.x += (dx / dist) * this.speed + this.vx;
        this.y += (dy / dist) * this.speed + this.vy;

        if (this.hitFlash > 0) this.hitFlash--;
    }

    takeDamage(amount, knockbackDir = null) {
        this.hp -= amount;
        this.hitFlash = 4;
        if (knockbackDir) {
            this.vx += knockbackDir.x * 4;
            this.vy += knockbackDir.y * 4;
        }
        return this.hp <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.hitFlash > 0) {
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 12;
        }

        ctx.font = `${this.size}px sans-serif`;
        ctx.fillText(this.symbol, this.x, this.y);

        // HP bar for boss
        if (this.type === 'boss' && this.hp < this.maxHp) {
            const barW = 40;
            const barH = 5;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(this.x - barW / 2, this.y - this.size / 2 - 8, barW, barH);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(this.x - barW / 2, this.y - this.size / 2 - 8, barW * (this.hp / this.maxHp), barH);
        }

        ctx.restore();
    }
}

// --- Projectile Class ---
class Projectile {
    constructor(x, y, targetX, targetY, speed, damage, size, symbol, pierce = 1, explosionRadius = 0) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.damage = damage;
        this.size = size;
        this.symbol = symbol;
        this.pierce = pierce;
        this.explosionRadius = explosionRadius;

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.hypot(dx, dy) || 1;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;

        this.life = 180; // Lifespan in frames
        this.hitEnemies = new Set();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${this.size}px sans-serif`;
        ctx.fillText(this.symbol, this.x, this.y);
        ctx.restore();
    }
}

// --- Player Class ---
class Player {
    constructor(charType = 'wizard') {
        this.x = 0;
        this.y = 0;
        this.charType = charType;
        
        switch (charType) {
            case 'knight':
                this.symbol = '🗡️';
                this.maxHp = 130;
                this.speed = 3.2;
                this.areaMultiplier = 1.0;
                break;
            case 'ranger':
                this.symbol = '🏹';
                this.maxHp = 90;
                this.speed = 4.2;
                this.areaMultiplier = 1.0;
                break;
            case 'wizard':
            default:
                this.symbol = '🧙‍♂️';
                this.maxHp = 100;
                this.speed = 3.5;
                this.areaMultiplier = 1.2;
                break;
        }

        this.hp = this.maxHp;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 10;
        this.magnetRadius = 100;
        
        // Multipliers from upgrades
        this.damageMultiplier = 1.0;
        this.cooldownMultiplier = 1.0;
        this.speedMultiplier = 1.0;

        this.invulnerableFrames = 0;

        // Weapons and Skills
        this.skills = {}; // e.g. { knife: 1, orbit: 1 }
    }

    update(inputKeys) {
        let dx = 0;
        let dy = 0;

        if (inputKeys['w'] || inputKeys['W'] || inputKeys['ArrowUp']) dy -= 1;
        if (inputKeys['s'] || inputKeys['S'] || inputKeys['ArrowDown']) dy += 1;
        if (inputKeys['a'] || inputKeys['A'] || inputKeys['ArrowLeft']) dx -= 1;
        if (inputKeys['d'] || inputKeys['D'] || inputKeys['ArrowRight']) dx += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        const currentSpeed = this.speed * this.speedMultiplier;
        this.x += dx * currentSpeed;
        this.y += dy * currentSpeed;

        if (this.invulnerableFrames > 0) this.invulnerableFrames--;
    }

    takeDamage(amount) {
        if (this.invulnerableFrames > 0) return false;
        this.hp -= amount;
        this.invulnerableFrames = 30; // 0.5s invulnerability
        return true;
    }

    addXP(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level++;
            this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.35 + 5);
            return true; // Level up triggered
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Invulnerability flickering
        if (this.invulnerableFrames > 0 && Math.floor(this.invulnerableFrames / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        // Draw Player Symbol
        ctx.font = '32px sans-serif';
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 12;
        ctx.fillText(this.symbol, this.x, this.y);
        ctx.restore();
    }
}

// --- Main Game Engine ---
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = new SoundSystem();
        
        this.gameState = 'TITLE'; // TITLE, PLAYING, PAUSED, LEVELUP, GAMEOVER, VICTORY
        this.keys = {};
        
        this.maxGameTime = 600; // 10 minutes in seconds
        this.gameTime = 0;
        this.timerInterval = null;
        this.score = 0;
        this.kills = 0;

        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.gems = [];
        this.damagePopups = [];
        this.particles = [];

        // Weapon Cooldown Timers
        this.weaponTimers = {
            knife: 0,
            orbit: 0,
            lightning: 0,
            fireball: 0,
            holyring: 0
        };

        this.orbitAngle = 0;

        this.setupEventListeners();
        this.resizeCanvas();
        HighScoreManager.renderLeaderboard('title-leaderboard');
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());

        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (this.gameState === 'PLAYING') this.pauseGame();
                else if (this.gameState === 'PAUSED') this.resumeGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // UI Button Listeners
        document.getElementById('start-btn').addEventListener('click', () => {
            this.sound.init();
            const selectedCharCard = document.querySelector('.char-card.selected');
            const charType = selectedCharCard ? selectedCharCard.getAttribute('data-char') : 'wizard';
            this.startGame(charType);
        });

        document.querySelectorAll('.char-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            });
        });

        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.showTitleScreen());
        document.getElementById('sound-btn').addEventListener('click', (e) => {
            this.sound.muted = !this.sound.muted;
            e.target.textContent = this.sound.muted ? '🔇' : '🔊';
        });
        document.getElementById('retry-btn').addEventListener('click', () => {
            const charType = this.player ? this.player.charType : 'wizard';
            this.startGame(charType);
        });
        document.getElementById('title-return-btn').addEventListener('click', () => this.showTitleScreen());
    }

    startGame(charType) {
        this.gameState = 'PLAYING';
        this.gameTime = 0;
        this.score = 0;
        this.kills = 0;

        this.player = new Player(charType);
        
        // Give initial skill based on character
        if (charType === 'wizard') {
            this.player.skills['orbit'] = 1;
            this.player.skills['knife'] = 1;
        } else if (charType === 'knight') {
            this.player.skills['knife'] = 1;
            this.player.skills['power'] = 1;
        } else if (charType === 'ranger') {
            this.player.skills['lightning'] = 1;
            this.player.skills['speed'] = 1;
        }

        this.enemies = [];
        this.projectiles = [];
        this.gems = [];
        this.damagePopups = [];
        this.particles = [];

        this.updateHUD();
        this.updateActiveSkillsUI();

        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('pause-modal').classList.add('hidden');
        document.getElementById('level-up-modal').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.tickTimer(), 1000);

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    tickTimer() {
        if (this.gameState !== 'PLAYING') return;

        this.gameTime++;
        const remaining = Math.max(0, this.maxGameTime - this.gameTime);
        const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
        const secs = (remaining % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').textContent = `${mins}:${secs}`;

        if (remaining <= 0) {
            this.victory();
        }
    }

    pauseGame() {
        if (this.gameState !== 'PLAYING') return;
        this.gameState = 'PAUSED';
        document.getElementById('pause-modal').classList.remove('hidden');
    }

    resumeGame() {
        if (this.gameState !== 'PAUSED') return;
        this.gameState = 'PLAYING';
        document.getElementById('pause-modal').classList.add('hidden');
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    showTitleScreen() {
        this.gameState = 'TITLE';
        if (this.timerInterval) clearInterval(this.timerInterval);
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('pause-modal').classList.add('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('level-up-modal').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');
        HighScoreManager.renderLeaderboard('title-leaderboard');
    }

    // --- Enemy Spawning System ---
    spawnEnemies() {
        // Enemy cap scales with time up to 250
        const enemyCap = Math.min(250, 25 + Math.floor(this.gameTime * 0.35));
        if (this.enemies.length >= enemyCap) return;

        // Spawn chance scales with elapsed time
        const spawnChance = 0.08 + (this.gameTime / 600) * 0.25;
        if (Math.random() > spawnChance) return;

        // Spawn location off-screen around player
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.canvas.width, this.canvas.height) / 2 + 60;
        const spawnX = this.player.x + Math.cos(angle) * dist;
        const spawnY = this.player.y + Math.sin(angle) * dist;

        // Determine enemy type based on current time
        let type = 'bat';
        const rand = Math.random();
        
        if (this.gameTime < 60) {
            type = rand < 0.8 ? 'bat' : 'imp';
        } else if (this.gameTime < 240) {
            if (rand < 0.5) type = 'bat';
            else if (rand < 0.85) type = 'imp';
            else type = 'skeleton';
        } else {
            if (rand < 0.3) type = 'bat';
            else if (rand < 0.65) type = 'imp';
            else if (rand < 0.95) type = 'skeleton';
            else type = 'boss';
        }

        this.enemies.push(new Enemy(spawnX, spawnY, type, this.gameTime));
    }

    // --- Weapons & Auto Attack Processing ---
    processWeapons() {
        const skills = this.player.skills;
        const dmgMult = this.player.damageMultiplier;
        const areaMult = this.player.areaMultiplier;

        // 1. Knife (🗡️) - Shoots rapid piercing daggers at closest enemies
        if (skills['knife']) {
            this.weaponTimers.knife--;
            if (this.weaponTimers.knife <= 0) {
                const lvl = skills['knife'];
                const cd = Math.max(12, Math.round((55 - lvl * 5) * this.player.cooldownMultiplier));
                this.weaponTimers.knife = cd;

                const count = 1 + Math.floor(lvl / 2);
                const closest = this.getClosestEnemies(count);

                closest.forEach(target => {
                    const dmg = (18 + lvl * 6) * dmgMult;
                    const proj = new Projectile(this.player.x, this.player.y, target.x, target.y, 11, dmg, 22, '🗡️', 1 + Math.floor(lvl / 3));
                    this.projectiles.push(proj);
                });
                if (closest.length > 0) this.sound.playShoot();
            }
        }

        // 2. Orbit Orbs (🔮) - Rotating guardian balls around player
        if (skills['orbit']) {
            const lvl = skills['orbit'];
            this.orbitAngle += 0.04 + lvl * 0.005;
            const numOrbs = 2 + lvl;
            const orbitDist = (70 + lvl * 10) * areaMult;
            const dmg = (8 + lvl * 3) * dmgMult;

            for (let i = 0; i < numOrbs; i++) {
                const angle = this.orbitAngle + (i * Math.PI * 2 / numOrbs);
                const orbX = this.player.x + Math.cos(angle) * orbitDist;
                const orbY = this.player.y + Math.sin(angle) * orbitDist;

                // Check collision with enemies directly
                this.enemies.forEach(enemy => {
                    if (Math.hypot(enemy.x - orbX, enemy.y - orbY) < enemy.size + 12) {
                        const isCrit = Math.random() < 0.15;
                        const finalDmg = isCrit ? dmg * 1.8 : dmg;
                        const killed = enemy.takeDamage(finalDmg, { x: Math.cos(angle), y: Math.sin(angle) });
                        this.damagePopups.push(new DamagePopup(enemy.x, enemy.y, finalDmg, isCrit));
                        if (killed) this.handleEnemyKilled(enemy);
                    }
                });

                // Render Orbit Orbs
                this.ctx.save();
                this.ctx.font = '22px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.shadowColor = '#8b5cf6';
                this.ctx.shadowBlur = 10;
                this.ctx.fillText('🔮', orbX, orbY);
                this.ctx.restore();
            }
        }

        // 3. Lightning Strike (⚡) - Random thunderbolts
        if (skills['lightning']) {
            this.weaponTimers.lightning--;
            if (this.weaponTimers.lightning <= 0) {
                const lvl = skills['lightning'];
                const cd = Math.max(25, Math.round((90 - lvl * 8) * this.player.cooldownMultiplier));
                this.weaponTimers.lightning = cd;

                const targets = this.getRandomEnemies(1 + Math.floor(lvl / 2));
                targets.forEach(target => {
                    const dmg = (35 + lvl * 15) * dmgMult;
                    const killed = target.takeDamage(dmg);
                    this.damagePopups.push(new DamagePopup(target.x, target.y, dmg, true));
                    this.particles.push(new Particle(target.x, target.y, '⚡', '#f59e0b', 32, 15));
                    if (killed) this.handleEnemyKilled(target);
                });
                if (targets.length > 0) this.sound.playExplosion();
            }
        }

        // 4. Fireball (🔥) - Explosive projectles
        if (skills['fireball']) {
            this.weaponTimers.fireball--;
            if (this.weaponTimers.fireball <= 0) {
                const lvl = skills['fireball'];
                const cd = Math.max(30, Math.round((110 - lvl * 10) * this.player.cooldownMultiplier));
                this.weaponTimers.fireball = cd;

                const closest = this.getClosestEnemies(1);
                if (closest.length > 0) {
                    const target = closest[0];
                    const dmg = (25 + lvl * 10) * dmgMult;
                    const explosionR = (60 + lvl * 15) * areaMult;
                    const proj = new Projectile(this.player.x, this.player.y, target.x, target.y, 8, dmg, 24, '🔥', 1, explosionR);
                    this.projectiles.push(proj);
                    this.sound.playShoot();
                }
            }
        }

        // 5. Holy Ring Shockwave (💫) - Radial pulse
        if (skills['holyring']) {
            this.weaponTimers.holyring--;
            if (this.weaponTimers.holyring <= 0) {
                const lvl = skills['holyring'];
                const cd = Math.max(40, Math.round((140 - lvl * 12) * this.player.cooldownMultiplier));
                this.weaponTimers.holyring = cd;

                const radius = (120 + lvl * 30) * areaMult;
                const dmg = (20 + lvl * 8) * dmgMult;

                this.enemies.forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
                    if (dist < radius) {
                        const dx = enemy.x - this.player.x || 1;
                        const dy = enemy.y - this.player.y || 1;
                        const d = Math.hypot(dx, dy);
                        const killed = enemy.takeDamage(dmg, { x: dx / d, y: dy / d });
                        this.damagePopups.push(new DamagePopup(enemy.x, enemy.y, dmg, false));
                        if (killed) this.handleEnemyKilled(enemy);
                    }
                });

                this.particles.push(new Particle(this.player.x, this.player.y, '💫', '#06b6d4', Math.round(radius), 18));
                this.sound.playHit();
            }
        }
    }

    getClosestEnemies(count) {
        return [...this.enemies]
            .sort((a, b) => {
                const da = Math.hypot(a.x - this.player.x, a.y - this.player.y);
                const db = Math.hypot(b.x - this.player.x, b.y - this.player.y);
                return da - db;
            })
            .slice(0, count);
    }

    getRandomEnemies(count) {
        const shuffled = [...this.enemies].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    handleEnemyKilled(enemy) {
        this.kills++;
        this.score += enemy.xpValue * 10;
        this.gems.push(new Gem(enemy.x, enemy.y, enemy.xpValue));
        this.particles.push(new Particle(enemy.x, enemy.y, null, '#ef4444', 3, 12));
    }

    // --- Main Game Loop ---
    gameLoop(timestamp) {
        if (this.gameState !== 'PLAYING') return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Camera Offset (Keep player centered)
        const cameraX = this.canvas.width / 2 - this.player.x;
        const cameraY = this.canvas.height / 2 - this.player.y;

        this.ctx.save();
        this.ctx.translate(cameraX, cameraY);

        // 1. Draw Grid Background
        this.drawBackground();

        // 2. Update & Draw Player
        this.player.update(this.keys);
        this.player.draw(this.ctx);

        // 3. Spawn & Update Enemies
        this.spawnEnemies();
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.player);
            enemy.draw(this.ctx);

            // Collision with player
            if (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) < enemy.size / 2 + 12) {
                if (this.player.takeDamage(enemy.damage)) {
                    this.sound.playPlayerHurt();
                    this.updateHUD();
                    if (this.player.hp <= 0) {
                        this.gameOver();
                        this.ctx.restore();
                        return;
                    }
                }
            }
        }

        // 4. Process Weapons & Projectiles
        this.processWeapons();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.update();
            proj.draw(this.ctx);

            // Projectile - Enemy Collision
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (proj.hitEnemies.has(enemy)) continue;

                if (Math.hypot(enemy.x - proj.x, enemy.y - proj.y) < enemy.size / 2 + proj.size / 2) {
                    proj.hitEnemies.add(enemy);
                    const isCrit = Math.random() < 0.2;
                    const dmg = isCrit ? proj.damage * 1.7 : proj.damage;
                    const killed = enemy.takeDamage(dmg);
                    this.damagePopups.push(new DamagePopup(enemy.x, enemy.y, dmg, isCrit));
                    this.sound.playHit();

                    // Explosive projectile
                    if (proj.explosionRadius > 0) {
                        this.particles.push(new Particle(proj.x, proj.y, '💥', '#f59e0b', Math.round(proj.explosionRadius), 15));
                        this.enemies.forEach(e => {
                            if (Math.hypot(e.x - proj.x, e.y - proj.y) < proj.explosionRadius) {
                                const ekilled = e.takeDamage(proj.damage * 0.7);
                                if (ekilled) this.handleEnemyKilled(e);
                            }
                        });
                        this.sound.playExplosion();
                    }

                    if (killed) this.handleEnemyKilled(enemy);

                    proj.pierce--;
                    if (proj.pierce <= 0) {
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }

            if (proj.life <= 0 && this.projectiles[i] === proj) {
                this.projectiles.splice(i, 1);
            }
        }

        // 5. Update & Draw Gems
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            gem.update(this.player);
            gem.draw(this.ctx);

            if (Math.hypot(gem.x - this.player.x, gem.y - this.player.y) < 20) {
                this.sound.playGem();
                const leveledUp = this.player.addXP(gem.value);
                this.gems.splice(i, 1);
                this.updateHUD();

                if (leveledUp) {
                    this.triggerLevelUp();
                    this.ctx.restore();
                    return;
                }
            }
        }

        // 6. Update & Draw Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            p.draw(this.ctx);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // 7. Update & Draw Floating Damage Texts
        for (let i = this.damagePopups.length - 1; i >= 0; i--) {
            const popup = this.damagePopups[i];
            popup.update();
            popup.draw(this.ctx);
            if (popup.life <= 0) this.damagePopups.splice(i, 1);
        }

        this.ctx.restore();

        this.updateHUD();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    drawBackground() {
        const gridSize = 80;
        const startX = Math.floor((this.player.x - this.canvas.width) / gridSize) * gridSize;
        const endX = Math.ceil((this.player.x + this.canvas.width) / gridSize) * gridSize;
        const startY = Math.floor((this.player.y - this.canvas.height) / gridSize) * gridSize;
        const endY = Math.ceil((this.player.y + this.canvas.height) / gridSize) * gridSize;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();
    }

    updateHUD() {
        document.getElementById('kill-display').textContent = this.kills;
        document.getElementById('score-display').textContent = this.score.toLocaleString();
        document.getElementById('level-display').textContent = `Lv.${this.player.level}`;

        const xpPct = Math.min(100, (this.player.xp / this.player.xpToNextLevel) * 100);
        document.getElementById('xp-bar-inner').style.width = `${xpPct}%`;
        document.getElementById('xp-text').textContent = `${this.player.xp} / ${this.player.xpToNextLevel} XP`;

        const hpPct = Math.max(0, Math.min(100, (this.player.hp / this.player.maxHp) * 100));
        document.getElementById('hp-bar-inner').style.width = `${hpPct}%`;
        document.getElementById('hp-text').textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    }

    updateActiveSkillsUI() {
        const container = document.getElementById('active-skills-bar');
        container.innerHTML = '';

        const skillIcons = {
            knife: '🗡️',
            orbit: '🔮',
            lightning: '⚡',
            fireball: '🔥',
            holyring: '💫',
            power: '⚔️',
            haste: '⏱️',
            speed: '👟',
            area: '❇️',
            magnet: '🧲'
        };

        Object.keys(this.player.skills).forEach(key => {
            const badge = document.createElement('div');
            badge.className = 'skill-icon-badge';
            badge.innerHTML = `${skillIcons[key] || '✦'}<span class="skill-lvl-tag">v${this.player.skills[key]}</span>`;
            container.appendChild(badge);
        });
    }

    // --- Level Up Modal & Skill Choice ---
    triggerLevelUp() {
        this.gameState = 'LEVELUP';
        this.sound.playLevelUp();

        const allUpgrades = [
            { id: 'knife', title: '魔法剣', icon: '🗡️', desc: '最寄りの敵に向けて高速飛翔する剣を発射する' },
            { id: 'orbit', title: 'ガーディアン球', icon: '🔮', desc: '自身の周囲を旋回して近づく敵をなぎ払う' },
            { id: 'lightning', title: '聖なる雷撃', icon: '⚡', desc: 'ランダムな敵の頭上に強烈な落雷を落とす' },
            { id: 'fireball', title: '爆炎の火球', icon: '🔥', desc: '着弾時に広範囲爆発を起こす火球を発射する' },
            { id: 'holyring', title: '聖なる衝撃波', icon: '💫', desc: '全方向に拡大する波動を定期的に放つ' },
            { id: 'power', title: '攻撃力強化', icon: '⚔️', desc: 'すべての攻撃の与ダメージが20%増加する' },
            { id: 'haste', title: '攻撃頻度強化', icon: '⏱️', desc: '武器の攻撃クールダウンを15%短縮する' },
            { id: 'speed', title: '移動速度強化', icon: '👟', desc: 'プレイヤーの移動速度が15%上昇する' },
            { id: 'area', title: '攻撃範囲強化', icon: '❇️', desc: '武器の攻撃範囲・爆発サイズが20%拡大する' },
            { id: 'magnet', title: '吸引磁力強化', icon: '🧲', desc: '経験値ジェムの自動引き寄せ範囲が40%拡大する' },
            { id: 'heal', title: '生命の泉', icon: '❤️', desc: '最大HPを20増やし、HPを全回復する' }
        ];

        // Shuffle & pick 3
        const pool = [...allUpgrades].sort(() => 0.5 - Math.random());
        const choices = pool.slice(0, 3);

        const container = document.getElementById('upgrade-cards');
        container.innerHTML = '';

        choices.forEach(upg => {
            const currentLvl = this.player.skills[upg.id] || 0;
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="card-icon">${upg.icon}</div>
                <div class="card-title">${upg.title}</div>
                <div class="card-level-badge">${currentLvl > 0 ? `Lv.${currentLvl} → Lv.${currentLvl + 1}` : '新規獲得'}</div>
                <div class="card-desc">${upg.desc}</div>
            `;

            card.addEventListener('click', () => {
                this.applyUpgrade(upg.id);
                document.getElementById('level-up-modal').classList.add('hidden');
                this.gameState = 'PLAYING';
                requestAnimationFrame((ts) => this.gameLoop(ts));
            });

            container.appendChild(card);
        });

        document.getElementById('level-up-modal').classList.remove('hidden');
    }

    applyUpgrade(id) {
        if (id === 'power') {
            this.player.damageMultiplier += 0.2;
        } else if (id === 'haste') {
            this.player.cooldownMultiplier *= 0.85;
        } else if (id === 'speed') {
            this.player.speedMultiplier += 0.15;
        } else if (id === 'area') {
            this.player.areaMultiplier += 0.2;
        } else if (id === 'magnet') {
            this.player.magnetRadius *= 1.4;
        } else if (id === 'heal') {
            this.player.maxHp += 20;
            this.player.hp = this.player.maxHp;
        } else {
            // Weapon upgrades
            this.player.skills[id] = (this.player.skills[id] || 0) + 1;
        }

        this.updateActiveSkillsUI();
    }

    // --- Game Over & Victory ---
    gameOver() {
        this.gameState = 'GAMEOVER';
        if (this.timerInterval) clearInterval(this.timerInterval);

        const mins = Math.floor(this.gameTime / 60).toString().padStart(2, '0');
        const secs = (this.gameTime % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;

        const isNewRecord = HighScoreManager.saveScore({
            score: this.score,
            timeStr: timeStr,
            kills: this.kills,
            level: this.player.level,
            charIcon: this.player.symbol
        });

        document.getElementById('result-badge').className = 'result-badge defeat';
        document.getElementById('result-badge').textContent = 'GAME OVER';
        document.getElementById('result-title').textContent = '討ち取られた...';
        document.getElementById('result-subtitle').textContent = 'モンスターの群れに呑み込まれてしまった';

        document.getElementById('res-time').textContent = timeStr;
        document.getElementById('res-score').textContent = this.score.toLocaleString();
        document.getElementById('res-kills').textContent = this.kills;
        document.getElementById('res-level').textContent = `Lv.${this.player.level}`;

        const tag = document.getElementById('new-record-tag');
        if (isNewRecord) tag.classList.remove('hidden');
        else tag.classList.add('hidden');

        HighScoreManager.renderLeaderboard('result-leaderboard');
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    victory() {
        this.gameState = 'VICTORY';
        if (this.timerInterval) clearInterval(this.timerInterval);

        const timeStr = '10:00';
        const isNewRecord = HighScoreManager.saveScore({
            score: this.score + 10000, // Victory Bonus!
            timeStr: timeStr,
            kills: this.kills,
            level: this.player.level,
            charIcon: this.player.symbol
        });

        document.getElementById('result-badge').className = 'result-badge victory';
        document.getElementById('result-badge').textContent = 'VICTORY SURVIVED';
        document.getElementById('result-title').textContent = '伝説の生還！';
        document.getElementById('result-subtitle').textContent = '見事に10分間の波乱を乗り越えた！';

        document.getElementById('res-time').textContent = timeStr;
        document.getElementById('res-score').textContent = (this.score + 10000).toLocaleString();
        document.getElementById('res-kills').textContent = this.kills;
        document.getElementById('res-level').textContent = `Lv.${this.player.level}`;

        const tag = document.getElementById('new-record-tag');
        if (isNewRecord) tag.classList.remove('hidden');
        else tag.classList.add('hidden');

        HighScoreManager.renderLeaderboard('result-leaderboard');
        document.getElementById('game-over-modal').classList.remove('hidden');
    }
}

// Initialize on Window Load
window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
