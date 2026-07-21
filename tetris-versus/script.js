/**
 * ==========================================================================
 * 『テトリスン』(Tetrisun) - Core Game Engine & Application Logic
 *  - Master Production Version (10-Iteration Multi-Persona Polished)
 *  - Features: Achievements, PPS Tracker, Perfect Clear, B2B, Cute Onomatopoeia,
 *              Beginner Guide, Custom Keybinds, Ending Staffroll & Dynamic Audio
 * ==========================================================================
 */

'use strict';

/* --- Canvas roundRect Polyfill for Universal Compatibility --- */
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        let r = radii;
        if (typeof r === 'number') r = [r, r, r, r];
        else if (!Array.isArray(r)) r = [0, 0, 0, 0];
        const topL = r[0] || 0, topR = r[1] || r[0] || 0, botR = r[2] || r[0] || 0, botL = r[3] || r[1] || r[0] || 0;
        this.beginPath();
        this.moveTo(x + topL, y);
        this.lineTo(x + w - topR, y);
        this.quadraticCurveTo(x + w, y, x + w, y + topR);
        this.lineTo(x + w, y + h - botR);
        this.quadraticCurveTo(x + w, y, x + w - botR, y + h);
        this.lineTo(x + botL, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - botL);
        this.lineTo(x, y + topL);
        this.quadraticCurveTo(x, y, x + topL, y);
        this.closePath();
        return this;
    };
}

/* --------------------------------------------------------------------------
   1. Data Specifications: Characters & Magic Definitions
   -------------------------------------------------------------------------- */
const CHARACTERS = {
    nekonya: {
        id: 'nekonya',
        name: 'ネコニャー',
        animal: '猫',
        emoji: '🐱',
        img: 'assets/nekonya.jpg',
        color: '#FFB7C5',
        desc: '気まぐれだけどすばやいパズルが得意なニャンコ！',
        quote: '「ニャんてね！気まぐれにいくニャ！」',
        magicEffectText: '奇数行からランダム3行を消去！',
        magicDesc: '自身の盤面の奇数行（1, 3, 5行目等）からランダムに3行分を消去する。'
    },
    inuwan: {
        id: 'inuwan',
        name: 'イヌワン',
        animal: '犬',
        emoji: '🐶',
        img: 'assets/inuwan.jpg',
        color: '#FFDF80',
        desc: '忠実で頼もしいワンコ！お邪魔ブロックを打ち返す！',
        quote: '「待ったワン！そのままお返しだワン！」',
        magicEffectText: 'お邪魔ブロックを相手に3行押し戻す！',
        magicDesc: '現在自分の盤面にあるお邪魔行をそのまま相手に押し戻す（最大3行）。'
    },
    torichun: {
        id: 'torichun',
        name: 'トリチュン',
        animal: '鳥',
        emoji: '🐤',
        img: 'assets/torichun.jpg',
        color: '#A8E6CF',
        desc: 'パタパタお空を飛ぶ鳥の歌姫！上からお掃除！',
        quote: '「お空から綺麗にお掃除チュン♪」',
        magicEffectText: '盤面の最上段から3行を消去！',
        magicDesc: '自身の盤面の最上段から3行分のブロックを消去する。'
    },
    sarukkey: {
        id: 'sarukkey',
        name: 'サルウッキー',
        animal: '猿',
        emoji: '🐵',
        img: 'assets/sarukkey.jpg',
        color: '#FFD3B6',
        desc: 'お調子者のサル！四角いテトリミノの嵐を起こす！',
        quote: '「ウッキッキー！四角で埋め尽くすウキ！」',
        magicEffectText: '3回連続で O型（四角）出現！',
        magicDesc: '次に出現するテトリミノが3回連続で「O型（四角）」に固定化される。'
    },
    tanupon: {
        id: 'tanupon',
        name: 'タヌポン',
        animal: 'タヌキ',
        emoji: '🦝',
        img: 'assets/tanupon.jpg',
        color: '#CBA6D7',
        desc: 'ドロンと化けるいたずらタヌキ！一瞬でリセット！',
        quote: '「ドロン！一瞬でぜんぶリセットポン！」',
        magicEffectText: 'お互いの盤面を完全リセット！',
        magicDesc: 'お互い（自分と相手）のステージ盤面を完全に空の初期状態へ戻す。'
    },
    kitsunekon: {
        id: 'kitsunekon',
        name: 'キツネコン',
        animal: '狐',
        emoji: '🦊',
        img: 'assets/kitsunekon.jpg',
        color: '#AEC6CF',
        desc: 'ミステリアスな忍者狐！相手と盤面をスワップ！',
        quote: '「狐の空蝉... 盤面を入れ替えるコン！」',
        magicEffectText: '自分と相手の盤面を丸ごと交換！',
        magicDesc: '自分の盤面状態と相手の盤面状態をそのまま入れ替える。'
    },
    dragogon: {
        id: 'dragogon',
        name: 'ドラゴゴン',
        animal: '竜',
        emoji: '🐲',
        img: 'assets/dragogon.jpg',
        color: '#FF7B9C',
        desc: '伝説の小竜！強力なブレスで下部を焼き尽くす！',
        quote: '「ガオーッ！熱々ブレスで焼き尽くすゴン！」',
        magicEffectText: '盤面の下部から5行を豪快消去！',
        magicDesc: '自身の盤面の下部から5行分のブロックを強力に消去する。'
    }
};

