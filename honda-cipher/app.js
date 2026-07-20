/* ==========================================================================
   E. HONDA CIPHER - Reversible Converter Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const inputText = document.getElementById('input-text');
  const outputText = document.getElementById('output-text');
  const actionBtn = document.getElementById('action-btn');
  const copyBtn = document.getElementById('copy-btn');
  const speakBtn = document.getElementById('speak-btn');
  const clearBtn = document.getElementById('clear-btn');
  const encodeTab = document.getElementById('tab-encode');
  const decodeTab = document.getElementById('tab-decode');
  const charCount = document.getElementById('char-count');
  const soundToggle = document.getElementById('sound-toggle');
  const toast = document.getElementById('toast');
  const canvas = document.getElementById('particle-canvas');

  let currentMode = 'encode'; // 'encode' or 'decode'
  let soundEnabled = true;
  let audioCtx = null;

  // 16-element Reversible Honda Dictionary (Maps 4-bit nibbles 0x0..0xF)
  const HONDA_DICT = [
    'ホンダ',                 // 0 (0x0)
    'ﾎﾝﾀﾞ',                  // 1 (0x1)
    'ホダ',                  // 2 (0x2)
    'ﾎｰﾝﾀﾞ"',                // 3 (0x3)
    'ﾎﾝﾀﾞ!?',                // 4 (0x4)
    'ドスコーイ',             // 5 (0x5)
    '百貫落としじゃーい',       // 6 (0x6)
    '世界は広いのう',          // 7 (0x7)
    'がーっはっはっはっは！',   // 8 (0x8)
    'どんなもんじゃい！',       // 9 (0x9)
    'チャンコ食わんかい！',     // 10 (0xA)
    '百裂張り手じゃい！',       // 11 (0xB)
    'スーパー頭突きじゃい！',   // 12 (0xC)
    'ドスコォイ',             // 13 (0xD)
    'ドスコイ！',             // 14 (0xE)
    'おぉにぃ～無双じゃい！'    // 15 (0xF)
  ];

  // Map phrase to its 4-bit integer index (0..15)
  const REVERSE_DICT = new Map();
  HONDA_DICT.forEach((phrase, idx) => {
    REVERSE_DICT.set(phrase, idx);
  });

  // Sound FX
  function initAudio() {
    if (!audioCtx) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      } catch (e) {
        console.warn('Audio Error:', e);
      }
    }
  }

  function playSound(type = 'dosukoi') {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'dosukoi') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      }

      osc.start(now);
      osc.stop(now + (type === 'dosukoi' ? 0.3 : 0.15));
    } catch (e) {}
  }

  /* --------------------------------------------------------------------------
     100% Reversible Encoding & Decoding Logic
     -------------------------------------------------------------------------- */

  // Text -> Honda Cipher (Encode)
  function encodeToHonda(text) {
    if (!text) return '';
    try {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      const phrases = [];

      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        const highNibble = (byte >> 4) & 0x0f;
        const lowNibble = byte & 0x0f;

        phrases.push(HONDA_DICT[highNibble]);
        phrases.push(HONDA_DICT[lowNibble]);
      }

      return phrases.join(' ');
    } catch (err) {
      console.error('Encode Error:', err);
      return '【エラー】暗号化に失敗しました';
    }
  }

  // Honda Cipher -> Text (Decode)
  function decodeFromHonda(cipherText) {
    if (!cipherText || !cipherText.trim()) return '';
    try {
      // Tokenize by spaces/newlines or match phrases from dictionary
      // Sort dictionary phrases by length descending to match multi-char tokens first
      const sortedPhrases = [...HONDA_DICT].sort((a, b) => b.length - a.length);
      
      let str = cipherText.trim();
      const tokens = [];

      while (str.length > 0) {
        str = str.trimStart();
        let matched = false;

        for (const phrase of sortedPhrases) {
          if (str.startsWith(phrase)) {
            tokens.push(phrase);
            str = str.slice(phrase.length);
            matched = true;
            break;
          }
        }

        if (!matched) {
          // Skip unknown character or space
          str = str.slice(1);
        }
      }

      if (tokens.length % 2 !== 0) {
        // If odd tokens, pad last token to complete byte
        tokens.push(HONDA_DICT[0]);
      }

      const byteValues = [];
      for (let i = 0; i < tokens.length; i += 2) {
        const highIdx = REVERSE_DICT.get(tokens[i]) ?? 0;
        const lowIdx = REVERSE_DICT.get(tokens[i + 1]) ?? 0;
        const byte = (highIdx << 4) | lowIdx;
        byteValues.push(byte);
      }

      const decoder = new TextDecoder('utf-8');
      const uint8Array = new Uint8Array(byteValues);
      return decoder.decode(uint8Array);
    } catch (err) {
      console.error('Decode Error:', err);
      return '【エラー】本田暗号の解読に失敗しました。正しい本田暗号文を入力してください。';
    }
  }

  /* --------------------------------------------------------------------------
     UI Interactions & Mode Switch
     -------------------------------------------------------------------------- */

  function updateConversion() {
    const text = inputText.value;
    charCount.textContent = `${text.length} 文字`;

    if (!text.trim()) {
      outputText.innerHTML = `<span class="output-placeholder">${
        currentMode === 'encode'
          ? 'ここに本田暗号文（可逆）が表示されます...'
          : 'ここに復元された原文テキストが表示されます...'
      }</span>`;
      return;
    }

    if (currentMode === 'encode') {
      outputText.textContent = encodeToHonda(text);
    } else {
      outputText.textContent = decodeFromHonda(text);
    }
  }

  function setMode(mode) {
    currentMode = mode;
    playSound('taiko');

    if (mode === 'encode') {
      encodeTab.classList.add('active');
      decodeTab.classList.remove('active');
      inputText.placeholder = '暗号化したい原文を入力してください...\n例: こんにちは！これは秘密のメッセージです。';
      actionBtn.innerHTML = '<span>🔐 本田暗号化 (ENCODE)</span>';
    } else {
      decodeTab.classList.add('active');
      encodeTab.classList.remove('active');
      inputText.placeholder = '解読したい本田暗号文を入力してください...\n例: 百貫落としじゃーい ﾎﾝﾀﾞ ドスコーイ ﾎｰﾝﾀﾞ"';
      actionBtn.innerHTML = '<span>🔓 本田解読 (DECODE)</span>';
    }

    updateConversion();
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // Particle Animation
  function createParticleBurst(x, y) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#eb2f06', '#f6b93b', '#ffffff', '#00d2d3'];
    const words = ['🔐ENCODE', '🔓DECODE', 'ドスコイ!', 'ﾎﾝﾀﾞ!'];

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: x || window.innerWidth / 2,
        y: y || window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14 - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 14 + 12,
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
          p.life -= 0.03;
          p.alpha = Math.max(0, p.life);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.font = `bold ${p.size}px 'Yuji Syuku', sans-serif`;
          ctx.fillText(p.word, p.x, p.y);
          ctx.restore();
        }
      });

      if (alive) requestAnimationFrame(render);
    }

    render();
  }

  /* --- Event Listeners --- */

  encodeTab.addEventListener('click', () => setMode('encode'));
  decodeTab.addEventListener('click', () => setMode('decode'));

  inputText.addEventListener('input', updateConversion);

  actionBtn.addEventListener('click', () => {
    playSound('dosukoi');
    updateConversion();
    const rect = actionBtn.getBoundingClientRect();
    createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  copyBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (!text || text.includes('ここに')) {
      showToast('コピーする結果がありません！');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      playSound('taiko');
      showToast('📋 クリップボードにごっつぁんコピーしました！');
    });
  });

  speakBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    if (!text || text.includes('ここに')) return;

    if (!('speechSynthesis' in window)) {
      showToast('お使いのブラウザは音声合成に対応していません');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.pitch = 0.65;
    window.speechSynthesis.speak(utterance);
    showToast('🔊 朗読中（ドスコイ！）...');
    playSound('dosukoi');
  });

  clearBtn.addEventListener('click', () => {
    playSound('taiko');
    inputText.value = '';
    updateConversion();
    inputText.focus();
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

  // Initial Execution
  inputText.value = '秘密のどすこい暗号テスト！可逆変換成功！';
  updateConversion();
});
