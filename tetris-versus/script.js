/**
 * ==========================================================================
 * 『テトリスン』(Tetrisun) - Core Game Engine & Application Logic
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
        this.quadraticCurveTo(x + w, y + h, x + w - botR, y + h);
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
        img: 'assets/nekonya.jpg',
        color: '#FFB7C5',
        desc: '気まぐれだけどすばやいパズルが得意なニャンコ！',
        magicName: '『気まぐれアタック』',
        magicDesc: '自身の盤面の奇数行（1, 3, 5, 7, 9行目等）からランダムに3行分を消去する。'
    },
    inuwan: {
        id: 'inuwan',
        name: 'イヌワン',
        animal: '犬',
        img: 'assets/inuwan.jpg',
        color: '#FFDF80',
        desc: '忠実で頼もしいワンコ！お邪魔ブロックを打ち返す！',
        magicName: '『カエシテク・アタック』',
        magicDesc: '現在自分の盤面にあるお邪魔行をそのまま相手に押し戻す（最大3行）。'
    },
    torichun: {
        id: 'torichun',
        name: 'トリチュン',
        animal: '鳥',
        img: 'assets/torichun.jpg',
        color: '#A8E6CF',
        desc: 'パタパタお空を飛ぶ鳥の歌姫！上からお掃除！',
        magicName: '『ピーチクテイル』',
        magicDesc: '自身の盤面の最上段から3行分のブロックを消去する。'
    },
    sarukkey: {
        id: 'sarukkey',
        name: 'サルウッキー',
        animal: '猿',
        img: 'assets/sarukkey.jpg',
        color: '#FFD3B6',
        desc: 'お調子者のサル！四角いテトリミノの嵐を起こす！',
        magicName: '『ウッキッキー・スクエア』',
        magicDesc: '次に出現するテトリミノが3回連続で「O型（四角）」に固定化される。'
    },
    tanupon: {
        id: 'tanupon',
        name: 'タヌポン',
        animal: 'タヌキ',
        img: 'assets/tanupon.jpg',
        color: '#CBA6D7',
        desc: 'ドロンと化けるいたずらタヌキ！一瞬でリセット！',
        magicName: '『ドロンコ・リセット』',
        magicDesc: 'お互い（自分と相手）のステージ盤面を完全に空の初期状態へ戻す。'
    },
    kitsunekon: {
        id: 'kitsunekon',
        name: 'キツネコン',
        animal: '狐',
        img: 'assets/kitsunekon.jpg',
        color: '#AEC6CF',
        desc: 'ミステリアスな忍者狐！相手と盤面をスワップ！',
        magicName: '『トリック・チェンジ』',
        magicDesc: '自分の盤面状態と相手の盤面状態をそのまま入れ替える。'
    },
    dragogon: {
        id: 'dragogon',
        name: 'ドラゴゴン',
        animal: '竜',
        img: 'assets/dragogon.jpg',
        color: '#FF7B9C',
        desc: '伝説の小竜！強力なブレスで下部を焼き尽くす！',
        magicName: '『ドラゴン・ブレス』',
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
   2. Audio Engine (Pure Web Audio API Synthesizer)
   -------------------------------------------------------------------------- */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.bgmVolume = 0.7;
        this.seVolume = 0.8;
        this.bgmTimer = null;
        this.isPlayingBgm = false;
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
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(this.seVolume * 0.4, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
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

    startBgm() {
        if (this.isPlayingBgm) return;
        this.init();
        this.isPlayingBgm = true;
        let step = 0;
        const melody = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 392.00, 293.66];
        
        this.bgmTimer = setInterval(() => {
            if (!this.isPlayingBgm || this.bgmVolume <= 0) return;
            const freq = melody[step % melody.length];
            step++;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(this.bgmVolume * 0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.18);
        }, 220);
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
   3. Single Player Board Engine (Tetris Logic)
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

        this.bag = [];
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.rotationState = 0;

        this.nextQueue = [];
        this.holdPiece = null;
        this.canHold = true;

        this.garbageQueue = 0;
        this.magicGauge = 0;
        this.barrierTimer = 0;
        this.forceIPieces = 0;
        this.forceOPieces = 0;

        this.isGameOver = false;
        this.isPaused = false;

        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.onLineClear = null;
        this.onSendGarbage = null;
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
        this.bag = [];
        this.nextQueue = [];
        this.holdPiece = null;
        this.canHold = true;
        this.garbageQueue = 0;
        this.magicGauge = 0;
        this.barrierTimer = 0;
        this.forceIPieces = 0;
        this.forceOPieces = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.dropInterval = 1000;

        this.refillBag();
        for (let i = 0; i < 4; i++) {
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

    rotatePiece(dir = 1) {
        if (!this.currentPiece) return false;
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
                return true;
            }
        }
        return false;
    }

    moveLeft() {
        if (!this.checkCollision(this.currentPiece.shape, this.currentX - 1, this.currentY)) {
            this.currentX--;
            return true;
        }
        return false;
    }

    moveRight() {
        if (!this.checkCollision(this.currentPiece.shape, this.currentX + 1, this.currentY)) {
            this.currentX++;
            return true;
        }
        return false;
    }

    softDrop() {
        if (!this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1)) {
            this.currentY++;
            this.score += 1;
            return true;
        }
        this.lockPiece();
        return false;
    }

    hardDrop() {
        let droppedLines = 0;
        while (!this.checkCollision(this.currentPiece.shape, this.currentX, this.currentY + 1)) {
            this.currentY++;
            droppedLines++;
        }
        this.score += droppedLines * 2;
        this.lockPiece();
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
        if (!this.canHold || !this.currentPiece) return;
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

        const cleared = this.clearLines();
        if (cleared > 0) {
            this.ren++;
            if (this.onLineClear) this.onLineClear(cleared);

            let sentGarbage = 0;
            if (cleared === 2) sentGarbage = 1;
            else if (cleared === 3) sentGarbage = 2;
            else if (cleared === 4) sentGarbage = 4;

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
        } else {
            this.ren = 0;
            if (this.garbageQueue > 0) {
                this.riseGarbage(this.garbageQueue);
                this.garbageQueue = 0;
            }
        }

        this.spawnPiece();
    }

    clearLines() {
        let cleared = 0;
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.grid[r].every(cell => cell !== null)) {
                this.grid.splice(r, 1);
                this.grid.unshift(Array(this.cols).fill(null));
                cleared++;
                r++;
            }
        }
        if (cleared > 0) {
            this.lines += cleared;
            this.score += [0, 100, 300, 500, 800][cleared] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 80);
        }
        return cleared;
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
        if (!this.game || this.game.isGameOver || !this.game.currentPiece) return;

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
   5. Main Application Controller (UI & Flow)
   -------------------------------------------------------------------------- */