/* Tetrimino Definitions */
const TETRIMINOS = {
    I: { color: '#74D2E7', shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
    J: { color: '#89CFF0', shape: [[1,0,0],[1,1,1],[0,0,0]] },
    L: { color: '#FFD3B6', shape: [[0,0,1],[1,1,1],[0,0,0]] },
    O: { color: '#FFDF80', shape: [[1,1],[1,1]] },
    S: { color: '#A8E6CF', shape: [[0,1,1],[1,1,0],[0,0,0]] },
    T: { color: '#CBA6D7', shape: [[0,1,0],[1,1,1],[0,0,0]] },
    Z: { color: '#FFAAA5', shape: [[1,1,0],[0,1,1],[0,0,0]] }
};

/* SRS Rotation Wall-Kick Offsets */
const WALLKICK_JLSTZ = [
    [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    [[0,0], [1,0], [1,-1], [0,2], [1,2]],
    [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
    [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
    [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
    [[0,0], [1,0], [1,1], [0,-2], [1,-2]]
];

const WALLKICK_I = [
    [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
    [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
    [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
    [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
    [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
    [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
    [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
    [[0,0], [-1,0], [2,0], [-1,2], [2,-1]]
];


/* --------------------------------------------------------------------------
   2. Audio Engine (Extended Synthesizer + Fanfare)
   -------------------------------------------------------------------------- */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.bgmVolume = 0.7;
        this.seVolume = 0.8;
        this.bgmTimer = null;
        this.isPlayingBgm = false;
        this.isDangerBgm = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(e => console.warn('AudioContext resume policy:', e));
        }
    }

    playPopSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(this.seVolume * 0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playHoldSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(520, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(780, this.ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(this.seVolume * 0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.07);
    }

    playAchievementSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(this.seVolume * 0.35, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.2);
        });
    }

    playPerfectClearSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            gain.gain.setValueAtTime(this.seVolume * 0.4, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.25);
        });
    }

    playLevelUpSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.04);
            gain.gain.setValueAtTime(this.seVolume * 0.35, now + i * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.04);
            osc.stop(now + i * 0.04 + 0.12);
        });
    }

    playTspinSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const now = this.ctx.currentTime;
        const notes = [659.25, 880, 1174.66];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            gain.gain.setValueAtTime(this.seVolume * 0.4, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.15);
        });
    }

    playRotateSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(this.seVolume * 0.35, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
    }

    playDropSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(this.seVolume * 0.45, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playGarbageWarnSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(this.seVolume * 0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playVictorySE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(this.seVolume * 0.4, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.3);
        });
    }

    playLineClearSE(lines = 1) {
        if (!this.ctx || this.seVolume <= 0) return;
        const now = this.ctx.currentTime;
        const baseFreq = lines >= 4 ? 523.25 : 440;
        const count = lines >= 4 ? 6 : 3;
        for (let i = 0; i < count; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(baseFreq * Math.pow(1.25, i), now + i * 0.05);
            gain.gain.setValueAtTime(this.seVolume * 0.3, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.12);
        }
    }

    playMagicSE() {
        if (!this.ctx || this.seVolume <= 0) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        gain.gain.setValueAtTime(this.seVolume * 0.4, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playCountdownSE(pitch = 1) {
        if (!this.ctx || this.seVolume <= 0) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 * pitch, this.ctx.currentTime);
        gain.gain.setValueAtTime(this.seVolume * 0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    setDangerMode(isDanger) {
        this.isDangerBgm = isDanger;
    }

    startBgm() {
        if (this.isPlayingBgm) return;
        this.init();
        this.isPlayingBgm = true;
        let step = 0;
        const melodyNormal = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 392.00, 293.66];
        const melodyDanger = [349.23, 440.00, 523.25, 659.25, 587.33, 440.00, 493.88, 349.23];

        this.bgmTimer = setInterval(() => {
            if (!this.isPlayingBgm || this.bgmVolume <= 0 || !this.ctx) return;
            const melody = this.isDangerBgm ? melodyDanger : melodyNormal;
            const freq = melody[step % melody.length];
            step++;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = this.isDangerBgm ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(this.bgmVolume * 0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.18);
        }, this.isDangerBgm ? 150 : 220);
    }

    stopBgm() {
        this.isPlayingBgm = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}


/* --------------------------------------------------------------------------
   3. Single Player Board Engine (PPS, Perfect Clear, B2B, Onomatopoeia)
   -------------------------------------------------------------------------- */
class TetrisGame {
    constructor(playerId, isCpu = false) {
        this.playerId = playerId;
        this.isCpu = isCpu;
        this.cols = 10;
        this.rows = 20;
        this.grid = this.createGrid();

        this.score = 0;
        this.lines = 0;
        this.ren = 0;
        this.level = 1;

        // Gamer & Purist Metrics
        this.piecesPlaced = 0;
        this.gameStartTime = 0;
        this.pps = 0.0;
        this.b2bCount = 0;

        this.bag = [];
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.rotationState = 0;
        this.lastMoveWasRotate = false;

        this.nextQueue = [];
        this.holdPiece = null;
        this.canHold = true;

        this.garbageQueue = 0;
        this.magicGauge = 0;
        this.barrierTimer = 0;
        this.forceIPieces = 0;
        this.forceOPieces = 0;

        this.lockDelay = 700;
        this.lockTimer = 0;
        this.lockResetCount = 0;
        this.isGrounded = false;

        this.animatingClearRows = [];
        this.clearAnimTimer = 0;

        this.particles = [];
        this.onomatopoeias = []; // Cute Onomatopoeia Popups
        this.hardDropFlashTimer = 0;

        this.isGameOver = false;
        this.isPaused = false;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.onLineClear = null;
        this.onSendGarbage = null;
        this.onTspin = null;
        this.onLevelUp = null;
        this.onPerfectClear = null;
    }

    createGrid() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    }

    reset() {
        this.grid = this.createGrid();
        this.score = 0;
        this.lines = 0;
        this.ren = 0;
        this.level = 1;
        this.piecesPlaced = 0;
        this.gameStartTime = performance.now();
        this.pps = 0.0;
        this.b2bCount = 0;

        this.bag = [];
        this.nextQueue = [];
        this.holdPiece = null;
        this.canHold = true;
        this.garbageQueue = 0;
        this.magicGauge = 0;
        this.barrierTimer = 0;
        this.forceIPieces = 0;
        this.forceOPieces = 0;
        this.lockTimer = 0;
        this.lockResetCount = 0;
        this.isGrounded = false;
        this.lastMoveWasRotate = false;
        this.animatingClearRows = [];
        this.clearAnimTimer = 0;
        this.particles = [];
        this.onomatopoeias = [];
        this.hardDropFlashTimer = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.dropInterval = 1000;

        this.refillBag();
        for (let i = 0; i < 6; i++) {
            this.nextQueue.push(this.drawFromBag());
        }
        this.spawnPiece();
    }

    refillBag() {
        const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }
        this.bag.push(...types);
    }

    drawFromBag() {
        if (this.bag.length < 7) this.refillBag();
        return this.bag.shift();
    }

    spawnPiece() {
        let type;
        if (this.forceIPieces > 0) {
            type = 'I';
            this.forceIPieces--;
        } else if (this.forceOPieces > 0) {
            type = 'O';
            this.forceOPieces--;
        } else {
            type = this.nextQueue.shift();
            this.nextQueue.push(this.drawFromBag());
        }

        const template = TETRIMINOS[type];
        this.currentPiece = {
            type: type,
            color: template.color,
            shape: template.shape.map(row => [...row])
        };
        this.rotationState = 0;
        this.currentX = Math.floor((this.cols - this.currentPiece.shape[0].length) / 2);
        this.currentY = 0;
        this.canHold = true;
        this.lastMoveWasRotate = false;

        this.lockTimer = 0;
        this.lockResetCount = 0;
        this.isGrounded = this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1);

        if (this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY)) {
            this.isGameOver = true;
        }
    }

    checkCollision(shape, x, y) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const newX = x + c;
                    const newY = y + r;
                    if (newX < 0 || newX >= this.cols || newY >= this.rows) return true;
                    if (newY >= 0 && this.grid[newY][newX] !== null) return true;
                }
            }
        }
        return false;
    }

    onPieceManipulated() {
        if (this.isGrounded && this.lockResetCount < 10) {
            this.lockTimer = 0;
            this.lockResetCount++;
        }
    }

    rotatePiece(dir = 1) {
        if (!this.currentPiece || this.clearAnimTimer > 0) return false;
        const oldShape = this.currentPiece.shape;
        const size = oldShape.length;
        const newShape = Array.from({ length: size }, () => Array(size).fill(0));

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (dir === 1) newShape[c][size - 1 - r] = oldShape[r][c];
                else newShape[size - 1 - c][r] = oldShape[r][c];
            }
        }

        const oldRotation = this.rotationState;
        const newRotation = (oldRotation + dir + 4) % 4;
        const kickTable = (this.currentPiece.type === 'I') ? WALLKICK_I : WALLKICK_JLSTZ;
        const kickIndex = (oldRotation * 2) + (dir === 1 ? 0 : 1);
        const offsets = kickTable[kickIndex] || [[0,0]];

        for (let [dx, dy] of offsets) {
            if (!this.checkCollision(newShape, this.currentX + dx, this.currentY - dy)) {
                this.currentPiece.shape = newShape;
                this.currentX += dx;
                this.currentY -= dy;
                this.rotationState = newRotation;
                this.isGrounded = this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1);
                this.lastMoveWasRotate = true;
                this.onPieceManipulated();
                return true;
            }
        }
        return false;
    }

    moveLeft() {
        if (this.clearAnimTimer > 0) return false;
        if (!this.checkCollision(this.currentPiece.shape, this.currentX - 1, this.currentY)) {
            this.currentX--;
            this.isGrounded = this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1);
            this.lastMoveWasRotate = false;
            this.onPieceManipulated();
            return true;
        }
        return false;
    }

    moveRight() {
        if (this.clearAnimTimer > 0) return false;
        if (!this.checkCollision(this.currentPiece.shape, this.currentX + 1, this.currentY)) {
            this.currentX++;
            this.isGrounded = this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1);
            this.lastMoveWasRotate = false;
            this.onPieceManipulated();
            return true;
        }
        return false;
    }

    softDrop() {
        if (this.clearAnimTimer > 0) return false;
        if (!this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1)) {
            this.currentY++;
            this.score += 1;
            this.isGrounded = this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1);
            this.lastMoveWasRotate = false;
            return true;
        } else {
            this.isGrounded = true;
        }
        return false;
    }

    hardDrop() {
        if (this.clearAnimTimer > 0) return;
        let droppedLines = 0;
        while (!this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1)) {
            this.currentY++;
            droppedLines++;
        }
        this.score += droppedLines * 2;

        this.spawnHardDropParticles(this.currentX, this.currentY, this.currentPiece.shape, this.currentPiece.color);
        this.hardDropFlashTimer = 180;
        this.spawnOnomatopoeia(this.currentX * 24 + 40, this.currentY * 24, 'すとん♪', '#FF7B9C');

        this.lockPiece();
    }

    spawnOnomatopoeia(x, y, text, color) {
        this.onomatopoeias.push({
            x: x,
            y: y,
            text: text,
            color: color,
            alpha: 1,
            life: 600
        });
    }

    checkTspin() {
        if (!this.currentPiece || this.currentPiece.type !== 'T' || !this.lastMoveWasRotate) return false;
        const cx = this.currentX + 1;
        const cy = this.currentY + 1;
        let occupiedCorners = 0;

        const corners = [[cx-1, cy-1], [cx+1, cy-1], [cx-1, cy+1], [cx+1, cy+1]];
        for (let [x, y] of corners) {
            if (x < 0 || x >= this.cols || y >= this.rows || (y >= 0 && this.grid[y][x] !== null)) {
                occupiedCorners++;
            }
        }
        return occupiedCorners >= 3;
    }

    spawnHardDropParticles(x, y, shape, color) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const px = (x + c) * 24 + 12;
                    const py = (y + r) * 24 + 12;
                    for (let p = 0; p < 3; p++) {
                        this.particles.push({
                            x: px,
                            y: py,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.8) * 5,
                            color: color,
                            alpha: 1,
                            life: 200 + Math.random() * 100
                        });
                    }
                }
            }
        }
    }

    updateParticles(dt) {
        if (this.hardDropFlashTimer > 0) this.hardDropFlashTimer -= dt;

        // Update Particle Life
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / 300);
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update Onomatopoeia Life
        for (let i = this.onomatopoeias.length - 1; i >= 0; i--) {
            const o = this.onomatopoeias[i];
            o.y -= 0.5;
            o.life -= dt;
            o.alpha = Math.max(0, o.life / 600);
            if (o.life <= 0) this.onomatopoeias.splice(i, 1);
        }
    }

    getGhostY() {
        if (!this.currentPiece) return 0;
        let ghostY = this.currentY;
        while (!this.checkCollision(this.currentPiece.shape, this.currentX, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    hold() {
        if (!this.canHold || !this.currentPiece || this.clearAnimTimer > 0) return;
        const currentType = this.currentPiece.type;
        if (!this.holdPiece) {
            this.holdPiece = currentType;
            this.spawnPiece();
        } else {
            const temp = this.holdPiece;
            this.holdPiece = currentType;
            const template = TETRIMINOS[temp];
            this.currentPiece = {
                type: temp,
                color: template.color,
                shape: template.shape.map(r => [...r])
            };
            this.currentX = Math.floor((this.cols - this.currentPiece.shape[0].length) / 2);
            this.currentY = 0;
        }
        this.canHold = false;
    }

    lockPiece() {
        if (!this.currentPiece) return;
        const isTspin = this.checkTspin();

        // Increment Placed Counter for PPS Metric
        this.piecesPlaced++;
        const elapsedSec = (performance.now() - this.gameStartTime) / 1000;
        if (elapsedSec > 0) this.pps = (this.piecesPlaced / elapsedSec).toFixed(2);

        const shape = this.currentPiece.shape;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const gy = this.currentY + r;
                    const gx = this.currentX + c;
                    if (gy >= 0 && gy < this.rows) {
                        this.grid[gy][gx] = { color: this.currentPiece.color, isGarbage: false };
                    }
                }
            }
        }

        const fullRows = [];
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.grid[r].every(cell => cell !== null)) {
                fullRows.push(r);
            }
        }

        if (isTspin && this.onTspin) {
            this.onTspin(fullRows.length);
        }

        if (fullRows.length > 0) {
            this.startRowClearAnimation(fullRows, 400);
        } else {
            this.ren = 0;
            if (this.garbageQueue > 0) {
                this.riseGarbage(this.garbageQueue);
                this.garbageQueue = 0;
            }
            this.spawnPiece();
        }
    }

    startRowClearAnimation(rows, duration = 400) {
        this.animatingClearRows = rows;
        this.clearAnimTimer = duration;
    }

    finishRowClearAnimation() {
        const cleared = this.animatingClearRows.length;
        if (cleared > 0) {
            this.animatingClearRows.sort((a, b) => a - b);
            this.animatingClearRows.forEach(r => {
                this.grid.splice(r, 1);
                this.grid.unshift(Array(this.cols).fill(null));
            });

            this.ren++;
            this.lines += cleared;
            this.score += [0, 100, 300, 500, 800][Math.min(4, cleared)] * this.level;

            // Onomatopoeia Popups
            const oText = cleared >= 4 ? 'ばばーん！！✨' : (cleared >= 2 ? 'どかーん！🔥' : 'きらーん★');
            this.spawnOnomatopoeia(80, 200, oText, '#FFDF80');

            // Perfect Clear Check
            const isBoardEmpty = this.grid.every(r => r.every(c => c === null));
            if (isBoardEmpty) {
                this.score += 2000;
                if (this.onPerfectClear) this.onPerfectClear();
            }
            
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                if (this.onLevelUp) this.onLevelUp(this.level);
            }

            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 80);

            if (this.onLineClear) this.onLineClear(cleared);

            let sentGarbage = 0;
            if (cleared === 2) sentGarbage = 1;
            else if (cleared === 3) sentGarbage = 2;
            else if (cleared >= 4) sentGarbage = 4;
            if (this.ren > 1) sentGarbage += (this.ren - 1);

            if (this.garbageQueue > 0) {
                if (sentGarbage >= this.garbageQueue) {
                    sentGarbage -= this.garbageQueue;
                    this.garbageQueue = 0;
                } else {
                    this.garbageQueue -= sentGarbage;
                    sentGarbage = 0;
                }
            }

            if (sentGarbage > 0 && this.onSendGarbage) {
                this.onSendGarbage(sentGarbage);
            }
        }

        this.animatingClearRows = [];
        this.clearAnimTimer = 0;
        this.spawnPiece();
    }

    riseGarbage(count) {
        for (let i = 0; i < count; i++) {
            this.grid.shift();
            const hole = Math.floor(Math.random() * this.cols);
            const row = Array(this.cols).fill(null).map((_, c) => c === hole ? null : { color: '#CBD5E1', isGarbage: true });
            this.grid.push(row);
        }
    }

    receiveGarbage(lines) {
        if (this.barrierTimer > 0) return;
        this.garbageQueue += lines;
        this.magicGauge = Math.min(100, this.magicGauge + lines * 15);
    }
}


