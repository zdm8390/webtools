/* ==========================================================================
   E. HONDAFY - E. Honda Sumo Converter (Definitive Edition)
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
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtx = new AudioContext();
        }
      } catch (e) {
        console.warn('Audio Context Error:', e);
      }
    }
  }

  // Sound Effects Generator
  function playSound(type = 'dosukoi') {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const now = audioCtx.currentTime;
      if (type === 'dosukoi') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'taiko') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      console.warn('Play sound error:', e);
    }
  }

  /* --------------------------------------------------------------------------
     Mora (Syllable) & Emotion Analyzer
     -------------------------------------------------------------------------- */
  function countMoras(text) {
    if (!text) return 0;
    const smallKanaRegex = /[ぁぃぅぇぉゃゅょゎァィゥヴェォャュョヮ]/g;
    const cleanText = text.replace(/[!！?？\s\n,、.。…〜~"'”」『』-]/g, '');
    if (cleanText.length === 0) return 0;

    const smallCount = (cleanText.match(smallKanaRegex) || []).length;
    return Math.max(1, cleanText.length - smallCount);
  }

  /* --------------------------------------------------------------------------
     Specified E. Honda Phrase Dictionary
     -------------------------------------------------------------------------- */
  
  // Various Honda variations
  const hondaVariations = [
    'ホンダ',
    'ﾎﾝﾀﾞ',
    'ホダ',
    'ﾎｰﾝﾀﾞ"',
    'ﾎﾝﾀﾞ!?',
    'ﾎｰﾝﾀﾞ"!!',
    'ホンダホンダホダ',
    'ホ～ンダ',
    'ﾎﾝﾀﾞｯ'
  ];

  // Specific user-requested E. Honda phrases
  const ehondaPhrases = [
    'ドスコーイ',
    '百貫落としじゃーい',
    '世界は広いのう',
    'がーっはっはっはっは！',
    'どんなもんじゃい！',
    'チャンコ食わんかい！',
    '百裂張り手じゃい！',
    'スーパー頭突きじゃい！',
    'ドスコォイ',
    'ドスコイ！',
    'おぉにぃ～無双じゃい！'
  ];

  /* --------------------------------------------------------------------------
     Single Unified E. Honda Converter Logic
     -------------------------------------------------------------------------- */
  function convertToEHonda(text, tension) {
    if (!text || !text.trim()) return '';

    const lines = text.split('\n');
    const convertedLines = lines.map(line => {
      if (!line.trim()) return '';
      
      // Split by punctuation or spaces to process chunks
      const sentences = line.split(/([、,。.！!？?\s]+)/).filter(Boolean);
      let lineResult = [];

      sentences.forEach(chunk => {
        // Preserve punctuation/spaces roughly
        if (/^[、,。.！!？?\s]+$/.test(chunk)) {
          if (chunk.includes('!') || chunk.includes('！')) {
            lineResult.push(tension > 60 ? '!!' : '!');
          } else if (chunk.includes('?') || chunk.includes('？')) {
            lineResult.push('!?');
          } else {
            lineResult.push(' ');
          }
          return;
        }

        const moras = countMoras(chunk);
        if (moras <= 0) return;

        // Build Honda + E. Honda phrases based on moras & tension
        let phraseList = [];
        let curMora = 0;
        let loopCount = 0;

        while (curMora < moras && loopCount < 50) {
          loopCount++;
          const roll = Math.random();

          // Mix between Honda variations (60%) and E. Honda Iconic phrases (40%)
          if (roll < 0.6) {
            const hIdx = Math.floor(Math.random() * hondaVariations.length);
            let hWord = hondaVariations[hIdx];

            // Add extra tension punctuation if tension is high
            if (tension > 70 && Math.random() < 0.3) {
              hWord += '!?';
            }
            phraseList.push(hWord);
            curMora += 2;
          } else {
            const pIdx = Math.floor(Math.random() * ehondaPhrases.length);
            phraseList.push(ehondaPhrases[pIdx]);
            curMora += 3;
          }
        }

        lineResult.push(phraseList.join(' '));
      });

      return lineResult.join('').trim();
    });

    return convertedLines.join('\n');
  }

  /* --------------------------------------------------------------------------
     UI Updates
     -------------------------------------------------------------------------- */
  function updateConversion() {
    try {
      const text = inputText.value;
      const tension = parseInt(tensionSlider.value, 10) || 80;

      if (charCount) {
        charCount.textContent = `${text.length} 文字`;
      }

      if (!text || !text.trim()) {
        if (outputText) {
          outputText.innerHTML = '<span class="output-placeholder">ここにエドモンド本田語の変換結果が表示されます...</span>';
        }
        if (hitBadge) hitBadge.textContent = '0 HITS!';
        updateGauge(0);
        return;
      }

      const result = convertToEHonda(text, tension);
      
      if (outputText) {
        outputText.textContent = result;
      }

      // Calculate Hit Counter & Purity Gauge
      const moras = countMoras(text);
      const hits = Math.max(1, Math.round(moras * (tension / 15)));
      if (hitBadge) {
        hitBadge.textContent = `${hits * 10} HITS!`;
      }

      const purity = Math.min(100, Math.round((result.length / (text.length || 1)) * 100));
      updateGauge(purity);
    } catch (err) {
      console.error('Conversion error:', err);
    }
  }

  function updateGauge(val) {
    if (purityFill) purityFill.style.width = `${val}%`;
    if (purityValue) purityValue.textContent = `${val}%`;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Canvas Particle Burst
  function createParticleBurst(x, y) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#eb2f06', '#f6b93b', '#ffffff', '#b71540'];
    const words = ['ドスコイ！', 'ﾎﾝﾀﾞ!', '百裂張り手!', 'ちゃんこ!', '頭突きじゃい!'];

    for (let i = 0; i < 35; i++) {
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
          p.life -= 0.03;
          p.alpha = Math.max(0, p.life);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.font = `bold ${p.size}px 'Yuji Syuku', sans-serif`;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
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

  /* --- Speech Synthesis (E. Honda Voice) --- */
  function speakHonda() {
    if (!outputText) return;
    const text = outputText.textContent;
    if (!text || text.includes('ここにエドモンド本田語')) {
      showToast('読み上げる言葉がありません！');
      return;
    }

    if (!('speechSynthesis' in window)) {
      showToast('お使いのブラウザは音声合成に対応していません');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.pitch = 0.65;
    utterance.rate = 1.0;

    window.speechSynthesis.speak(utterance);
    showToast('🔊 エドモンド本田が朗読中（ドスコイ！）...');
    playSound('dosukoi');
  }

  /* --------------------------------------------------------------------------
     Event Listeners
     -------------------------------------------------------------------------- */
  
  if (inputText) {
    inputText.addEventListener('input', updateConversion);
  }

  if (tensionSlider) {
    tensionSlider.addEventListener('input', (e) => {
      if (tensionValue) tensionValue.textContent = `${e.target.value}%`;
      updateConversion();
    });
  }

  if (convertBtn) {
    convertBtn.addEventListener('click', () => {
      playSound('dosukoi');
      updateConversion();
      if (outputText) {
        outputText.classList.remove('shake');
        void outputText.offsetWidth;
        outputText.classList.add('shake');
      }

      const rect = convertBtn.getBoundingClientRect();
      createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!outputText) return;
      const text = outputText.textContent;
      if (!text || text.includes('ここにエドモンド本田語')) {
        showToast('コピーする結果がありません！');
        return;
      }

      navigator.clipboard.writeText(text).then(() => {
        playSound('taiko');
        showToast('📋 ごっつぁんコピーしました！');
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    });
  }

  if (speakBtn) {
    speakBtn.addEventListener('click', speakHonda);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      playSound('taiko');
      if (inputText) inputText.value = '';
      updateConversion();
      if (inputText) inputText.focus();
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (!outputText) return;
      const text = outputText.textContent;
      if (!text || text.includes('ここにエドモンド本田語')) return;
      const shareText = encodeURIComponent(`【E. HONDAFY】エドモンド本田語に変換しました！\n\n${text}\n\n#EHONDA #ストリートファイター #ドスコイ #ホンダ変換器`);
      window.open(`https://twitter.com/intent/tweet?text=${shareText}`, '_blank');
    });
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundToggle.classList.toggle('active', soundEnabled);
      soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
      showToast(soundEnabled ? '効果音: ON' : '効果音: OFF');
    });
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      playSound('taiko');
      if (inputText) {
        inputText.value = e.target.getAttribute('data-preset');
      }
      updateConversion();
      createParticleBurst();
    });
  });

  // Initial Execution
  if (inputText) {
    inputText.value = 'こんにちは！今日も元気に頑張りましょう！';
  }
  updateConversion();
});
