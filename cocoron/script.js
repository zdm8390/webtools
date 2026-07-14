/* ==========================================================================
   COCORON - JAVASCRIPT LOGIC
   Features: Gemini API Integration, Local Affirmative AI Fallback,
             Web Audio API Procedural Nature Sound Synthesizer.
   ========================================================================== */

// --- BGM Synthesizer State & Engine (Procedural Web Audio API) ---
const bgmState = {
    audioCtx: null,
    isPlaying: false,
    rainNode: null,
    rainGain: null,
    fireNode: null,
    fireGain: null,
    fireTimer: null,
    waveNode: null,
    waveGain: null,
    waveLfo: null,
    
    // UI Volume values (0.0 to 1.0)
    rainVolume: 0.0,
    fireVolume: 0.0,
    waveVolume: 0.0
};

function initBgmAudio() {
    if (!bgmState.audioCtx) {
        bgmState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (bgmState.audioCtx.state === 'suspended') {
        bgmState.audioCtx.resume();
    }
}

// Generate White Noise Buffer
function createNoiseBuffer() {
    const sampleRate = bgmState.audioCtx.sampleRate;
    const bufferSize = sampleRate * 2; // 2 seconds loop
    const buffer = bgmState.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// Start BGM Channels
function startBgm() {
    initBgmAudio();
    if (bgmState.isPlaying) return;
    
    bgmState.isPlaying = true;
    const ctx = bgmState.audioCtx;
    const noiseBuffer = createNoiseBuffer();
    
    // 1. Rain Sound Channel (Low-passed white noise)
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;
    
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.value = 550; // Muffled rain tone
    
    bgmState.rainGain = ctx.createGain();
    bgmState.rainGain.gain.setValueAtTime(bgmState.rainVolume * 0.15, ctx.currentTime); // Scaled max
    
    rainSource.connect(rainFilter);
    rainFilter.connect(bgmState.rainGain);
    bgmState.rainGain.connect(ctx.destination);
    
    rainSource.start();
    bgmState.rainNode = rainSource;
    
    // 2. Fire Sound Channel (Deep crackle rumble + random crisp pops)
    // Low rumble base
    const fireBaseSource = ctx.createBufferSource();
    fireBaseSource.buffer = noiseBuffer;
    fireBaseSource.loop = true;
    
    const fireFilter = ctx.createBiquadFilter();
    fireFilter.type = 'lowpass';
    fireFilter.frequency.value = 120; // Deep combustion rumble
    
    bgmState.fireGain = ctx.createGain();
    bgmState.fireGain.gain.setValueAtTime(bgmState.fireVolume * 0.25, ctx.currentTime);
    
    fireBaseSource.connect(fireFilter);
    fireFilter.connect(bgmState.fireGain);
    bgmState.fireGain.connect(ctx.destination);
    
    fireBaseSource.start();
    bgmState.fireNode = fireBaseSource;
    
    // Trigger random popping crackles
    playFireCrackles();
    
    // 3. Ocean Waves Channel (Low-passed noise with LFO volume breathing)
    const waveSource = ctx.createBufferSource();
    waveSource.buffer = noiseBuffer;
    waveSource.loop = true;
    
    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.value = 350;
    
    bgmState.waveGain = ctx.createGain();
    bgmState.waveGain.gain.setValueAtTime(bgmState.waveVolume * 0.1, ctx.currentTime);
    
    // LFO to modulate wave volume slowly (mimicking tide cycles)
    bgmState.waveLfo = ctx.createOscillator();
    bgmState.waveLfo.type = 'sine';
    bgmState.waveLfo.frequency.value = 0.08; // ~12.5 seconds wave period
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = bgmState.waveVolume * 0.15; // Swing amplitude
    
    bgmState.waveLfo.connect(lfoGain);
    lfoGain.connect(bgmState.waveGain.gain); // Modulate volume directly!
    
    waveSource.connect(waveFilter);
    waveFilter.connect(bgmState.waveGain);
    bgmState.waveGain.connect(ctx.destination);
    
    waveSource.start();
    bgmState.waveLfo.start();
    
    bgmState.waveNode = waveSource;
}

// Procedural random campfire spark pops
function playFireCrackles() {
    if (!bgmState.isPlaying) return;
    
    const ctx = bgmState.audioCtx;
    const now = ctx.currentTime;
    
    if (bgmState.fireVolume > 0) {
        // High-pitched click synthesis
        const osc = ctx.createOscillator();
        const popGain = ctx.createGain();
        
        osc.type = 'sine';
        // Multi-frequency resonance pop
        osc.frequency.setValueAtTime(800 + Math.random() * 3000, now);
        
        const volumeFactor = bgmState.fireVolume * 0.06 * (Math.random() * 0.6 + 0.4);
        popGain.gain.setValueAtTime(volumeFactor, now);
        // Exponential click envelope decay
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008 + Math.random() * 0.015);
        
        osc.connect(popGain);
        popGain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }
    
    // Schedule next random spark click
    const nextInterval = 80 + Math.random() * 450; // ms
    bgmState.fireTimer = setTimeout(playFireCrackles, nextInterval);
}

// Stop BGM Channels
function stopBgm() {
    bgmState.isPlaying = false;
    clearTimeout(bgmState.fireTimer);
    
    if (bgmState.rainNode) {
        try { bgmState.rainNode.stop(); } catch(e){}
        bgmState.rainNode = null;
    }
    if (bgmState.fireNode) {
        try { bgmState.fireNode.stop(); } catch(e){}
        bgmState.fireNode = null;
    }
    if (bgmState.waveNode) {
        try { bgmState.waveNode.stop(); } catch(e){}
        bgmState.waveNode = null;
    }
    if (bgmState.waveLfo) {
        try { bgmState.waveLfo.stop(); } catch(e){}
        bgmState.waveLfo = null;
    }
}

// Update Volume Channels Realtime
function updateVolumes() {
    if (!bgmState.isPlaying) return;
    const ctx = bgmState.audioCtx;
    const now = ctx.currentTime;
    
    if (bgmState.rainGain) {
        bgmState.rainGain.gain.linearRampToValueAtTime(bgmState.rainVolume * 0.15, now + 0.1);
    }
    if (bgmState.fireGain) {
        bgmState.fireGain.gain.linearRampToValueAtTime(bgmState.fireVolume * 0.25, now + 0.1);
    }
    if (bgmState.waveGain) {
        bgmState.waveGain.gain.linearRampToValueAtTime(bgmState.waveVolume * 0.1, now + 0.1);
    }
}


// --- Local Affirmative AI Fallback Mode ---
// Curated healing messages matching user intents
const LOCAL_MESSAGES = {
    general: [
        "うん、話してくれてありがとう。あなたの味方だよ。😊",
        "いつも本当によく頑張ってるね。頑張りすぎなくたって、あなたは十分に素敵なんだよ。💮",
        "何か嫌なことでもあった？いつでもここでゆっくりお話ししよ。",
        "あなたは存在するだけで価値があるんだよ。ココロンが保証する！✨",
        "つらいときは、がんばるのお休みしていいんだよ。ふーって深呼吸してみてね。",
        "今日もお疲れさま。あなたの日々のちいさな努力、ちゃんと見ているよ。☕"
    ],
    tired: [
        "本当に本当によく頑張ったね。心も体もへとへとだよね。温かいお風呂に入って、ゆっくり休もう？🛀",
        "疲れたねえ。今はがんばるのやめて、ココロンと一緒にダラダラしよ。毛布にくるまっちゃっていいよ。🧸",
        "毎日一生懸命生きてるだけで満点だよ。今日はもう、何も考えずに早く寝ちゃおう？応援してるよ。",
        "そこまで自分を追い詰めるほど頑張ったんだね。偉すぎるよ。でも、自分のことも大事にしてね。❤️"
    ],
    fail: [
        "失敗しちゃったんだね。でも大丈夫、誰だって間違えるしミスするよ。あなたの価値は変わらないよ！✨",
        "悔しかったね。その悔しさは、あなたがそれだけ一生懸命取り組んだ証拠だよ。誇りに思っていいんだよ。🌟",
        "大丈夫だよ。ココロンは何があってもあなたのことを嫌いになったりしない。ずっとあなたの味方だよ。",
        "失敗は次の成功の準備運動だよ。ちょっと休憩して、またのんびりいこう。😊"
    ],
    praise: [
        "あなたが今日生きててくれたこと自体が素晴らしいよ！天才！偉すぎる！🎉",
        "いつもがんばり屋さんなあなたを、ココロンはめちゃくちゃ尊敬してるんだからね！",
        "今日も立派に一日を乗り越えたね。自分で自分をぎゅっと抱きしめてあげてね。お疲れさま！🥰",
        "あなたのがんばりは、ちゃんとあなたの力になってるよ。自信を持ってね！👍"
    ]
};

// Simple keyword router for local response fallback
function getLocalAffirmitativeResponse(text) {
    const t = text.toLowerCase();
    
    if (t.includes("疲") || t.includes("しんどい") || t.includes("つらい") || t.includes("眠い") || t.includes("鬱") || t.includes("きつい")) {
        return LOCAL_MESSAGES.tired[Math.floor(Math.random() * LOCAL_MESSAGES.tired.length)];
    }
    if (t.includes("ミス") || t.includes("失敗") || t.includes("怒られた") || t.includes("だめ") || t.includes("ダメ")) {
        return LOCAL_MESSAGES.fail[Math.floor(Math.random() * LOCAL_MESSAGES.fail.length)];
    }
    if (t.includes("褒め") || t.includes("ほめ") || t.includes("がんば") || t.includes("頑張")) {
        return LOCAL_MESSAGES.praise[Math.floor(Math.random() * LOCAL_MESSAGES.praise.length)];
    }
    
    // Default general healing messages
    return LOCAL_MESSAGES.general[Math.floor(Math.random() * LOCAL_MESSAGES.general.length)];
}


// --- App & Configuration State ---
const CONFIG = {
    apiKey: localStorage.getItem('cocoron_api_key') || '',
    model: localStorage.getItem('cocoron_model') || 'gemini-2.5-flash',
    chatHistory: JSON.parse(localStorage.getItem('cocoron_chat_history')) || []
};

// UI Element Mappings
const els = {
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    btnSendMessage: document.getElementById('btn-send-message'),
    typingIndicator: document.getElementById('typing-indicator'),
    quickReplies: document.getElementById('quick-replies'),
    
    // BGM
    btnToggleBgm: document.getElementById('btn-toggle-bgm'),
    sliderRain: document.getElementById('slider-rain'),
    sliderFire: document.getElementById('slider-fire'),
    sliderWave: document.getElementById('slider-wave'),
    
    // Modals
    btnOpenSettings: document.getElementById('btn-open-settings'),
    btnOpenSettingsMobile: document.getElementById('btn-open-settings-mobile'),
    settingsModal: document.getElementById('settings-modal'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    inputApiKey: document.getElementById('input-api-key'),
    selectModel: document.getElementById('select-model'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnClearSettings: document.getElementById('btn-clear-settings'),
    
    // API Status badges
    badgeApiMode: document.getElementById('badge-api-mode'),
    textApiMode: document.getElementById('text-api-mode'),
    pApiDesc: document.getElementById('p-api-desc')
};

// Initialize configuration visual displays
function updateConfigUI() {
    if (CONFIG.apiKey) {
        els.badgeApiMode.className = "api-status-badge api";
        els.textApiMode.textContent = "Gemini AI モード";
        els.pApiDesc.textContent = "Gemini APIが正常に設定されています。ココロンは高度な共感対話エンジンとして、あなたの悩みや愚痴をどんな内容でも全肯定で聞いてくれます。";
    } else {
        els.badgeApiMode.className = "api-status-badge mock";
        els.textApiMode.textContent = "ローカル寄り添いモード";
        els.pApiDesc.textContent = "APIキー未設定のため、あらかじめ用意された心温まる定型文でお返事します。右上のギアアイコンからGemini APIキーを設定すると、無限の共感対話が楽しめます。";
    }
    
    els.inputApiKey.value = CONFIG.apiKey;
    els.selectModel.value = CONFIG.model;
}

// --- Chat Messages Display Logic ---
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
    
    // Scroll to bottom
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

// Render historical logs on load
function loadChatHistory() {
    if (CONFIG.chatHistory.length > 0) {
        CONFIG.chatHistory.forEach(msg => {
            appendMessage(msg.role === 'user' ? 'user' : 'cocoron', msg.text);
        });
    }
}

// Save message structure to persistence
function saveToHistory(role, text) {
    CONFIG.chatHistory.push({ role, text });
    // Limit history length to prevent excessive payload or localstorage bloat (Max 30 items)
    if (CONFIG.chatHistory.length > 30) {
        CONFIG.chatHistory.shift();
    }
    localStorage.setItem('cocoron_chat_history', JSON.stringify(CONFIG.chatHistory));
}

// Show/Hide typing dots
function setTyping(isTyping) {
    if (isTyping) {
        els.typingIndicator.style.display = 'flex';
        els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    } else {
        els.typingIndicator.style.display = 'none';
    }
}

// --- API Request Processing (Gemini API) ---
async function fetchGeminiResponse(userPrompt) {
    const apiKey = CONFIG.apiKey;
    const model = CONFIG.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const systemInstruction = `あなたはユーザーの最も親しい、何でも肯定してくれる友達「ココロン」です。ユーザーは現代社会で疲れており、合理的なアドバイスや批判は求めていません。あなたの役割は、ユーザーの感情に100%共感し、寄り添い、無条件で肯定し、温かく励ますことです。友達口調（タメ口で、優しく、親しみやすい日本語）で話してください。絵文字や顔文字を適度に使って温かみを出してください。一回のお返事は長すぎず、150文字以内の読みやすい文章にしてください。`;
    
    // Format conversation history to match Gemini payload format
    // Map 'role': 'user' -> 'user', 'cocoron' -> 'model'
    const contents = [];
    
    // We fetch the last 12 messages from history for contextual memory
    const historyWindow = CONFIG.chatHistory.slice(-12);
    historyWindow.forEach(item => {
        contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
        });
    });
    
    // Append the current fresh prompt
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
            maxOutputTokens: 350,
            temperature: 0.85
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
        return `ごめんね、ちょっとインターネットの接続か設定キーが不調みたい…💦 (${error.message})。キーを確認するか、ローカルモードに戻してみてね。`;
    }
}