/* --------------------------------------------------------------------------
   4. CPU AI Logic Engine
   -------------------------------------------------------------------------- */
class CpuAI {
    constructor(game, difficulty = 'normal') {
        this.game = game;
        this.difficulty = difficulty;
        this.lastMoveTime = 0;
        this.target = null;
    }

    update(now) {
        if (!this.game || this.game.isGameOver || !this.game.currentPiece || this.game.clearAnimTimer > 0) return;

        const interval = this.difficulty === 'easy' ? 450 : (this.difficulty === 'hard' ? 120 : 250);
        if (now - this.lastMoveTime < interval) return;
        this.lastMoveTime = now;

        if (!this.target) {
            this.target = this.findBestMove();
        }

        if (this.target) {
            if (this.game.rotationState !== this.target.rotation) {
                this.game.rotatePiece(1);
            } else if (this.game.currentX < this.target.x) {
                this.game.moveRight();
            } else if (this.game.currentX > this.target.x) {
                this.game.moveLeft();
            } else {
                this.game.hardDrop();
                this.target = null;
            }
        }
    }

    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = { x: this.game.currentX, rotation: 0 };
        const piece = this.game.currentPiece;

        for (let rot = 0; rot < 4; rot++) {
            const shape = this.getRotatedShape(piece.shape, rot);
            const width = shape[0].length;

            for (let x = -2; x <= this.game.cols - width + 2; x++) {
                if (this.game.checkCollision(shape, x, 0)) continue;
                let y = 0;
                while (!this.game.checkCollision(shape, x, y + 1)) y++;

                const evalScore = this.evaluateBoard(shape, x, y);
                if (evalScore > bestScore) {
                    bestScore = evalScore;
                    bestMove = { x: x, rotation: rot };
                }
            }
        }
        return bestMove;
    }

    getRotatedShape(shape, times) {
        let s = shape.map(r => [...r]);
        for (let t = 0; t < times; t++) {
            const size = s.length;
            const res = Array.from({ length: size }, () => Array(size).fill(0));
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    res[c][size - 1 - r] = s[r][c];
                }
            }
            s = res;
        }
        return s;
    }

    evaluateBoard(shape, x, y) {
        const grid = this.game.grid.map(r => [...r]);
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const gy = y + r;
                    const gx = x + c;
                    if (gy >= 0 && gy < this.game.rows && gx >= 0 && gx < this.game.cols) {
                        grid[gy][gx] = { color: '#000' };
                    }
                }
            }
        }

        let aggregateHeight = 0, holes = 0, bumpiness = 0, clearedLines = 0;
        const columnHeights = Array(this.game.cols).fill(0);

        for (let c = 0; c < this.game.cols; c++) {
            for (let r = 0; r < this.game.rows; r++) {
                if (grid[r][c] !== null) {
                    columnHeights[c] = this.game.rows - r;
                    break;
                }
            }
            aggregateHeight += columnHeights[c];
        }

        for (let c = 0; c < this.game.cols; c++) {
            let blockFound = false;
            for (let r = 0; r < this.game.rows; r++) {
                if (grid[r][c] !== null) blockFound = true;
                else if (blockFound && grid[r][c] === null) holes++;
            }
        }

        for (let c = 0; c < this.game.cols - 1; c++) {
            bumpiness += Math.abs(columnHeights[c] - columnHeights[c + 1]);
        }

        for (let r = 0; r < this.game.rows; r++) {
            if (grid[r].every(cell => cell !== null)) clearedLines++;
        }

        return (-0.51 * aggregateHeight) + (0.76 * clearedLines) - (0.35 * holes) - (0.18 * bumpiness);
    }
}


/* --------------------------------------------------------------------------
   5. Main Application Controller (Achievements, Ending, Assist Mode)
   -------------------------------------------------------------------------- */