class TetrisunApp {
    constructor() {
        this.sound = new SoundEngine();
        this.selectedMode = 'story';
        this.difficulty = 'normal';
        this.p2pEnabled = true;

        this.playerChar = 'nekonya';
        this.cpuChar = 'inuwan';

        this.p1Game = null;
        this.p2Game = null;
        this.cpuAI = null;

        this.peer = null;
        this.peerId = null;
        this.peerConn = null;

        this.storyStage = 1;
        this.storyYamlData = null;
        this.storyDialogues = [];
        this.currentDialogueIdx = 0;

        this.highScores = JSON.parse(localStorage.getItem('tetrisun_scores') || '[]');
        this.isLoopRunning = false;
        this.lastTime = 0;
    }

    async init() {
        this.fitToScreen();
        window.addEventListener('resize', () => this.fitToScreen());

        await this.loadStoryYaml();
        this.initCharSelectGrid();
        this.initPeerJS();
        this.bindEvents();
        this.updateRankingTable();
        this.startMagicGaugeTimer();

        // Select initial story mode settings panel
        this.selectMode('story', document.querySelector('.mode-btn[data-mode="story"]'));

        console.log("🐾 Tetrisun initialized successfully.");
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
        document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
        this.sound.init();
    }

    /* Dynamic Settings Panel Switch per Selected Mode */
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
    }

    updateSettings() {
        const diffEl = document.getElementById('setting-difficulty');
        if (diffEl) this.difficulty = diffEl.value;

        const chalEl = document.getElementById('setting-challenger');
        if (chalEl) this.p2pEnabled = (chalEl.value === 'on');
    }

    updateAudioVolume() {
        const bgmVal = document.getElementById('setting-bgm').value;
        const seVal = document.getElementById('setting-se').value;
        this.sound.bgmVolume = bgmVal / 100;
        this.sound.seVolume = seVal / 100;
    }

    initCharSelectGrid() {
        const grid = document.getElementById('char-grid');
        const cpuSelect = document.getElementById('setting-cpu-char');
        if (!grid) return;
        grid.innerHTML = '';
        if (cpuSelect) cpuSelect.innerHTML = '';

        Object.keys(CHARACTERS).forEach(id => {
            const char = CHARACTERS[id];

            // Character Card with Illustration Image
            const card = document.createElement('div');
            card.className = `char-card ${id === this.playerChar ? 'selected' : ''}`;
            card.onclick = () => this.selectPlayerChar(id);
            card.innerHTML = `
                <img class="char-card-img" src="${char.img}" alt="${char.name}">
                <div class="char-card-name">${char.name}</div>
            `;
            grid.appendChild(card);

            // CPU Select Options in Settings
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
        document.getElementById('char-name').textContent = char.name;
        document.getElementById('char-animal').textContent = `モチーフ: ${char.animal}`;
        document.getElementById('char-desc').textContent = char.desc;
        document.getElementById('magic-name').textContent = char.magicName;
        document.getElementById('magic-desc').textContent = char.magicDesc;

        const previewImg = document.getElementById('char-preview-img');
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
            if (data.type === 'GARBAGE' && this.p1Game) {
                this.p1Game.receiveGarbage(data.amount);
            } else if (data.type === 'STATE' && this.p2Game) {
                this.p2Game.grid = data.grid;
                this.p2Game.score = data.score;
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

    startGame() {
        this.showScreen('view-game');
        this.sound.startBgm();

        this.p1Game = new TetrisGame('p1', false);
        this.p1Game.reset();

        // Line Clear Excitement Shake Callback
        this.p1Game.onLineClear = (lines) => {
            this.sound.playLineClearSE(lines);
            if (lines >= 4) this.triggerScreenShake('large');
            else if (lines >= 1) this.triggerScreenShake('small');
        };

        this.p1Game.onSendGarbage = (lines) => {
            if (this.p2Game) this.p2Game.receiveGarbage(lines);
            if (this.peerConn) this.peerConn.send({ type: 'GARBAGE', amount: lines });
        };

        if (this.selectedMode === 'scoreattack') {
            this.p2Game = null;
            document.getElementById('p2-stage-box').style.opacity = '0.3';
        } else {
            document.getElementById('p2-stage-box').style.opacity = '1';
            const enemyCharId = (this.selectedMode === 'story') ? this.getStoryEnemyChar() : this.cpuChar;
            this.cpuChar = enemyCharId;
            this.p2Game = new TetrisGame('p2', true);
            this.p2Game.reset();

            this.p2Game.onLineClear = (lines) => {
                this.sound.playLineClearSE(lines);
            };

            this.p2Game.onSendGarbage = (lines) => {
                if (this.p1Game) this.p1Game.receiveGarbage(lines);
            };
            this.cpuAI = new CpuAI(this.p2Game, this.difficulty);
        }

        // Update Portraits & Names
        document.getElementById('p1-name').textContent = `${CHARACTERS[this.playerChar].name} (1P)`;
        document.getElementById('p2-name').textContent = `${CHARACTERS[this.cpuChar].name} (CPU)`;
        document.getElementById('p1-face-img').src = CHARACTERS[this.playerChar].img;
        document.getElementById('p2-face-img').src = CHARACTERS[this.cpuChar].img;

        document.getElementById('game-stage-info').textContent = (this.selectedMode === 'story') ? `STAGE ${this.storyStage}: ${CHARACTERS[this.cpuChar].name}戦` : 'SINGLE VERSUS';

        if (this.selectedMode === 'story') {
            this.loadStoryDialogue();
        } else {
            document.getElementById('adv-dialogue-box').style.display = 'none';
        }

        if (!this.isLoopRunning) {
            this.isLoopRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.gameLoop(time));
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
                    speaker: d.speaker === 'p1' ? CHARACTERS[this.playerChar].name : CHARACTERS[this.cpuChar].name,
                    text: d.text
                }));
            }
        }

        if (dialogues.length === 0) {
            dialogues = [
                { speaker: CHARACTERS[this.playerChar].name, text: '「いよいよパステルテトリス対戦の始まりだね！」' },
                { speaker: CHARACTERS[this.cpuChar].name, text: `「${CHARACTERS[this.cpuChar].name}の魔法で勝負だワン/ニャン！」` }
            ];
        }

        this.storyDialogues = dialogues;
        this.currentDialogueIdx = 0;
        dialogBox.style.display = 'block';
        this.renderDialogueStep();
    }

    renderDialogueStep() {
        if (this.currentDialogueIdx >= this.storyDialogues.length) {
            document.getElementById('adv-dialogue-box').style.display = 'none';
            return;
        }
        const d = this.storyDialogues[this.currentDialogueIdx];
        document.getElementById('adv-speaker-name').textContent = d.speaker;
        document.getElementById('adv-text').textContent = d.text;
    }

    nextDialogue() {
        this.currentDialogueIdx++;
        this.renderDialogueStep();
    }

    skipDialogue() {
        document.getElementById('adv-dialogue-box').style.display = 'none';
    }

    gameLoop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        this.pollGamepad();

        if (this.p1Game && !this.p1Game.isPaused && !this.p1Game.isGameOver) {
            this.updatePlayerGame(this.p1Game, dt);
        }

        if (this.p2Game && !this.p2Game.isPaused && !this.p2Game.isGameOver) {
            this.updatePlayerGame(this.p2Game, dt);
            if (this.cpuAI) this.cpuAI.update(time);
        }

        this.renderAll();

        if (this.p1Game && this.p1Game.isGameOver) {
            this.handleGameOver(false);
        } else if (this.p2Game && this.p2Game.isGameOver) {
            this.handleGameOver(true);
        } else {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    pollGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (!gp || !this.p1Game || this.p1Game.isGameOver) return;

        if (gp.buttons[0].pressed || gp.buttons[1].pressed) {
            if (!this.gpPrevRotate) { this.p1Game.rotatePiece(1); this.sound.playRotateSE(); }
            this.gpPrevRotate = true;
        } else { this.gpPrevRotate = false; }

        if (gp.buttons[2].pressed || gp.buttons[3].pressed) {
            if (!this.gpPrevDrop) { this.p1Game.hardDrop(); this.sound.playDropSE(); }
            this.gpPrevDrop = true;
        } else { this.gpPrevDrop = false; }

        if (gp.buttons[4].pressed || gp.buttons[5].pressed) {
            if (!this.gpPrevHold) { this.p1Game.hold(); }
            this.gpPrevHold = true;
        } else { this.gpPrevHold = false; }

        if (gp.buttons[7].pressed || gp.buttons[6].pressed) {
            if (!this.gpPrevMagic) { this.triggerMagic('p1'); }
            this.gpPrevMagic = true;
        } else { this.gpPrevMagic = false; }

        if (gp.axes[0] < -0.5 || gp.buttons[14].pressed) this.p1Game.moveLeft();
        else if (gp.axes[0] > 0.5 || gp.buttons[15].pressed) this.p1Game.moveRight();
        if (gp.axes[1] > 0.5 || gp.buttons[13].pressed) this.p1Game.softDrop();
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
        setInterval(() => {
            if (this.p1Game && !this.p1Game.isGameOver) {
                this.p1Game.magicGauge = Math.min(100, this.p1Game.magicGauge + 2);
                const btn = document.getElementById('p1-magic-btn');
                if (btn) btn.disabled = (this.p1Game.magicGauge < 100);
            }
            if (this.p2Game && !this.p2Game.isGameOver) {
                this.p2Game.magicGauge = Math.min(100, this.p2Game.magicGauge + 2);
                if (this.p2Game.magicGauge >= 100 && Math.random() < 0.3) {
                    this.triggerMagic('p2');
                }
            }
        }, 1000);
    }

    triggerMagic(playerId) {
        const game = (playerId === 'p1') ? this.p1Game : this.p2Game;
        const opponent = (playerId === 'p1') ? this.p2Game : this.p1Game;
        const charId = (playerId === 'p1') ? this.playerChar : this.cpuChar;

        if (!game || game.magicGauge < 100) return;
        game.magicGauge = 0;
        this.sound.playMagicSE();

        const modal = document.getElementById('magic-roulette-modal');
        const textEl = document.getElementById('roulette-text');
        modal.style.display = 'block';

        let spins = 0;
        const timer = setInterval(() => {
            spins++;
            const randLv = Math.floor(Math.random() * 5);
            textEl.textContent = `LV${randLv}: 魔法ルーレット回転中...`;
            if (spins > 10) {
                clearInterval(timer);
                const finalLv = Math.floor(Math.random() * 5);
                this.applyMagicEffect(finalLv, game, opponent, charId);
                setTimeout(() => { modal.style.display = 'none'; }, 1000);
            }
        }, 80);
    }

    applyMagicEffect(lv, game, opponent, charId) {
        const textEl = document.getElementById('roulette-text');
        switch (lv) {
            case 0:
                textEl.textContent = 'LV0: はずれ (効果なし)';
                break;
            case 1:
                textEl.textContent = 'LV1: 全お邪魔ブロック消去！';
                game.grid.forEach(row => {
                    row.forEach((cell, c) => {
                        if (cell && cell.isGarbage) row[c] = null;
                    });
                });
                break;
            case 2:
                textEl.textContent = 'LV2: 5秒間お邪魔無効バリア！';
                game.barrierTimer = 5;
                break;
            case 3:
                textEl.textContent = 'LV3: 次の5回「I型」固定！';
                game.forceIPieces = 5;
                break;
            case 4:
                textEl.textContent = `LV4: ${CHARACTERS[charId].magicName}！`;
                this.executeCharacterMagic(charId, game, opponent);
                break;
        }
        this.showCutinBanner(`${CHARACTERS[charId].name}: LV${lv} 魔法発動！`);
    }

    executeCharacterMagic(charId, game, opponent) {
        switch (charId) {
            case 'nekonya':
                let clearedCount = 0;
                for (let r = 1; r < game.rows; r += 2) {
                    if (clearedCount < 3) {
                        game.grid[r] = Array(game.cols).fill(null);
                        clearedCount++;
                    }
                }
                break;

            case 'inuwan':
                let pushed = 0;
                for (let r = game.rows - 1; r >= 0; r--) {
                    if (game.grid[r].some(c => c && c.isGarbage) && pushed < 3) {
                        game.grid[r] = Array(game.cols).fill(null);
                        pushed++;
                    }
                }
                if (pushed > 0 && opponent) opponent.receiveGarbage(pushed);
                break;

            case 'torichun':
                let topCleared = 0;
                for (let r = 0; r < game.rows; r++) {
                    if (game.grid[r].some(c => c !== null) && topCleared < 3) {
                        game.grid[r] = Array(game.cols).fill(null);
                        topCleared++;
                    }
                }
                break;

            case 'sarukkey':
                game.forceOPieces = 3;
                break;

            case 'tanupon':
                game.grid = game.createGrid();
                if (opponent) opponent.grid = opponent.createGrid();
                break;

            case 'kitsunekon':
                if (opponent) {
                    const temp = game.grid;
                    game.grid = opponent.grid;
                    opponent.grid = temp;
                }
                break;

            case 'dragogon':
                for (let r = game.rows - 1; r >= game.rows - 5; r--) {
                    game.grid[r] = Array(game.cols).fill(null);
                }
                break;
        }
    }

    showCutinBanner(text) {
        const banner = document.getElementById('cutin-banner');
        const txt = document.getElementById('cutin-text');
        if (!banner || !txt) return;
        txt.textContent = text;
        banner.style.display = 'block';
        setTimeout(() => { banner.style.display = 'none'; }, 1200);
    }

    renderAll() {
        if (this.p1Game) {
            this.renderBoard('p1-board-canvas', this.p1Game);
            this.renderHold('p1-hold-canvas', this.p1Game.holdPiece);
            this.renderNext('p1-next-canvas', this.p1Game.nextQueue);
            document.getElementById('p1-score').textContent = `SCORE: ${String(this.p1Game.score).padStart(6, '0')}`;
            document.getElementById('p1-lines').textContent = this.p1Game.lines;
            document.getElementById('p1-ren').textContent = this.p1Game.ren;
            document.getElementById('p1-level').textContent = this.p1Game.level;
            document.getElementById('p1-magic-fill').style.width = `${this.p1Game.magicGauge}%`;
            document.getElementById('p1-garbage-bar').style.height = `${Math.min(100, this.p1Game.garbageQueue * 10)}%`;
        }

        if (this.p2Game) {
            this.renderBoard('p2-board-canvas', this.p2Game);
            this.renderHold('p2-hold-canvas', this.p2Game.holdPiece);
            this.renderNext('p2-next-canvas', this.p2Game.nextQueue);
            document.getElementById('p2-score').textContent = `SCORE: ${String(this.p2Game.score).padStart(6, '0')}`;
            document.getElementById('p2-lines').textContent = this.p2Game.lines;
            document.getElementById('p2-ren').textContent = this.p2Game.ren;
            document.getElementById('p2-level').textContent = this.p2Game.level;
            document.getElementById('p2-magic-fill').style.width = `${this.p2Game.magicGauge}%`;
            document.getElementById('p2-garbage-bar').style.height = `${Math.min(100, this.p2Game.garbageQueue * 10)}%`;
        }
    }

    renderBoard(canvasId, game) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cellW = 24;
        const cellH = 24;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Locked Grid Blocks
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                if (game.grid[r][c]) {
                    this.drawRoundedBlock(ctx, c * cellW, r * cellH, cellW, cellH, game.grid[r][c].color);
                }
            }
        }

        // Active Piece & Ghost Block
        if (game.currentPiece && !game.isGameOver) {
            const ghostY = game.getGhostY();
            const shape = game.currentPiece.shape;

            // Ghost Block (Rounded outline & soft fill)
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const gx = (game.currentX + c) * cellW;
                        const gy = (ghostY + r) * cellH;
                        ctx.fillStyle = 'rgba(180, 190, 220, 0.15)';
                        ctx.beginPath();
                        ctx.roundRect(gx + 1, gy + 1, cellW - 2, cellH - 2, 5);
                        ctx.fill();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = 'rgba(160, 170, 210, 0.5)';
                        ctx.stroke();
                    }
                }
            }

            // Current Active Piece
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

    renderHold(canvasId, type) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!type) return;
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
    }

    renderNext(canvasId, queue) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cell = 14;
        queue.slice(0, 3).forEach((type, idx) => {
            const template = TETRIMINOS[type];
            const shape = template.shape;
            const offsetX = (canvas.width - shape[0].length * cell) / 2;
            const offsetY = 10 + idx * 65;

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
            if (!this.p1Game || this.p1Game.isGameOver || this.p1Game.isPaused) return;
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
                    // Note: Drop shake removed per request
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
                    break;
                case 'Space':
                    this.triggerMagic('p1');
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
        this.p1Game.isPaused = !this.p1Game.isPaused;
        const modal = document.getElementById('pause-modal');
        if (modal) modal.style.display = this.p1Game.isPaused ? 'flex' : 'none';
    }

    quitToTitle() {
        this.sound.stopBgm();
        this.showScreen('view-mode-select');
    }

    handleGameOver(isWin) {
        this.sound.stopBgm();
        this.showScreen('view-score-result');

        const titleBanner = document.getElementById('result-title-banner');
        if (titleBanner) {
            titleBanner.textContent = isWin ? '🎉 VICTORY! クリア成功！' : '💀 GAME OVER';
        }

        document.getElementById('res-score').textContent = String(this.p1Game ? this.p1Game.score : 0).padStart(6, '0');
        document.getElementById('res-lines').textContent = this.p1Game ? this.p1Game.lines : 0;
        document.getElementById('res-ren').textContent = this.p1Game ? this.p1Game.ren : 0;
    }

    submitScore() {
        const nameInput = document.getElementById('player-name-input');
        const rawName = nameInput ? nameInput.value.trim() : 'たびびと';
        const safeName = this.escapeHTML(rawName || 'たびびと');

        const entry = {
            name: safeName,
            score: this.p1Game ? this.p1Game.score : 0,
            mode: this.selectedMode.toUpperCase(),
            date: new Date().toLocaleDateString('ja-JP')
        };

        this.highScores.push(entry);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 5);

        localStorage.setItem('tetrisun_scores', JSON.stringify(this.highScores));
        this.updateRankingTable();
        this.showToast('🏆 ランキングスコアを登録しました！');
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
            tr.innerHTML = `
                <td><strong>#${idx + 1}</strong></td>
                <td>${item.name}</td>
                <td>${item.score}</td>
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
