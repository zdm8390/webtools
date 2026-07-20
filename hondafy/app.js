/* ==========================================================================
   E. HONDAFY - Street Fighter E. Honda Sumo Converter Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const inputText = document.getElementById('input-text');
  const outputText = document.getElementById('output-text');
  const convertBtn = document.getElementById('convert-btn');
  const copyBtn = document.getElementById('copy-btn');
  const speakBtn = document.getElementById('speak-btn');
  const shareBtn = document.getElementById('share-btn');
  const clearBtn = document.getElementById('clear-btn');
  const modeSelect = document.getElementById('mode-select');
  const tensionSlider = document.getElementById('tension-slider');
  const tensionValue = document.getElementById('tension-value');
  const charCount = document.getElementById('char-count');
  const hitBadge = document.getElementById('hit-badge');
  const purityFill = document.getElementById('purity-fill');
  const purityValue = document.getElementById('purity-value');
  const soundToggle = document.getElementById('sound-toggle');
  const toast = document.getElementById('toast');
  const canvas = document.getElementById('particle-canvas');

  let soundEnabled = true;
  let audioCtx = null;

  // Initialize Web Audio API
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  // Play synthetic E. Honda Sound Effects
  function playSound(type = 'dosukoi') {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const now = audioCtx.currentTime;

      if (type === 'dosukoi' || type === 'zutsuki') {
        // Heavy Sumo Impact Sound (Super Zutsuki / Dosukoi)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'harite') {
        // Rapid Hyakuretsu Harite Slap Sounds
        for (let i = 0; i < 4; i++) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);

          const time = now + i * 0.06;
          osc.type = 'square';
          osc.frequency.setValueAtTime(450 + i * 50, time);
          osc.frequency.exponentialRampToValueAtTime(150, time + 0.04);

          gain.gain.setValueAtTime(0.15, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

          osc.start(time);
          osc.stop(time + 0.04);
        }
      } else if (type === 'taiko') {
        // Japanese Taiko Drum Sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /* --------------------------------------------------------------------------
     Mora & Emotion Analyzer
     -------------------------------------------------------------------------- */
  function countMoras(text) {
    if (!text) return 0;
    const smallKanaRegex = /[ぁぃぅぇぉゃゅょゎァィゥヴェォャュョヮ]/g;
    const cleanText = text.replace(/[!！?？\s\n,、.。…〜~"'”」『』-]/g, '');
    if (cleanText.length === 0) return 0;

    const smallCount = (cleanText.match(smallKanaRegex) || []).length;
    return Math.max(1, cleanText.length - smallCount);
  }

  function analyzeEmotion(text) {
    const exclamations = (text.match(/[!！]/g) || []).length;
    const questions = (text.match(/[?？]/g) || []).length;
    return { exclamations, questions };
  }

  /* --------------------------------------------------------------------------
     E. Honda Conversion Logic
     -------------------------------------------------------------------------- */
  function hondafyText(text, mode, tension) {
    if (!text.trim()) return '';

    const lines = text.split('\n');
    const convertedLines = lines.map(line => convertSingleLine(line, mode, tension));
    return convertedLines.join('\n');
  }

  function convertSingleLine(line, mode, tension) {
    if (!line.trim()) return '';

    const tokens = line.split(/([、,。.！!？?\s]+)/).filter(Boolean);
    let result = '';

    tokens.forEach(token => {
      if (/^[、,。.！!？?\s]+$/.test(token)) {
        result += adaptPunctuation(token, tension);
        return;
      }

      const moras = countMoras(token);
      const emotion = analyzeEmotion(token);
      result += generateEHondaChunk(moras, mode, tension, emotion);
    });

    return result.trim();
  }

  function adaptPunctuation(punct, tension) {
    if (punct.includes('!') || punct.includes('！')) {
      return tension > 70 ? '!!"' : '!';
    }
    if (punct.includes('?') || punct.includes('？')) {
      return tension > 50 ? '!?';
    }
    return ' ';
  }

  function generateEHondaChunk(moras, mode, tension, emotion) {
    if (moras <= 0) return '';
    const t = tension / 100;

    // 1. ✋ 百裂張り手 (Hyakuretsu Harite)
    if (mode === 'harite') {
      return buildHariteHonda(moras, t);
    }
    // 2. 🐂 スーパー頭突き (Super Zutsuki)
    else if (mode === 'zutsuki') {
      return buildZutsukiHonda(moras, t);
    }
    // 3. 💥 半角カオス本田 (Chaos Honda) - 原案「ホンダホンダホダ ﾎﾝﾀﾞ ﾎﾝﾀﾞ!? ﾎｰﾝﾀﾞ"!!」
    else if (mode === 'chaos') {
      return buildChaosEHonda(moras, t, emotion);
    }
    // 4. 🍲 ごっつぁんちゃんこ (Gottsuan Style)
    else if (mode === 'gottsuan') {
      return buildGottsuanHonda(moras, t);
    }
    // 5. 🏆 世界一の相撲 (World Champion)
    else if (mode === 'champion') {
      return buildChampionHonda(moras, t);
    }

    return buildChaosEHonda(moras, t, emotion);
  }

  /* --- Pattern Builders --- */

  // 1. 百裂張り手 (Hyakuretsu Harite) Mode
  function buildHariteHonda(moras, tension) {
    const slaps = Math.max(2, Math.min(8, Math.floor(moras * 1.5)));
    let funs = 'フン'.repeat(slaps);
    const endVocab = tension > 0.6 ? '張り手ぇー!!' : 'ﾎﾝﾀﾞｯ!';
    return `${funs}！ ${endVocab}`;
  }

  // 2. スーパー頭突き (Super Zutsuki) Mode
  function buildZutsukiHonda(moras, tension) {
    const dashLength = 'ー'.repeat(Math.floor(tension * 5) + 2);
    const excls = '！'.repeat(Math.floor(tension * 3) + 1);
    return `どすこ${dashLength}い${excls} ﾎｰﾝﾀﾞ"!!`;
  }

  // 3. 半角カオス本田 (Chaos E. Honda) Mode
  // Direct support for: 「ホンダホンダホダ ﾎﾝﾀﾞ ﾎﾝﾀﾞ!? ﾎｰﾝﾀﾞ"!!」 + E. Honda vocabulary
  function buildChaosEHonda(moras, tension, emotion) {
    let chunks = [];
    let remaining = moras;

    const hondaVocab = [
      'ﾎﾝﾀﾞ', 'ホンダ', 'ﾎｰﾝﾀﾞ"', 'ホダ', 'どすこい', 'ごっつぁん', 
      'ﾎﾝﾀﾞ!?', 'ﾎｰﾝﾀﾞ"!!', 'ホンダホンダホダ', '張り手ぇ', 'どすこーい'
    ];

    while (remaining > 0) {
      let take = Math.min(remaining, Math.floor(Math.random() * 3) + 1);
      remaining -= take;

      let piece = '';
      const roll = Math.random();

      if (take === 1) {
        piece = roll < 0.4 ? 'ﾎﾝ' : (roll < 0.7 ? 'ホ' : 'ど');
      } else if (take === 2) {
        if (roll < 0.3) piece = 'ﾎﾝﾀﾞ';
        else if (roll < 0.5) piece = 'ホンダ';
        else if (roll < 0.7) piece = 'どすこい';
        else if (roll < 0.85) piece = 'ﾎｰﾝﾀﾞ"';
        else piece = 'ホダ';
      } else {
        if (roll < 0.35) piece = 'ホンダホンダホダ';
        else if (roll < 0.65) piece = 'ごっつぁん';
        else if (roll < 0.85) piece = 'どすこーい';
        else piece = 'ﾎﾝﾀﾞｯ';
      }

      if (tension > 0.6 && Math.random() < 0.35) {
        piece += '!?';
      } else if (tension > 0.8 && Math.random() < 0.4) {
        piece += '"!!';
      }

      chunks.push(piece);
    }

    if (emotion.exclamations > 0) {
      chunks[chunks.length - 1] += '"!!';
    } else if (emotion.questions > 0) {
      chunks[chunks.length - 1] += '!?';
    }

    return chunks.join(' ');
  }

  // 4. ごっつぁんちゃんこ (Gottsuan Style)
  function buildGottsuanHonda(moras, tension) {
    const parts = ['ごっつぁんです！', 'はっけよい！', '残った！', '本田場所！'];
    const p = parts[moras % parts.length];
    return `${p} ﾎﾝﾀﾞﾎﾝﾀﾞ どすこい！`;
  }

  // 5. 世界一の相撲 (World Champion)
  function buildChampionHonda(moras, tension) {
    return `わははは！ 相撲こそ世界一！ ﾎｰﾝﾀﾞ"!! DOSUKOI!!`;
  }

  /* --------------------------------------------------------------------------
     UI Interactions
     -------------------------------------------------------------------------- */
  
  function updateConversion() {
    const text = inputText.value;
    const mode = modeSelect.value;
    const tension = parseInt(tensionSlider.value, 10);

    charCount.textContent = `${text.length} 文字`;

    if (!text.trim()) {
      outputText.innerHTML = '<span class="output-placeholder">ここにエドモンド本田語の変換結果が表示されます...</span>';
      hitBadge.textContent = '0 HITS!';
      updateGauge(0);
      return;
    }

    const result = hondafyText(text, mode, tension);
    outputText.textContent = result;

    // Calculate Hit Counter & Purity
    const moras = countMoras(text);
    const hits = Math.max(1, Math.round(moras * (tension / 20)));
    hitBadge.textContent = `${hits * 10} HITS!`;

    const purity = Math.min(100, Math.round((result.length / (text.length || 1)) * 100));
    updateGauge(purity);
  }

  function updateGauge(val) {
    purityFill.style.width = `${val}%`;
    purityValue.textContent = `${val}%`;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Particle Burst (Sumo Slap & Spark Effect)
  function createParticleBurst(x, y) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#eb2f06', '#f6b93b', '#ffffff', '#b71540'];
    const words = ['どすこい!', 'ﾎﾝﾀﾞ!', '張り手ぇ!', 'ごっつぁん!', '百裂!'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: x || window.innerWidth / 2,
        y: y || window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.5) * 16 - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 16 + 12,
        word: words[Math.floor(Math.random() * words.length)],
        alpha: 1,
        life: 1
      });
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.life > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.3;
          p.life -= 0.028;
          p.alpha = Math.max(0, p.life);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.font = `bold ${p.size}px 'Yuji Syuku', sans-serif`;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.fillText(p.word, p.x, p.y);
          ctx.restore();
        }
      });

      if (alive) {
        requestAnimationFrame(render);
      }
    }

    render();
  }

  /* --- Web Speech API (E. Honda Sumo Voice) --- */
  function speakHonda() {
    const text = outputText.textContent;
    if (!text || text.includes('ここにエドモンド本田語')) {
      showToast('読み上げるどすこいがありません！');
      return;
    }

    if (!('speechSynthesis' in window)) {
      showToast('お使いのブラウザは音声合成に対応していません');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';

    // Deep sumo voice pitch
    utterance.pitch = 0.6;
    utterance.rate = 1.0;

    window.speechSynthesis.speak(utterance);
    showToast('🔊 エドモンド本田が朗読中（どすこい！）...');
    playSound('dosukoi');
  }

  /* --------------------------------------------------------------------------
     Event Listeners
     -------------------------------------------------------------------------- */
  
  inputText.addEventListener('input', () => {
    updateConversion();
  });

  modeSelect.addEventListener('change', () => {
    playSound('taiko');
    updateConversion();
  });

  tensionSlider.addEventListener('input', (e) => {
    tensionValue.textContent = `${e.target.value}%`;
    updateConversion();
  });

  convertBtn.addEventListener('click', () => {
    const mode = modeSelect.value;
    if (mode === 'harite') playSound('harite');
    else playSound('dosukoi');

    updateConversion();
    outputText.classList.remove('shake');
    void outputText.offsetWidth;
    outputText.classList.add('shake');

    const rect = convertBtn.getBoundingClientRect();
    createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  copyBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (!text || text.includes('ここにエドモンド本田語')) {
      showToast('コピーする結果がありません！');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      playSound('taiko');
      showToast('📋 クリップボードにごっつぁんコピーしました！');
    });
  });

  speakBtn.addEventListener('click', speakHonda);

  clearBtn.addEventListener('click', () => {
    playSound('taiko');
    inputText.value = '';
    updateConversion();
    inputText.focus();
  });

  shareBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (!text || text.includes('ここにエドモンド本田語')) return;
    const shareText = encodeURIComponent(`【E. HONDAFY】エドモンド本田語に変換しました！\n\n${text}\n\n#EHONDA #ストリートファイター #どすこい #ホンダ変換器`);
    window.open(`https://twitter.com/intent/tweet?text=${shareText}`, '_blank');
  });

  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.classList.toggle('active', soundEnabled);
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    showToast(soundEnabled ? '効果音: ON' : '効果音: OFF');
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      playSound('taiko');
      inputText.value = e.target.getAttribute('data-preset');
      updateConversion();
      createParticleBurst();
    });
  });

  // Initial Sample
  inputText.value = 'こんにちは！今日も元気にどすこい頑張りましょう！';
  updateConversion();
});