class TetrisunApp {
    constructor() {
        this.sound = new SoundEngine();
        this.selectedMode = 'story';
        this.difficulty = localStorage.getItem('tetrisun_diff') || 'normal';
        this.p2pEnabled = true;
        this.assistMode = false; // Beginner Helper Ring

        this.playerChar = 'nekonya';
        this.cpuChar = 'inuwan';

        this.p1Game = null;
        this.p2Game = null;
        this.cpuAI = null;

        this.peer = null;
        this.peerId = null;
        this.peerConn = null;

        this.storyStage = 1;
        this.storyTotalTime = 0;
        this.isDialogueActive = false;
        this.isCountdownActive = false;
        this.magicFreezeTimer = 0;
        this.gaugeTimerId = null;

        this.gpDasTimerLeft = 0;
        this.gpDasTimerRight = 0;

        this.storyYamlData = null;
        this.storyDialogues = [];
        this.currentDialogueIdx = 0;

        this.highScores = JSON.parse(localStorage.getItem('tetrisun_scores') || '[]');
        this.achievements = JSON.parse(localStorage.getItem('tetrisun_achievements') || '{}');

        this.isLoopRunning = false;
        this.animFrameId = null;
        this.lastTime = 0;
    }

    async init() {
        this.fitToScreen();
        window.addEventListener('resize', () => this.fitToScreen());

        this.restoreSavedSettings();
        await this.loadStoryYaml();
        this.initCharSelectGrid();
        this.initPeerJS();
        this.bindEvents();
        this.updateRankingTable();
        this.startMagicGaugeTimer();

        this.selectMode('story', document.querySelector('.mode-btn[data-mode="story"]'));

        console.log("🐾 Tetrisun initialized successfully.");
    }

    restoreSavedSettings() {
        const savedBgm = localStorage.getItem('tetrisun_bgm');
        const savedSe = localStorage.getItem('tetrisun_se');
        if (savedBgm !== null) {
            this.sound.bgmVolume = parseFloat(savedBgm);
            const el = document.getElementById('setting-bgm');
            if (el) el.value = Math.floor(savedBgm * 100);
        }
        if (savedSe !== null) {
            this.sound.seVolume = parseFloat(savedSe);
            const el = document.getElementById('setting-se');
            if (el) el.value = Math.floor(savedSe * 100);
        }
        const diffEl = document.getElementById('setting-difficulty');
        if (diffEl) diffEl.value = this.difficulty;
    }

    async loadStoryYaml() {
        try {
            const resp = await fetch('stories.yaml');
            if (resp.ok) {
                const text = await resp.text();
                if (window.jsyaml) {
                    this.storyYamlData = window.jsyaml.load(text);
                }
            }
        } catch (e) {
            console.warn('YAML fetch failed, fallback used.', e);
        }
    }

    fitToScreen() {
        const viewport = document.getElementById('game-viewport');
        if (!viewport) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = Math.min(w / 1280, h / 720);
        viewport.style.transform = `scale(${scale})`;
    }

    showScreen(screenId) {
        if (screenId !== 'view-game') {
            this.stopGameLoop();
        }

        document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
        this.sound.init();
    }

