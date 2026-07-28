/**
 * AudioManager - Web Audio API によるシンセサイズ効果音・BGM再生
 * 音源ファイルのダウンロード不要で、完全ローカルでインパクトのあるサウンドを動的生成。
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.initOnInteraction();
    }

    initOnInteraction() {
        const startAudio = () => {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                    this.enabled = true;
                }
            } else if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            window.removeEventListener('keydown', startAudio);
            window.removeEventListener('click', startAudio);
            window.removeEventListener('gamepadconnected', startAudio);
        };

        window.addEventListener('keydown', startAudio);
        window.addEventListener('click', startAudio);
        window.addEventListener('gamepadconnected', startAudio);
    }

    // パンチ音 (打撃系ノイズ + 周波数降下)
    playPunch() {
        if (!this.ctx || !this.enabled) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);

        // 重低音インパクト
        this.playSubImpact(0.15, 120);
    }

    // キック音 (重低音ドカン音)
    playKick() {
        if (!this.ctx || !this.enabled) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);

        this.playNoiseBurst(0.15, 800);
    }

    // ガード音 (金属的・バリア音)
    playGuard() {
        if (!this.ctx || !this.enabled) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // オブジェクト破壊音 (破壊物飛散・破砕音)
    playDestruction() {
        if (!this.ctx || !this.enabled) return;
        this.playNoiseBurst(0.35, 2500);
        this.playSubImpact(0.25, 90);
    }

    // ノイズバースト生成 helper
    playNoiseBurst(duration, cutoffFreq = 1000) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoffFreq, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start();
    }

    // サブインパクト生成
    playSubImpact(duration, startFreq) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + duration);

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }
}
