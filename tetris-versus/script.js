/**
 * Cyber Tetris Versus - Web Audio, Canvas Arcade & WebRTC Online Multiplayer Engine
 * Antigravity Webtools Suite
 */

(function () {
    'use strict';

    // --- TETROMINO DEFINITIONS & COLOR PALETTE ---
    const TETROMINOES = {
        I: {
            color: '#06b6d4', // Cyan
            ghostColor: 'rgba(6, 182, 212, 0.25)',
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ]
        },
        J: {
            color: '#3b82f6', // Blue
            ghostColor: 'rgba(59, 130, 246, 0.25)',
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ]
        },
        L: {
            color: '#f97316', // Orange
            ghostColor: 'rgba(249, 115, 22, 0.25)',
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ]
        },
        O: {
            color: '#eab308', // Yellow
            ghostColor: 'rgba(234, 179, 8, 0.25)',
            shape: [
                [1, 1],
                [1, 1]
            ]
        },
        S: {
            color: '#22c55e', // Green
            ghostColor: 'rgba(34, 197, 94, 0.25)',
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ]
        },
        T: {
            color: '#a855f7', // Purple
            ghostColor: 'rgba(168, 85, 247, 0.25)',
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ]
        },
        Z: {
            color: '#ef4444', // Red
            ghostColor: 'rgba(239, 68, 68, 0.25)',
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ]
        }
    };

    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30; // 300x600 canvas

    // --- Web Audio Synthesizer ---
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
        }

        playTone(freq, duration, type = 'sine', gainVal = 0.1) {
            if (!this.enabled || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {}
        }

        move() { this.playTone(300, 0.05, 'triangle', 0.05); }
        rotate() { this.playTone(450, 0.06, 'sine', 0.08); }
        drop() { this.playTone(150, 0.08, 'square', 0.1); }
        hardDrop() { this.playTone(80, 0.15, 'sawtooth', 0.15); }
        clear() {
            this.playTone(523.25, 0.1, 'sine', 0.12);
            setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.12), 60);
        }
        tetris() {
            this.playTone(523.25, 0.1, 'square', 0.15);
            setTimeout(() => this.playTone(659.25, 0.1, 'square', 0.15), 60);
            setTimeout(() => this.playTone(783.99, 0.1, 'square', 0.15), 120);
            setTimeout(() => this.playTone(1046.50, 0.25, 'square', 0.18), 180);
        }
        garbage() { this.playTone(120, 0.2, 'sawtooth', 0.18); }
        ko() {
            this.playTone(200, 0.2, 'sawtooth', 0.2);
            setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.2), 150);
            setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.2), 300);
        }
    }

    const sound = new SoundEngine();

    // --- TETRIS PLAYER BOARD CLASS ---
    class TetrisBoard {
        constructor(id, isCPU = false, cpuDiff = 'medium', isRemote = false) {
            this.id = id;
            this.isCPU = isCPU;
            this.cpuDiff = cpuDiff;
            this.isRemote = isRemote; // True if controlled remotely over WebRTC

            this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
            this.score = 0;
            this.lines = 0;
            this.combo = -1;
            this.garbageSentTotal = 0;
            this.queuedGarbage = 0;

            this.bag = [];
            this.currentPiece = null;
            this.pieceX = 0;
            this.pieceY = 0;
            this.holdPiece = null;
            this.canHold = true;
            this.nextQueue = [];

            this.isGameOver = false;
            this.dropCounter = 0;
            this.dropInterval = 800; // ms
            this.lastTime = 0;

            this.cpuTimer = 0;
            this.cpuTarget = null;

            // Canvas references
            this.boardCanvas = document.getElementById(`${id}-board-canvas`);
            this.boardCtx = this.boardCanvas.getContext('2d');
            this.holdCanvas = document.getElementById(`${id}-hold-canvas`);
            this.holdCtx = this.holdCanvas.getContext('2d');
            this.nextCanvas = document.getElementById(`${id}-next-canvas`);
            this.nextCtx = this.nextCanvas.getContext('2d');

            // UI Elements
            this.scoreEl = document.getElementById(`${id}-score`);
            this.linesEl = document.getElementById(`${id}-lines`);
            this.comboEl = document.getElementById(`${id}-combo`);
            this.garbageSentEl = document.getElementById(`${id}-garbage-sent`);
            this.garbageGaugeEl = document.getElementById(`${id}-garbage-gauge`);
            this.announcerEl = document.getElementById(`${id}-announcer`);
            this.koOverlayEl = document.getElementById(`${id}-ko-overlay`);

            this.opponent = null; // Reference to enemy board
            this.fillBag();
            this.spawnPiece();
        }

        fillBag() {
            const types = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
            for (let i = types.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [types[i], types[j]] = [types[j], types[i]];
            }
            this.bag.push(...types);
        }

        getNextPieceType() {
            if (this.bag.length < 7) {
                this.fillBag();
            }
            return this.bag.shift();
        }

        spawnPiece() {
            while (this.nextQueue.length < 4) {
                this.nextQueue.push(this.getNextPieceType());
            }

            const type = this.nextQueue.shift();
            this.currentPiece = {
                type: type,
                matrix: JSON.parse(JSON.stringify(TETROMINOES[type].shape)),
                color: TETROMINOES[type].color,
                ghostColor: TETROMINOES[type].ghostColor
            };

            this.pieceX = Math.floor((COLS - this.currentPiece.matrix[0].length) / 2);
            this.pieceY = 0;
            this.canHold = true;

            if (this.collide(this.grid, this.currentPiece.matrix, { x: this.pieceX, y: this.pieceY })) {
                this.isGameOver = true;
                this.koOverlayEl.style.display = 'flex';
                sound.ko();
            }

            if (this.isCPU) {
                this.calculateCPUMove();
            }
        }

        collide(grid, matrix, offset) {
            for (let y = 0; y < matrix.length; y++) {
                for (let x = 0; x < matrix[y].length; x++) {
                    if (matrix[y][x] !== 0) {
                        const boardX = x + offset.x;
                        const boardY = y + offset.y;
                        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                            return true;
                        }
                        if (boardY >= 0 && grid[boardY][boardX] !== 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        rotateMatrix(matrix, dir = 1) {
            const result = matrix.map((_, i) => matrix.map(col => col[i]));
            if (dir > 0) return result.map(row => row.reverse());
            return result.reverse();
        }

        rotate(dir = 1) {
            if (this.isRemote) return;
            const originalMatrix = this.currentPiece.matrix;
            const rotated = this.rotateMatrix(originalMatrix, dir);

            if (!this.collide(this.grid, rotated, { x: this.pieceX, y: this.pieceY })) {
                this.currentPiece.matrix = rotated;
                sound.rotate();
                return;
            }

            const kicks = [1, -1, 2, -2];
            for (let k of kicks) {
                if (!this.collide(this.grid, rotated, { x: this.pieceX + k, y: this.pieceY })) {
                    this.pieceX += k;
                    this.currentPiece.matrix = rotated;
                    sound.rotate();
                    return;
                }
            }
        }

        move(dir) {
            if (this.isRemote) return;
            if (!this.collide(this.grid, this.currentPiece.matrix, { x: this.pieceX + dir, y: this.pieceY })) {
                this.pieceX += dir;
                sound.move();
            }
        }

        softDrop() {
            if (this.isRemote) return false;
            if (!this.collide(this.grid, this.currentPiece.matrix, { x: this.pieceX, y: this.pieceY + 1 })) {
                this.pieceY++;
                this.score += 1;
                this.dropCounter = 0;
                return true;
            } else {
                this.lockPiece();
                return false;
            }
        }

        hardDrop() {
            if (this.isRemote) return;
            let dropDist = 0;
            while (!this.collide(this.grid, this.currentPiece.matrix, { x: this.pieceX, y: this.pieceY + 1 })) {
                this.pieceY++;
                dropDist++;
            }
            this.score += dropDist * 2;
            sound.hardDrop();
            this.lockPiece();
        }

        hold() {
            if (this.isRemote || !this.canHold) return;
            sound.move();

            const currentType = this.currentPiece.type;
            if (this.holdPiece === null) {
                this.holdPiece = currentType;
                this.spawnPiece();
            } else {
                const temp = this.holdPiece;
                this.holdPiece = currentType;
                this.currentPiece = {
                    type: temp,
                    matrix: JSON.parse(JSON.stringify(TETROMINOES[temp].shape)),
                    color: TETROMINOES[temp].color,
                    ghostColor: TETROMINOES[temp].ghostColor
                };
                this.pieceX = Math.floor((COLS - this.currentPiece.matrix[0].length) / 2);
                this.pieceY = 0;
            }

            this.canHold = false;
            if (this.isCPU) this.calculateCPUMove();
        }

        lockPiece() {
            this.currentPiece.matrix.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val !== 0) {
                        const gy = y + this.pieceY;
                        const gx = x + this.pieceX;
                        if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
                            this.grid[gy][gx] = this.currentPiece.color;
                        }
                    }
                });
            });

            this.clearLines();
            this.spawnPiece();
        }

        clearLines() {
            let linesCleared = 0;
            for (let y = ROWS - 1; y >= 0; y--) {
                if (this.grid[y].every(cell => cell !== 0 && cell !== 'garbage_pending')) {
                    this.grid.splice(y, 1);
                    this.grid.unshift(Array(COLS).fill(0));
                    linesCleared++;
                    y++;
                }
            }

            if (linesCleared > 0) {
                this.lines += linesCleared;
                this.combo++;

                let attack = 0;
                if (linesCleared === 1) attack = 0;
                else if (linesCleared === 2) attack = 1;
                else if (linesCleared === 3) attack = 2;
                else if (linesCleared === 4) { attack = 4; sound.tetris(); this.showAnnouncer('TETRIS!'); }
                else { sound.clear(); }

                if (this.combo > 0) {
                    attack += Math.floor(this.combo / 2);
                    if (linesCleared < 4) this.showAnnouncer(`${linesCleared === 2 ? 'DOUBLE' : linesCleared === 3 ? 'TRIPLE' : 'SINGLE'}!\n${this.combo} REN`);
                }

                this.score += linesCleared * 100 * (this.combo + 1);

                if (this.queuedGarbage > 0) {
                    const offset = Math.min(this.queuedGarbage, attack);
                    this.queuedGarbage -= offset;
                    attack -= offset;
                }

                if (attack > 0 && this.opponent) {
                    this.garbageSentTotal += attack;
                    this.opponent.receiveGarbage(attack);
                }
            } else {
                this.combo = -1;

                if (this.queuedGarbage > 0) {
                    this.applyGarbage(this.queuedGarbage);
                    this.queuedGarbage = 0;
                }
            }
        }

        receiveGarbage(count) {
            this.queuedGarbage += count;
            sound.garbage();
        }

        applyGarbage(count) {
            for (let i = 0; i < count; i++) {
                const holeX = Math.floor(Math.random() * COLS);
                const garbageRow = Array(COLS).fill('#475569');
                garbageRow[holeX] = 0;

                this.grid.shift();
                this.grid.push(garbageRow);
            }
        }

        showAnnouncer(text) {
            this.announcerEl.textContent = text;
            this.announcerEl.classList.add('show');
            setTimeout(() => this.announcerEl.classList.remove('show'), 1200);
        }

        // AI BOT CPU BRAIN
        calculateCPUMove() {
            if (!this.currentPiece) return;

            let bestScore = -Infinity;
            let bestMove = { x: this.pieceX, rotation: 0, hold: false };

            const testPieceRotations = [0, 1, 2, 3];

            testPieceRotations.forEach(rot => {
                let testMatrix = JSON.parse(JSON.stringify(this.currentPiece.matrix));
                for (let r = 0; r < rot; r++) {
                    testMatrix = this.rotateMatrix(testMatrix, 1);
                }

                const width = testMatrix[0].length;
                for (let x = -2; x <= COLS - width + 2; x++) {
                    if (this.collide(this.grid, testMatrix, { x: x, y: 0 })) continue;

                    let y = 0;
                    while (!this.collide(this.grid, testMatrix, { x: x, y: y + 1 })) {
                        y++;
                    }

                    const score = this.evaluateBoard(this.grid, testMatrix, x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { x: x, rotation: rot, hold: false };
                    }
                }
            });

            this.cpuTarget = bestMove;
            this.cpuTimer = 0;
        }

        evaluateBoard(grid, matrix, pieceX, pieceY) {
            const tempGrid = JSON.parse(JSON.stringify(grid));
            matrix.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val !== 0 && y + pieceY >= 0 && y + pieceY < ROWS && x + pieceX >= 0 && x + pieceX < COLS) {
                        tempGrid[y + pieceY][x + pieceX] = 1;
                    }
                });
            });

            let aggregateHeight = 0;
            let completeLines = 0;
            let holes = 0;
            let bumpiness = 0;

            const heights = Array(COLS).fill(0);
            for (let x = 0; x < COLS; x++) {
                for (let y = 0; y < ROWS; y++) {
                    if (tempGrid[y][x] !== 0) {
                        heights[x] = ROWS - y;
                        break;
                    }
                }
                aggregateHeight += heights[x];
            }

            for (let y = 0; y < ROWS; y++) {
                if (tempGrid[y].every(cell => cell !== 0)) completeLines++;
            }

            for (let x = 0; x < COLS; x++) {
                let blockFound = false;
                for (let y = 0; y < ROWS; y++) {
                    if (tempGrid[y][x] !== 0) blockFound = true;
                    else if (blockFound && tempGrid[y][x] === 0) holes++;
                }
            }

            for (let x = 0; x < COLS - 1; x++) {
                bumpiness += Math.abs(heights[x] - heights[x + 1]);
            }

            return (-0.51 * aggregateHeight) + (0.76 * completeLines) - (0.36 * holes) - (0.18 * bumpiness);
        }

        updateCPU(delta) {
            if (this.isGameOver || !this.cpuTarget) return;

            let cpuDelay = 500;
            if (this.cpuDiff === 'easy') cpuDelay = 800;
            else if (this.cpuDiff === 'medium') cpuDelay = 450;
            else if (this.cpuDiff === 'hard') cpuDelay = 180;
            else if (this.cpuDiff === 'master') cpuDelay = 50;

            this.cpuTimer += delta;
            if (this.cpuTimer >= cpuDelay) {
                this.cpuTimer = 0;

                if (this.cpuTarget.rotation > 0) {
                    this.rotate(1);
                    this.cpuTarget.rotation--;
                    return;
                }

                if (this.pieceX < this.cpuTarget.x) {
                    this.move(1);
                } else if (this.pieceX > this.cpuTarget.x) {
                    this.move(-1);
                } else {
                    if (this.cpuDiff === 'hard' || this.cpuDiff === 'master') {
                        this.hardDrop();
                    } else {
                        this.softDrop();
                    }
                }
            }
        }

        update(time = 0) {
            if (this.isGameOver) return;

            const delta = time - this.lastTime;
            this.lastTime = time;

            if (this.isCPU) {
                this.updateCPU(delta);
            }

            if (!this.isRemote) {
                this.dropCounter += delta;
                if (this.dropCounter > this.dropInterval) {
                    this.softDrop();
                    this.dropCounter = 0;
                }
            }

            this.render();
            this.updateUI();
        }

        render() {
            this.boardCtx.fillStyle = '#0b0f19';
            this.boardCtx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

            this.boardCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            this.boardCtx.lineWidth = 1;
            for (let x = 0; x <= COLS; x++) {
                this.boardCtx.beginPath();
                this.boardCtx.moveTo(x * BLOCK_SIZE, 0);
                this.boardCtx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
                this.boardCtx.stroke();
            }
            for (let y = 0; y <= ROWS; y++) {
                this.boardCtx.beginPath();
                this.boardCtx.moveTo(0, y * BLOCK_SIZE);
                this.boardCtx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
                this.boardCtx.stroke();
            }

            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (this.grid[y][x] !== 0) {
                        this.drawBlock(this.boardCtx, x, y, this.grid[y][x]);
                    }
                }
            }

            if (this.currentPiece) {
                let ghostY = this.pieceY;
                while (!this.collide(this.grid, this.currentPiece.matrix, { x: this.pieceX, y: ghostY + 1 })) {
                    ghostY++;
                }

                this.currentPiece.matrix.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val !== 0) {
                            this.drawBlock(this.boardCtx, x + this.pieceX, y + ghostY, this.currentPiece.ghostColor, true);
                        }
                    });
                });

                this.currentPiece.matrix.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val !== 0) {
                            this.drawBlock(this.boardCtx, x + this.pieceX, y + this.pieceY, this.currentPiece.color);
                        }
                    });
                });
            }

            this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
            if (this.holdPiece) {
                const spec = TETROMINOES[this.holdPiece];
                const matrix = spec.shape;
                const size = 18;
                const offsetX = (this.holdCanvas.width - matrix[0].length * size) / 2;
                const offsetY = (this.holdCanvas.height - matrix.length * size) / 2;

                matrix.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val !== 0) {
                            this.holdCtx.fillStyle = spec.color;
                            this.holdCtx.fillRect(offsetX + x * size, offsetY + y * size, size - 1, size - 1);
                        }
                    });
                });
            }

            this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
            this.nextQueue.slice(0, 3).forEach((type, idx) => {
                const spec = TETROMINOES[type];
                const matrix = spec.shape;
                const size = 16;
                const offsetX = (this.nextCanvas.width - matrix[0].length * size) / 2;
                const offsetY = 12 + idx * 75;

                matrix.forEach((row, y) => {
                    row.forEach((val, x) => {
                        if (val !== 0) {
                            this.nextCtx.fillStyle = spec.color;
                            this.nextCtx.fillRect(offsetX + x * size, offsetY + y * size, size - 1, size - 1);
                        }
                    });
                });
            });
        }

        drawBlock(ctx, x, y, color, isGhost = false) {
            const px = x * BLOCK_SIZE;
            const py = y * BLOCK_SIZE;

            if (isGhost) {
                ctx.strokeStyle = color.replace('0.25', '0.8');
                ctx.lineWidth = 1.5;
                ctx.strokeRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                return;
            }

            ctx.fillStyle = color;
            ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, 3);
            ctx.fillRect(px + 1, py + 1, 3, BLOCK_SIZE - 2);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(px + 1, py + BLOCK_SIZE - 4, BLOCK_SIZE - 2, 3);
            ctx.fillRect(px + BLOCK_SIZE - 4, py + 1, 3, BLOCK_SIZE - 2);
        }

        updateUI() {
            this.scoreEl.textContent = this.score;
            this.linesEl.textContent = this.lines;
            this.comboEl.textContent = Math.max(0, this.combo);
            this.garbageSentEl.textContent = this.garbageSentTotal;

            const fillPct = Math.min(100, (this.queuedGarbage / 12) * 100);
            this.garbageGaugeEl.style.height = `${fillPct}%`;
        }

        // Export state payload for network synchronization
        exportState() {
            return {
                grid: this.grid,
                score: this.score,
                lines: this.lines,
                combo: this.combo,
                queuedGarbage: this.queuedGarbage,
                pieceX: this.pieceX,
                pieceY: this.pieceY,
                pieceType: this.currentPiece ? this.currentPiece.type : null,
                pieceMatrix: this.currentPiece ? this.currentPiece.matrix : null,
                holdPiece: this.holdPiece,
                nextQueue: this.nextQueue,
                isGameOver: this.isGameOver
            };
        }

        // Import network state payload from remote peer
        importState(state) {
            if (!state) return;
            this.grid = state.grid;
            this.score = state.score;
            this.lines = state.lines;
            this.combo = state.combo;
            this.queuedGarbage = state.queuedGarbage;
            this.pieceX = state.pieceX;
            this.pieceY = state.pieceY;
            if (state.pieceType) {
                this.currentPiece = {
                    type: state.pieceType,
                    matrix: state.pieceMatrix,
                    color: TETROMINOES[state.pieceType].color,
                    ghostColor: TETROMINOES[state.pieceType].ghostColor
                };
            }
            this.holdPiece = state.holdPiece;
            this.nextQueue = state.nextQueue;
            this.isGameOver = state.isGameOver;
            if (this.isGameOver) {
                this.koOverlayEl.style.display = 'flex';
            }
        }
    }

    // --- PEERJS WEBRTC NETWORK MANAGER ---
    class PeerManager {
        constructor(matchManager) {
            this.matchManager = matchManager;
            this.peer = null;
            this.conn = null;
            this.isHost = false;
            this.roomCode = null;

            this.logEl = document.getElementById('online-connection-log');
            this.statusDot = document.getElementById('online-status-dot');
            this.statusText = document.getElementById('online-status-text');
        }

        log(msg) {
            if (this.logEl) this.logEl.textContent = `[WebRTC] ${msg}`;
        }

        setStatus(status, text) {
            this.statusDot.className = `status-dot ${status}`;
            this.statusText.textContent = text;
        }

        createRoom() {
            const randomCode = 'TETRIS-' + Math.random().toString(36).substring(2, 6).toUpperCase();
            this.roomCode = randomCode;
            this.isHost = true;
            this.setStatus('connecting', '接続待機中...');
            this.log(`ルーム作成中 (${randomCode})...`);

            try {
                this.peer = new Peer(randomCode);
            } catch (err) {
                this.log(`エラー: PeerJS初期化失敗 - ${err.message}`);
                return;
            }

            this.peer.on('open', (id) => {
                this.log(`ルーム作成完了！コード: ${id}`);
                document.getElementById('my-room-code-display').textContent = id;
                document.getElementById('room-created-info').style.display = 'block';
            });

            this.peer.on('connection', (connection) => {
                this.conn = connection;
                this.setupConnection();
            });

            this.peer.on('error', (err) => {
                this.log(`通信エラー: ${err.type}`);
                this.setStatus('disconnected', 'エラー');
            });
        }

        joinRoom(targetCode) {
            if (!targetCode) {
                alert('ルームコードを入力してください。');
                return;
            }
            this.isHost = false;
            this.setStatus('connecting', '接続中...');
            this.log(`ルーム ${targetCode} に接続試行中...`);

            try {
                this.peer = new Peer();
            } catch (err) {
                this.log(`エラー: PeerJS初期化失敗 - ${err.message}`);
                return;
            }

            this.peer.on('open', () => {
                this.conn = this.peer.connect(targetCode);
                this.setupConnection();
            });

            this.peer.on('error', (err) => {
                this.log(`接続エラー: ${err.type}`);
                this.setStatus('disconnected', 'エラー');
            });
        }

        setupConnection() {
            this.conn.on('open', () => {
                this.setStatus('connected', 'オンライン接続完了');
                this.log(`対戦相手と通信確立！対戦を開始できます。`);
                document.getElementById('modal-online-lobby').style.display = 'none';
                this.matchManager.onOnlineConnected(this.isHost);
            });

            this.conn.on('data', (data) => {
                this.handleData(data);
            });

            this.conn.on('close', () => {
                this.setStatus('disconnected', '切断されました');
                this.log(`対戦相手との通信が切断されました。`);
            });
        }

        send(data) {
            if (this.conn && this.conn.open) {
                this.conn.send(data);
            }
        }

        handleData(data) {
            if (!data) return;
            if (data.type === 'STATE_SYNC') {
                if (this.isHost) {
                    // Host receives Guest (P2) board state
                    if (this.matchManager.p2) this.matchManager.p2.importState(data.state);
                } else {
                    // Guest receives Host (P1) board state
                    if (this.matchManager.p1) this.matchManager.p1.importState(data.state);
                }
            } else if (data.type === 'INPUT') {
                this.matchManager.handleRemoteInput(data.action, this.isHost ? 'p2' : 'p1');
            } else if (data.type === 'START_MATCH') {
                this.matchManager.startRound(false);
            } else if (data.type === 'RESET_MATCH') {
                this.matchManager.resetMatch(false);
            }
        }
    }

    // --- MATCH MANAGER (MATCH CONTROLLER) ---
    class MatchManager {
        constructor() {
            this.mode = 'p1vscpu'; // 'p1vscpu', 'p1vsp2', 'online', 'cpuvscpu'
            this.cpuDifficulty = 'medium';
            this.targetWins = 3;

            this.p1Wins = 0;
            this.p2Wins = 0;

            this.p1 = null;
            this.p2 = null;
            this.isRunning = false;
            this.isPaused = false;
            this.animationFrameId = null;

            this.peerMgr = new PeerManager(this);

            this.initDOM();
            this.setupEvents();
            this.checkUrlParams();
        }

        initDOM() {
            this.p1NameEl = document.getElementById('p1-name-display');
            this.p2NameEl = document.getElementById('p2-name-display');
            this.p1MatchScoreEl = document.getElementById('p1-match-score');
            this.p2MatchScoreEl = document.getElementById('p2-match-score');
            this.p1WinDotsEl = document.getElementById('p1-win-dots');
            this.p2WinDotsEl = document.getElementById('p2-win-dots');

            this.btnStart = document.getElementById('btn-start-match');
            this.btnPause = document.getElementById('btn-pause-match');
            this.btnReset = document.getElementById('btn-reset-match');

            this.modeBadge = document.getElementById('current-mode-badge');
            this.cpuDiffGroup = document.getElementById('cpu-diff-select-group');
            this.cpuDiffSelect = document.getElementById('cpu-difficulty');
            this.onlineStatusPill = document.getElementById('online-status-pill');

            this.p2TouchGroup = document.getElementById('p2-touch-group');
        }

        setupEvents() {
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.mode = btn.dataset.mode;
                    this.updateModeUI();

                    if (this.mode === 'online') {
                        document.getElementById('modal-online-lobby').style.display = 'flex';
                    } else {
                        this.resetMatch();
                    }
                });
            });

            this.cpuDiffSelect.addEventListener('change', (e) => {
                this.cpuDifficulty = e.target.value;
                this.updateModeUI();
            });

            this.btnStart.addEventListener('click', () => {
                sound.init();
                if (!this.isRunning) {
                    this.startRound(true);
                }
            });

            this.btnPause.addEventListener('click', () => {
                this.isPaused = !this.isPaused;
                this.btnPause.querySelector('span').textContent = this.isPaused ? 'RESUME' : 'PAUSE';
            });

            this.btnReset.addEventListener('click', () => this.resetMatch(true));

            // Keyboard Control Handlers
            window.addEventListener('keydown', (e) => this.handleKeyDown(e));

            // Sound Toggle
            document.getElementById('btn-sound-toggle').addEventListener('click', () => {
                sound.enabled = !sound.enabled;
                document.querySelector('.icon-sound-on').style.display = sound.enabled ? 'block' : 'none';
                document.querySelector('.icon-sound-off').style.display = sound.enabled ? 'none' : 'block';
            });

            // Modals & Lobby Buttons
            document.getElementById('btn-controls-modal').addEventListener('click', () => {
                document.getElementById('modal-controls').style.display = 'flex';
            });
            document.getElementById('btn-open-online-lobby').addEventListener('click', () => {
                document.getElementById('modal-online-lobby').style.display = 'flex';
            });

            document.querySelectorAll('[data-close]').forEach(b => {
                b.addEventListener('click', () => {
                    document.getElementById(b.dataset.close).style.display = 'none';
                });
            });

            document.getElementById('btn-result-rematch').addEventListener('click', () => {
                document.getElementById('modal-result').style.display = 'none';
                this.resetMatch(true);
                this.startRound(true);
            });

            // WebRTC Lobby Events
            document.getElementById('btn-create-room').addEventListener('click', () => {
                this.peerMgr.createRoom();
            });

            document.getElementById('btn-join-room').addEventListener('click', () => {
                const code = document.getElementById('input-join-room-code').value.trim().toUpperCase();
                this.peerMgr.joinRoom(code);
            });

            document.getElementById('btn-copy-room-code').addEventListener('click', () => {
                if (this.peerMgr.roomCode) {
                    navigator.clipboard.writeText(this.peerMgr.roomCode);
                    alert('ルームコードをコピーしました！');
                }
            });

            document.getElementById('btn-copy-invite-link').addEventListener('click', () => {
                if (this.peerMgr.roomCode) {
                    const link = `${window.location.origin}${window.location.pathname}?room=${this.peerMgr.roomCode}`;
                    navigator.clipboard.writeText(link);
                    alert('招待URLをコピーしました！');
                }
            });

            // Touch Controls Binding
            document.querySelectorAll('.btn-touch').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    this.dispatchVirtualKey(key);
                });
            });
        }

        checkUrlParams() {
            const params = new URLSearchParams(window.location.search);
            const roomCode = params.get('room');
            if (roomCode) {
                // Auto join room from query param URL!
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                const onlineBtn = document.querySelector('.mode-btn[data-mode="online"]');
                if (onlineBtn) onlineBtn.classList.add('active');
                this.mode = 'online';
                this.updateModeUI();

                document.getElementById('input-join-room-code').value = roomCode.toUpperCase();
                document.getElementById('modal-online-lobby').style.display = 'flex';
                this.peerMgr.joinRoom(roomCode.toUpperCase());
            }
        }

        dispatchVirtualKey(code) {
            this.handleKeyDown({ code: code, preventDefault: () => {} });
        }

        updateModeUI() {
            this.cpuDiffGroup.style.display = 'none';
            this.onlineStatusPill.style.display = 'none';
            this.p2TouchGroup.style.display = 'none';

            if (this.mode === 'p1vscpu') {
                this.modeBadge.textContent = '1P vs CPU';
                this.p1NameEl.textContent = 'PLAYER 1';
                this.p2NameEl.textContent = `CPU (${this.cpuDifficulty.toUpperCase()})`;
                this.cpuDiffGroup.style.display = 'flex';
            } else if (this.mode === 'p1vsp2') {
                this.modeBadge.textContent = '1P vs 2P';
                this.p1NameEl.textContent = 'PLAYER 1';
                this.p2NameEl.textContent = 'PLAYER 2';
                this.p2TouchGroup.style.display = 'flex';
            } else if (this.mode === 'online') {
                this.modeBadge.textContent = 'オンライン対戦';
                this.p1NameEl.textContent = this.peerMgr.isHost ? 'YOU (P1/Host)' : 'YOU (P2/Guest)';
                this.p2NameEl.textContent = this.peerMgr.isHost ? 'ENEMY (P2)' : 'ENEMY (P1)';
                this.onlineStatusPill.style.display = 'flex';
            } else if (this.mode === 'cpuvscpu') {
                this.modeBadge.textContent = 'CPU vs CPU';
                this.p1NameEl.textContent = 'CPU 1 (MASTER)';
                this.p2NameEl.textContent = `CPU 2 (${this.cpuDifficulty.toUpperCase()})`;
                this.cpuDiffGroup.style.display = 'flex';
            }
        }

        onOnlineConnected(isHost) {
            this.updateModeUI();
            this.resetMatch(false);
        }

        resetMatch(broadcast = true) {
            this.isRunning = false;
            this.isPaused = false;
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);

            this.p1Wins = 0;
            this.p2Wins = 0;
            this.updateWinDots();

            document.getElementById('p1-ko-overlay').style.display = 'none';
            document.getElementById('p2-ko-overlay').style.display = 'none';

            this.initRoundBoards();

            if (broadcast && this.mode === 'online') {
                this.peerMgr.send({ type: 'RESET_MATCH' });
            }
        }

        initRoundBoards() {
            const p1IsCPU = (this.mode === 'cpuvscpu');
            const p2IsCPU = (this.mode === 'p1vscpu' || this.mode === 'cpuvscpu');

            const p1IsRemote = (this.mode === 'online' && !this.peerMgr.isHost);
            const p2IsRemote = (this.mode === 'online' && this.peerMgr.isHost);

            this.p1 = new TetrisBoard('p1', p1IsCPU, 'master', p1IsRemote);
            this.p2 = new TetrisBoard('p2', p2IsCPU, this.cpuDifficulty, p2IsRemote);

            this.p1.opponent = this.p2;
            this.p2.opponent = this.p1;

            this.p1.render();
            this.p2.render();
            this.p1.updateUI();
            this.p2.updateUI();
        }

        startRound(broadcast = true) {
            this.initRoundBoards();
            this.isRunning = true;
            this.isPaused = false;
            this.btnStart.disabled = true;
            this.btnPause.disabled = false;

            if (broadcast && this.mode === 'online') {
                this.peerMgr.send({ type: 'START_MATCH' });
            }

            let syncTimer = 0;
            const gameLoop = (time) => {
                if (this.isRunning) {
                    if (!this.isPaused) {
                        this.p1.update(time);
                        this.p2.update(time);

                        // Broadcast local board state over WebRTC every 100ms
                        if (this.mode === 'online') {
                            syncTimer += 16;
                            if (syncTimer > 100) {
                                syncTimer = 0;
                                const localBoard = this.peerMgr.isHost ? this.p1 : this.p2;
                                this.peerMgr.send({ type: 'STATE_SYNC', state: localBoard.exportState() });
                            }
                        }

                        this.checkRoundEnd();
                    }
                    this.animationFrameId = requestAnimationFrame(gameLoop);
                }
            };
            this.animationFrameId = requestAnimationFrame(gameLoop);
        }

        checkRoundEnd() {
            if (this.p1.isGameOver || this.p2.isGameOver) {
                this.isRunning = false;
                this.btnStart.disabled = false;

                if (this.p1.isGameOver && !this.p2.isGameOver) {
                    this.p2Wins++;
                } else if (!this.p1.isGameOver && this.p2.isGameOver) {
                    this.p1Wins++;
                }

                this.updateWinDots();

                if (this.p1Wins >= this.targetWins || this.p2Wins >= this.targetWins) {
                    setTimeout(() => this.showMatchResult(), 1000);
                } else {
                    setTimeout(() => this.startRound(false), 2000);
                }
            }
        }

        updateWinDots() {
            this.p1MatchScoreEl.textContent = this.p1Wins;
            this.p2MatchScoreEl.textContent = this.p2Wins;

            const updateDots = (container, count) => {
                const dots = container.querySelectorAll('.dot');
                dots.forEach((dot, idx) => {
                    dot.classList.toggle('filled', idx < count);
                });
            };

            updateDots(this.p1WinDotsEl, this.p1Wins);
            updateDots(this.p2WinDotsEl, this.p2Wins);
        }

        showMatchResult() {
            const winner = this.p1Wins >= this.targetWins ? this.p1NameEl.textContent : this.p2NameEl.textContent;
            document.getElementById('result-winner-title').textContent = `${winner} WINS!`;
            document.getElementById('result-score-detail').textContent = `${this.p1Wins} - ${this.p2Wins} で完全勝利！`;
            document.getElementById('modal-result').style.display = 'flex';
        }

        handleRemoteInput(action, playerSide) {
            const targetBoard = playerSide === 'p1' ? this.p1 : this.p2;
            if (!targetBoard || targetBoard.isGameOver) return;

            switch (action) {
                case 'moveLeft': targetBoard.move(-1); break;
                case 'moveRight': targetBoard.move(1); break;
                case 'softDrop': targetBoard.softDrop(); break;
                case 'hardDrop': targetBoard.hardDrop(); break;
                case 'rotateRight': targetBoard.rotate(1); break;
                case 'rotateLeft': targetBoard.rotate(-1); break;
                case 'hold': targetBoard.hold(); break;
            }
        }

        handleKeyDown(e) {
            if (!this.isRunning || this.isPaused) return;

            if (this.mode === 'online') {
                // Online mode: Local player controls their board and sends input over WebRTC
                const myBoard = this.peerMgr.isHost ? this.p1 : this.p2;
                if (!myBoard || myBoard.isGameOver) return;

                let action = null;
                switch (e.code) {
                    case 'KeyA':
                    case 'ArrowLeft':
                        e.preventDefault(); action = 'moveLeft'; myBoard.move(-1); break;
                    case 'KeyD':
                    case 'ArrowRight':
                        e.preventDefault(); action = 'moveRight'; myBoard.move(1); break;
                    case 'KeyS':
                    case 'ArrowDown':
                        e.preventDefault(); action = 'softDrop'; myBoard.softDrop(); break;
                    case 'KeyW':
                    case 'ArrowUp':
                        e.preventDefault(); action = 'hardDrop'; myBoard.hardDrop(); break;
                    case 'KeyE':
                    case 'KeyK':
                        e.preventDefault(); action = 'rotateRight'; myBoard.rotate(1); break;
                    case 'KeyQ':
                    case 'KeyJ':
                        e.preventDefault(); action = 'rotateLeft'; myBoard.rotate(-1); break;
                    case 'Space':
                    case 'ShiftRight':
                        e.preventDefault(); action = 'hold'; myBoard.hold(); break;
                }

                if (action) {
                    this.peerMgr.send({ type: 'INPUT', action: action });
                }
                return;
            }

            // Player 1 Controls (A, D, S, W, Q, E, Space)
            if (!this.p1.isCPU && !this.p1.isGameOver) {
                switch (e.code) {
                    case 'KeyA': e.preventDefault(); this.p1.move(-1); break;
                    case 'KeyD': e.preventDefault(); this.p1.move(1); break;
                    case 'KeyS': e.preventDefault(); this.p1.softDrop(); break;
                    case 'KeyW': e.preventDefault(); this.p1.hardDrop(); break;
                    case 'KeyE': e.preventDefault(); this.p1.rotate(1); break;
                    case 'KeyQ': e.preventDefault(); this.p1.rotate(-1); break;
                    case 'Space': e.preventDefault(); this.p1.hold(); break;
                }
            }

            // Player 2 Controls (Arrows, K, J, ShiftRight)
            if (this.mode === 'p1vsp2' && !this.p2.isCPU && !this.p2.isGameOver) {
                switch (e.code) {
                    case 'ArrowLeft': e.preventDefault(); this.p2.move(-1); break;
                    case 'ArrowRight': e.preventDefault(); this.p2.move(1); break;
                    case 'ArrowDown': e.preventDefault(); this.p2.softDrop(); break;
                    case 'ArrowUp': e.preventDefault(); this.p2.hardDrop(); break;
                    case 'KeyK': e.preventDefault(); this.p2.rotate(1); break;
                    case 'KeyJ':
                    case 'KeyL': e.preventDefault(); this.p2.rotate(-1); break;
                    case 'ShiftRight': e.preventDefault(); this.p2.hold(); break;
                }
            }
        }
    }

    // Initialize Match App
    document.addEventListener('DOMContentLoaded', () => {
        window.matchApp = new MatchManager();
    });

})();