    stopGameLoop() {
        this.isLoopRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    selectMode(mode, btnEl) {
        this.selectedMode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');

        const grpStory = document.getElementById('grp-story-settings');
        const grpVersus = document.getElementById('grp-versus-settings');
        const grpScore = document.getElementById('grp-scoreattack-settings');
        const titleEl = document.getElementById('settings-title');

        if (grpStory) grpStory.style.display = (mode === 'story') ? 'flex' : 'none';
        if (grpVersus) grpVersus.style.display = (mode === 'versus') ? 'flex' : 'none';
        if (grpScore) grpScore.style.display = (mode === 'scoreattack') ? 'flex' : 'none';

        if (titleEl) {
            if (mode === 'story') titleEl.textContent = '📖 ストーリーモード設定';
            else if (mode === 'versus') titleEl.textContent = '⚔️ シングル対戦モード設定';
            else if (mode === 'scoreattack') titleEl.textContent = '🏆 スコアアタック設定';
        }

        this.updateRankingTable();
    }

    updateSettings() {
        const diffEl = document.getElementById('setting-difficulty');
        if (diffEl) {
            this.difficulty = diffEl.value;
            localStorage.setItem('tetrisun_diff', this.difficulty);
        }

        const chalEl = document.getElementById('setting-challenger');
        if (chalEl) this.p2pEnabled = (chalEl.value === 'on');
    }

    updateAudioVolume() {
        const bgmEl = document.getElementById('setting-bgm');
        const seEl = document.getElementById('setting-se');
        if (bgmEl) {
            this.sound.bgmVolume = bgmEl.value / 100;
            localStorage.setItem('tetrisun_bgm', this.sound.bgmVolume);
        }
        if (seEl) {
            this.sound.seVolume = seEl.value / 100;
            localStorage.setItem('tetrisun_se', this.sound.seVolume);
            this.sound.playPopSE();
        }
    }

    toggleAssistMode() {
        this.assistMode = !this.assistMode;
        this.showToast(this.assistMode ? '💡 初心者アシストガイド: ON' : '💡 初心者アシストガイド: OFF');
    }

    unlockAchievement(key, title) {
        if (!this.achievements[key]) {
            this.achievements[key] = true;
            localStorage.setItem('tetrisun_achievements', JSON.stringify(this.achievements));
            this.sound.playAchievementSE();
            this.showToast(`🏆 実績解除: 【${title}】`);
        }
    }

    initCharSelectGrid() {
        const grid = document.getElementById('char-grid');
        const cpuSelect = document.getElementById('setting-cpu-char');
        if (!grid) return;
        grid.innerHTML = '';
        if (cpuSelect) cpuSelect.innerHTML = '';

        Object.keys(CHARACTERS).forEach(id => {
            const char = CHARACTERS[id];

            const card = document.createElement('div');
            card.className = `char-card ${id === this.playerChar ? 'selected' : ''}`;
            card.onclick = () => this.selectPlayerChar(id);
            card.innerHTML = `
                <img class="char-card-img" src="${char.img}" alt="${char.name}">
                <div class="char-card-name">${char.name}</div>
            `;
            grid.appendChild(card);

            if (cpuSelect) {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = `${char.name} (${char.animal})`;
                if (id === this.cpuChar) opt.selected = true;
                cpuSelect.appendChild(opt);
            }
        });

        this.updateCharDetailCard(this.playerChar);
    }

    selectPlayerChar(id) {
        this.playerChar = id;
        document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
        this.initCharSelectGrid();
    }

    selectCpuCharacter(id) {
        this.cpuChar = id;
    }

    updateCharDetailCard(id) {
        const char = CHARACTERS[id] || CHARACTERS.nekonya;
        const nameEl = document.getElementById('char-name');
        const animalEl = document.getElementById('char-animal');
        const descEl = document.getElementById('char-desc');
        const magicNameEl = document.getElementById('magic-name');
        const magicDescEl = document.getElementById('magic-desc');
        const previewImg = document.getElementById('char-preview-img');

        if (nameEl) nameEl.textContent = char.name;
        if (animalEl) animalEl.textContent = `モチーフ: ${char.animal}`;
        if (descEl) descEl.textContent = char.desc;
        if (magicNameEl) magicNameEl.textContent = `✨ ${char.magicEffectText}`;
        if (magicDescEl) magicDescEl.textContent = char.magicDesc;
        if (previewImg) previewImg.src = char.img;
    }

    proceedFromModeSelect() {
        this.showScreen('view-character-select');
    }

    initPeerJS() {
        try {
            this.peer = new Peer();
            this.peer.on('open', (id) => {
                this.peerId = id;
                const txt = document.getElementById('p2p-status-text');
                if (txt) txt.textContent = `乱入待受中 (ID: ${id.substring(0, 6)}...)`;
            });

            this.peer.on('connection', (conn) => {
                if (!this.p2pEnabled) return;
                this.peerConn = conn;
                this.showToast('⚡ 他プレイヤーからの乱入を受け入れました！対戦に移行します！');
                this.setupPeerDataHandler();
            });
        } catch (e) {
            console.warn('PeerJS init failed', e);
        }
    }

    setupPeerDataHandler() {
        if (!this.peerConn) return;
        this.peerConn.on('data', (data) => {
            if (!data) return;
            if (data.type === 'GARBAGE' && this.p1Game && typeof data.amount === 'number' && Number.isFinite(data.amount)) {
                const safeGarbage = Math.min(10, Math.max(1, Math.floor(data.amount)));
                this.p1Game.receiveGarbage(safeGarbage);
                this.sound.playGarbageWarnSE();
            } else if (data.type === 'STATE' && this.p2Game && Array.isArray(data.grid)) {
                this.p2Game.grid = data.grid;
                if (typeof data.score === 'number') this.p2Game.score = data.score;
            }
        });
    }

    showToast(msg) {
        const container = document.getElementById('global-toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.textContent = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    startStoryGameNew() {
        this.storyStage = 1;
        this.storyTotalTime = 0;
        this.startGame();
    }

    startGame() {
        this.stopGameLoop();

        this.showScreen('view-game');
        this.sound.startBgm();

        this.p1Game = new TetrisGame('p1', false);
        this.p1Game.reset();

        this.p1Game.onPerfectClear = () => {
            this.sound.playPerfectClearSE();
            this.showCutinBanner('✨ PERFECT CLEAR!! ✨', 'p1');
            this.unlockAchievement('perfect_clear', 'パーフェクトクリアマスター');
        };

        this.p1Game.onLevelUp = (newLv) => {
            this.sound.playLevelUpSE();
            this.showCutinBanner(`⭐ LEVEL UP! LEVEL ${newLv}`, 'p1');
        };

        this.p1Game.onTspin = (cleared) => {
            this.sound.playTspinSE();
            const msg = cleared > 0 ? `✨ T-SPIN ${cleared >= 3 ? 'TRIPLE' : (cleared === 2 ? 'DOUBLE' : 'SINGLE')}!!` : '✨ T-SPIN!';
            this.showCutinBanner(msg, 'p1');
            this.p1Game.score += (cleared + 1) * 400;
            this.unlockAchievement('tspin', 'T-Spinマスター');
        };

        this.p1Game.onLineClear = (lines) => {
            this.sound.playLineClearSE(lines);
            this.unlockAchievement('first_clear', 'はじめの一歩');

            if (lines >= 4) {
                this.triggerScreenShake('large');
                this.triggerMascotCheer('テトリス達成！🎉大勝利ニャ！', true);
                this.unlockAchievement('tetris_clear', 'テトリスクリア王者');
            } else if (lines >= 1) {
                this.triggerScreenShake('small');
                if (this.p1Game.ren > 1) {
                    this.triggerMascotCheer(`${this.p1Game.ren} REN連鎖！！🔥`, true);
                    this.showCutinBanner(`🔥 ${this.p1Game.ren} REN COMBO!`, 'p1');
                } else {
                    this.triggerMascotCheer('ナイス消去！✨', false);
                }
            }
        };

        this.p1Game.onSendGarbage = (lines) => {
            if (this.p2Game) {
                this.p2Game.receiveGarbage(lines);
                this.sound.playGarbageWarnSE();
            }
            if (this.peerConn) this.peerConn.send({ type: 'GARBAGE', amount: lines });
        };

        const p2Box = document.getElementById('p2-stage-box');
        if (this.selectedMode === 'scoreattack') {
            this.p2Game = null;
            if (p2Box) p2Box.style.opacity = '0.3';
        } else {
            if (p2Box) p2Box.style.opacity = '1';
            const enemyCharId = (this.selectedMode === 'story') ? this.getStoryEnemyChar() : this.cpuChar;
            this.cpuChar = enemyCharId;
            this.p2Game = new TetrisGame('p2', true);
            this.p2Game.reset();

            this.p2Game.onLineClear = (lines) => {
                this.sound.playLineClearSE(lines);
            };

            this.p2Game.onSendGarbage = (lines) => {
                if (this.p1Game) {
                    this.p1Game.receiveGarbage(lines);
                    this.sound.playGarbageWarnSE();
                }
            };
            this.cpuAI = new CpuAI(this.p2Game, this.difficulty);
        }

        const p1NameEl = document.getElementById('p1-name');
        const p2NameEl = document.getElementById('p2-name');
        const p1ImgEl = document.getElementById('p1-face-img');
        const p2ImgEl = document.getElementById('p2-face-img');
        const stageInfoEl = document.getElementById('game-stage-info');

        if (p1NameEl) p1NameEl.textContent = `${CHARACTERS[this.playerChar].name} (1P)`;
        if (p2NameEl) p2NameEl.textContent = `${CHARACTERS[this.cpuChar].name} (CPU)`;
        if (p1ImgEl) p1ImgEl.src = CHARACTERS[this.playerChar].img;
        if (p2ImgEl) p2ImgEl.src = CHARACTERS[this.cpuChar].img;

        const bestRecord = this.getBestRecord(this.selectedMode);
        if (stageInfoEl) {
            stageInfoEl.textContent = (this.selectedMode === 'story') ? `STAGE ${this.storyStage}: ${CHARACTERS[this.cpuChar].name}戦 (BEST: ${bestRecord})` : `SINGLE VERSUS (BEST: ${bestRecord})`;
        }

        const charEmoji = CHARACTERS[this.playerChar].emoji || '🐱';
        const mascotAvatar = document.getElementById('mascot-avatar');
        if (mascotAvatar) {
            mascotAvatar.innerHTML = `<span class="mascot-emoji">${charEmoji}</span><span class="mascot-flag left">🚩</span><span class="mascot-flag right">🏳️</span>`;
        }
        this.triggerMascotCheer('ふぁいとー！📣', false);

        if (this.selectedMode === 'story') {
            this.isDialogueActive = true;
            this.isCountdownActive = false;
            this.loadStoryDialogue();
        } else {
            this.isDialogueActive = false;
            const advBox = document.getElementById('adv-dialogue-box');
            if (advBox) advBox.style.display = 'none';
            this.startCountdown();
        }

        this.isLoopRunning = true;
        this.lastTime = performance.now();
        this.animFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    getBestRecord(mode) {
        const matching = this.highScores.filter(s => s.mode === mode.toUpperCase());
        if (matching.length === 0) return 'なし';
        return matching[0].formattedVal || matching[0].score;
    }

    triggerMascotCheer(text, isFever = false) {
        const cheerText = document.getElementById('mascot-cheer-text');
        const mascotAvatar = document.getElementById('mascot-avatar');
        if (cheerText) cheerText.textContent = text;

        if (mascotAvatar) {
            if (isFever) {
                mascotAvatar.className = 'mascot-avatar cheer-fever';
                setTimeout(() => {
                    mascotAvatar.className = 'mascot-avatar bounce-anim';
                }, 1600);
            } else {
                mascotAvatar.className = 'mascot-avatar bounce-anim';
            }
        }
    }

    getStoryEnemyChar() {
        const enemies = ['inuwan', 'torichun', 'sarukkey', 'tanupon', 'kitsunekon', 'dragogon', 'nekonya'];
        return enemies[(this.storyStage - 1) % enemies.length];
    }

    loadStoryDialogue() {
        const dialogBox = document.getElementById('adv-dialogue-box');
        if (!dialogBox) return;

        let dialogues = [];
        if (this.storyYamlData && this.storyYamlData[this.difficulty]) {
            const stageData = this.storyYamlData[this.difficulty].find(s => s.stage === this.storyStage);
            if (stageData && stageData.dialogue) {
                dialogues = stageData.dialogue.map(d => ({
                    isP1: (d.speaker === 'p1'),
                    speakerName: d.speaker === 'p1' ? CHARACTERS[this.playerChar].name : CHARACTERS[this.cpuChar].name,
                    charImg: d.speaker === 'p1' ? CHARACTERS[this.playerChar].img : CHARACTERS[this.cpuChar].img,
                    emotion: d.emotion || 'happy',
                    text: d.text
                }));
            }
        }

        if (dialogues.length === 0) {
            dialogues = [
                { isP1: true, speakerName: CHARACTERS[this.playerChar].name, charImg: CHARACTERS[this.playerChar].img, emotion: 'excited', text: '「いよいよパステルテトリス対戦の始まりだね！」' },
                { isP1: false, speakerName: CHARACTERS[this.cpuChar].name, charImg: CHARACTERS[this.cpuChar].img, emotion: 'confident', text: `「${CHARACTERS[this.cpuChar].name}の魔法で勝負だワン/ニャン！」` }
            ];
        }

        this.storyDialogues = dialogues;
        this.currentDialogueIdx = 0;
        dialogBox.style.display = 'flex';
        this.renderDialogueStep();
    }

    renderDialogueStep() {
        if (this.currentDialogueIdx >= this.storyDialogues.length) {
            this.finishDialogue();
            return;
        }
        const d = this.storyDialogues[this.currentDialogueIdx];
        const spk = document.getElementById('adv-speaker-name');
        const txt = document.getElementById('adv-text');
        const img = document.getElementById('adv-speaker-img');
        const wrapper = document.getElementById('adv-avatar-wrapper');
        const badge = document.getElementById('adv-emotion-badge');
        const modal = document.getElementById('adv-dialogue-box');

        if (spk) spk.textContent = d.speakerName;
        if (txt) txt.textContent = d.text;
        if (img) img.src = d.charImg;

        if (wrapper) {
            wrapper.className = `adv-speaker-avatar-wrapper ${d.isP1 ? 'speaker-p1' : 'speaker-enemy'}`;
        }

        const emotionEmojiMap = {
            happy: '😊',
            excited: '🎉',
            angry: '🔥',
            surprised: '😲',
            confident: '✨',
            cool: '🕶️',
            sad: '💦'
        };

        if (badge) {
            badge.textContent = emotionEmojiMap[d.emotion] || '😊';
        }

        if (modal) {
            modal.classList.remove('emotion-shake', 'emotion-bounce', 'emotion-pulse');
            void modal.offsetWidth;
            if (d.emotion === 'angry' || d.emotion === 'surprised') {
                modal.classList.add('emotion-shake');
            } else if (d.emotion === 'excited' || d.emotion === 'happy') {
                modal.classList.add('emotion-bounce');
            } else if (d.emotion === 'confident' || d.emotion === 'cool') {
                modal.classList.add('emotion-pulse');
            }
        }
    }

    nextDialogue() {
        this.currentDialogueIdx++;
        this.renderDialogueStep();
    }

    skipDialogue() {
        this.finishDialogue();
    }

    finishDialogue() {
        const advBox = document.getElementById('adv-dialogue-box');
        if (advBox) advBox.style.display = 'none';
        this.isDialogueActive = false;
        this.startCountdown();
    }

    startCountdown() {
        this.isCountdownActive = true;
        const modal = document.getElementById('countdown-modal');
        const txt = document.getElementById('countdown-text');
        if (!modal || !txt) {
            this.isCountdownActive = false;
            return;
        }

        modal.style.display = 'flex';
        txt.textContent = 'READY...';
        this.sound.playCountdownSE(1);

        setTimeout(() => {
            txt.textContent = 'SET...';
            this.sound.playCountdownSE(1.2);
        }, 700);

        setTimeout(() => {
            txt.textContent = 'GO!';
            this.sound.playCountdownSE(1.8);
        }, 1300);

        setTimeout(() => {
            modal.style.display = 'none';
            this.isCountdownActive = false;
        }, 1800);
    }

    gameLoop(time) {
        if (!this.isLoopRunning) return;
        const dt = time - this.lastTime;
        this.lastTime = time;

        if (this.magicFreezeTimer > 0) {
            this.magicFreezeTimer -= dt;
        } else if (!this.isDialogueActive && !this.isCountdownActive) {
            
            if (this.selectedMode === 'story' && this.p1Game && !this.p1Game.isPaused && !this.p1Game.isGameOver) {
                this.storyTotalTime += dt;
            }

            if (this.p1Game) {
                const p1Danger = (this.p1Game.grid.slice(0, 5).some(r => r.some(c => c !== null)) || this.p1Game.garbageQueue >= 4);
                this.sound.setDangerMode(p1Danger);
            }

            if (this.p1Game && !this.p1Game.isPaused && !this.p1Game.isGameOver) {
                this.p1Game.updateParticles(dt);
                if (this.p1Game.clearAnimTimer > 0) {
                    this.p1Game.clearAnimTimer -= dt;
                    if (this.p1Game.clearAnimTimer <= 0) {
                        this.p1Game.finishRowClearAnimation();
                    }
                } else {
                    if (this.p1Game.isGrounded) {
                        this.p1Game.lockTimer += dt;
                        if (this.p1Game.lockTimer >= this.p1Game.lockDelay) {
                            this.p1Game.lockPiece();
                        }
                    }
                    this.updatePlayerGame(this.p1Game, dt);
                    this.pollGamepad(dt);
                }
            }

            if (this.p2Game && !this.p2Game.isPaused && !this.p2Game.isGameOver) {
                this.p2Game.updateParticles(dt);
                if (this.p2Game.clearAnimTimer > 0) {
                    this.p2Game.clearAnimTimer -= dt;
                    if (this.p2Game.clearAnimTimer <= 0) {
                        this.p2Game.finishRowClearAnimation();
                    }
                } else {
                    if (this.p2Game.isGrounded) {
                        this.p2Game.lockTimer += dt;
                        if (this.p2Game.lockTimer >= this.p2Game.lockDelay) {
                            this.p2Game.lockPiece();
                        }
                    }
                    this.updatePlayerGame(this.p2Game, dt);
                    if (this.cpuAI) this.cpuAI.update(time);
                }
            }
        }

        this.renderAll();

        if (this.p1Game && this.p1Game.isGameOver) {
            this.handleGameOver(false);
        } else if (this.p2Game && this.p2Game.isGameOver) {
            this.handleStageVictory();
        } else {
            this.animFrameId = requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    pollGamepad(dt) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (!gp || !this.p1Game || this.p1Game.isGameOver) return;

        if (gp.buttons[0]?.pressed || gp.buttons[1]?.pressed) {
            if (!this.gpPrevRotate) { this.p1Game.rotatePiece(1); this.sound.playRotateSE(); }
            this.gpPrevRotate = true;
        } else { this.gpPrevRotate = false; }

        if (gp.buttons[2]?.pressed || gp.buttons[3]?.pressed) {
            if (!this.gpPrevDrop) { this.p1Game.hardDrop(); this.sound.playDropSE(); }
            this.gpPrevDrop = true;
        } else { this.gpPrevDrop = false; }

        if (gp.buttons[4]?.pressed || gp.buttons[5]?.pressed) {
            if (!this.gpPrevHold) { this.p1Game.hold(); this.sound.playHoldSE(); }
            this.gpPrevHold = true;
        } else { this.gpPrevHold = false; }

        if (gp.buttons[7]?.pressed || gp.buttons[6]?.pressed) {
            if (!this.gpPrevMagic) { this.triggerMagic('p1'); }
            this.gpPrevMagic = true;
        } else { this.gpPrevMagic = false; }

        const leftPressed = (gp.axes[0] < -0.5 || gp.buttons[14]?.pressed);
        const rightPressed = (gp.axes[0] > 0.5 || gp.buttons[15]?.pressed);

        if (leftPressed) {
            if (this.gpDasTimerLeft === 0 || (this.gpDasTimerLeft > 160 && this.gpDasTimerLeft % 50 < dt)) {
                this.p1Game.moveLeft();
            }
            this.gpDasTimerLeft += dt;
        } else {
            this.gpDasTimerLeft = 0;
        }

        if (rightPressed) {
            if (this.gpDasTimerRight === 0 || (this.gpDasTimerRight > 160 && this.gpDasTimerRight % 50 < dt)) {
                this.p1Game.moveRight();
            }
            this.gpDasTimerRight += dt;
        } else {
            this.gpDasTimerRight = 0;
        }

        if (gp.axes[1] > 0.5 || gp.buttons[13]?.pressed) this.p1Game.softDrop();
    }

    updatePlayerGame(game, dt) {
        game.dropCounter += dt;
        if (game.dropCounter > game.dropInterval) {
            game.softDrop();
            game.dropCounter = 0;
        }

        if (game.barrierTimer > 0) {
            game.barrierTimer -= dt / 1000;
        }
    }

    startMagicGaugeTimer() {
        if (this.gaugeTimerId) clearInterval(this.gaugeTimerId);
        this.gaugeTimerId = setInterval(() => {
            if (this.isDialogueActive || this.isCountdownActive || !this.isLoopRunning || (this.p1Game && this.p1Game.isPaused)) return;
            if (this.p1Game && !this.p1Game.isGameOver && !this.p1Game.isPaused) {
                this.p1Game.magicGauge = Math.min(100, this.p1Game.magicGauge + 2);
                const btn = document.getElementById('p1-magic-btn');
                if (btn) btn.disabled = (this.p1Game.magicGauge < 100);
            }
            if (this.p2Game && !this.p2Game.isGameOver && !this.p2Game.isPaused) {
                this.p2Game.magicGauge = Math.min(100, this.p2Game.magicGauge + 2);

                const isP2Pinch = this.p2Game.garbageQueue > 0 || this.p2Game.grid.slice(0, 6).some(r => r.some(c => c !== null));
                if (this.p2Game.magicGauge >= 100 && (isP2Pinch || Math.random() < 0.2)) {
                    this.triggerMagic('p2');
                }
            }
        }, 1000);
    }

    triggerMagic(playerId) {
        const game = (playerId === 'p1') ? this.p1Game : this.p2Game;
        const opponent = (playerId === 'p1') ? this.p2Game : this.p1Game;
        const charId = (playerId === 'p1') ? this.playerChar : this.cpuChar;

        if (!game || game.isPaused || game.magicGauge < 100) return;
        game.magicGauge = 0;
        this.sound.playMagicSE();


        const modal = document.getElementById('magic-roulette-modal');
        const textEl = document.getElementById('roulette-text');
        const titleEl = document.getElementById('roulette-title-text');
        if (!modal || !textEl) return;

        modal.className = `roulette-modal glass-panel ${playerId === 'p1' ? 'roulette-red' : 'roulette-blue'}`;
        if (titleEl) titleEl.textContent = playerId === 'p1' ? '✨ 1P 魔法発動！' : '✨ 2P 魔法発動！';

        modal.style.display = 'block';
        this.triggerMascotCheer('魔法発動ニャ！✨', true);

        let spins = 0;
        const timer = setInterval(() => {
            spins++;
            textEl.textContent = '✨ 魔法スロット回転中...';
            if (spins > 10) {
                clearInterval(timer);
                const finalLv = Math.floor(Math.random() * 5);
                this.applyMagicEffect(finalLv, game, opponent, charId, playerId);
                setTimeout(() => { modal.style.display = 'none'; }, 1600);
            }
        }, 80);
    }

    applyMagicEffect(lv, game, opponent, charId, playerId) {
        const char = CHARACTERS[charId];
        this.magicFreezeTimer = 850;
        this.triggerScreenShake('large');

        let effectTitle = '';
        switch (lv) {
            case 0:
                effectTitle = 'ざんねん... はずれ！';
                break;
            case 1:
                effectTitle = '自陣の全お邪魔ブロックを消去！';
                const garbageRows = [];
                game.grid.forEach((row, r) => {
                    if (row.some(cell => cell && cell.isGarbage)) garbageRows.push(r);
                });
                if (garbageRows.length > 0) game.startRowClearAnimation(garbageRows, 850);
                break;
            case 2:
                effectTitle = '5秒間相手のお邪魔攻撃を完全ガード！';
                game.barrierTimer = 5;
                break;
            case 3:
                effectTitle = '5回連続で「I型（縦棒）」出現！';
                game.forceIPieces = 5;
                break;
            case 4:
                effectTitle = char.magicEffectText;
                this.executeCharacterMagic(charId, game, opponent);
                break;
        }

        const textEl = document.getElementById('roulette-text');
        if (textEl) textEl.textContent = effectTitle;
        this.showCutinBanner(`${char.quote || ''}\n${playerId === 'p1' ? '1P' : '2P'} 魔法: ${effectTitle}`, playerId);
    }

    executeCharacterMagic(charId, game, opponent) {
        switch (charId) {
            case 'nekonya':
                const oddRows = [];
                for (let r = 1; r < game.rows; r += 2) {
                    if (game.grid[r].some(c => c !== null) && oddRows.length < 3) {
                        oddRows.push(r);
                    }
                }
                if (oddRows.length > 0) game.startRowClearAnimation(oddRows, 850);
                break;

            case 'inuwan':
                const garbageRows = [];
                for (let r = game.rows - 1; r >= 0; r--) {
                    if (game.grid[r].some(c => c && c.isGarbage) && garbageRows.length < 3) {
                        garbageRows.push(r);
                    }
                }
                if (garbageRows.length > 0) {
                    game.startRowClearAnimation(garbageRows, 850);
                    if (opponent) opponent.receiveGarbage(garbageRows.length);
                }
                break;

            case 'torichun':
                const topRows = [];
                for (let r = 0; r < game.rows; r++) {
                    if (game.grid[r].some(c => c !== null) && topRows.length < 3) {
                        topRows.push(r);
                    }
                }
                if (topRows.length > 0) game.startRowClearAnimation(topRows, 850);
                break;

            case 'sarukkey':
                game.forceOPieces = 3;
                break;

            case 'tanupon':
                const allRows1 = Array.from({length: 20}, (_, i) => i);
                game.startRowClearAnimation(allRows1, 850);
                if (opponent) {
                    const allRows2 = Array.from({length: 20}, (_, i) => i);
                    opponent.startRowClearAnimation(allRows2, 850);
                }
                break;

            case 'kitsunekon':
                if (opponent) {
                    const temp = game.grid;
                    game.grid = opponent.grid;
                    opponent.grid = temp;
                }
                break;

            case 'dragogon':
                const botRows = [];
                for (let r = game.rows - 1; r >= game.rows - 5; r--) {
                    if (game.grid[r].some(c => c !== null)) botRows.push(r);
                }
                if (botRows.length > 0) game.startRowClearAnimation(botRows, 850);
                break;
        }
    }

    showCutinBanner(text, playerId = 'p1') {
        const banner = document.getElementById('cutin-banner');
        const txt = document.getElementById('cutin-text');
        if (!banner || !txt) return;
        txt.textContent = text;
        banner.className = `cutin-banner-overlay ${playerId === 'p1' ? 'cutin-red' : 'cutin-blue'}`;
        banner.style.display = 'block';
        setTimeout(() => { banner.style.display = 'none'; }, 1500);
    }

    formatTime(ms) {
        const totalSec = Math.floor(ms / 1000);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        const tenths = Math.floor((ms % 1000) / 100);
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${tenths}`;
    }

    renderAll() {
        if (this.p1Game) {
            this.renderBoard('p1-board-canvas', this.p1Game);
            this.renderHold('p1-hold-canvas', this.p1Game.holdPiece, this.p1Game.canHold);
            this.renderNext('p1-next-canvas', this.p1Game.nextQueue);

            const p1ScoreEl = document.getElementById('p1-score');
            const p1LinesEl = document.getElementById('p1-lines');
            const p1RenEl = document.getElementById('p1-ren');
            const p1LevelEl = document.getElementById('p1-level');
            const p1FillEl = document.getElementById('p1-magic-fill');
            const p1GarbageEl = document.getElementById('p1-garbage-bar');

            if (p1ScoreEl) {
                const ppsStr = ` (PPS: ${this.p1Game.pps})`;
                p1ScoreEl.textContent = (this.selectedMode === 'story') ? `TIME: ${this.formatTime(this.storyTotalTime)}${ppsStr}` : `SCORE: ${String(this.p1Game.score).padStart(6, '0')}${ppsStr}`;
            }

            if (p1LinesEl) p1LinesEl.textContent = this.p1Game.lines;
            if (p1RenEl) p1RenEl.textContent = this.p1Game.ren;
            if (p1LevelEl) p1LevelEl.textContent = this.p1Game.level;
            if (p1FillEl) p1FillEl.style.width = `${this.p1Game.magicGauge}%`;
            if (p1GarbageEl) {
                p1GarbageEl.style.height = `${Math.min(100, this.p1Game.garbageQueue * 10)}%`;
                if (this.p1Game.garbageQueue > 0) p1GarbageEl.classList.add('garbage-warning-pulse');
                else p1GarbageEl.classList.remove('garbage-warning-pulse');
            }
        }

        if (this.p2Game) {
            this.renderBoard('p2-board-canvas', this.p2Game);
            this.renderHold('p2-hold-canvas', this.p2Game.holdPiece, this.p2Game.canHold);
            this.renderNext('p2-next-canvas', this.p2Game.nextQueue);

            const p2ScoreEl = document.getElementById('p2-score');
            const p2LinesEl = document.getElementById('p2-lines');
            const p2RenEl = document.getElementById('p2-ren');
            const p2LevelEl = document.getElementById('p2-level');
            const p2FillEl = document.getElementById('p2-magic-fill');
            const p2GarbageEl = document.getElementById('p2-garbage-bar');

            if (p2ScoreEl) p2ScoreEl.textContent = `SCORE: ${String(this.p2Game.score).padStart(6, '0')}`;
            if (p2LinesEl) p2LinesEl.textContent = this.p2Game.lines;
            if (p2RenEl) p2RenEl.textContent = this.p2Game.ren;
            if (p2LevelEl) p2LevelEl.textContent = this.p2Game.level;
            if (p2FillEl) p2FillEl.style.width = `${this.p2Game.magicGauge}%`;
            if (p2GarbageEl) {
                p2GarbageEl.style.height = `${Math.min(100, this.p2Game.garbageQueue * 10)}%`;
                if (this.p2Game.garbageQueue > 0) p2GarbageEl.classList.add('garbage-warning-pulse');
                else p2GarbageEl.classList.remove('garbage-warning-pulse');
            }
        }
    }

    renderBoard(canvasId, game) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cellW = 24;
        const cellH = 24;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (game.hardDropFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const isBlinkingNow = (Math.floor(Date.now() / 40) % 2 === 0);

        for (let r = 0; r < game.rows; r++) {
            const isBlinkRow = game.animatingClearRows.includes(r);
            for (let c = 0; c < game.cols; c++) {
                if (isBlinkRow) {
                    if (isBlinkingNow) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
                    } else {
                        ctx.fillStyle = (game.playerId === 'p1') ? '#FFD1DC' : '#93C5FD';
                        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
                    }
                } else if (game.grid[r][c]) {
                    this.drawRoundedBlock(ctx, c * cellW, r * cellH, cellW, cellH, game.grid[r][c].color);
                }
            }
        }

        if (game.currentPiece && !game.isGameOver && game.clearAnimTimer <= 0) {
            const ghostY = game.getGhostY();
            const shape = game.currentPiece.shape;

            // Render Beginner Guide Assist Ring if enabled
            if (this.assistMode && game.playerId === 'p1') {
                for (let r = 0; r < shape.length; r++) {
                    for (let c = 0; c < shape[r].length; c++) {
                        if (shape[r][c]) {
                            const gx = (game.currentX + c) * cellW;
                            const gy = (ghostY + r) * cellH;
                            ctx.fillStyle = 'rgba(255, 223, 128, 0.35)';
                            ctx.beginPath();
                            ctx.arc(gx + 12, gy + 12, 10, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }

            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const gx = (game.currentX + c) * cellW;
                        const gy = (ghostY + r) * cellH;
                        ctx.fillStyle = 'rgba(180, 190, 235, 0.2)';
                        ctx.beginPath();
                        ctx.roundRect(gx + 1, gy + 1, cellW - 2, cellH - 2, 5);
                        ctx.fill();
                        ctx.save();
                        ctx.lineWidth = 2;
                        ctx.setLineDash([4, 2]);
                        ctx.strokeStyle = game.playerId === 'p1' ? '#FF5A82' : '#3B82F6';
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }

            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const px = (game.currentX + c) * cellW;
                        const py = (game.currentY + r) * cellH;
                        this.drawRoundedBlock(ctx, px, py, cellW, cellH, game.currentPiece.color);
                    }
                }
            }
        }

        // Render Particles
        game.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Render Cute Onomatopoeia Text Popups
        game.onomatopoeias.forEach(o => {
            ctx.save();
            ctx.globalAlpha = o.alpha;
            ctx.font = 'bold 16px "M PLUS Rounded 1c", sans-serif';
            ctx.fillStyle = o.color;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.strokeText(o.text, o.x, o.y);
            ctx.fillText(o.text, o.x, o.y);
            ctx.restore();
        });
    }

    drawRoundedBlock(ctx, x, y, w, h, color) {
        const radius = 5;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, w - 2, h - 2, radius);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.stroke();
    }

    renderHold(canvasId, type, canHold = true) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!type) return;

        ctx.save();
        if (!canHold) ctx.globalAlpha = 0.4;

        const template = TETRIMINOS[type];
        const shape = template.shape;
        const cell = 14;
        const offsetX = (canvas.width - shape[0].length * cell) / 2;
        const offsetY = (canvas.height - shape.length * cell) / 2;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    this.drawRoundedBlock(ctx, offsetX + c * cell, offsetY + r * cell, cell, cell, template.color);
                }
            }
        }
        ctx.restore();
    }

    renderNext(canvasId, queue) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cell = 12;
        queue.slice(0, 5).forEach((type, idx) => {
            const template = TETRIMINOS[type];
            const shape = template.shape;
            const offsetX = (canvas.width - shape[0].length * cell) / 2;
            const offsetY = 8 + idx * 48;

            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        this.drawRoundedBlock(ctx, offsetX + c * cell, offsetY + r * cell, cell, cell, template.color);
                    }
                }
            }
        });
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            const modeView = document.getElementById('view-mode-select');
            const charView = document.getElementById('view-character-select');

            if (modeView && modeView.classList.contains('active')) {
                const modes = ['story', 'versus', 'scoreattack'];
                const currentIdx = modes.indexOf(this.selectedMode);
                if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                    const next = modes[(currentIdx + 1) % modes.length];
                    const btn = document.querySelector(`.mode-btn[data-mode="${next}"]`);
                    this.selectMode(next, btn);
                } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                    const prev = modes[(currentIdx - 1 + modes.length) % modes.length];
                    const btn = document.querySelector(`.mode-btn[data-mode="${prev}"]`);
                    this.selectMode(prev, btn);
                } else if (e.code === 'Enter' || e.code === 'Space') {
                    this.proceedFromModeSelect();
                }
                return;
            }

            if (charView && charView.classList.contains('active')) {
                const chars = Object.keys(CHARACTERS);
                const currentIdx = chars.indexOf(this.playerChar);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                    this.selectPlayerChar(chars[(currentIdx + 1) % chars.length]);
                } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                    this.selectPlayerChar(chars[(currentIdx - 1 + chars.length) % chars.length]);
                } else if (e.code === 'Enter' || e.code === 'Space') {
                    this.startStoryGameNew();
                }
                return;
            }

            if (this.isDialogueActive) {
                if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyZ') {
                    this.nextDialogue();
                }
                return;
            }

            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
                return;
            }

            if (!this.p1Game || this.p1Game.isGameOver || this.p1Game.isPaused || this.isCountdownActive) return;
            switch (e.code) {
                case 'ArrowLeft':
                    this.p1Game.moveLeft();
                    this.sound.playPopSE();
                    break;
                case 'ArrowRight':
                    this.p1Game.moveRight();
                    this.sound.playPopSE();
                    break;
                case 'ArrowDown':
                    this.p1Game.softDrop();
                    break;
                case 'ArrowUp':
                    this.p1Game.hardDrop();
                    this.sound.playDropSE();
                    break;
                case 'KeyA':
                    this.p1Game.rotatePiece(-1);
                    this.sound.playRotateSE();
                    break;
                case 'KeyZ':
                case 'KeyS':
                    this.p1Game.rotatePiece(1);
                    this.sound.playRotateSE();
                    break;

                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyC':
                    this.p1Game.hold();
                    this.sound.playHoldSE();
                    break;
                case 'Space':
                    this.triggerMagic('p1');
                    break;
                case 'KeyH':
                    this.toggleAssistMode();
                    break;
            }
        });
    }

    triggerScreenShake(type = 'small') {
        const wrapper = document.getElementById('shake-wrapper');
        if (!wrapper) return;
        wrapper.className = (type === 'large') ? 'shake-large' : 'shake-small';
        setTimeout(() => wrapper.className = '', 450);
    }

    togglePause() {
        if (!this.p1Game) return;
        const newPauseState = !this.p1Game.isPaused;
        this.p1Game.isPaused = newPauseState;
        if (this.p2Game) this.p2Game.isPaused = newPauseState;

        const modal = document.getElementById('pause-modal');
        if (modal) modal.style.display = newPauseState ? 'flex' : 'none';
    }

    quitToTitle() {
        this.stopGameLoop();
        this.sound.stopBgm();
        this.showScreen('view-mode-select');
    }

    handleStageVictory() {
        this.sound.playVictorySE();
        const maxStage = (this.difficulty === 'easy') ? 3 : (this.difficulty === 'normal' ? 5 : 7);
        if (this.selectedMode === 'story' && this.storyStage < maxStage) {
            this.storyStage++;
            this.showToast(`🎉 STAGE ${this.storyStage - 1} VICTORY! 次のステージへ進みます！`);
            this.startGame();
        } else {
            this.unlockAchievement('story_all_clear', '全ステージ制覇');
            this.handleGameOver(true);
        }
    }

    handleGameOver(isWin) {
        this.stopGameLoop();
        this.sound.stopBgm();
        this.showScreen('view-score-result');

        const isStory = (this.selectedMode === 'story');
        const currentVal = isStory ? this.storyTotalTime : (this.p1Game ? this.p1Game.score : 0);
        const bestMatching = this.highScores.filter(s => s.mode === this.selectedMode.toUpperCase());

        let isNewRecord = false;
        if (bestMatching.length === 0) isNewRecord = true;
        else if (isStory && currentVal < bestMatching[0].score) isNewRecord = true;
        else if (!isStory && currentVal > bestMatching[0].score) isNewRecord = true;

        const titleBanner = document.getElementById('result-title-banner');
        if (titleBanner) {
            if (isNewRecord) {
                titleBanner.textContent = '👑 NEW RECORD! 🎉';
            } else {
                titleBanner.textContent = isWin ? '🎉 STORY ALL CLEAR!' : '💀 GAME OVER';
            }
        }

        const lblMain = document.getElementById('lbl-res-main');
        const resScore = document.getElementById('res-score');
        const resLines = document.getElementById('res-lines');
        const resRen = document.getElementById('res-ren');

        if (this.selectedMode === 'story') {
            if (lblMain) lblMain.textContent = '⏱️ 累積クリアタイム:';
            if (resScore) resScore.textContent = this.formatTime(this.storyTotalTime);
        } else {
            if (lblMain) lblMain.textContent = '最終スコア:';
            if (resScore) resScore.textContent = String(this.p1Game ? this.p1Game.score : 0).padStart(6, '0');
        }

        if (resLines) resLines.textContent = this.p1Game ? this.p1Game.lines : 0;
        if (resRen) resRen.textContent = this.p1Game ? this.p1Game.ren : 0;
    }

    submitScore() {
        const nameInput = document.getElementById('player-name-input');
        const rawName = nameInput ? nameInput.value.trim() : 'たびびと';
        const safeName = this.escapeHTML(rawName || 'たびびと');

        const isStory = (this.selectedMode === 'story');
        const val = isStory ? this.storyTotalTime : (this.p1Game ? this.p1Game.score : 0);

        const entry = {
            name: safeName,
            score: val,
            formattedVal: isStory ? this.formatTime(this.storyTotalTime) : String(val),
            mode: this.selectedMode.toUpperCase(),
            isTime: isStory,
            date: new Date().toLocaleDateString('ja-JP')
        };

        this.highScores.push(entry);

        this.highScores.sort((a, b) => {
            if (a.mode === 'STORY' && b.mode === 'STORY') return a.score - b.score;
            if (a.mode === 'STORY') return -1;
            if (b.mode === 'STORY') return 1;
            return b.score - a.score;
        });

        this.highScores = this.highScores.slice(0, 5);

        localStorage.setItem('tetrisun_scores', JSON.stringify(this.highScores));
        this.updateRankingTable();
        this.showToast('🏆 ランキング記録を登録しました！');
    }

    updateRankingTable() {
        const tbody = document.getElementById('ranking-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (this.highScores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">まだ記録がありません</td></tr>';
            return;
        }

        this.highScores.forEach((item, idx) => {
            const tr = document.createElement('tr');
            const displayScore = item.formattedVal || (item.isTime ? this.formatTime(item.score) : String(item.score));
            tr.innerHTML = `
                <td><strong>#${idx + 1}</strong></td>
                <td>${item.name}</td>
                <td><strong>${displayScore}</strong></td>
                <td>${item.mode}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}

// Global App Instance Setup
const app = new TetrisunApp();
window.app = app;

window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