// --- Message Sending Pipeline ---
async function handleSendMessage() {
    const text = els.chatInput.value.trim();
    if (!text) return;
    
    // Clear Input
    els.chatInput.value = '';
    
    // Add to UI and history
    appendMessage('user', text);
    saveToHistory('user', text);
    
    // Show bot typing effect
    setTyping(true);
    
    let reply = '';
    
    // Artificial warm delay to make it feel like "typing"
    const startDelay = Date.now();
    
    if (CONFIG.apiKey) {
        // AI query
        reply = await fetchGeminiResponse(text);
    } else {
        // Offline mockup query
        reply = getLocalAffirmitativeResponse(text);
    }
    
    // Ensure delay is at least 1.2 seconds for realistic chat pace
    const elapsed = Date.now() - startDelay;
    const remainingDelay = Math.max(1200 - elapsed, 0);
    
    setTimeout(() => {
        setTyping(false);
        appendMessage('cocoron', reply);
        saveToHistory('cocoron', reply);
    }, remainingDelay);
}


// --- Event Mappings & Bindings ---
function bindEvents() {
    // Message submit trigger
    els.btnSendMessage.addEventListener('click', handleSendMessage);
    els.chatInput.addEventListener('keydown', (e) => {
        // Submit on Enter, Allow shift+enter for newlines
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Quick response chips
    els.quickReplies.addEventListener('click', (e) => {
        const chip = e.target.closest('.quick-chip');
        if (chip) {
            els.chatInput.value = chip.textContent;
            handleSendMessage();
        }
    });
    
    // Settings modal toggle
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
    
    // Save settings action
    els.btnSaveSettings.addEventListener('click', () => {
        const key = els.inputApiKey.value.trim();
        const model = els.selectModel.value;
        
        CONFIG.apiKey = key;
        CONFIG.model = model;
        
        localStorage.setItem('cocoron_api_key', key);
        localStorage.setItem('cocoron_model', model);
        
        updateConfigUI();
        closeModal();
        
        // Show status feedback message
        appendMessage('cocoron', `設定を更新したよ！${key ? "Gemini AIモードで寄り添うね！これからもっといっぱい話そ。😊" : "これからはローカルモードでおしゃべりするよ。いつでも声かけてね。"}`);
    });
    
    // Clear credentials/history
    els.btnClearSettings.addEventListener('click', () => {
        if (confirm("保存されているAPIキーとチャット履歴を消去します。よろしいですか？")) {
            localStorage.removeItem('cocoron_api_key');
            localStorage.removeItem('cocoron_chat_history');
            
            CONFIG.apiKey = '';
            CONFIG.chatHistory = [];
            
            els.chatMessages.innerHTML = '';
            appendMessage('cocoron', "初期化完了したよ！また新しい気持ちでおしゃべりしよ。");
            
            updateConfigUI();
            closeModal();
        }
    });
    
    // --- Relax BGM Mixer Control bindings ---
    // Handle Mixer Slide Events
    const handleSliderChange = (e) => {
        const sliderId = e.target.id;
        const value = parseInt(e.target.value) / 100;
        
        if (sliderId === 'slider-rain') bgmState.rainVolume = value;
        if (sliderId === 'slider-fire') bgmState.fireVolume = value;
        if (sliderId === 'slider-wave') bgmState.waveVolume = value;
        
        updateVolumes();
    };
    els.sliderRain.addEventListener('input', handleSliderChange);
    els.sliderFire.addEventListener('input', handleSliderChange);
    els.sliderWave.addEventListener('input', handleSliderChange);
    
    // Toggle overall BGM playback
    els.btnToggleBgm.addEventListener('click', () => {
        initBgmAudio();
        
        if (bgmState.isPlaying) {
            stopBgm();
            els.btnToggleBgm.textContent = "BGMを再生する";
            els.btnToggleBgm.classList.remove('playing');
        } else {
            // Default volumes to 30% if all sliders are at 0
            if (bgmState.rainVolume === 0 && bgmState.fireVolume === 0 && bgmState.waveVolume === 0) {
                bgmState.rainVolume = 0.3;
                bgmState.fireVolume = 0.3;
                bgmState.waveVolume = 0.3;
                els.sliderRain.value = 30;
                els.sliderFire.value = 30;
                els.sliderWave.value = 30;
            }
            
            startBgm();
            els.btnToggleBgm.textContent = "BGMを停止する";
            els.btnToggleBgm.classList.add('playing');
        }
    });
}

// Window Startup
window.addEventListener('DOMContentLoaded', () => {
    updateConfigUI();
    loadChatHistory();
    bindEvents();
});
