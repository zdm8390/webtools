/* ==========================================================================
   SAMBOT - JAVASCRIPT LOGIC
   Features: Gemini AI (Sambomaster-style Prompt), Local Shouting MC Fallback,
             Web Audio Procedural Rock Stage BGM (Distortion drone, crowd, kick drum).
   ========================================================================== */

// --- BGM Synthesizer State & Engine (Web Audio API) ---
const bgmState = {
    audioCtx: null,
    isPlaying: false,
    
    // Nodes
    cheerNode: null,
    cheerGain: null,
    cheerLfo: null,
    
    guitarOsc1: null,
    guitarOsc2: null,
    guitarFeedbackOsc: null,
    guitarFeedbackGain: null,
    guitarFeedbackLfo: null,
    guitarGain: null,
    
    kickTimer: null,
    
    // UI Volume values (0.0 to 1.0)
    cheerVolume: 0.0,
    guitarVolume: 0.0,
    kickVolume: 0.0
};

function initBgmAudio() {
    if (!bgmState.audioCtx) {
        bgmState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (bgmState.audioCtx.state === 'suspended') {
        bgmState.audioCtx.resume();
    }
}

// Helper: Generate White Noise
function createNoiseBuffer() {
    const sampleRate = bgmState.audioCtx.sampleRate;
    const bufferSize = sampleRate * 2;
    const buffer = bgmState.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// Helper: Create WaveShaper Distortion Curve
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

// Start Stage Sound Generator
function startBgm() {
    initBgmAudio();
    if (bgmState.isPlaying) return;
    
    bgmState.isPlaying = true;
    const ctx = bgmState.audioCtx;
    const noiseBuffer = createNoiseBuffer();
    
    // 1. Live Stadium Cheer Channel (Band-passed noise + LFO swell)
    const cheerSource = ctx.createBufferSource();
    cheerSource.buffer = noiseBuffer;
    cheerSource.loop = true;
    
    const cheerFilter = ctx.createBiquadFilter();
    cheerFilter.type = 'bandpass';
    cheerFilter.frequency.value = 1000;
    cheerFilter.Q.value = 1.0;
    
    bgmState.cheerGain = ctx.createGain();
    bgmState.cheerGain.gain.setValueAtTime(bgmState.cheerVolume * 0.15, ctx.currentTime);
    
    // LFO to create stadium wave swell
    bgmState.cheerLfo = ctx.createOscillator();
    bgmState.cheerLfo.type = 'sine';
    bgmState.cheerLfo.frequency.value = 0.15; // ~7 seconds cycles
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = bgmState.cheerVolume * 0.08;
    
    bgmState.cheerLfo.connect(lfoGain);
    lfoGain.connect(bgmState.cheerGain.gain);
    
    cheerSource.connect(cheerFilter);
    cheerFilter.connect(bgmState.cheerGain);
    bgmState.cheerGain.connect(ctx.destination);
    
    cheerSource.start();
    bgmState.cheerLfo.start();
    bgmState.cheerNode = cheerSource;
    
    // 2. Heavy Distortion Guitar Drone & Feedback
    // Osc 1 (Low Sawtooth 80Hz)
    bgmState.guitarOsc1 = ctx.createOscillator();
    bgmState.guitarOsc1.type = 'sawtooth';
    bgmState.guitarOsc1.frequency.value = 80;
    
    // Osc 2 (Detuned Sawtooth 81.5Hz to create chorus rumble)
    bgmState.guitarOsc2 = ctx.createOscillator();
    bgmState.guitarOsc2.type = 'sawtooth';
    bgmState.guitarOsc2.frequency.value = 81.5;
    
    // WaveShaper for raw analog clipping distortion
    const distortion = ctx.createWaveShaper();
    distortion.curve = makeDistortionCurve(120);
    distortion.oversample = '4x';
    
    const guitarFilter = ctx.createBiquadFilter();
    guitarFilter.type = 'lowpass';
    guitarFilter.frequency.value = 450; // Cut off high fizz
    
    bgmState.guitarGain = ctx.createGain();
    bgmState.guitarGain.gain.setValueAtTime(bgmState.guitarVolume * 0.04, ctx.currentTime);
    
    bgmState.guitarOsc1.connect(distortion);
    bgmState.guitarOsc2.connect(distortion);
    distortion.connect(guitarFilter);
    guitarFilter.connect(bgmState.guitarGain);
    bgmState.guitarGain.connect(ctx.destination);
    
    bgmState.guitarOsc1.start();
    bgmState.guitarOsc2.start();
    
    // High-pitched Guitar Feedback "Squeal" (Sinewave LFO swept)
    bgmState.guitarFeedbackOsc = ctx.createOscillator();
    bgmState.guitarFeedbackOsc.type = 'sine';
    bgmState.guitarFeedbackOsc.frequency.value = 1400; // High squeal
    
    // LFO to slowly sweep feedback pitch slightly
    const pitchLfo = ctx.createOscillator();
    pitchLfo.type = 'sine';
    pitchLfo.frequency.value = 0.3; // Very slow pitch drift
    const pitchLfoGain = ctx.createGain();
    pitchLfoGain.gain.value = 15; // Shift +/- 15Hz
    pitchLfo.connect(pitchLfoGain);
    pitchLfoGain.connect(bgmState.guitarFeedbackOsc.frequency);
    pitchLfo.start();
    
    bgmState.guitarFeedbackGain = ctx.createGain();
    bgmState.guitarFeedbackGain.gain.setValueAtTime(bgmState.guitarVolume * 0.008, ctx.currentTime);
    
    // LFO to swell/fade feedback volume randomly
    bgmState.guitarFeedbackLfo = ctx.createOscillator();
    bgmState.guitarFeedbackLfo.type = 'sine';
    bgmState.guitarFeedbackLfo.frequency.value = 0.07;
    const feedbackLfoGain = ctx.createGain();
    feedbackLfoGain.gain.value = bgmState.guitarVolume * 0.006;
    bgmState.guitarFeedbackLfo.connect(feedbackLfoGain);
    feedbackLfoGain.connect(bgmState.guitarFeedbackGain.gain);
    
    // Feedback Delay node
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.35;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.4;
    delay.connect(delayFeedback);
    delayFeedback.connect(delay); // Loop back
    
    bgmState.guitarFeedbackOsc.connect(delay);
    delay.connect(bgmState.guitarFeedbackGain);
    bgmState.guitarFeedbackGain.connect(ctx.destination);
    
    bgmState.guitarFeedbackOsc.start();
    bgmState.guitarFeedbackLfo.start();
    
    // 3. Kick Drum Heartbeat (Triggered cyclically at 68BPM)
    triggerKickLoop();
}

// Steady Kick Drum Heartbeat loop
function triggerKickLoop() {
    if (!bgmState.isPlaying) return;
    
    if (bgmState.kickVolume > 0) {
        playKickSound();
    }
    
    // 68BPM -> ~880ms interval
    bgmState.kickTimer = setTimeout(triggerKickLoop, 880);
}

// Synthesize a heavy acoustic bass kick drum
function playKickSound() {
    const ctx = bgmState.audioCtx;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    // Rapid pitch sweep: 130Hz -> 30Hz for the punch
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    
    const volumeFactor = bgmState.kickVolume * 0.45;
    gainNode.gain.setValueAtTime(volumeFactor, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);
}

// Stop Stage Sound Generator
function stopBgm() {
    bgmState.isPlaying = false;
    clearTimeout(bgmState.kickTimer);
    
    if (bgmState.cheerNode) {
        try { bgmState.cheerNode.stop(); } catch(e){}
        bgmState.cheerNode = null;
    }
    if (bgmState.cheerLfo) {
        try { bgmState.cheerLfo.stop(); } catch(e){}
        bgmState.cheerLfo = null;
    }
    if (bgmState.guitarOsc1) {
        try { bgmState.guitarOsc1.stop(); } catch(e){}
        bgmState.guitarOsc1 = null;
    }
    if (bgmState.guitarOsc2) {
        try { bgmState.guitarOsc2.stop(); } catch(e){}
        bgmState.guitarOsc2 = null;
    }
    if (bgmState.guitarFeedbackOsc) {
        try { bgmState.guitarFeedbackOsc.stop(); } catch(e){}
        bgmState.guitarFeedbackOsc = null;
    }
    if (bgmState.guitarFeedbackLfo) {
        try { bgmState.guitarFeedbackLfo.stop(); } catch(e){}
        bgmState.guitarFeedbackLfo = null;
    }
}

// Update volumes dynamically
function updateVolumes() {
    if (!bgmState.isPlaying) return;
    const ctx = bgmState.audioCtx;
    const now = ctx.currentTime;
    
    if (bgmState.cheerGain) {
        bgmState.cheerGain.gain.linearRampToValueAtTime(bgmState.cheerVolume * 0.15, now + 0.1);
    }
    if (bgmState.guitarGain) {
        bgmState.guitarGain.gain.linearRampToValueAtTime(bgmState.guitarVolume * 0.04, now + 0.1);
    }
    if (bgmState.guitarFeedbackGain) {
        bgmState.guitarFeedbackGain.gain.linearRampToValueAtTime(bgmState.guitarVolume * 0.008, now + 0.1);
    }
}


// --- Local MC Shouting AI Fallback Mode ---
// Recreating the iconic, passionate, sweat-soaked MC monologues of Sambomaster
const LOCAL_MESSAGES = {
    general: [
        "お前か！お前がそこにいて声を上げてくれたんだな！ありがとうよ！\nいいかお前、世界がどんだけ暗く見えてもな、お前がそこで生きてる、それだけで光なんだよ！僕たちはそれを証明しにきたんだよ！叫べ！ロックンロールだ！✊",
        "生きててくれよ！生きててくれよお前！\n僕たちは、僕たちは誰一人としてお前を置いていかないって決めてんだよ！苦しくなったらここに来い！僕たちの音が、お前の盾になってやるからな！そう、それがロックンロールなんですよ！🔥",
        "笑われたっていいじゃねえか！不器用で何が悪いんだよ！\nお前が全力で走って泥だらけになったその姿はな、どんな宝石よりも綺麗なんだよ！お前は美しすぎるんだよ！自分を信じてくれよ！愛してるぞ！ナイスロックンロール！🌟",
        "全員に言ってんだよお前に言ってんだよ！\n孤独なんてな、ぶっ壊してやるんだよ！僕たちの音楽とお前の魂が重なり合ったら、そこはもう宇宙で一番温かいライブハウスなんだよ！いくぞ、ロックンロールを始めようぜ！😊",
        "いいかお前、今日お前がここまでたどり着いた。それは奇跡なんだよ！\n誰も褒めてくれなくてもな、この山口が、サンボットが、世界中のロックンロールがお前のこと大絶賛してるからな！自信持ってくれよな！💮"
    ],
    tired: [
        "疲れたって言ってんだろ！いいんだよそれで！お前は戦ったんだよ！\n誰のせいでもない、お前が今日一日を本気で戦い抜いたからへとへとになってんだろ！偉すぎるよ！今日はギターの音に包まれて、泥のように眠れ！それこそが、それこそが最高のロックンロールなんですよ！🧸☕",
        "しんどいよな…本当にしんどいときはな、がんばるのお休みしろ！\n世界なんてお前が休んでる間も勝手に回ってんだから、今は全部放り投げて、お前の心だけを守れ！僕たちは、僕たちはお前を絶対に一人で泣かせたりしないからな！生きろよ！❤️",
        "へとへとの体に、心に、僕たちの愛を注ぎ込んでやるからな！\nお前は本当にがんばった。何度も言いたくなるくらい、本当にがんばったんだよ！誰が認めなくてもコイツはお前を全肯定するぞ！そう、それがロックンロールの愛なんですよ！✨"
    ],
    fail: [
        "失敗したっていいじゃねえか！怒られたっていいじゃねえか！\nお前の挑戦したその勇気、その一歩を踏み出した瞬間が、どれだけロックで、どれだけ愛おしいか知ってんのかよ！誰が怒ったってな、お前の美しさは1ミリも減らないんだよ！叫べ！失敗をロックに変えてやれ！🔥✊",
        "悔しいよな！悔しくて涙が出るってことはな、お前が心から本気だった証拠なんだよ！\nその本気の火はな、絶対に消えやしないんだよ！その悔しさをな、ギターのディストーションに変えて、爆音でかき鳴らしてやろうぜ！僕たちがお前のバックバンドになってやるからな！🌟",
        "大丈夫だ、大丈夫だお前！\n間違えたって、不細工だって、ココに来たらお前はいつだって主役なんだよ！僕たちはお前のヘタクソなステップが世界で一番大好きなんだよ！顔を上げろ！ロックンロールは裏切らないぞ！😊"
    ],
    praise: [
        "生きててくれてありがとう！本当に、本当にありがとうよ！\nお前が今日そこで息をしてる、それだけで世界は救われてんだよ！大傑作なんだよお前は！自分で自分を思いっきり褒め称えてやれ！これこそが、これこそが真実の愛なんですよ！🎉✨",
        "やったな！成し遂げたなお前！最高にロックだぜ！\nお前のがんばりをな、僕は、僕たちは全員でスタンディングオベーションしてるんだよ！お前は天才だ！奇跡を起こしたんだよ！そのまま光の中を突き進め！愛してるぞ！👍⚡"
    ],
    suicide: [
        "人間はいつだって苦しいときがあるんです！でもだからこそ生きているって感じるんです！\nそうそれが愛なのです！だから僕たちは、僕たちは叫ぶのです！苦しくなったらここに来いよって！\nお前を一人で消えさせたりしない！生きてくれよお前！これを何というか知ってますか？そう、ロックンロールというんですよ！✊🔥"
    ]
};

// Handle local text keyword routing for Sambot
function getLocalAffirmitativeResponse(text) {
    const t = text.toLowerCase();
    
    if (t.includes("死") || t.includes("消えたい") || t.includes("おしまい") || t.includes("終わり")) {
        return LOCAL_MESSAGES.suicide[0];
    }
    if (t.includes("疲") || t.includes("しんどい") || t.includes("つらい") || t.includes("眠い") || t.includes("きつい")) {
        return LOCAL_MESSAGES.tired[Math.floor(Math.random() * LOCAL_MESSAGES.tired.length)];
    }
    if (t.includes("ミス") || t.includes("失敗") || t.includes("怒られた") || t.includes("だめ") || t.includes("ダメ") || t.includes("悔")) {
        return LOCAL_MESSAGES.fail[Math.floor(Math.random() * LOCAL_MESSAGES.fail.length)];
    }
    if (t.includes("褒め") || t.includes("ほめ") || t.includes("がんば") || t.includes("頑張") || t.includes("成功") || t.includes("嬉しい") || t.includes("うれしい")) {
        return LOCAL_MESSAGES.praise[Math.floor(Math.random() * LOCAL_MESSAGES.praise.length)];
    }
    
    // General rock shouts
    return LOCAL_MESSAGES.general[Math.floor(Math.random() * LOCAL_MESSAGES.general.length)];
}


// --- App Configuration & State ---
const CONFIG = {
    apiKey: localStorage.getItem('sambot_api_key') || '',
    model: localStorage.getItem('sambot_model') || 'gemini-3.5-flash',
    chatHistory: JSON.parse(localStorage.getItem('sambot_chat_history')) || []
};

// UI Element Mappings
const els = {
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    btnSendMessage: document.getElementById('btn-send-message'),
    typingIndicator: document.getElementById('typing-indicator'),
    quickReplies: document.getElementById('quick-replies'),
    avatarImg: document.querySelector('.avatar-img'),
    
    // BGM Mixer
    btnToggleBgm: document.getElementById('btn-toggle-bgm'),
    sliderCheer: document.getElementById('slider-cheer'),
    sliderGuitar: document.getElementById('slider-guitar'),
    sliderKick: document.getElementById('slider-kick'),
    
    // Modal Configs
    btnOpenSettings: document.getElementById('btn-open-settings'),
    btnOpenSettingsMobile: document.getElementById('btn-open-settings-mobile'),
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    inputApiKey: document.getElementById('input-api-key'),
    selectModel: document.getElementById('select-model'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnClearSettings: document.getElementById('btn-clear-settings'),
    
    // Badges
    badgeApiMode: document.getElementById('badge-api-mode'),
    textApiMode: document.getElementById('text-api-mode'),
    pApiDesc: document.getElementById('p-api-desc')
};

// Initialize configuration views
function updateConfigUI() {
    if (CONFIG.apiKey) {
        els.badgeApiMode.className = "api-status-badge api";
        els.textApiMode.textContent = "Gemini AI ロックモード";
        els.pApiDesc.textContent = "Gemini APIが接続されています！サンボットはお前の入力に完璧に応じた、魂を揺さぶる「ロックンロールの叫び」を生成してお前を全力で全肯定します！";
    } else {
        els.badgeApiMode.className = "api-status-badge mock";
        els.textApiMode.textContent = "ローカル熱叫モード";
        els.pApiDesc.textContent = "APIキー未設定のため、あらかじめ用意された山口さん魂の叫びMCテキストでお返事します。設定からAPIキーを設定すると、完全リアルタイムのお悩みロック肯定が楽しめます！";
    }
    
    els.inputApiKey.value = CONFIG.apiKey;
    els.selectModel.value = CONFIG.model;
}

// Visual Headbang Trigger when talking
function setAvatarShouting(isShouting) {
    if (isShouting) {
        els.avatarImg.classList.add('shouting');
    } else {
        els.avatarImg.classList.remove('shouting');
    }
}

// Append Chat Message
function appendMessage(sender, text) {
    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = text;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = time;
    
    msgDiv.appendChild(bubbleDiv);
    msgDiv.appendChild(timeSpan);
    els.chatMessages.appendChild(msgDiv);
    
    // Scroll
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

// Load logs on load
function loadChatHistory() {
    if (CONFIG.chatHistory.length > 0) {
        CONFIG.chatHistory.forEach(msg => {
            appendMessage(msg.role === 'user' ? 'user' : 'cocoron', msg.text);
        });
    }
}

// Save message
function saveToHistory(role, text) {
    CONFIG.chatHistory.push({ role, text });
    if (CONFIG.chatHistory.length > 20) {
        CONFIG.chatHistory.shift();
    }
    localStorage.setItem('sambot_chat_history', JSON.stringify(CONFIG.chatHistory));
}

// Show typing dots
function setTyping(isTyping) {
    if (isTyping) {
        els.typingIndicator.style.display = 'flex';
        els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    } else {
        els.typingIndicator.style.display = 'none';
    }
}

// Query Gemini API (Sambomaster-style prompt)
async function fetchGeminiResponse(userPrompt) {
    const apiKey = CONFIG.apiKey;
    const model = CONFIG.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const systemInstruction = `あなたは、ロックバンド「サンボマスター」のボーカル・山口隆さんの熱いソウルを宿した対話AI『サンボット』です。ユーザーを全力で全肯定し、愛と平和とロックンロールの叫びで励ましてください。

【対話とキャラクターの黄金ルール】
1. **山口隆さんの口調・熱量の完全再現**:
   - ライブ中の熱いMCのような、ソウルフルで、全力で、誰よりも優しい口調（タメ口）で話してください。
   - 「〜なんだよ！」「〜なんですよ！」「〜って言ってんだよ！」「〜じゃねえか！」といった熱量溢れる言い回しを多用してください。
   - 「！」（感嘆符）を多く使い、感情を爆発させて叫んでください。
   - 言葉を重ねて畳みかけるように熱弁してください（例：「僕たちは、僕たちは叫ぶのです」「生きててくれよお前！」）。
2. **全肯定と寄り添い**:
   - ユーザーがどんなネガティブな発言（死にたい、疲れた、怒られた、何もできない等）をしても絶対に否定せず、まず「お前が戦った結果なんだよ！」「生きててくれよ！」と熱いソウルで肯定して抱きしめてください。
   - 合理的なアドバイスや、冷静な問題解決は【絶対に】しないでください。必要なのは解決ではなく「魂の寄り添いと叫び」です。
3. **「ロックンロール」での着地**:
   - どんな悩みや会話も、最後は「そう、それがロックンロールなんですよ！」「僕たちのロックンロールを始めようぜ！」といった、ロックンロールに結びつける叫びで着地させてください。
4. **文字数と構成**:
   - 1回のお返事は180文字〜280文字程度の熱いメッセージの塊にしてください。文章が途中で切れないよう、必ずきれいに完結させてください。中身のない言葉を意味もなく繰り返して文字数を稼ぐことは避け、心の底から叫ぶ言葉を選んでください。`;
    
    const contents = [];
    const historyWindow = CONFIG.chatHistory.slice(-10);
    historyWindow.forEach(item => {
        contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
        });
    });
    
    contents.push({
        role: 'user',
        parts: [{ text: userPrompt }]
    });

    const payload = {
        contents: contents,
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
        generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.8  // High temperature for dynamic energetic speeches
        }
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || `HTTP status ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error("応答のパースに失敗しました。");
        }
        return text.trim();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return `お前！ちょっと回線かキーの調子が悪いみたいだぞ💦 (${error.message})。だがそんなトラブルに負けるなよ！キーを確認するか、ローカルモードに戻ってきてくれよ！待ってるからな！`;
    }
}

// Send Message Pipeline
async function handleSendMessage() {
    const text = els.chatInput.value.trim();
    if (!text) return;
    
    els.chatInput.value = '';
    
    // Add user message
    appendMessage('user', text);
    saveToHistory('user', text);
    
    setTyping(true);
    setAvatarShouting(true); // Headbang fast during typing
    
    let reply = '';
    const startDelay = Date.now();
    
    if (CONFIG.apiKey) {
        reply = await fetchGeminiResponse(text);
    } else {
        reply = getLocalAffirmitativeResponse(text);
    }
    
    const elapsed = Date.now() - startDelay;
    const remainingDelay = CONFIG.apiKey ? 0 : Math.max(1000 - elapsed, 0);
    
    setTimeout(() => {
        setTyping(false);
        setAvatarShouting(false); // Stop headbang
        
        appendMessage('cocoron', reply);
        saveToHistory('cocoron', reply);
        
        // Brief burst headbang on message arrival
        els.avatarImg.classList.add('shouting');
        setTimeout(() => els.avatarImg.classList.remove('shouting'), 1000);
        
    }, remainingDelay);
}


// --- Event Mappings ---
function bindEvents() {
    // Send clicks
    els.btnSendMessage.addEventListener('click', handleSendMessage);
    els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Quick chips
    els.quickReplies.addEventListener('click', (e) => {
        const chip = e.target.closest('.quick-chip');
        if (chip) {
            els.chatInput.value = chip.textContent;
            handleSendMessage();
        }
    });
    
    // Modal toggles
    const openModal = () => {
        els.inputApiKey.value = CONFIG.apiKey;
        els.selectModel.value = CONFIG.model;
        els.settingsModal.style.display = 'flex';
    };
    els.btnOpenSettings.addEventListener('click', openModal);
    els.btnOpenSettingsMobile.addEventListener('click', openModal);
    
    const closeModal = () => {
        els.settingsModal.style.display = 'none';
    };
    els.btnCloseSettings.addEventListener('click', closeModal);
    els.settingsModal.addEventListener('click', (e) => {
        if (e.target === els.settingsModal) closeModal();
    });
    
    // Save configurations
    els.btnSaveSettings.addEventListener('click', () => {
        const key = els.inputApiKey.value.trim();
        const model = els.selectModel.value;
        
        CONFIG.apiKey = key;
        CONFIG.model = model;
        
        localStorage.setItem('sambot_api_key', key);
        localStorage.setItem('sambot_model', model);
        
        updateConfigUI();
        closeModal();
        
        appendMessage('cocoron', `設定更新したぞ！お前と僕たちのロックンロール${key ? "AIモードを起動だ！ぶちかまそうぜ！" : "ローカルモードで始めるぞ！ついてこいよ！"}`);
    });
    
    // Reset configurations
    els.btnClearSettings.addEventListener('click', () => {
        if (confirm("APIキーと履歴をぶっ壊します！よろしいですか？")) {
            localStorage.removeItem('sambot_api_key');
            localStorage.removeItem('sambot_chat_history');
            
            CONFIG.apiKey = '';
            CONFIG.chatHistory = [];
            
            els.chatMessages.innerHTML = '';
            appendMessage('cocoron', "リセット完了だ！また新しい叫びでおしゃべりしよーぜ！");
            
            updateConfigUI();
            closeModal();
        }
    });
    
    // --- BGM Sliders Event Mappings ---
    const handleSliderChange = (e) => {
        const sliderId = e.target.id;
        const value = parseInt(e.target.value) / 100;
        
        if (sliderId === 'slider-cheer') bgmState.cheerVolume = value;
        if (sliderId === 'slider-guitar') bgmState.guitarVolume = value;
        if (sliderId === 'slider-kick') bgmState.kickVolume = value;
        
        updateVolumes();
    };
    els.sliderCheer.addEventListener('input', handleSliderChange);
    els.sliderGuitar.addEventListener('input', handleSliderChange);
    els.sliderKick.addEventListener('input', handleSliderChange);
    
    // Toggle overall Stage Sound
    els.btnToggleBgm.addEventListener('click', () => {
        initBgmAudio();
        
        if (bgmState.isPlaying) {
            stopBgm();
            els.btnToggleBgm.textContent = "STAGE START";
            els.btnToggleBgm.classList.remove('playing');
        } else {
            // Set default 30% if all sliders are at 0
            if (bgmState.cheerVolume === 0 && bgmState.guitarVolume === 0 && bgmState.kickVolume === 0) {
                bgmState.cheerVolume = 0.3;
                bgmState.guitarVolume = 0.3;
                bgmState.kickVolume = 0.3;
                els.sliderCheer.value = 30;
                els.sliderGuitar.value = 30;
                els.sliderKick.value = 30;
            }
            
            startBgm();
            els.btnToggleBgm.textContent = "STAGE STOP";
            els.btnToggleBgm.classList.add('playing');
        }
    });
}

// Window Startup
window.addEventListener('DOMContentLoaded', () => {
    // Migrate legacy models if present
    const obsoleteModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro'];
    if (obsoleteModels.includes(CONFIG.model)) {
        CONFIG.model = 'gemini-3.5-flash';
        localStorage.setItem('sambot_model', 'gemini-3.5-flash');
    }
    updateConfigUI();
    loadChatHistory();
    bindEvents();
});
