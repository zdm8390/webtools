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
    // --- Web Audio Synthesizer & BGM Engine ---
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
            this.bgmEnabled = true;
            this.bgmPlaying = false;
            this.bgmTimer = null;
            this.bgmStep = 0;
            this.bgmTempo = 135; // BPM

            // Korobeiniki (Tetris Theme) Melody Sequence (Note frequencies, duration multiplier)
            // 0 means rest
            this.melody = [
                { f: 659.25, d: 2 }, { f: 493.88, d: 1 }, { f: 523.25, d: 1 }, { f: 587.33, d: 2 }, { f: 523.25, d: 1 }, { f: 493.88, d: 1 },
                { f: 440.00, d: 2 }, { f: 440.00, d: 1 }, { f: 523.25, d: 1 }, { f: 659.25, d: 2 }, { f: 587.33, d: 1 }, { f: 523.25, d: 1 },
                { f: 493.88, d: 3 }, { f: 523.25, d: 1 }, { f: 587.33, d: 2 }, { f: 659.25, d: 2 },
                { f: 523.25, d: 2 }, { f: 440.00, d: 2 }, { f: 440.00, d: 4 },

                { f: 0, d: 1 }, { f: 587.33, d: 2 }, { f: 698.46, d: 1 }, { f: 880.00, d: 2 }, { f: 783.99, d: 1 }, { f: 698.46, d: 1 },
                { f: 659.25, d: 3 }, { f: 523.25, d: 1 }, { f: 659.25, d: 2 }, { f: 587.33, d: 1 }, { f: 523.25, d: 1 },
                { f: 493.88, d: 2 }, { f: 493.88, d: 1 }, { f: 523.25, d: 1 }, { f: 587.33, d: 2 }, { f: 659.25, d: 2 },
                { f: 523.25, d: 2 }, { f: 440.00, d: 2 }, { f: 440.00, d: 4 }
            ];

            this.bassline = [
                329.63, 440.00, 329.63, 440.00, 293.66, 392.00, 261.63, 349.23,
                246.94, 329.63, 440.00, 440.00, 293.66, 392.00, 261.63, 329.63
            ];
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

        playTone(freq, duration, type = 'sine', gainVal = 0.1) {
            if (!this.enabled || !this.ctx || freq <= 0) return;
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

        move() { this.playTone(320, 0.04, 'triangle', 0.04); }
        rotate() { this.playTone(520, 0.05, 'sine', 0.06); }
        drop() { this.playTone(180, 0.06, 'square', 0.08); }
        hardDrop() { this.playTone(90, 0.12, 'sawtooth', 0.14); }
        
        clear() {
            this.playTone(523.25, 0.08, 'sine', 0.12);
            setTimeout(() => this.playTone(659.25, 0.08, 'sine', 0.12), 50);
            setTimeout(() => this.playTone(783.99, 0.12, 'sine', 0.14), 100);
        }

        rainbowClear() {
            const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            freqs.forEach((f, i) => {
                setTimeout(() => this.playTone(f, 0.15, 'triangle', 0.15), i * 40);
            });
        }

        tetris() {
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            notes.forEach((f, i) => {
                setTimeout(() => this.playTone(f, 0.18, 'square', 0.16), i * 45);
            });
        }

        cancel() {
            this.playTone(880, 0.08, 'sine', 0.15);
            setTimeout(() => this.playTone(1174.66, 0.12, 'triangle', 0.18), 60);
        }

        garbage() { this.playTone(110, 0.22, 'sawtooth', 0.2); }

        magicCast() {
            const freqs = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
            freqs.forEach((f, i) => {
                setTimeout(() => this.playTone(f, 0.2, 'sine', 0.18), i * 35);
            });
        }

        shield() {
            this.playTone(392, 0.15, 'sine', 0.15);
            setTimeout(() => this.playTone(523.25, 0.15, 'sine', 0.18), 80);
            setTimeout(() => this.playTone(659.25, 0.3, 'sine', 0.2), 160);
        }

        transmute() {
            const freqs = [1046.50, 880, 659.25, 523.25, 659.25, 880, 1046.50, 1318.51];
            freqs.forEach((f, i) => {
                setTimeout(() => this.playTone(f, 0.15, 'triangle', 0.15), i * 40);
            });
        }

        fizzle() {
            this.playTone(300, 0.15, 'sawtooth', 0.15);
            setTimeout(() => this.playTone(200, 0.15, 'sawtooth', 0.15), 100);
            setTimeout(() => this.playTone(120, 0.3, 'sawtooth', 0.18), 200);
        }
        
        ko() {
            this.playTone(220, 0.15, 'sawtooth', 0.2);
            setTimeout(() => this.playTone(164.81, 0.15, 'sawtooth', 0.2), 120);
            setTimeout(() => this.playTone(110, 0.35, 'sawtooth', 0.25), 240);
        }

        setBGMTheme(speedMultiplier = 1.0, pitchShift = 1.0) {
            this.bgmSpeedMultiplier = speedMultiplier;
            this.bgmPitchShift = pitchShift;
            if (this.bgmPlaying) {
                this.stopBGM();
                this.startBGM();
            }
        }

        // --- BGM SEQUENCER ENGINE ---
        startBGM() {
            this.init();
            if (this.bgmPlaying || !this.bgmEnabled) return;
            this.bgmPlaying = true;
            this.bgmStep = 0;

            const baseTempo = this.bgmTempo * (this.bgmSpeedMultiplier || 1.0);
            const stepTime = (60 / baseTempo / 4) * 1000; // 16th note duration in ms

            let subStep = 0;
            let currentMelodyIdx = 0;
            let noteTicksLeft = 0;

            this.bgmTimer = setInterval(() => {
                if (!this.bgmPlaying || !this.bgmEnabled || !this.ctx) return;

                const pitchFactor = this.bgmPitchShift || 1.0;

                // Play Melody
                if (noteTicksLeft <= 0) {
                    const item = this.melody[currentMelodyIdx];
                    if (item && item.f > 0) {
                        const dur = (item.d * stepTime * 2) / 1000;
                        this.playTone(item.f * pitchFactor, dur * 0.85, 'square', 0.035);
                    }
                    noteTicksLeft = item ? item.d * 2 : 2;
                    currentMelodyIdx = (currentMelodyIdx + 1) % this.melody.length;
                }
                noteTicksLeft--;

                // Play Bassline
                if (subStep % 2 === 0) {
                    const bassIdx = Math.floor(subStep / 2) % this.bassline.length;
                    const bassFreq = (this.bassline[bassIdx] / 2) * pitchFactor;
                    this.playTone(bassFreq, (stepTime * 1.8) / 1000, 'triangle', 0.05);
                }

                // Hi-Hat / Percussion Noise
                if (subStep % 4 === 2) {
                    this.playTone(2000 * pitchFactor, 0.02, 'sine', 0.015);
                }

                subStep++;
            }, stepTime);
        }

        stopBGM() {
            this.bgmPlaying = false;
            if (this.bgmTimer) {
                clearInterval(this.bgmTimer);
                this.bgmTimer = null;
            }
        }
    }

    const sound = new SoundEngine();

    // --- TETRIS PLAYER BOARD CLASS ---
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

            // Lock Delay (猶予時間) Variables
            this.lockTimer = 0;
            this.lockDelay = 500; // 500ms lock delay
            this.lockResets = 0;
            this.maxLockResets = 15;

            // Mana Gauge & Magic System Properties
            this.mana = 0;
            this.isShielded = false;
            this.shieldTimer = 0;
            this.iRushTurns = 0;

            // Excitement Visuals: Particles & Rainbow Line Animations
            this.particles = [];
            this.clearingLines = []; // { y, timer, hue }
            this.rainbowHue = 0;

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
            this.manaGaugeEl = document.getElementById(`${id}-mana-gauge`);
            this.magicBtnEl = document.getElementById(`btn-${id}-magic`);
            this.magicOverlayEl = document.getElementById(`${id}-magic-overlay`);
            this.magicBannerEl = document.getElementById(`${id}-magic-banner`);
            this.shieldIndicatorEl = document.getElementById(`${id}-shield-indicator`);
            this.announcerEl = document.getElementById(`${id}-announcer`);
            this.koOverlayEl = document.getElementById(`${id}-ko-overlay`);

            if (this.magicBtnEl) {
                this.magicBtnEl.addEventListener('click', () => this.castMagic());
            }

            this.opponent = null; // Reference to enemy board
            this.fillBag();
            this.spawnPiece();
        }

        addMana(amount) {
            if (this.isGameOver) return;
            this.mana = Math.min(100, this.mana + amount);
            if (this.mana >= 100) {
                if (this.manaGaugeEl) this.manaGaugeEl.classList.add('mana-full');
                if (this.magicBtnEl) {
                    this.magicBtnEl.classList.add('ready');
                    this.magicBtnEl.disabled = false;
                }
            }
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

            let type;
            if (this.iRushTurns > 0) {
                type = 'I';
                this.iRushTurns--;
            } else {
                type = this.nextQueue.shift();
            }

            this.currentPiece = {
                type: type,
                matrix: JSON.parse(JSON.stringify(TETROMINOES[type].shape)),
                color: TETROMINOES[type].color,
                ghostColor: TETROMINOES[type].ghostColor
            };

            this.pieceX = Math.floor((COLS - this.currentPiece.matrix[0].length) / 2);
            this.pieceY = 0;
            this.canHold = true;
            this.lockTimer = 0;
            this.lockResets = 0;

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

        checkGrounded() {
            if (!this.currentPiece) return false;
            return this.collide(this.grid, this.currentPiece.matrix, { x: this.pieceX, y: this.pieceY + 1 });
        }

        resetLockDelayIfGrounded() {
            if (this.checkGrounded()) {
                if (this.lockResets < this.maxLockResets) {
                    this.lockTimer = 0;
                    this.lockResets++;
                }
            }
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
                this.resetLockDelayIfGrounded();
                sound.rotate();
                return;
            }

            // Wall Kick (SRS)
            const kicks = [1, -1, 2, -2];
            for (let k of kicks) {
                if (!this.collide(this.grid, rotated, { x: this.pieceX + k, y: this.pieceY })) {
                    this.pieceX += k;
                    this.currentPiece.matrix = rotated;
                    this.resetLockDelayIfGrounded();
                    sound.rotate();
                    return;
                }
            }
        }

        move(dir) {
            if (this.isRemote) return;
            if (!this.collide(this.grid, this.currentPiece.matrix, { x: this.pieceX + dir, y: this.pieceY })) {
                this.pieceX += dir;
                this.resetLockDelayIfGrounded();
                sound.move();
            }
        }

        softDrop() {
            if (this.isRemote) return false;
            if (!this.collide(this.grid, this.currentPiece.matrix, { x: this.pieceX, y: this.pieceY + 1 })) {
                this.pieceY++;
                this.score += 1;
                this.dropCounter = 0;
                this.lockTimer = 0;
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
            this.lockTimer = 0;
            this.lockResets = 0;
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

            this.lockTimer = 0;
            this.lockResets = 0;
            this.clearLines();
            this.spawnPiece();
        }

        clearLines() {
            const fullLines = [];
            for (let y = ROWS - 1; y >= 0; y--) {
                if (this.grid[y].every(cell => cell !== 0 && cell !== 'garbage_pending')) {
                    fullLines.push(y);
                }
            }

            if (fullLines.length > 0) {
                this.lines += fullLines.length;
                this.combo++;

                // Charge Mana on Line Clear
                this.addMana(fullLines.length * 15);

                // CHARACTER-SPECIFIC LINE CLEAR PARTICLES & EFFECTS
                fullLines.forEach(y => {
                    this.clearingLines.push({ y: y, timer: 240, style: this.clearStyle || 'rainbow', hue: Math.floor(Math.random() * 360) });
                    
                    const particleCount = 16;
                    for (let i = 0; i < particleCount; i++) {
                        let pColor = `hsl(${Math.random() * 360}, 100%, 65%)`;
                        let pSize = Math.random() * 6 + 3;
                        let pVy = (Math.random() - 0.5) * 10 - 3;
                        let pVx = (Math.random() - 0.5) * 10;
                        let pShape = 'circle';

                        if (this.clearStyle === 'digital') {
                            pColor = '#22c55e';
                            pShape = 'square';
                        } else if (this.clearStyle === 'moon') {
                            pColor = Math.random() < 0.5 ? '#38bdf8' : '#e0e7ff';
                            pShape = 'star';
                        } else if (this.clearStyle === 'lightning') {
                            pColor = Math.random() < 0.5 ? '#eab308' : '#60a5fa';
                            pVy = (Math.random() - 0.5) * 14;
                        } else if (this.clearStyle === 'sakura') {
                            pColor = '#f472b6';
                            pSize = Math.random() * 8 + 4;
                            pVy = Math.random() * 3 + 1; // Falling sakura petals
                        } else if (this.clearStyle === 'ice') {
                            pColor = '#38bdf8';
                            pShape = 'diamond';
                        } else if (this.clearStyle === 'fire') {
                            pColor = Math.random() < 0.5 ? '#ef4444' : '#a855f7';
                            pVy = -Math.random() * 6 - 2; // Flame rising
                        } else if (this.clearStyle === 'cosmic') {
                            pColor = `hsl(${(i * 45) % 360}, 100%, 75%)`;
                            pSize = Math.random() * 10 + 4;
                        }

                        this.particles.push({
                            x: (Math.random() * COLS) * BLOCK_SIZE,
                            y: y * BLOCK_SIZE + (BLOCK_SIZE / 2),
                            vx: pVx,
                            vy: pVy,
                            size: pSize,
                            color: pColor,
                            shape: pShape,
                            life: 1.0,
                            decay: Math.random() * 0.03 + 0.02
                        });
                    }
                });

                // Clear grid rows
                fullLines.sort((a, b) => a - b).forEach(y => {
                    this.grid.splice(y, 1);
                    this.grid.unshift(Array(COLS).fill(0));
                });

                // Calculate attack power based on rule selection
                const garbageRule = document.getElementById('garbage-rule')?.value || 'direct';
                let attack = 0;

                if (garbageRule === 'direct') {
                    // User Request: 1 line = 1 garbage, 2 lines = 2, 3 lines = 3, 4 lines = 4
                    attack = fullLines.length;
                } else {
                    // Classic Tetris rule: 2 lines = 1, 3 lines = 2, 4 lines = 4
                    if (fullLines.length === 2) attack = 1;
                    else if (fullLines.length === 3) attack = 2;
                    else if (fullLines.length === 4) attack = 4;
                }

                if (fullLines.length === 4) {
                    sound.tetris();
                    this.showAnnouncer('✨ RAINBOW TETRIS! ✨', true);
                    this.triggerShake(true);
                } else {
                    sound.rainbowClear();
                    if (fullLines.length >= 2) this.triggerShake(false);
                }

                // Combo Bonus
                if (this.combo > 0) {
                    attack += Math.floor(this.combo / 2);
                    this.addMana(this.combo * 4);
                    if (fullLines.length < 4) {
                        const label = fullLines.length === 1 ? 'SINGLE' : fullLines.length === 2 ? 'DOUBLE' : 'TRIPLE';
                        this.showAnnouncer(`${label}!\n🔥 ${this.combo} REN`, false);
                    }
                }

                this.score += fullLines.length * 100 * (this.combo + 1);

                // 🛡️ GARBAGE CANCELLATION / COUNTER SYSTEM (相殺)
                if (this.queuedGarbage > 0) {
                    const cancelAmount = Math.min(this.queuedGarbage, attack);
                    this.queuedGarbage -= cancelAmount;
                    attack -= cancelAmount;

                    if (cancelAmount > 0) {
                        sound.cancel();
                        this.addMana(cancelAmount * 10);
                        this.showAnnouncer(`🛡️ COUNTER!\n-${cancelAmount} GARBAGE`, true);
                    }
                }

                // Send attack garbage to opponent
                if (attack > 0 && this.opponent) {
                    this.garbageSentTotal += attack;
                    this.opponent.receiveGarbage(attack);
                    this.spawnAttackStream(attack);
                }
            } else {
                this.combo = -1;

                // Apply pending garbage if no lines cleared
                if (this.queuedGarbage > 0) {
                    this.applyGarbage(this.queuedGarbage);
                    this.queuedGarbage = 0;
                }
            }
        }

        castMagic() {
            if (this.isGameOver || this.mana < 100) return;

            this.mana = 0;
            if (this.manaGaugeEl) this.manaGaugeEl.classList.remove('mana-full');
            if (this.magicBtnEl) {
                this.magicBtnEl.classList.remove('ready');
                this.magicBtnEl.disabled = true;
            }

            sound.magicCast();

            // Determine player/boss character unique spell
            let charObj = null;
            if (window.storyApp) {
                if (this.id === 'p1') {
                    const charVal = document.getElementById('player-character')?.value || 'hero';
                    charObj = window.storyApp.getCharacterById(charVal);
                } else {
                    charObj = window.storyApp.getCurrentBoss();
                }
            }

            const uniqueName = charObj?.uniqueSpell?.name || '🌟 キャラ固有奥義';

            const rouletteItems = [
                '⚡ [Lv.1] メガクリア',
                '🗡️ [Lv.2] ブレード・オブ・アイ',
                '🛡️ [Lv.3] アブソリュートシールド',
                '💥 [MISFIRE] 呪文不発',
                '🔮 [Lv.MAX] トランスミュート',
                `✨ ${uniqueName}`
            ];

            if (this.magicOverlayEl && this.magicBannerEl) {
                this.magicBannerEl.className = 'magic-banner roulette-spinning';
                this.magicOverlayEl.style.display = 'flex';

                let rouletteIndex = 0;
                const rouletteTimer = setInterval(() => {
                    rouletteIndex = (rouletteIndex + 1) % rouletteItems.length;
                    this.magicBannerEl.textContent = `🎰 SPELL ROULETTE 🎰\n${rouletteItems[rouletteIndex]}`;
                    sound.playTone(400 + (rouletteIndex * 120), 0.03, 'sine', 0.05);
                }, 45);

                setTimeout(() => {
                    clearInterval(rouletteTimer);
                    const chosenSpell = Math.floor(Math.random() * rouletteItems.length) + 1;

                    this.magicBannerEl.className = 'magic-banner spell-selected-pop';
                    this.magicBannerEl.textContent = `✨ SPELL CAST! ✨\n${rouletteItems[chosenSpell - 1]}`;
                    sound.magicCast();

                    setTimeout(() => {
                        if (chosenSpell === 6 && charObj?.uniqueSpell) {
                            this.executeUniqueSpell(charObj.uniqueSpell);
                        } else {
                            this.executeSpell(chosenSpell);
                        }
                    }, 1000);
                }, 900);
            } else {
                const chosenSpell = Math.floor(Math.random() * 6) + 1;
                if (chosenSpell === 6 && charObj?.uniqueSpell) {
                    this.executeUniqueSpell(charObj.uniqueSpell);
                } else {
                    this.executeSpell(chosenSpell);
                }
            }
        }

        executeUniqueSpell(uniqueSpell) {
            if (this.magicOverlayEl) {
                this.magicOverlayEl.style.display = 'none';
            }

            sound.rainbowClear();
            this.triggerShake(true);

            switch (uniqueSpell.code) {
                case 'hero_rainbow':
                    for (let i = 0; i < 4; i++) {
                        this.grid.pop();
                        this.grid.unshift(Array(COLS).fill(0));
                    }
                    if (this.opponent) this.opponent.receiveGarbage(3);
                    this.showAnnouncer(`🌟 ${uniqueSpell.name}!\n下4行消去＆3攻撃！`, true);
                    break;

                case 'bot_overload':
                    for (let i = 0; i < 3; i++) {
                        this.grid.pop();
                        this.grid.unshift(Array(COLS).fill(0));
                    }
                    for (let y = 0; y < ROWS; y++) {
                        for (let x = 0; x < COLS; x++) {
                            if (this.grid[y][x] !== 0 && this.grid[y][x] !== '#475569') {
                                this.grid[y][x] = TETROMINOES['S'].color;
                            }
                        }
                    }
                    this.showAnnouncer(`⚡ ${uniqueSpell.name}!\n緑ブロックオーバーロード！`, true);
                    break;

                case 'luna_hack':
                    if (this.queuedGarbage > 0) this.queuedGarbage = 0;
                    this.isShielded = true;
                    this.shieldTimer = 5000;
                    if (this.shieldIndicatorEl) this.shieldIndicatorEl.style.display = 'block';
                    this.showAnnouncer(`🌙 ${uniqueSpell.name}!\nお邪魔無効化＆ハッキングバリア！`, true);
                    break;

                case 'zeus_thunder':
                    for (let y = 0; y < ROWS; y++) {
                        for (let x = 0; x < COLS; x++) {
                            if (this.grid[y][x] === '#475569') this.grid[y][x] = 0;
                        }
                    }
                    if (this.opponent) this.opponent.receiveGarbage(3);
                    this.showAnnouncer(`⚡ ${uniqueSpell.name}!\n落雷全破砕＆3電撃攻撃！`, true);
                    break;

                case 'hayate_shadow':
                    this.iRushTurns = 5;
                    this.nextQueue = ['I', 'I', 'I', 'I', 'I', ...this.nextQueue];
                    this.showAnnouncer(`🥷 ${uniqueSpell.name}!\n影分身・5連縦棒！`, true);
                    break;

                case 'valk_freeze':
                    this.isShielded = true;
                    this.shieldTimer = 8000;
                    if (this.shieldIndicatorEl) this.shieldIndicatorEl.style.display = 'block';
                    this.showAnnouncer(`👸 ${uniqueSpell.name}!\n8秒間絶対ダイヤバリア！`, true);
                    break;

                case 'venom_inferno':
                    this.queuedGarbage = 0;
                    if (this.opponent) this.opponent.receiveGarbage(4);
                    this.showAnnouncer(`👿 ${uniqueSpell.name}!\n地獄暗黒4行攻撃！`, true);
                    break;

                case 'astral_bigbang':
                    for (let y = 0; y < ROWS; y++) {
                        for (let x = 0; x < COLS; x++) {
                            if (this.grid[y][x] === '#475569') {
                                this.grid[y][x] = TETROMINOES['T'].color;
                            }
                        }
                    }
                    for (let i = 0; i < 6; i++) {
                        this.grid.pop();
                        this.grid.unshift(Array(COLS).fill(0));
                    }
                    this.queuedGarbage = 0;
                    this.showAnnouncer(`🌌 ${uniqueSpell.name}!\n全浄化＆6行消去！`, true);
                    break;

                default:
                    this.showAnnouncer(`✨ ${uniqueSpell.name}!`, true);
                    break;
            }
        }

        executeSpell(spell) {
            if (this.magicOverlayEl) {
                this.magicOverlayEl.style.display = 'none';
            }

            switch (spell) {
                case 1:
                    // ⚡ [Lv.1] MEGA CLEAR
                    for (let i = 0; i < 5; i++) {
                        this.grid.pop();
                        this.grid.unshift(Array(COLS).fill(0));
                    }
                    sound.rainbowClear();
                    this.triggerShake(true);
                    this.showAnnouncer('⚡ [Lv.1] MEGA CLEAR ⚡\n下5行一気消し！', true);
                    break;

                case 2:
                    // 🗡️ [Lv.2] BLADE OF I
                    this.iRushTurns = 5;
                    this.nextQueue = ['I', 'I', 'I', 'I', 'I', ...this.nextQueue];
                    sound.clear();
                    this.showAnnouncer('🗡️ [Lv.2] BLADE OF I 🗡️\n5連縦棒ラッシュ！', true);
                    break;

                case 3:
                    // 🛡️ [Lv.3] ABSOLUTE SHIELD
                    this.isShielded = true;
                    this.shieldTimer = 5000;
                    if (this.shieldIndicatorEl) this.shieldIndicatorEl.style.display = 'block';
                    sound.shield();
                    this.showAnnouncer('🛡️ [Lv.3] ABSOLUTE SHIELD 🛡️\n5秒間お邪魔無効化！', true);
                    break;

                case 4:
                    // 💥 [Lv.4] MISFIRE
                    sound.fizzle();
                    this.showAnnouncer('💥 [Lv.4] MISFIRE 💥\n呪文不発！(ハズレ)', false);
                    break;

                case 5:
                    // 🔮 [Lv.MAX] TRANSMUTE
                    let transmutedCount = 0;
                    for (let y = 0; y < ROWS; y++) {
                        for (let x = 0; x < COLS; x++) {
                            if (this.grid[y][x] === '#475569') {
                                this.grid[y][x] = TETROMINOES['I'].color;
                                transmutedCount++;
                            }
                        }
                    }
                    this.queuedGarbage = 0;
                    sound.transmute();
                    this.triggerShake(false);
                    this.showAnnouncer('🔮 [Lv.MAX] TRANSMUTE 🔮\nお邪魔全浄化！', true);
                    break;
            }
        }

        triggerShake(heavy = false) {
            const container = document.getElementById(`${this.id}-board-canvas`);
            if (!container) return;
            const cls = heavy ? 'screen-shake-heavy' : 'screen-shake';
            container.classList.remove('screen-shake', 'screen-shake-heavy');
            void container.offsetWidth;
            container.classList.add(cls);
            setTimeout(() => container.classList.remove(cls), 450);
        }

        spawnAttackStream(amount) {
            const streamContainer = document.getElementById('attack-stream-container');
            if (!streamContainer) return;
            for (let i = 0; i < Math.min(amount * 2, 8); i++) {
                const orb = document.createElement('div');
                orb.style.cssText = `
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ef4444, #f59e0b);
                    box-shadow: 0 0 12px #ef4444;
                    left: ${this.id === 'p1' ? '20%' : '80%'};
                    top: ${30 + Math.random() * 40}%;
                    transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
                    z-index: 100;
                    pointer-events: none;
                `;
                streamContainer.appendChild(orb);
                setTimeout(() => {
                    orb.style.left = this.id === 'p1' ? '80%' : '20%';
                    orb.style.opacity = '0';
                    orb.style.transform = 'scale(1.6)';
                }, 30);
                setTimeout(() => orb.remove(), 550);
            }
        }

        receiveGarbage(count) {
            if (this.isShielded) {
                sound.shield();
                this.showAnnouncer('🛡️ BLOCKED!\nお邪魔をバリアで遮断！', false);
                return;
            }
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

        showAnnouncer(text, isRainbow = false) {
            this.announcerEl.textContent = text;
            this.announcerEl.className = 'announcer-overlay';
            if (isRainbow) {
                this.announcerEl.classList.add('rainbow-text');
            }
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
            if (this.isGameOver) return;

            // CPU Auto Cast Magic when Mana is full
            if (this.mana >= 100 && Math.random() < 0.04) {
                this.castMagic();
            }

            if (!this.cpuTarget || !this.currentPiece) {
                this.calculateCPUMove();
                if (!this.cpuTarget) return;
            }

            let cpuDelay = 400;
            if (this.cpuDiff === 'easy') cpuDelay = 700;
            else if (this.cpuDiff === 'medium') cpuDelay = 350;
            else if (this.cpuDiff === 'hard') cpuDelay = 120;
            else if (this.cpuDiff === 'master') cpuDelay = 30;

            this.cpuTimer += delta;
            if (this.cpuTimer >= cpuDelay) {
                this.cpuTimer = 0;

                if (this.cpuTarget.rotation > 0) {
                    const prevMatrix = this.currentPiece.matrix;
                    this.rotate(1);
                    if (this.currentPiece.matrix !== prevMatrix) {
                        this.cpuTarget.rotation--;
                    } else {
                        // Rotation blocked, recalculate best move
                        this.calculateCPUMove();
                    }
                    return;
                }

                if (this.pieceX < this.cpuTarget.x) {
                    const prevX = this.pieceX;
                    this.move(1);
                    if (this.pieceX === prevX) this.calculateCPUMove();
                } else if (this.pieceX > this.cpuTarget.x) {
                    const prevX = this.pieceX;
                    this.move(-1);
                    if (this.pieceX === prevX) this.calculateCPUMove();
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

            const delta = Math.min(time - this.lastTime, 100);
            this.lastTime = time;

            // Passive Mana Charge over time
            this.addMana(delta * 0.0025);

            // Shield Timer update
            if (this.isShielded) {
                this.shieldTimer -= delta;
                if (this.shieldTimer <= 0) {
                    this.isShielded = false;
                    if (this.shieldIndicatorEl) this.shieldIndicatorEl.style.display = 'none';
                }
            }

            // 1. Particle Physics
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // Gravity
                p.life -= p.decay;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // 2. Rainbow Clearing Lines Timer
            for (let i = this.clearingLines.length - 1; i >= 0; i--) {
                this.clearingLines[i].timer -= delta;
                if (this.clearingLines[i].timer <= 0) {
                    this.clearingLines.splice(i, 1);
                }
            }

            // 3. Lock Delay Check when Grounded
            if (this.checkGrounded() && !this.isRemote && !this.isCPU) {
                this.lockTimer += delta;
                if (this.lockTimer >= this.lockDelay) {
                    this.lockPiece();
                }
            }

            // 4. CPU AI Update
            if (this.isCPU) {
                this.updateCPU(delta);
            }

            // 5. Gravity Drop Update
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
            this.boardCtx.fillStyle = '#ffffff';
            this.boardCtx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

            // Grid background lines (Soft pop grid)
            this.boardCtx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
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

            // Render standard Grid Blocks
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (this.grid[y][x] !== 0) {
                        this.drawBlock(this.boardCtx, x, y, this.grid[y][x]);
                    }
                }
            }

            // Render Character-Specific Line Clear Overlay Effect
            this.rainbowHue = (this.rainbowHue + 8) % 360;
            this.clearingLines.forEach(cl => {
                const alpha = Math.max(0, cl.timer / 240);
                if (cl.style === 'digital') {
                    this.boardCtx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
                    this.boardCtx.shadowColor = '#22c55e';
                } else if (cl.style === 'moon') {
                    this.boardCtx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
                    this.boardCtx.shadowColor = '#38bdf8';
                } else if (cl.style === 'lightning') {
                    this.boardCtx.fillStyle = `rgba(234, 179, 8, ${alpha})`;
                    this.boardCtx.shadowColor = '#eab308';
                } else if (cl.style === 'sakura') {
                    this.boardCtx.fillStyle = `rgba(244, 114, 182, ${alpha})`;
                    this.boardCtx.shadowColor = '#f472b6';
                } else if (cl.style === 'ice') {
                    this.boardCtx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
                    this.boardCtx.shadowColor = '#60a5fa';
                } else if (cl.style === 'fire') {
                    this.boardCtx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
                    this.boardCtx.shadowColor = '#ef4444';
                } else if (cl.style === 'cosmic') {
                    this.boardCtx.fillStyle = `hsla(${this.rainbowHue}, 100%, 75%, ${alpha})`;
                    this.boardCtx.shadowColor = `hsl(${this.rainbowHue}, 100%, 70%)`;
                } else {
                    this.boardCtx.fillStyle = `hsla(${this.rainbowHue}, 100%, 65%, ${alpha})`;
                    this.boardCtx.shadowColor = `hsl(${this.rainbowHue}, 100%, 60%)`;
                }
                this.boardCtx.shadowBlur = 18;
                this.boardCtx.fillRect(0, cl.y * BLOCK_SIZE, COLS * BLOCK_SIZE, BLOCK_SIZE);
                this.boardCtx.shadowBlur = 0;
            });

            // Ghost & Current Piece Rendering
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

            // Render Sparkle Particles
            this.particles.forEach(p => {
                this.boardCtx.fillStyle = p.color;
                this.boardCtx.globalAlpha = Math.max(0, p.life);
                this.boardCtx.shadowColor = p.color;
                this.boardCtx.shadowBlur = 8;
                this.boardCtx.beginPath();
                this.boardCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.boardCtx.fill();
                this.boardCtx.globalAlpha = 1.0;
                this.boardCtx.shadowBlur = 0;
            });

            // Render Hold Canvas
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
                            const bx = offsetX + x * size;
                            const by = offsetY + y * size;
                            this.holdCtx.beginPath();
                            this.holdCtx.roundRect(bx, by, size - 2, size - 2, 4);
                            this.holdCtx.fillStyle = spec.color;
                            this.holdCtx.fill();
                            this.holdCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                            this.holdCtx.fillRect(bx + 1, by + 1, size - 4, 2);
                        }
                    });
                });
            }

            // Render Next Queue Canvas
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
                            const bx = offsetX + x * size;
                            const by = offsetY + y * size;
                            this.nextCtx.beginPath();
                            this.nextCtx.roundRect(bx, by, size - 2, size - 2, 4);
                            this.nextCtx.fillStyle = spec.color;
                            this.nextCtx.fill();
                            this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                            this.nextCtx.fillRect(bx + 1, by + 1, size - 4, 2);
                        }
                    });
                });
            });
        }

        drawBlock(ctx, x, y, color, isGhost = false) {
            const px = x * BLOCK_SIZE;
            const py = y * BLOCK_SIZE;
            const size = BLOCK_SIZE - 2;
            const radius = 6; // 可愛く丸まらせた丸っこいテトリミノ角丸

            ctx.save();
            if (isGhost) {
                ctx.strokeStyle = color.replace('0.25', '0.7');
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(px + 1, py + 1, size, size, radius);
                ctx.stroke();
                ctx.restore();
                return;
            }

            // ぷっくり丸いキャンディ・マカロンテトリミノ本体
            ctx.beginPath();
            ctx.roundRect(px + 1, py + 1, size, size, radius);
            ctx.fillStyle = color;
            ctx.fill();

            // 上部ぷっくり光沢ハイライト
            ctx.beginPath();
            ctx.roundRect(px + 2, py + 2, size - 2, size / 2.2, [radius - 1, radius - 1, 2, 2]);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
            ctx.fill();

            // ドロップキャンディ光沢スポット
            ctx.beginPath();
            ctx.arc(px + 7, py + 7, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.fill();

            // 下部立体シャドウ
            ctx.beginPath();
            ctx.roundRect(px + 2, py + size / 2, size - 2, size / 2 - 1, [2, 2, radius - 1, radius - 1]);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            ctx.fill();

            ctx.restore();
        }

        updateUI() {
            this.scoreEl.textContent = this.score;
            this.linesEl.textContent = this.lines;
            this.comboEl.textContent = Math.max(0, this.combo);
            this.garbageSentEl.textContent = this.garbageSentTotal;

            const fillPct = Math.min(100, (this.queuedGarbage / 12) * 100);
            this.garbageGaugeEl.style.height = `${fillPct}%`;

            if (this.manaGaugeEl) {
                this.manaGaugeEl.style.height = `${this.mana}%`;
            }

            if (this.magicBtnEl) {
                if (this.mana >= 100) {
                    this.magicBtnEl.classList.add('ready');
                    this.magicBtnEl.disabled = false;
                } else {
                    this.magicBtnEl.classList.remove('ready');
                    this.magicBtnEl.disabled = true;
                }
            }
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

    // --- KEYBOARD & GAMEPAD INPUT ENGINE WITH DAS / ARR ---
    class InputEngine {
        constructor(matchManager) {
            this.matchManager = matchManager;
            this.keys = {};

            // DAS (Delayed Auto Shift) & ARR (Auto Repeat Rate)
            this.DAS_DELAY = 135; // ms delay before continuous shift
            this.ARR_RATE = 16;   // ms shift repeat interval (60fps ultra responsive)
            this.SOFT_DROP_ARR = 25; // ms soft drop repeat interval

            window.addEventListener('keydown', (e) => this.onKeyDown(e));
            window.addEventListener('keyup', (e) => this.onKeyUp(e));

            // Gamepad Connection Listeners
            window.addEventListener('gamepadconnected', (e) => {
                const padName = e.gamepad.id.split('(')[0].trim();
                this.showToast(`🎮 ゲームパッド #${e.gamepad.index + 1} (${padName}) 接続`);
            });

            window.addEventListener('gamepaddisconnected', (e) => {
                this.showToast(`🎮 ゲームパッド #${e.gamepad.index + 1} 切断`);
            });
        }

        showToast(text) {
            const toast = document.getElementById('gamepad-toast');
            const toastText = document.getElementById('gamepad-toast-text');
            if (toast && toastText) {
                toastText.textContent = text;
                toast.style.display = 'flex';
                setTimeout(() => { toast.style.display = 'none'; }, 3500);
            }
        }

        onKeyDown(e) {
            const gameKeys = ['KeyA', 'KeyD', 'KeyS', 'KeyW', 'KeyE', 'KeyQ', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyF', 'KeyN', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'KeyK', 'KeyJ', 'KeyL'];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }

            if (!this.matchManager.isRunning || this.matchManager.isPaused) return;

            if (!this.keys[e.code] || !this.keys[e.code].isDown) {
                this.keys[e.code] = {
                    isDown: true,
                    dasTimer: 0,
                    arrTimer: 0
                };
                this.triggerAction(e.code);
            }
        }

        onKeyUp(e) {
            if (this.keys[e.code]) {
                this.keys[e.code].isDown = false;
            }
        }

        pollGamepads() {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            if (!gamepads) return;

            for (let i = 0; i < gamepads.length; i++) {
                const pad = gamepads[i];
                if (!pad) continue;

                const prefix = i === 0 ? 'GP0_' : 'GP1_';

                // D-Pad and Left Analog Stick (with 0.4 deadzone)
                const left = (pad.buttons[14] && pad.buttons[14].pressed) || (pad.axes[0] && pad.axes[0] < -0.4);
                const right = (pad.buttons[15] && pad.buttons[15].pressed) || (pad.axes[0] && pad.axes[0] > 0.4);
                const down = (pad.buttons[13] && pad.buttons[13].pressed) || (pad.axes[1] && pad.axes[1] > 0.4);
                const up = (pad.buttons[12] && pad.buttons[12].pressed) || (pad.axes[1] && pad.axes[1] < -0.4) || (pad.buttons[3] && pad.buttons[3].pressed);

                // Face Buttons & Shoulders
                const rotRight = (pad.buttons[0] && pad.buttons[0].pressed) || (pad.buttons[1] && pad.buttons[1].pressed);
                const rotLeft = (pad.buttons[2] && pad.buttons[2].pressed);
                const hold = (pad.buttons[4] && pad.buttons[4].pressed) || (pad.buttons[5] && pad.buttons[5].pressed);
                const magic = (pad.buttons[6] && pad.buttons[6].pressed) || (pad.buttons[7] && pad.buttons[7].pressed); // L2 / R2 for Magic
                const start = (pad.buttons[9] && pad.buttons[9].pressed);

                this.setVirtualKey(`${prefix}Left`, left);
                this.setVirtualKey(`${prefix}Right`, right);
                this.setVirtualKey(`${prefix}Down`, down);
                this.setVirtualKey(`${prefix}Up`, up);
                this.setVirtualKey(`${prefix}RotR`, rotRight);
                this.setVirtualKey(`${prefix}RotL`, rotLeft);
                this.setVirtualKey(`${prefix}Hold`, hold);
                this.setVirtualKey(`${prefix}Magic`, magic);
                this.setVirtualKey(`${prefix}Start`, start);
            }
        }

        setVirtualKey(code, isPressed) {
            if (isPressed) {
                if (!this.keys[code] || !this.keys[code].isDown) {
                    this.keys[code] = {
                        isDown: true,
                        dasTimer: 0,
                        arrTimer: 0
                    };
                    this.triggerAction(code);
                }
            } else {
                if (this.keys[code]) {
                    this.keys[code].isDown = false;
                }
            }
        }

        update(delta) {
            this.pollGamepads();

            if (!this.matchManager.isRunning || this.matchManager.isPaused) return;

            for (const code in this.keys) {
                const k = this.keys[code];
                if (!k || !k.isDown) continue;

                // Non-repeating single trigger actions
                if (['KeyW', 'ArrowUp', 'KeyE', 'KeyQ', 'KeyK', 'KeyJ', 'KeyL', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyF', 'KeyN',
                     'GP0_Up', 'GP0_RotR', 'GP0_RotL', 'GP0_Hold', 'GP0_Magic', 'GP0_Start',
                     'GP1_Up', 'GP1_RotR', 'GP1_RotL', 'GP1_Hold', 'GP1_Magic', 'GP1_Start'].includes(code)) {
                    continue;
                }

                k.dasTimer += delta;

                const isSoftDrop = (code === 'KeyS' || code === 'ArrowDown' || code === 'GP0_Down' || code === 'GP1_Down');
                const dasThreshold = isSoftDrop ? 0 : this.DAS_DELAY;
                const arrRate = isSoftDrop ? this.SOFT_DROP_ARR : this.ARR_RATE;

                if (k.dasTimer >= dasThreshold) {
                    k.arrTimer += delta;
                    while (k.arrTimer >= arrRate) {
                        k.arrTimer -= arrRate;
                        this.triggerAction(code);
                    }
                }
            }
        }

        triggerAction(code) {
            const mm = this.matchManager;
            if (mm.mode === 'online') {
                const myBoard = mm.peerMgr.isHost ? mm.p1 : mm.p2;
                if (!myBoard || myBoard.isGameOver) return;
                let action = null;
                switch (code) {
                    case 'KeyA': case 'ArrowLeft': case 'GP0_Left': case 'GP1_Left': action = 'moveLeft'; myBoard.move(-1); break;
                    case 'KeyD': case 'ArrowRight': case 'GP0_Right': case 'GP1_Right': action = 'moveRight'; myBoard.move(1); break;
                    case 'KeyS': case 'ArrowDown': case 'GP0_Down': case 'GP1_Down': action = 'softDrop'; myBoard.softDrop(); break;
                    case 'KeyW': case 'ArrowUp': case 'GP0_Up': case 'GP1_Up': action = 'hardDrop'; myBoard.hardDrop(); break;
                    case 'KeyE': case 'KeyK': case 'GP0_RotR': case 'GP1_RotR': action = 'rotateRight'; myBoard.rotate(1); break;
                    case 'KeyQ': case 'KeyJ': case 'KeyL': case 'GP0_RotL': case 'GP1_RotL': action = 'rotateLeft'; myBoard.rotate(-1); break;
                    case 'Space': case 'GP0_Hold': case 'GP1_Hold': action = 'hold'; myBoard.hold(); break;
                    case 'ShiftLeft': case 'ShiftRight': case 'KeyF': case 'GP0_Magic': case 'GP1_Magic': action = 'castMagic'; myBoard.castMagic(); break;
                }
                if (action) {
                    mm.peerMgr.send({ type: 'INPUT', action: action });
                }
                return;
            }

            // P1 Controls (Keyboard or Gamepad 0)
            if (mm.p1 && !mm.p1.isCPU && !mm.p1.isGameOver) {
                switch (code) {
                    case 'KeyA': case 'GP0_Left': mm.p1.move(-1); break;
                    case 'KeyD': case 'GP0_Right': mm.p1.move(1); break;
                    case 'KeyS': case 'GP0_Down': mm.p1.softDrop(); break;
                    case 'KeyW': case 'GP0_Up': mm.p1.hardDrop(); break;
                    case 'KeyE': case 'GP0_RotR': mm.p1.rotate(1); break;
                    case 'KeyQ': case 'GP0_RotL': mm.p1.rotate(-1); break;
                    case 'Space': case 'GP0_Hold': mm.p1.hold(); break;
                    case 'ShiftLeft': case 'KeyF': case 'GP0_Magic': mm.p1.castMagic(); break;
                }
            }

            // P2 Controls (Keyboard or Gamepad 1)
            if (mm.p2 && mm.mode === 'p1vsp2' && !mm.p2.isCPU && !mm.p2.isGameOver) {
                switch (code) {
                    case 'ArrowLeft': case 'GP1_Left': mm.p2.move(-1); break;
                    case 'ArrowRight': case 'GP1_Right': mm.p2.move(1); break;
                    case 'ArrowDown': case 'GP1_Down': mm.p2.softDrop(); break;
                    case 'ArrowUp': case 'GP1_Up': mm.p2.hardDrop(); break;
                    case 'KeyK': case 'GP1_RotR': mm.p2.rotate(1); break;
                    case 'KeyJ': case 'KeyL': case 'GP1_RotL': mm.p2.rotate(-1); break;
                    case 'ShiftRight': case 'KeyN': case 'GP1_Magic': mm.p2.castMagic(); break;
                }
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
            this.inputEngine = new InputEngine(this);

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

                    if (this.mode === 'story') {
                        if (window.storyApp) window.storyApp.showStageDialogue();
                    } else if (this.mode === 'online') {
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
                if (this.isPaused) {
                    sound.stopBGM();
                } else {
                    sound.startBGM();
                }
            });

            this.btnReset.addEventListener('click', () => this.resetMatch(true));

            // Sound Effects Toggle
            document.getElementById('btn-sound-toggle').addEventListener('click', () => {
                sound.enabled = !sound.enabled;
                document.querySelector('.icon-sound-on').style.display = sound.enabled ? 'block' : 'none';
                document.querySelector('.icon-sound-off').style.display = sound.enabled ? 'none' : 'block';
            });

            // BGM Music Toggle
            const bgmBtn = document.getElementById('btn-bgm-toggle');
            if (bgmBtn) {
                bgmBtn.addEventListener('click', () => {
                    sound.bgmEnabled = !sound.bgmEnabled;
                    if (sound.bgmEnabled) {
                        bgmBtn.classList.add('active-btn');
                        if (this.isRunning && !this.isPaused) sound.startBGM();
                    } else {
                        bgmBtn.classList.remove('active-btn');
                        sound.stopBGM();
                    }
                });
            }

            // Modals & Lobby Buttons
            const tutorialBtn = document.getElementById('btn-tutorial-modal');
            if (tutorialBtn) {
                tutorialBtn.addEventListener('click', () => {
                    document.getElementById('modal-tutorial').style.display = 'flex';
                });
            }

            const closeTutorialBtn = document.getElementById('btn-close-tutorial');
            if (closeTutorialBtn) {
                closeTutorialBtn.addEventListener('click', () => {
                    sound.init();
                    document.getElementById('modal-tutorial').style.display = 'none';
                    if (window.viewApp) {
                        window.viewApp.showView('main-menu');
                    }
                });
            }

            // Show Tutorial Modal automatically on initial page start
            setTimeout(() => {
                const tutorialModal = document.getElementById('modal-tutorial');
                if (tutorialModal) tutorialModal.style.display = 'flex';
            }, 300);

            document.getElementById('btn-controls-modal').addEventListener('click', () => {
                document.getElementById('modal-controls').style.display = 'flex';
            });
            document.getElementById('btn-open-online-lobby').addEventListener('click', () => {
                document.getElementById('modal-online-lobby').style.display = 'flex';
            });

            document.querySelectorAll('[data-close]').forEach(b => {
                b.addEventListener('click', () => {
                    const targetModal = document.getElementById(b.dataset.close);
                    if (targetModal) targetModal.style.display = 'none';
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
            this.inputEngine.triggerAction(code);
        }

        updateModeUI() {
            this.cpuDiffGroup.style.display = 'none';
            document.getElementById('story-diff-select-group').style.display = 'none';
            this.onlineStatusPill.style.display = 'none';
            this.p2TouchGroup.style.display = 'none';

            if (this.mode === 'story') {
                this.targetWins = 1; // ストーリーモードは1本先取！
                this.modeBadge.textContent = '📖 ストーリーモード (1本先取)';
                document.getElementById('story-diff-select-group').style.display = 'flex';
                this.p1NameEl.textContent = 'PLAYER 1';
                if (window.storyApp) window.storyApp.updateCurrentBossUI();
            } else if (this.mode === 'p1vscpu') {
                this.targetWins = 2;
                this.modeBadge.textContent = '1P vs CPU';
                this.p1NameEl.textContent = 'PLAYER 1';
                this.p2NameEl.textContent = `CPU (${this.cpuDifficulty.toUpperCase()})`;
                this.cpuDiffGroup.style.display = 'flex';
            } else if (this.mode === 'p1vsp2') {
                this.targetWins = 2;
                this.modeBadge.textContent = '1P vs 2P';
                this.p1NameEl.textContent = 'PLAYER 1';
                this.p2NameEl.textContent = 'PLAYER 2';
                this.p2TouchGroup.style.display = 'flex';
            } else if (this.mode === 'online') {
                this.targetWins = 2;
                this.modeBadge.textContent = 'オンライン対戦';
                this.p1NameEl.textContent = this.peerMgr.isHost ? 'YOU (P1/Host)' : 'YOU (P2/Guest)';
                this.p2NameEl.textContent = this.peerMgr.isHost ? 'ENEMY (P2)' : 'ENEMY (P1)';
                this.onlineStatusPill.style.display = 'flex';
            } else if (this.mode === 'cpuvscpu') {
                this.targetWins = 2;
                this.modeBadge.textContent = 'CPU vs CPU';
                this.p1NameEl.textContent = 'CPU 1 (MASTER)';
                this.p2NameEl.textContent = `CPU 2 (${this.cpuDifficulty.toUpperCase()})`;
                this.cpuDiffGroup.style.display = 'flex';
            }

            this.updateWinDots();
        }

        onOnlineConnected(isHost) {
            this.updateModeUI();
            this.resetMatch(false);
        }

        resetMatch(broadcast = true) {
            this.isRunning = false;
            this.isPaused = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            sound.stopBGM();

            this.p1Wins = 0;
            this.p2Wins = 0;
            this.updateWinDots();

            this.btnStart.disabled = false;
            this.btnPause.disabled = true;
            this.btnPause.querySelector('span').textContent = 'PAUSE';

            document.getElementById('p1-ko-overlay').style.display = 'none';
            document.getElementById('p2-ko-overlay').style.display = 'none';
            document.getElementById('modal-result').style.display = 'none';

            this.initRoundBoards();

            if (broadcast && this.mode === 'online') {
                this.peerMgr.send({ type: 'RESET_MATCH' });
            }
        }

        initRoundBoards() {
            const p1IsCPU = (this.mode === 'cpuvscpu');
            let p2IsCPU = (this.mode === 'p1vscpu' || this.mode === 'cpuvscpu' || this.mode === 'story');

            const p1IsRemote = (this.mode === 'online' && !this.peerMgr.isHost);
            const p2IsRemote = (this.mode === 'online' && this.peerMgr.isHost);

            // User Request: Story mode is 1 Target Win (1本先取)
            if (this.mode === 'story') {
                this.targetWins = 1;
                document.getElementById('match-target-text').textContent = 'STORY MODE (1 TARGET WIN)';
                document.getElementById('story-stage-banner').style.display = 'flex';
                document.getElementById('story-timer-card').style.display = 'flex';
            } else {
                this.targetWins = 3;
                document.getElementById('match-target-text').textContent = 'FIRST TO 3 WINS';
                document.getElementById('story-stage-banner').style.display = 'none';
                document.getElementById('story-timer-card').style.display = 'none';
            }

            let p2Diff = this.cpuDifficulty;
            if (this.mode === 'story' && window.storyApp) {
                const boss = window.storyApp.getCurrentBoss();
                p2Diff = boss.diff;
            }

            this.p1 = new TetrisBoard('p1', p1IsCPU, 'master', p1IsRemote);
            this.p2 = new TetrisBoard('p2', p2IsCPU, p2Diff, p2IsRemote);

            // Apply Selected Player Character to P1
            const p1CharVal = document.getElementById('player-character')?.value || 'hero';
            const p1BadgeEl = document.getElementById('p1-avatar-badge');
            const p2BadgeEl = document.getElementById('p2-avatar-badge');

            if (window.storyApp) {
                const p1CharObj = window.storyApp.getCharacterById(p1CharVal);
                if (p1CharObj) {
                    this.p1.clearStyle = p1CharObj.clearStyle;
                    this.p1NameEl.textContent = p1CharObj.name;
                    if (p1BadgeEl) p1BadgeEl.textContent = p1CharObj.avatar;
                } else {
                    this.p1NameEl.textContent = 'みけねこニャン';
                    if (p1BadgeEl) p1BadgeEl.textContent = '🐱';
                }
            }

            // Apply Story Boss settings to P2
            if (this.mode === 'story' && window.storyApp) {
                const boss = window.storyApp.getCurrentBoss();
                this.p2.dropInterval = boss.dropInterval;
                this.p2.clearStyle = boss.clearStyle;
                this.p2NameEl.textContent = boss.name;
                if (p2BadgeEl) p2BadgeEl.textContent = boss.avatar;

                // Update permanent Stage Banner Badge text
                const maxStages = window.storyApp.getMaxStages();
                document.getElementById('story-stage-badge-text').textContent = `STAGE ${window.storyApp.currentStage} / ${maxStages} (VS ${boss.name})`;
            } else if (p2BadgeEl) {
                p2BadgeEl.textContent = '🐶';
            }

            this.p1.opponent = this.p2;
            this.p2.opponent = this.p1;

            this.p1.render();
            this.p2.render();
            this.p1.updateUI();
            this.p2.updateUI();
        }

        startRound(broadcast = true) {
            if (this.p1Wins >= this.targetWins || this.p2Wins >= this.targetWins) {
                this.p1Wins = 0;
                this.p2Wins = 0;
                this.updateWinDots();
            }

            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            document.getElementById('p1-ko-overlay').style.display = 'none';
            document.getElementById('p2-ko-overlay').style.display = 'none';
            document.getElementById('modal-result').style.display = 'none';

            this.initRoundBoards();
            this.isRunning = true;
            this.isPaused = false;
            this.btnStart.disabled = true;
            this.btnPause.disabled = false;
            this.btnPause.querySelector('span').textContent = 'PAUSE';

            sound.startBGM();

            if (broadcast && this.mode === 'online') {
                this.peerMgr.send({ type: 'START_MATCH' });
            }

            let syncTimer = 0;
            let lastLoopTime = performance.now();

            const gameLoop = (time) => {
                if (this.isRunning) {
                    const delta = Math.min(time - lastLoopTime, 100);
                    lastLoopTime = time;

                    if (!this.isPaused) {
                        this.inputEngine.update(delta);
                        this.p1.update(time);
                        this.p2.update(time);

                        if (this.mode === 'story' && window.storyApp) {
                            window.storyApp.updateTimer(delta);
                        }

                        if (this.mode === 'online') {
                            syncTimer += delta;
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
                this.btnPause.disabled = true;
                sound.stopBGM();

                if (this.p1.isGameOver && !this.p2.isGameOver) {
                    this.p2Wins++;
                } else if (!this.p1.isGameOver && this.p2.isGameOver) {
                    this.p1Wins++;
                }

                this.updateWinDots();

                if (this.p1Wins >= this.targetWins || this.p2Wins >= this.targetWins) {
                    setTimeout(() => this.showMatchResult(), 800);
                } else {
                    setTimeout(() => this.startRound(false), 1800);
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
            if (this.mode === 'story' && window.storyApp) {
                if (this.p1Wins >= this.targetWins) {
                    window.storyApp.onStageVictory();
                    return;
                }
            }

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
                case 'castMagic': targetBoard.castMagic(); break;
            }
        }
    }

    // --- ONLINE HIGH SCORE LEADERBOARD MANAGER ---
    class LeaderboardManager {
        constructor() {
            this.storageKey = 'cyber_tetris_online_leaderboard';
            this.defaultScores = [
                { name: 'CYBER_MASTER', score: 152000, lines: 142, date: '2026-07-21' },
                { name: 'TETRIS_KING', score: 118400, lines: 110, date: '2026-07-20' },
                { name: 'NEON_BLADE', score: 89000, lines: 84, date: '2026-07-19' },
                { name: 'HYPER_ACE', score: 64200, lines: 62, date: '2026-07-18' },
                { name: 'PIXEL_HERO', score: 42000, lines: 45, date: '2026-07-17' }
            ];

            this.init();
        }

        init() {
            const btnOpen = document.getElementById('btn-leaderboard-modal');
            if (btnOpen) {
                btnOpen.addEventListener('click', () => {
                    document.getElementById('modal-leaderboard').style.display = 'flex';
                    this.fetchScores();
                });
            }

            const btnSubmit = document.getElementById('btn-submit-score');
            if (btnSubmit) {
                btnSubmit.addEventListener('click', () => this.submitCurrentScore());
            }
        }

        getScores() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) return JSON.parse(stored);
            } catch (e) {}
            return [...this.defaultScores];
        }

        saveScores(scores) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(scores));
            } catch (e) {}
        }

        fetchScores() {
            const tbody = document.getElementById('leaderboard-tbody');
            if (!tbody) return;

            let scores = this.getScores();

            tbody.innerHTML = '';
            scores.sort((a, b) => b.score - a.score);
            scores.slice(0, 10).forEach((s, idx) => {
                const tr = document.createElement('tr');
                const rankBadge = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `${idx + 1}th`;
                tr.innerHTML = `
                    <td class="rank-badge-top">${rankBadge}</td>
                    <td style="font-weight:700;">${this.escapeHtml(s.name)}</td>
                    <td style="color:#38bdf8; font-weight:800;">${s.score.toLocaleString()}</td>
                    <td>${s.lines}</td>
                    <td style="color:var(--text-muted); font-size:0.75rem;">${s.date}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        submitCurrentScore() {
            const nameInput = document.getElementById('player-name-input');
            const name = (nameInput?.value || 'PLAYER_1').trim();
            const p1Score = parseInt(document.getElementById('p1-score')?.textContent || '0', 10);
            const p1Lines = parseInt(document.getElementById('p1-lines')?.textContent || '0', 10);

            if (p1Score <= 0) {
                alert('登録できるスコアがありません。1Pプレイでスコアを獲得してください！');
                return;
            }

            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const newEntry = { name: name.substring(0, 12), score: p1Score, lines: p1Lines, date: dateStr };
            let scores = this.getScores();
            scores.push(newEntry);
            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, 15);

            this.saveScores(scores);
            this.fetchScores();
            alert(`🏆 ${name} 様のスコア ${p1Score.toLocaleString()}pt をオンラインランキングに登録しました！`);
        }

        submitStoryTime(course, timeMs, charName) {
            const timeStr = window.storyApp ? window.storyApp.formatTime(timeMs) : `${Math.floor(timeMs / 1000)}s`;
            const name = `${charName} (${course.toUpperCase()})`;
            
            // Calculate a score equivalent for sorting (faster time = higher score)
            const calculatedScore = Math.max(1000, 1000000 - Math.floor(timeMs / 10));

            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const newEntry = { name: name.substring(0, 14), score: calculatedScore, lines: `⏱️ ${timeStr}`, date: dateStr };
            let scores = this.getScores();
            scores.push(newEntry);
            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, 15);

            this.saveScores(scores);
            this.fetchScores();
        }

        escapeHtml(str) {
            return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
        }
    }

    // --- ONLINE CHALLENGER MATCHMAKING (乱入システム) ---
    class ChallengerManager {
        constructor(matchManager) {
            this.matchManager = matchManager;
            this.isChallengerWelcome = true;

            const selectEl = document.getElementById('challenger-mode');
            if (selectEl) {
                selectEl.addEventListener('change', (e) => {
                    this.isChallengerWelcome = e.target.value === 'welcome';
                });
            }

            this.startChallengerScanner();
        }

        startChallengerScanner() {
            setInterval(() => {
                if (this.isChallengerWelcome && this.matchManager.mode === 'p1vsp2' && this.matchManager.isRunning && !this.matchManager.isPaused) {
                    if (Math.random() < 0.08) {
                        this.triggerChallengerCutIn();
                    }
                }
            }, 20000);
        }

        triggerChallengerCutIn() {
            sound.magicCast();
            const overlay = document.getElementById('challenger-cutin-overlay');
            if (!overlay) return;

            overlay.style.display = 'flex';
            setTimeout(() => {
                overlay.style.display = 'none';
                this.matchManager.p2NameEl.textContent = '⚔️ ONLINE CHALLENGER';
                this.matchManager.p2.isCPU = true;
                this.matchManager.p2.cpuDiff = 'master';
                this.matchManager.p2.dropInterval = 120;
                this.matchManager.showToast('⚔️ 挑戦者が乱入！オンラインバトルの始まりです！');
            }, 2400);
        }
    }
    class StoryModeManager {
        constructor(matchManager) {
            this.matchManager = matchManager;
            this.currentStage = 1;
            this.storyDifficulty = 'easy'; // 'easy' (3面), 'normal' (5面), 'hard' (7面)
            this.currentDialogueIndex = 0;
            this.purePlayTimeMs = 0;

            this.characters = [
                {
                    id: 'hero',
                    name: 'みけねこニャン',
                    title: '🐱 かわいい三毛猫パズラー',
                    avatar: '🐱',
                    clearStyle: 'rainbow',
                    uniqueSpell: {
                        name: '🌟 にゃんこ・レインボー',
                        code: 'hero_rainbow',
                        desc: '即座に下4行を七色に変換して一括消去し、強力な攻撃お邪魔を相手に送るニャン！'
                    }
                },
                {
                    id: 'botmaru',
                    name: 'ぽちまる',
                    title: '🐶 おてんば柴犬ロボ',
                    avatar: '🐶',
                    clearStyle: 'digital',
                    bgGradient: 'radial-gradient(circle at 50% 30%, #052e16 0%, #070913 85%)',
                    bgmSpeed: 1.0,
                    bgmPitch: 1.0,
                    diff: 'easy',
                    dropInterval: 750,
                    uniqueSpell: {
                        name: '⚡ 柴犬ワンワン・オーバーロード',
                        code: 'bot_overload',
                        desc: '下3行を消去し、自盤面の全ブロックを消しやすい単色グリーンブロックに変えるワン！'
                    }
                },
                {
                    id: 'luna',
                    name: 'うさみみルナ',
                    title: '🐰 月うさぎハッカー',
                    avatar: '🐰',
                    clearStyle: 'moon',
                    bgGradient: 'radial-gradient(circle at 50% 30%, #3b0764 0%, #070913 85%)',
                    bgmSpeed: 1.15,
                    bgmPitch: 1.1,
                    diff: 'medium',
                    dropInterval: 420,
                    uniqueSpell: {
                        name: '🌙 うさみみ・ナイトハック',
                        code: 'luna_hack',
                        desc: '相手のお邪魔メーターを横取り吸収して消滅させ、自分のマナ＋5秒バリア！'
                    }
                },
                {
                    id: 'zeus',
                    name: 'くまぞう',
                    title: '🐻 いなずま大熊ゲーマー',
                    avatar: '🐻',
                    clearStyle: 'lightning',
                    bgGradient: 'radial-gradient(circle at 50% 30%, #451a03 0%, #070913 85%)',
                    bgmSpeed: 1.25,
                    bgmPitch: 1.2,
                    diff: 'hard',
                    dropInterval: 220,
                    uniqueSpell: {
                        name: '⚡ クマさん・サンダーボルト',
                        code: 'zeus_thunder',
                        desc: '盤面内のお邪魔ブロックを落雷で全消去し、相手に強烈な3行お邪魔を叩き込むクマー！'
                    }
                },
                {
                    id: 'hayate',
                    name: 'きつねハヤテ',
                    title: '🦊 影の忍び狐',
                    avatar: '🦊',
                    clearStyle: 'sakura',
                    bgGradient: 'radial-gradient(circle at 50% 30%, #831843 0%, #070913 85%)',
                    bgmSpeed: 1.35,
                    bgmPitch: 1.25,
                    diff: 'hard',
                    dropInterval: 120,
                    uniqueSpell: {
                        name: '🦊 狐火・影分身縦棒',
                        code: 'hayate_shadow',
                        desc: '5ターンの間、出現する全てのテトロミノが「Iミノ（縦棒）」に固定変化ポン！'
                    }
                },
                {
                    id: 'valkyrie',
                    name: 'ぺんぎん女王',
                    title: '🐧 氷結ペンギン女王',
                    avatar: '🐧',
                    clearStyle: 'ice',
                    bgGradient: 'radial-gradient(circle at 50% 30%, #0c4a6e 0%, #070913 85%)',
                    bgmSpeed: 1.45,
                    bgmPitch: 1.3,
                    diff: 'master',
                    dropInterval: 60,
                    uniqueSpell: {
                        name: '🐧 氷結ペンギン・フリーズ',
                        code: 'valk_freeze',
                        desc: '8秒間相手からの攻撃を100%完全防御する極大ダイヤモンドバリアを展開パタ！'
                    }
                },
                {
                    id: 'venom',
                    name: 'らいおんヴェノム',
                    title: '🦁 暗黒の百獣王',
                    avatar: '🦁',
                    clearStyle: 'fire',
                    bgGradient: 'radial-gradient(circle at 50% 30%, #450a0a 0%, #070913 85%)',
                    bgmSpeed: 1.55,
                    bgmPitch: 1.4,
                    diff: 'master',
                    dropInterval: 35,
                    uniqueSpell: {
                        name: '🦁 サバンナ・インフェルノ',
                        code: 'venom_inferno',
                        desc: '相手の盤面底に即座に4行の凶悪お邪魔を発生させ、自分のお邪魔を全リセットガオ！'
                    }
                },
                {
                    id: 'astral',
                    name: 'ドラゴンアストラル',
                    title: '🐲 究極の神竜',
                    avatar: '🐲',
                    clearStyle: 'cosmic',
                    bgGradient: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #312e81 85%)',
                    bgmSpeed: 1.7,
                    bgmPitch: 1.5,
                    diff: 'master',
                    dropInterval: 18,
                    uniqueSpell: {
                        name: '🐲 ドラゴンブレス・ビッグバン',
                        code: 'astral_bigbang',
                        desc: '盤面のお邪魔を全てカラーミノへ浄化し、さらに下6行を一括消去する神竜極大魔法！'
                    }
                }
            ];

            this.init();
        }

        getCharacterById(id) {
            return this.characters.find(c => c.id === id) || this.characters[0];
        }

        getMaxStages() {
            if (this.storyDifficulty === 'easy') return 3;
            if (this.storyDifficulty === 'normal') return 5;
            return 7;
        }

        updateTimer(delta) {
            this.purePlayTimeMs += delta;
            const timerEl = document.getElementById('story-timer-display');
            if (timerEl) {
                timerEl.textContent = this.formatTime(this.purePlayTimeMs);
            }
        }

        formatTime(ms) {
            const totalSec = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSec / 60);
            const seconds = totalSec % 60;
            const millis = Math.floor((ms % 1000) / 10);
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
        }

        init() {
            const btnOpenCharModal = document.getElementById('btn-open-char-modal');
            if (btnOpenCharModal) {
                btnOpenCharModal.addEventListener('click', () => {
                    this.renderCharSelectModal();
                    document.getElementById('modal-char-select').style.display = 'flex';
                });
            }

            const playerCharSelect = document.getElementById('player-character');
            if (playerCharSelect) {
                playerCharSelect.addEventListener('change', () => {
                    if (this.matchManager) this.matchManager.initRoundBoards();
                });
            }

            const selectEl = document.getElementById('story-difficulty');
            if (selectEl) {
                selectEl.addEventListener('change', (e) => {
                    this.storyDifficulty = e.target.value;
                    this.currentStage = 1;
                    this.purePlayTimeMs = 0;
                    if (this.matchManager.mode === 'story') {
                        this.showStageDialogue();
                    }
                });
            }

            const btnNext = document.getElementById('btn-next-dialogue');
            const bubbleContainer = document.getElementById('story-bubble-container');

            const handleNext = () => {
                const dialogueList = this.getBossDialogue();
                if (this.currentDialogueIndex < dialogueList.length - 1) {
                    this.currentDialogueIndex++;
                    this.renderDialogueTurn();
                } else {
                    document.getElementById('modal-story-dialogue').style.display = 'none';
                    this.matchManager.startRound(false);
                }
            };

            if (btnNext) btnNext.addEventListener('click', handleNext);
            if (bubbleContainer) bubbleContainer.addEventListener('click', handleNext);

            const btnStartStage = document.getElementById('btn-start-story-stage');
            if (btnStartStage) {
                btnStartStage.addEventListener('click', () => {
                    document.getElementById('modal-story-dialogue').style.display = 'none';
                    this.matchManager.startRound(false);
                });
            }

            const btnCloseClear = document.getElementById('btn-close-story-clear');
            if (btnCloseClear) {
                btnCloseClear.addEventListener('click', () => {
                    document.getElementById('modal-story-clear').style.display = 'none';
                    this.currentStage = 1;
                    this.purePlayTimeMs = 0;
                    this.matchManager.resetMatch(false);
                });
            }
        }

        renderCharSelectModal() {
            const container = document.getElementById('char-cards-container');
            if (!container) return;

            const currentCharVal = document.getElementById('player-character')?.value || 'hero';
            container.innerHTML = '';

            this.characters.forEach(char => {
                const card = document.createElement('div');
                card.className = `char-card ${char.id === currentCharVal ? 'selected-char' : ''}`;
                card.innerHTML = `
                    <div class="char-card-header">
                        <div class="char-card-avatar">${char.avatar}</div>
                        <div class="char-card-info">
                            <div class="char-card-name">${char.name} ${char.id === currentCharVal ? '✅(選択中)' : ''}</div>
                            <div class="char-card-title">${char.title}</div>
                        </div>
                    </div>
                    <div class="unique-spell-box">
                        <div class="unique-spell-header">
                            <span class="unique-spell-badge">🔮キャラ専用個別魔法</span>
                            <span class="unique-spell-name">${char.uniqueSpell.name}</span>
                        </div>
                        <p class="unique-spell-desc">${char.uniqueSpell.desc}</p>
                    </div>
                `;

                card.addEventListener('click', () => {
                    const selectEl = document.getElementById('player-character');
                    if (selectEl) {
                        selectEl.value = char.id;
                        if (this.matchManager) this.matchManager.initRoundBoards();
                    }
                    this.renderCharSelectModal();
                });

                container.appendChild(card);
            });
        }

        getCurrentBoss() {
            const index = Math.min(this.currentStage, this.characters.length - 1);
            return this.characters[index];
        }

        updateCurrentBossUI() {
            const boss = this.getCurrentBoss();
            if (boss && this.matchManager.mode === 'story') {
                this.matchManager.p2NameEl.textContent = `${boss.avatar} ${boss.name}`;

                // Apply Stage Background & Music Theme
                const appContainer = document.querySelector('.app-container');
                if (appContainer && boss.bgGradient) {
                    appContainer.style.background = boss.bgGradient;
                }
                sound.setBGMTheme(boss.bgmSpeed || 1.0, boss.bgmPitch || 1.0);
            }
        }

        showStageDialogue() {
            const boss = this.getCurrentBoss();
            const maxStages = this.getMaxStages();

            document.getElementById('story-stage-pill').textContent = `STAGE ${this.currentStage} / ${maxStages} (${this.storyDifficulty.toUpperCase()})`;
            document.getElementById('story-boss-title').textContent = `⚔️ VS ${boss.name}`;
            document.getElementById('story-boss-avatar').textContent = boss.avatar;
            document.getElementById('story-boss-name').textContent = boss.name;

            const p1CharVal = document.getElementById('player-character')?.value || 'hero';
            const p1CharObj = this.getCharacterById(p1CharVal);
            const p1AvatarEl = document.querySelector('#speaker-p1-card .character-avatar');
            const p1NameEl = document.querySelector('#speaker-p1-card .speaker-name');
            if (p1AvatarEl) p1AvatarEl.textContent = p1CharObj.avatar;
            if (p1NameEl) p1NameEl.textContent = p1CharObj.name;

            this.updateCurrentBossUI();
            this.currentDialogueIndex = 0;
            this.renderDialogueTurn();

            document.getElementById('modal-story-dialogue').style.display = 'flex';
        }

        getBossDialogue() {
            const boss = this.getCurrentBoss();
            if (window.STORY_DIALOGUES && window.STORY_DIALOGUES[boss.id]) {
                return window.STORY_DIALOGUES[boss.id];
            }
            return [
                { speaker: 'p1', text: `「いざ勝負だ！${boss.name}！」` },
                { speaker: 'boss', text: '「負けないわよ！勝負勝負！」' }
            ];
        }

        renderDialogueTurn() {
            const boss = this.getCurrentBoss();
            const dialogueList = this.getBossDialogue();
            const turn = dialogueList[this.currentDialogueIndex];
            if (!turn) return;

            sound.playTone(600 + (this.currentDialogueIndex * 80), 0.04, 'sine', 0.05);

            const speakerP1Card = document.getElementById('speaker-p1-card');
            const speakerBossCard = document.getElementById('speaker-boss-card');
            const currentSpeakerLabel = document.getElementById('current-speaker-name');
            const speechText = document.getElementById('story-speech-text');

            const p1CharVal = document.getElementById('player-character')?.value || 'hero';
            const p1CharObj = this.getCharacterById(p1CharVal);

            if (turn.speaker === 'p1') {
                speakerP1Card.classList.add('active-speaker');
                speakerBossCard.classList.remove('active-speaker');
                currentSpeakerLabel.textContent = p1CharObj.name;
                currentSpeakerLabel.style.color = '#38bdf8';
            } else {
                speakerP1Card.classList.remove('active-speaker');
                speakerBossCard.classList.add('active-speaker');
                currentSpeakerLabel.textContent = boss.name;
                currentSpeakerLabel.style.color = '#c084fc';
            }

            speechText.textContent = turn.text;
        }

        onStageVictory() {
            const maxStages = this.getMaxStages();
            if (this.currentStage >= maxStages) {
                sound.magicCast();
                const timeStr = this.formatTime(this.purePlayTimeMs);
                document.getElementById('story-clear-desc').textContent = `${this.storyDifficulty.toUpperCase()} コース (全${maxStages}ステージ) を完全制覇！\n⏱️ 純プレイタイム: ${timeStr}`;
                document.getElementById('modal-story-clear').style.display = 'flex';

                if (window.leaderboardApp) {
                    const p1CharVal = document.getElementById('player-character')?.value || 'hero';
                    const p1CharObj = this.getCharacterById(p1CharVal);
                    window.leaderboardApp.submitStoryTime(this.storyDifficulty, this.purePlayTimeMs, p1CharObj.name);
                }
            } else {
                this.currentStage++;
                this.updateCurrentBossUI();
                setTimeout(() => {
                    this.showStageDialogue();
                }, 800);
            }
        }
    }

    // --- 🖥️ SCREEN VIEW MANAGER (画面遷移フロー制御) ---
    class ViewManager {
        constructor(matchManager, storyManager) {
            this.matchManager = matchManager;
            this.storyManager = storyManager;
            this.selectedCharId = 'hero';

            this.init();
        }

        showView(viewName) {
            const views = {
                'main-menu': document.getElementById('view-main-menu'),
                'char-select': document.getElementById('view-char-select'),
                'gameplay': document.getElementById('view-gameplay')
            };

            Object.keys(views).forEach(k => {
                if (views[k]) views[k].style.display = (k === viewName) ? 'flex' : 'none';
            });

            if (viewName === 'char-select') {
                this.renderCharCards();
            } else if (viewName === 'gameplay') {
                sound.init();
                if (this.matchManager.mode === 'story') {
                    this.storyManager.showStageDialogue();
                } else {
                    this.matchManager.startRound(true);
                }
            } else if (viewName === 'main-menu') {
                sound.stopBGM();
                this.matchManager.resetMatch(false);
            }
        }

        init() {
            // Mode Select Buttons in Main Menu
            document.querySelectorAll('.mode-card-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.mode-card-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const mode = btn.dataset.mode;
                    this.matchManager.mode = mode;
                    this.matchManager.updateModeUI();

                    const storyGroup = document.getElementById('story-diff-group');
                    if (storyGroup) {
                        storyGroup.style.display = (mode === 'story') ? 'flex' : 'none';
                    }
                });
            });

            // "Next: Go to Char Select" Button
            const btnGoChar = document.getElementById('btn-go-to-char-select');
            if (btnGoChar) {
                btnGoChar.addEventListener('click', (e) => {
                    e.preventDefault();
                    sound.init();
                    this.showView('char-select');
                });
            }

            // "Back to Settings Menu" Buttons
            const btnBackMenu = document.getElementById('btn-back-to-menu-from-char');
            if (btnBackMenu) {
                btnBackMenu.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showView('main-menu');
                });
            }

            const btnBackFromGame = document.getElementById('btn-back-to-menu-from-game');
            if (btnBackFromGame) {
                btnBackFromGame.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showView('main-menu');
                });
            }

            // "Start Game from Char Select" Button
            const btnStartGame = document.getElementById('btn-start-game-from-char');
            if (btnStartGame) {
                btnStartGame.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showView('gameplay');
                });
            }

            // Menu Modals
            const btnRankMenu = document.getElementById('btn-leaderboard-modal-menu');
            if (btnRankMenu) {
                btnRankMenu.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById('modal-leaderboard').style.display = 'flex';
                    if (window.leaderboardApp) window.leaderboardApp.fetchScores();
                });
            }

            const btnGuideMenu = document.getElementById('btn-tutorial-modal-menu');
            if (btnGuideMenu) {
                btnGuideMenu.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById('modal-tutorial').style.display = 'flex';
                });
            }
        }

        renderCharCards() {
            const container = document.getElementById('char-cards-full-grid');
            if (!container || !this.storyManager) return;

            container.innerHTML = '';
            const charImages = {
                'hero': 'assets/cat.jpg',
                'botmaru': 'assets/shiba.jpg',
                'luna': 'assets/rabbit.jpg'
            };

            this.storyManager.characters.forEach(char => {
                const isSelected = char.id === this.selectedCharId;
                const card = document.createElement('div');
                card.className = `char-pop-card ${isSelected ? 'selected-pop-card' : ''}`;
                card.dataset.charid = char.id;
                card.setAttribute('onclick', `window.selectChar('${char.id}')`);

                const imgHtml = charImages[char.id] 
                    ? `<img src="${charImages[char.id]}" alt="${char.name}">`
                    : `<span style="font-size:3rem; display:block; text-align:center;">${char.avatar}</span>`;

                card.innerHTML = `
                    <div class="char-img-frame">
                        ${imgHtml}
                    </div>
                    <div class="char-pop-name">${char.name}</div>
                    <div class="char-pop-title">${char.title}</div>
                    <div class="unique-spell-box" style="margin-top:6px; width:100%;">
                        <div class="unique-spell-header">
                            <span class="unique-spell-badge">🔮個別魔法スキル</span>
                            <span class="unique-spell-name">${char.uniqueSpell.name}</span>
                        </div>
                        <p class="unique-spell-desc">${char.uniqueSpell.desc}</p>
                    </div>
                `;

                container.appendChild(card);
            });
        }
    }

    // Global Navigation & Character Handlers for Guaranteed Responsiveness
    window.selectChar = function(charId) {
        if (sound) {
            sound.init();
            sound.hold();
        }

        const cards = document.querySelectorAll('.char-pop-card');
        cards.forEach(card => {
            if (card.dataset.charid === charId) {
                card.classList.add('selected-pop-card');
            } else {
                card.classList.remove('selected-pop-card');
            }
        });

        if (window.viewApp) {
            window.viewApp.selectedCharId = charId;
        }
        if (window.matchApp) {
            window.matchApp.playerCharId = charId;
        }

        const selectEl = document.getElementById('player-character');
        if (selectEl) selectEl.value = charId;
    };

    window.selectMode = function(modeName, btnEl) {
        document.querySelectorAll('.mode-card-btn').forEach(b => b.classList.remove('active'));
        if (btnEl) btnEl.classList.add('active');

        if (window.matchApp) {
            window.matchApp.mode = modeName;
            window.matchApp.updateModeUI();
        }

        const storyGroup = document.getElementById('story-diff-group');
        if (storyGroup) {
            storyGroup.style.display = (modeName === 'story') ? 'flex' : 'none';
        }
    };

    window.goToCharSelect = function() {
        if (sound) sound.init();
        if (window.viewApp) {
            window.viewApp.showView('char-select');
            window.viewApp.renderCharCards();
        } else {
            const menu = document.getElementById('view-main-menu');
            const charScreen = document.getElementById('view-char-select');
            if (menu) menu.style.display = 'none';
            if (charScreen) charScreen.style.display = 'flex';
        }
    };

    window.backToMainMenu = function() {
        if (sound) sound.stopBGM();
        if (window.matchApp) window.matchApp.resetMatch(true);

        if (window.viewApp) {
            window.viewApp.showView('main-menu');
        } else {
            const menu = document.getElementById('view-main-menu');
            const charScreen = document.getElementById('view-char-select');
            const gameplay = document.getElementById('view-gameplay');
            if (charScreen) charScreen.style.display = 'none';
            if (gameplay) gameplay.style.display = 'none';
            if (menu) menu.style.display = 'flex';
        }
    };

    window.startGameFromChar = function() {
        if (sound) sound.init();
        if (window.viewApp && window.matchApp) {
            window.matchApp.playerCharId = window.viewApp.selectedCharId || 'hero';
            window.viewApp.showView('gameplay');
        } else {
            const charScreen = document.getElementById('view-char-select');
            const gameplay = document.getElementById('view-gameplay');
            if (charScreen) charScreen.style.display = 'none';
            if (gameplay) gameplay.style.display = 'flex';
            if (window.matchApp) window.matchApp.startRound(true);
        }
    };

    window.startMatch = function() {
        if (sound) sound.init();
        if (window.matchApp && !window.matchApp.isRunning) {
            window.matchApp.startRound(true);
        }
    };

    window.pauseMatch = function() {
        if (!window.matchApp) return;
        window.matchApp.isPaused = !window.matchApp.isPaused;
        const btnPause = document.getElementById('btn-pause-match');
        if (btnPause) {
            const label = btnPause.querySelector('span');
            if (label) label.textContent = window.matchApp.isPaused ? 'RESUME' : 'PAUSE';
        }
        if (window.matchApp.isPaused) {
            if (sound) sound.stopBGM();
        } else {
            if (sound) sound.startBGM();
        }
    };

    window.restartMatch = function() {
        if (sound) sound.init();
        if (window.matchApp) {
            window.matchApp.resetMatch(true);
            window.matchApp.startRound(true);
        }
    };

    // Initialize Match App & Managers
    document.addEventListener('DOMContentLoaded', () => {
        window.matchApp = new MatchManager();
        window.leaderboardApp = new LeaderboardManager();
        window.challengerApp = new ChallengerManager(window.matchApp);
        window.storyApp = new StoryModeManager(window.matchApp);
        window.viewApp = new ViewManager(window.matchApp, window.storyApp);
    });

})();
