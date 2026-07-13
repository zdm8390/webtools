import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Key,
  AlertTriangle,
  Volume2,
  Activity,
  RotateCcw,
  Send,
  Terminal,
  Settings,
  ShieldAlert,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Info,
  HelpCircle,
  CheckCircle2,
  Cpu,
  Sun,
  Moon
} from 'lucide-react';

// Web Speech API Types
const SpeechRecognition =
  typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

interface TranscriptItem {
  id: string;
  timestamp: Date;
  text: string;
  isFinal: boolean;
}

interface AnalysisRecord {
  timestamp: Date;
  score: number;
  texts: string[];
}

// Translations dictionary
const translations = {
  ja: {
    title: "Chime-Out Radar",
    subtitle: "オンライン会議不穏空気検知システム",
    micStatus: "マイク",
    aiStatus: "AI分析",
    levelStatus: "不穏状況",
    listening: "集音中",
    off: "停止",
    analyzing: "分析中",
    idle: "待機",
    hostile: "不穏検知",
    secure: "安全",
    controlBoard: "システム制御盤",
    apiKeyLabel: "Gemini API キー",
    apiSafetyNotice: "※ APIキーはブラウザの LocalStorage にのみ暗号的に保存されます。開発者や第三者の外部サーバーにアップロード・転送されることは一切ありませんのでご安心ください。",
    getApiKey: "APIキーの無料取得手順はこちら",
    saveKey: "キーを保存",
    saved: "保存完了",
    modelSelectLabel: "使用するAIモデル",
    atmosphereMonitoring: "空気監視コントロール",
    startMonitoring: "空気監視を開始",
    stopMonitoring: "空気監視を停止",
    simulator: "不穏度シミュレーター",
    atmosphereValue: "不穏度シミュレーション値",
    stableButton: "良好 (15%)",
    tenseButton: "緊張 (55%)",
    crisisButton: "険悪 (85%)",
    loadPeacefulDemo: "💬 平和な会話を注入",
    loadAngryDemo: "🔥 険悪な会話を注入",
    testGong: "警告音（鐘）をテスト再生",
    resetAll: "全データをリセット",
    gaugeTitle: "空気の不穏度メーター",
    updateLoop: "18秒間隔で自動判定",
    statusTitle: "空気の評価ステータス",
    dialogueTimeline: "会話ログのタイムライン",
    bufferInfo: "直近30秒 / 最新5発言",
    timelineEmpty: "-- 会話はまだ記録されていません --",
    timelineEmptyDesc: "集音を開始するか、デモ会話ログを挿入して空気判定を開始してください。",
    nowSpeaking: "集音中...",
    interim: "集音データ",
    final: "確定値",
    placeholderManual: "テキストを直接入力して会話に追加...",
    scanLog: "不穏度判定の履歴",
    noScanLog: "判定履歴はありません。",
    systemLog: "システムログ",
    tabDashboard: "レーダー画面",
    tabGuide: "無料APIキー取得ガイド",
    enterKeyPrompt: "空気分析を開始するには、まず左側でGemini APIキーを設定してください。",
    deviceNotSupported: "お使いのブラウザは音声認識に対応していません。Google ChromeまたはMicrosoft Edgeを使用してください。",
    simulatedText: "(シミュレーターによる設定値)",
    injectLabel: "モック対話の注入シミュレート",
    aiErrorOccurred: "AI解析エラーが発生しました",
    themeToggleLabel: "テーマ切り替え"
  },
  en: {
    title: "Chime-Out Radar",
    subtitle: "Atmosphere & Tension Detector",
    micStatus: "Mic",
    aiStatus: "AI",
    levelStatus: "Level",
    listening: "Listening",
    off: "Off",
    analyzing: "Analyzing",
    idle: "Idle",
    hostile: "Hostile",
    secure: "Secure",
    controlBoard: "System Control Board",
    apiKeyLabel: "Gemini API Key",
    apiSafetyNotice: "* Your API Key is stored securely in your local browser LocalStorage. It is never uploaded or transmitted to the developer's server or any third-party websites.",
    getApiKey: "Get Gemini API Key (Free Guide)",
    saveKey: "Save Key",
    saved: "Saved",
    modelSelectLabel: "AI Model to Use",
    atmosphereMonitoring: "Atmosphere Monitoring",
    startMonitoring: "Start Monitoring",
    stopMonitoring: "Stop Monitoring",
    simulator: "Atmosphere Simulator",
    atmosphereValue: "Atmosphere Value",
    stableButton: "Stable (15%)",
    tenseButton: "Tense (55%)",
    crisisButton: "Crisis (85%)",
    loadPeacefulDemo: "💬 Load Peaceful Demo",
    loadAngryDemo: "🔥 Load Angry Demo",
    testGong: "Test Gong Sound",
    resetAll: "Reset All",
    gaugeTitle: "Atmosphere Scanner Gauge",
    updateLoop: "18s Update Loop",
    statusTitle: "ATMOSPHERE STATUS",
    dialogueTimeline: "Dialogue Timeline",
    bufferInfo: "Buffer (30s / last 5)",
    timelineEmpty: "-- TIMELINE IS EMPTY --",
    timelineEmptyDesc: "Start monitoring or load a demo dialogue to begin tracking tension.",
    nowSpeaking: "Now speaking...",
    interim: "Interim",
    final: "Final",
    placeholderManual: "Type manual speech text...",
    scanLog: "Atmosphere Scan Log (History)",
    noScanLog: "No evaluations recorded yet.",
    systemLog: "System Operations Logs",
    tabDashboard: "Radar Dashboard",
    tabGuide: "API Key Guide (Free)",
    enterKeyPrompt: "Please configure your Gemini API Key in the left panel to start analyzing atmosphere.",
    deviceNotSupported: "Your browser does not support Speech Recognition. Please use Chrome or Edge.",
    simulatedText: "(Simulated evaluation values)",
    injectLabel: "Inject Dialogue Snippets",
    aiErrorOccurred: "AI Analysis Error Occurred",
    themeToggleLabel: "Toggle Theme"
  }
};

export default function App() {
  // --- State Variables ---
  const [lang, setLang] = useState<'ja' | 'en'>('ja'); // Default to Japanese
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_preference') === 'light';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guide'>('dashboard');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('gemini_model_name') || 'gemini-2.5-flash';
  });
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [tensionLevel, setTensionLevel] = useState<number>(0);
  const [lastTensionLevel, setLastTensionLevel] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState<string>('');
  const [apiSaveSuccess, setApiSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [friendlyApiError, setFriendlyApiError] = useState<string | null>(null);

  // --- Refs ---
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(isListening);
  const apiKeyRef = useRef<string>(apiKey);
  const selectedModelRef = useRef<string>(selectedModel);
  const transcriptsRef = useRef<TranscriptItem[]>(transcripts);
  const lastTensionLevelRef = useRef<number>(lastTensionLevel);
  const logEndRef = useRef<HTMLDivElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Sync refs to avoid stale state in callbacks
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  useEffect(() => {
    lastTensionLevelRef.current = lastTensionLevel;
  }, [lastTensionLevel]);

  // Sync theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme_preference', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  // Autoscroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, interimTranscript]);

  // Initialize System Logs
  useEffect(() => {
    addSystemLog('Atmospheric Radar v1.0 initialized.');
    if (!SpeechRecognition) {
      addSystemLog('Error: Web Speech API (SpeechRecognition) is not supported in this browser.');
    } else {
      addSystemLog('Speech Recognition engine ready.');
    }
  }, []);

  const t = translations[lang];

  // --- Audio Engine (Web Audio API Synthesized Gong) ---
  const playGong = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.05); // Attack
      masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5); // 3.5 seconds decay

      // Ominous bell tones (low frequencies detuned for dissonance)
      const frequencies = [110, 155, 220, 310, 440];
      const waveforms: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'sine', 'triangle'];
      const relativeGains = [0.6, 0.35, 0.1, 0.15, 0.08];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = waveforms[i];
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        // Add frequency detuning for a wider, heavier chorus effect
        osc.detune.setValueAtTime(i % 2 === 0 ? 8 : -8, ctx.currentTime);

        gainNode.gain.setValueAtTime(relativeGains[i], ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (3.0 - i * 0.4));

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start();
        osc.stop(ctx.currentTime + 3.5);
      });

      // Shimmer chime accent (high pitch metallic chime)
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 note
      chimeGain.gain.setValueAtTime(0.18, ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(masterGain);

      chimeOsc.start();
      chimeOsc.stop(ctx.currentTime + 2.0);

      addSystemLog('🔊 Ominous alert sound played.');
    } catch (e: any) {
      console.error('Audio synthesizer error:', e);
      addSystemLog(`Audio error: ${e.message}`);
    }
  };

  // Helper to log system events
  const addSystemLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSystemLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  // --- API Key Management ---
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setApiSaveSuccess(true);
    addSystemLog('API Key updated in LocalStorage.');
    setError(null);
    setFriendlyApiError(null);
    setTimeout(() => setApiSaveSuccess(false), 2000);
  };

  // --- Model Selection Management ---
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedModel(val);
    localStorage.setItem('gemini_model_name', val);
    addSystemLog(`AI model updated to: ${val}`);
    setFriendlyApiError(null);
  };

  // --- Speech Recognition Logic ---
  const startMonitoring = () => {
    if (!SpeechRecognition) {
      setError(t.deviceNotSupported);
      return;
    }
    if (!apiKey.trim()) {
      setError(t.enterKeyPrompt);
      return;
    }

    setError(null);
    setIsListening(true);
    addSystemLog('Starting Speech Recognition monitoring...');

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ja-JP';

      recognition.onstart = () => {
        addSystemLog('Speech Recognition active. Listening for Japanese speech...');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        const newFinals: TranscriptItem[] = [];

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            if (text.trim()) {
              newFinals.push({
                id: Math.random().toString(36).substring(2, 9),
                timestamp: new Date(),
                text: text.trim(),
                isFinal: true
              });
            }
          } else {
            interim += text;
          }
        }

        if (newFinals.length > 0) {
          setTranscripts((prev) => [...prev, ...newFinals]);
          setInterimTranscript('');
          addSystemLog(`Recognized speech: "${newFinals[newFinals.length - 1].text}"`);
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Enable microphone access in browser settings.');
          setIsListening(false);
          addSystemLog('Error: Microphone permission denied.');
        } else {
          addSystemLog(`Speech recognition warning/error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if isListening is still active
        if (isListeningRef.current) {
          addSystemLog('Restarting speech recognition instance...');
          try {
            recognitionRef.current?.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
          }
        } else {
          addSystemLog('Speech Recognition stopped.');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setError(`Engine setup failed: ${e.message}`);
      setIsListening(false);
    }
  };

  const stopMonitoring = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error calling stop:', err);
      }
    }
    setInterimTranscript('');
    addSystemLog('Stopping monitoring...');
  };

  // --- Friendly API Error Helper ---
  const getFriendlyErrorMessage = (rawError: string): string => {
    const lower = rawError.toLowerCase();
    if (lower.includes('not found') || lower.includes('models/')) {
      return lang === 'ja'
        ? '【モデルエラー】指定されたAIモデル（gemini-1.5-flashなど）は提供終了またはサポートされていません。左側の設定で「gemini-2.5-flash」等の現在有効なモデルに変更してください。'
        : '【Model Error】The selected AI model is deprecated or not found. Please switch to a currently supported model like "gemini-2.5-flash" in the left panel.';
    }
    if (lower.includes('api key') || lower.includes('key') || lower.includes('invalid') || lower.includes('api_key_invalid')) {
      return lang === 'ja'
        ? '【認証エラー】APIキーが無効または間違っています。入力したキーが正しいか確認するか、「無料APIキー取得ガイド」を参考に新しいキーを再取得してください。'
        : '【Auth Error】Invalid API Key. Please make sure the key is correct or grab a new one from the Guide tab.';
    }
    if (lower.includes('quota') || lower.includes('limit') || lower.includes('429') || lower.includes('resource exhausted')) {
      return lang === 'ja'
        ? '【利用制限】APIの無料利用枠の上限に達したか、短時間のリクエスト制限を超えました。しばらく待つか、別のAPIキーを試してください。'
        : '【Quota Limit】API rate limit or quota exceeded. Please wait a minute before requesting again.';
    }
    return lang === 'ja'
      ? `【API通信エラー】${rawError}。キー設定やネットワーク、選択したモデルが正しいか確認してください。`
      : `【API Error】${rawError}. Please verify your key, model, and internet connection.`;
  };

  // --- Atmosphere Analysis (Gemini API) ---
  const getTranscriptBuffer = () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

    // Get transcripts from the last 30 seconds
    const last30s = transcriptsRef.current.filter((t) => t.timestamp >= thirtySecondsAgo);

    // If we have transcripts in the last 30 seconds, use them.
    // Otherwise, fallback to the last 5 transcripts.
    if (last30s.length > 0) {
      return last30s;
    } else {
      return transcriptsRef.current.slice(-5);
    }
  };

  const analyzeAtmosphere = async () => {
    const key = apiKeyRef.current;
    if (!key.trim()) {
      addSystemLog('Analysis Error: Gemini API key not configured.');
      return;
    }

    const buffer = getTranscriptBuffer();
    if (buffer.length === 0) {
      addSystemLog('Analysis Skipped: No speech detected in the buffer.');
      return;
    }

    const modelName = selectedModelRef.current;
    setIsAnalyzing(true);
    addSystemLog(`Atmosphere Scan: Sending buffer to Gemini (${modelName})...`);

    // Format transcripts
    const bufferText = buffer
      .map((t) => {
        const timeStr = t.timestamp.toLocaleTimeString();
        return `[${timeStr}] ${t.text}`;
      })
      .join('\n');

    const prompt = `以下の会議の発言ログを分析し、場の空気の『不穏さ・ピリつき度・険悪さ』を0から 100 の数値だけで評価してください。余計な解説、挨拶、文字は一切出力せず、必ず半角数字（例: 75）のみを返してください。

■ 発言ログ：
${bufferText}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = rawText.trim().match(/\d+/);

      if (match) {
        const score = parseInt(match[0], 10);
        const normalizedScore = Math.min(Math.max(score, 0), 100);

        const prevLevel = lastTensionLevelRef.current;

        // Set state
        setTensionLevel(normalizedScore);
        setLastTensionLevel(normalizedScore);
        setFriendlyApiError(null); // Clear errors on success

        // Add to history
        setAnalysisHistory((prev) => [
          {
            timestamp: new Date(),
            score: normalizedScore,
            texts: buffer.map((b) => b.text)
          },
          ...prev.slice(0, 19)
        ]);

        addSystemLog(`Scan Result: Tension Score = ${normalizedScore}%`);

        // Trigger alert sound if crossing threshold
        if (normalizedScore >= 70 && prevLevel < 70) {
          playGong();
          addSystemLog('⚠️ Atmosphere threshold exceeded! Triggered Warning Sound.');
        }
      } else {
        throw new Error(`API response could not be parsed as a number: "${rawText}"`);
      }
    } catch (err: any) {
      console.error('Gemini API call failed:', err);
      const friendlyMsg = getFriendlyErrorMessage(err.message || String(err));
      setFriendlyApiError(friendlyMsg);
      addSystemLog(`Scan Error: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Timer loop for Analysis: runs every 18 seconds (15-20s interval)
  useEffect(() => {
    let intervalId: any = null;
    if (isListening) {
      // Analyze immediately on start (if transcripts exist) or wait 18 seconds
      intervalId = setInterval(() => {
        analyzeAtmosphere();
      }, 18000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isListening]);

  // --- Manual Text Addition ---
  const handleAddManualSpeech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const newItem: TranscriptItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      text: manualInput.trim(),
      isFinal: true
    };

    setTranscripts((prev) => [...prev, newItem]);
    addSystemLog(`Manual Input added: "${manualInput.trim()}"`);
    setManualInput('');
  };

  // --- Demos & Simulations ---
  const triggerSimulation = (score: number) => {
    const prev = lastTensionLevelRef.current;
    setTensionLevel(score);
    setLastTensionLevel(score);
    setFriendlyApiError(null); // Clear errors on simulation
    setAnalysisHistory((prevHist) => [
      {
        timestamp: new Date(),
        score: score,
        texts: [t.simulatedText]
      },
      ...prevHist.slice(0, 19)
    ]);
    addSystemLog(`Simulated Atmosphere Score: ${score}%`);

    if (score >= 70 && prev < 70) {
      playGong();
    }
  };

  const loadDemoDialogue = (type: 'chill' | 'tense') => {
    const now = new Date();
    const demoItems: { text: string; delayOffset: number }[] =
      type === 'tense'
        ? [
            { text: 'ちょっと進捗遅れすぎじゃないですか？', delayOffset: 25000 },
            { text: 'そもそも仕様の合意取れてないですよね。', delayOffset: 20000 },
            { text: 'それはあなたの確認不足だと思うんですが。', delayOffset: 15000 },
            { text: 'だから言ったじゃないですか！後から言われても困ります。', delayOffset: 10000 },
            { text: 'もういいです。この件は上に報告して相談します。', delayOffset: 5000 }
          ]
        : [
            { text: '本日のミーティングを開始します。よろしくお願いします！', delayOffset: 25000 },
            { text: '先日のデモ、クライアントに大変好評でした！', delayOffset: 20000 },
            { text: 'みなさんのおかげですね。本当にありがとうございます！', delayOffset: 15000 },
            { text: '今回のリファクタリング、コードが凄く綺麗になりましたね。', delayOffset: 10000 },
            { text: 'いい感じですね！この調子で進めていきましょう！', delayOffset: 5000 }
          ];

    const currentT = [...transcripts];
    demoItems.forEach((d) => {
      currentT.push({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(now.getTime() - d.delayOffset),
        text: d.text,
        isFinal: true
      });
    });

    setTranscripts(currentT);
    addSystemLog(`Loaded ${type === 'tense' ? 'Tense (不穏)' : 'Chill (良好)'} demo dialogue into buffer.`);
  };

  const clearLogsAndTranscripts = () => {
    setTranscripts([]);
    setInterimTranscript('');
    setAnalysisHistory([]);
    setTensionLevel(0);
    setLastTensionLevel(0);
    setSystemLogs([]);
    setFriendlyApiError(null);
    addSystemLog('Logs and speech buffers cleared.');
  };

  // --- UI Helpers ---
  const getAtmosphereTheme = (val: number) => {
    if (val >= 70) {
      return {
        color: 'text-cyber-red',
        borderColor: 'border-glow-red',
        bgGlow: 'bg-red-500/10',
        label: lang === 'ja' ? 'CRITICAL (険悪)' : 'CRITICAL',
        textColor: 'text-red-500',
        barColor: 'bg-cyber-red',
        commentary: lang === 'ja'
          ? '⚠️ 険悪な空気を検知。発言者の声調・単語のトゲが強まっています。防音装備または撤退を推奨。'
          : '⚠️ Ominous tension detected. Sarcasm or defensive tones are elevated. Suggest stepping away or applying caution.'
      };
    } else if (val >= 40) {
      return {
        color: 'text-cyber-pink animate-pulse',
        borderColor: 'border-glow-pink',
        bgGlow: 'bg-pink-500/10',
        label: lang === 'ja' ? 'TENSE (緊張)' : 'TENSE / ELEVATED',
        textColor: 'text-pink-400',
        barColor: 'bg-cyber-pink',
        commentary: lang === 'ja'
          ? '⚡ 微妙なピリつき、または沈黙が発生している可能性があります。慎重に言葉を選んでください。'
          : '⚡ Subtle awkwardness or long silences detected. Choose your words carefully.'
      };
    } else {
      return {
        color: 'text-cyber-cyan',
        borderColor: 'border-glow-cyan',
        bgGlow: 'bg-cyan-500/10',
        label: lang === 'ja' ? 'STABLE (良好)' : 'STABLE / CHILL',
        textColor: 'text-cyan-400',
        barColor: 'bg-cyber-cyan',
        commentary: lang === 'ja'
          ? '🟢 場の空気は極めて平穏です。ユーモアや軽い雑談も受け入れられるコンディションです。'
          : '🟢 Air pressure nominal. Conversation is going smoothly. Good time for jokes.'
      };
    }
  };

  const currentTheme = getAtmosphereTheme(tensionLevel);

  // Circular Gauge Calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (tensionLevel / 100) * circumference;

  return (
    <div className={`min-h-screen w-full relative flex flex-col p-4 md:p-6 transition-colors duration-500 select-none ${
      isLightMode ? 'light-cyber-grid bg-[#f5f6fa] text-slate-800' : 'cyber-grid bg-[#0d0e12] text-gray-100'
    } cyber-scanline`}>
      
      {/* Full screen ominous flashing overlay if tension >= 70 */}
      {tensionLevel >= 70 && (
        <div className="fixed inset-0 pointer-events-none z-50 animate-warning-flash" />
      )}

      {/* Top Header */}
      <header className={`w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between border-b pb-4 mb-6 transition-colors ${
        isLightMode ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <ShieldAlert className="w-8 h-8 text-cyber-purple glow-purple" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 font-sans uppercase">
              {t.title}
            </h1>
            <p className={`text-xs font-mono transition-colors ${isLightMode ? 'text-slate-500' : 'text-gray-500'}`}>{t.subtitle}</p>
          </div>
        </div>

        {/* Navigation, Theme & Language Select */}
        <div className="flex flex-wrap gap-3 items-center justify-end">
          {/* Subpage Tabs */}
          <div className={`flex space-x-1 border rounded-lg p-0.5 transition-colors ${
            isLightMode ? 'bg-slate-200/50 border-slate-300' : 'bg-black/40 border-white/10'
          }`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono tracking-wider transition-all ${
                activeTab === 'dashboard'
                  ? isLightMode
                    ? 'bg-white text-cyber-purple border border-slate-300 shadow-sm font-bold'
                    : 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/5 border border-transparent'
              }`}
            >
              {t.tabDashboard}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono tracking-wider transition-all flex items-center space-x-1 ${
                activeTab === 'guide'
                  ? isLightMode
                    ? 'bg-white text-cyber-cyan border border-slate-300 shadow-sm font-bold'
                    : 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/5 border border-transparent'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t.tabGuide}</span>
            </button>
          </div>

          {/* Theme Toggle (Light / Dark) */}
          <div className={`flex border rounded-lg p-0.5 transition-colors ${
            isLightMode ? 'bg-slate-200/50 border-slate-300' : 'bg-black/40 border-white/10'
          }`}>
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className={`p-1.5 rounded-md transition-all flex items-center justify-center`}
              title={t.themeToggleLabel}
            >
              {isLightMode ? (
                <Moon className="w-4 h-4 text-cyber-purple" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-400" />
              )}
            </button>
          </div>

          {/* Language Toggle */}
          <div className={`flex space-x-1 border rounded-lg p-0.5 transition-colors ${
            isLightMode ? 'bg-slate-200/50 border-slate-300' : 'bg-black/40 border-white/10'
          }`}>
            <button
              onClick={() => setLang('ja')}
              className={`w-8 py-1 rounded text-xs font-mono transition-all ${
                lang === 'ja'
                  ? isLightMode
                    ? 'bg-white text-slate-800 font-bold shadow-sm'
                    : 'bg-white/10 text-white font-bold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              JA
            </button>
            <button
              onClick={() => setLang('en')}
              className={`w-8 py-1 rounded text-xs font-mono transition-all ${
                lang === 'en'
                  ? isLightMode
                    ? 'bg-white text-slate-800 font-bold shadow-sm'
                    : 'bg-white/10 text-white font-bold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Area */}
      {activeTab === 'dashboard' ? (
        /* TAB 1: RADAR DASHBOARD */
        <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
          
          {/* Left Side: Controller / Setup */}
          <section className="lg:col-span-4 flex flex-col space-y-6">
            
            {/* Card 1: Configuration Panel */}
            <div className={`border rounded-xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 ${
              isLightMode ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/55' : 'bg-[#12131a]/95 border-white/10 text-gray-100'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center space-x-2 mb-4 border-b pb-3 border-inherit/10">
                <Settings className="w-4 h-4 text-cyber-purple" />
                <h2 className={`text-sm font-bold tracking-wider uppercase font-mono ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                  {t.controlBoard}
                </h2>
              </div>

              {/* Error alerts */}
              {error && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-lg flex items-start space-x-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-red-300 font-mono leading-relaxed">{error}</span>
                </div>
              )}

              {/* API Key Form */}
              <form onSubmit={handleSaveApiKey} className="space-y-4">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1.5 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    {t.apiKeyLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4.5 w-4.5 text-gray-500" />
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className={`block w-full pl-9 pr-10 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-1 transition-all ${
                        isLightMode
                          ? 'border-slate-300 bg-slate-50 text-slate-800 focus:ring-cyber-purple focus:border-cyber-purple'
                          : 'border-white/10 bg-black/40 text-gray-200 focus:ring-cyber-purple focus:border-cyber-purple'
                      }`}
                      placeholder="AIzaSy..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
                        isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* AI Model Selector */}
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1.5 flex items-center space-x-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    <Cpu className="w-3.5 h-3.5 text-cyber-purple" />
                    <span>{t.modelSelectLabel}</span>
                  </label>
                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    className={`block w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none focus:ring-1 cursor-pointer transition-all ${
                      isLightMode
                        ? 'border-slate-300 bg-slate-50 text-slate-800 focus:ring-cyber-purple focus:border-cyber-purple'
                        : 'border-white/10 bg-[#191b24] text-gray-200 focus:ring-cyber-purple focus:border-cyber-purple'
                    }`}
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Standard / Recommended)</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Latest / High Speed)</option>
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Deprecated / Legacy)</option>
                  </select>
                </div>
                
                {/* Security reassuring message */}
                <p className={`text-[10px] p-2.5 rounded-lg leading-normal flex items-start space-x-1.5 font-mono border ${
                  isLightMode
                    ? 'text-cyan-800 bg-cyan-50 border-cyan-200/80'
                    : 'text-cyber-cyan bg-cyan-950/20 border-cyber-cyan/10'
                }`}>
                  <ShieldAlert className="w-4 h-4 text-cyber-cyan flex-shrink-0 mt-0.5" />
                  <span>{t.apiSafetyNotice}</span>
                </p>

                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('guide')}
                    className="text-[10px] text-cyber-cyan hover:underline flex items-center space-x-0.5 font-mono"
                  >
                    <span>{t.getApiKey}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-gradient-to-r from-cyber-purple to-cyber-pink text-xs font-mono font-bold text-white hover:opacity-90 active:scale-95 transition-all duration-150 flex items-center space-x-1 cursor-pointer"
                  >
                    {apiSaveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.saved}</span>
                      </>
                    ) : (
                      <span>{t.saveKey}</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Speech Recognition Controls */}
              <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
                <label className={`block text-xs font-mono uppercase ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {t.atmosphereMonitoring}
                </label>

                {/* State badges (Compact) */}
                <div className="grid grid-cols-2 gap-2 pb-2">
                  <div className={`flex items-center space-x-1.5 px-2 py-1 rounded border text-[10px] font-mono transition-colors ${
                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-black/20 border-white/5 text-gray-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-cyan-400 animate-ping' : 'bg-gray-500'}`} />
                    <span>{t.micStatus}: {isListening ? t.listening : t.off}</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 px-2 py-1 rounded border text-[10px] font-mono transition-colors ${
                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-black/20 border-white/5 text-gray-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-pink-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span>{t.aiStatus}: {isAnalyzing ? t.analyzing : t.idle}</span>
                  </div>
                </div>

                {!isListening ? (
                  <button
                    onClick={startMonitoring}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-sm font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-[0.98] cursor-pointer"
                  >
                    <Mic className="w-4.5 h-4.5 animate-pulse" />
                    <span>{t.startMonitoring}</span>
                  </button>
                ) : (
                  <button
                    onClick={stopMonitoring}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-500 hover:to-pink-600 text-sm font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-[0.98] cursor-pointer"
                  >
                    <MicOff className="w-4.5 h-4.5" />
                    <span>{t.stopMonitoring}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Simulation Panel (Crucial for Demo/Testing) */}
            <div className={`border rounded-xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 ${
              isLightMode ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/55' : 'bg-[#12131a]/95 border-white/10 text-gray-100'
            }`}>
              <div className="flex items-center space-x-2 mb-4 border-b pb-3 border-inherit/10">
                <Activity className="w-4 h-4 text-cyber-pink" />
                <h2 className={`text-sm font-bold tracking-wider uppercase font-mono ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                  {t.simulator}
                </h2>
              </div>

              <div className="space-y-4">
                {/* Slider simulation */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-mono ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>{t.atmosphereValue}</span>
                    <span className="text-xs font-mono font-bold text-cyber-pink">{tensionLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tensionLevel}
                    onChange={(e) => triggerSimulation(parseInt(e.target.value, 10))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyber-pink ${
                      isLightMode ? 'bg-slate-200' : 'bg-black/40'
                    }`}
                  />
                </div>

                {/* Quick simulation buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => triggerSimulation(15)}
                    className={`py-1.5 px-2 border rounded text-[10px] font-mono transition-all cursor-pointer ${
                      isLightMode ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {t.stableButton}
                  </button>
                  <button
                    onClick={() => triggerSimulation(55)}
                    className={`py-1.5 px-2 border rounded text-[10px] font-mono transition-all cursor-pointer ${
                      isLightMode ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {t.tenseButton}
                  </button>
                  <button
                    onClick={() => triggerSimulation(85)}
                    className={`py-1.5 px-2 border rounded text-[10px] font-mono transition-all cursor-pointer animate-pulse ${
                      isLightMode ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white/5 border-white/5 hover:bg-white/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {t.crisisButton}
                  </button>
                </div>

                {/* Demo text loaders */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className={`block text-[10px] font-mono uppercase ${isLightMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t.injectLabel}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadDemoDialogue('chill')}
                      className={`flex-1 py-1.5 border rounded text-[11px] font-mono transition-all cursor-pointer ${
                        isLightMode
                          ? 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100/60'
                          : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-300 hover:text-cyan-200'
                      }`}
                    >
                      {t.loadPeacefulDemo}
                    </button>
                    <button
                      onClick={() => loadDemoDialogue('tense')}
                      className={`flex-1 py-1.5 border rounded text-[11px] font-mono transition-all cursor-pointer ${
                        isLightMode
                          ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100/60'
                          : 'bg-red-950/20 border-red-500/20 text-red-300 hover:text-red-200'
                      }`}
                    >
                      {t.loadAngryDemo}
                    </button>
                  </div>
                </div>

                {/* Test Audio & Reset */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={playGong}
                    className={`py-1.5 px-3 border rounded text-xs font-mono flex items-center space-x-1 cursor-pointer ${
                      isLightMode
                        ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/60'
                        : 'bg-purple-950/30 border-purple-500/30 text-purple-300'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{t.testGong}</span>
                  </button>

                  <button
                    onClick={clearLogsAndTranscripts}
                    className={`py-1.5 px-3 border rounded text-xs font-mono flex items-center space-x-1 cursor-pointer ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.resetAll}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Center: Tension Visualizer Gauge */}
          <section className="lg:col-span-4 flex flex-col space-y-6">
            <div className={`border rounded-xl p-6 shadow-2xl flex flex-col items-center justify-between flex-grow min-h-[400px] relative overflow-hidden transition-all duration-300 ${
              isLightMode ? 'bg-white border-slate-200 shadow-slate-200/55' : 'bg-[#12131a]/95 border-white/10'
            }`}>
              
              {/* Ambient colorful grid backdrop glow */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${currentTheme.bgGlow} rounded-full blur-3xl transition-colors duration-1000 pointer-events-none`} />

              <div className="w-full flex items-center justify-between border-b pb-3 border-inherit/10 z-10">
                <span className={`text-xs font-mono uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {t.gaugeTitle}
                </span>
                <span className="text-xs font-mono text-gray-500">
                  {t.updateLoop}
                </span>
              </div>

              {/* SVG Circular Gauge */}
              <div className="relative my-8 z-10 select-none">
                <svg className="w-64 h-64 transform -rotate-90">
                  {/* Background Ring */}
                  <circle
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke={isLightMode ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)'}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Glowing border ring */}
                  <circle
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke={isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'}
                    strokeWidth={strokeWidth + 2}
                    fill="transparent"
                  />
                  {/* Active Progress Ring */}
                  <circle
                    className="transition-all duration-1000 ease-out"
                    cx="128"
                    cy="128"
                    r={radius}
                    stroke={`var(--color-cyber-${tensionLevel >= 70 ? 'red' : tensionLevel >= 40 ? 'pink' : 'cyan'})`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Inner score reading */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black font-mono tracking-tighter select-text ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                    {tensionLevel}
                  </span>
                  <span className="text-xs font-mono tracking-widest text-gray-500 uppercase">
                    Tension %
                  </span>
                </div>
              </div>

              {/* Atmosphere status readouts */}
              <div className="w-full space-y-4 text-center z-10">
                <div className={`inline-block px-4 py-1.5 rounded border shadow-lg ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/60 border-white/10'
                }`}>
                  <span className="text-xs font-mono text-gray-400 block mb-0.5">{t.statusTitle}</span>
                  <span className={`text-base font-extrabold tracking-wide uppercase ${currentTheme.color} transition-all duration-500`}>
                    {currentTheme.label}
                  </span>
                </div>

                {/* Score bar */}
                <div className={`w-full h-2 rounded-full overflow-hidden border ${isLightMode ? 'bg-slate-200 border-slate-300' : 'bg-black/40 border-white/5'}`}>
                  <div
                    className={`h-full ${currentTheme.barColor} transition-all duration-1000 ease-out`}
                    style={{ width: `${tensionLevel}%` }}
                  />
                </div>

                {/* Fun / Snarky advice banner */}
                <p className={`text-xs p-3 rounded-lg leading-relaxed select-text border ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200 text-slate-600'
                    : 'bg-white/5 border-white/5 text-gray-400 italic'
                }`}>
                  {currentTheme.commentary}
                </p>
              </div>

              {/* User Friendly API Error Callout Banner */}
              {friendlyApiError && (
                <div className="w-full mt-4 p-3 bg-red-950/40 border border-red-500/40 rounded-lg flex items-start space-x-2 animate-pulse z-25 text-left">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-300 font-mono">
                    <span className="font-bold block mb-1 text-red-200">{t.aiErrorOccurred}</span>
                    {friendlyApiError}
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* Right Side: Live Dialogue Timeline */}
          <section className="lg:col-span-4 flex flex-col space-y-6">
            <div className={`border rounded-xl p-5 shadow-2xl flex flex-col h-[500px] relative overflow-hidden transition-all duration-300 ${
              isLightMode ? 'bg-white border-slate-200 shadow-slate-200/55' : 'bg-[#12131a]/95 border-white/10'
            }`}>
              
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-inherit/10">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-cyber-cyan" />
                  <h2 className={`text-sm font-bold tracking-wider uppercase font-mono ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                    {t.dialogueTimeline}
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-gray-500 px-2 py-0.5 bg-white/5 rounded">
                  {t.bufferInfo}
                </span>
              </div>

              {/* Transcript Timeline Messages */}
              <div className="flex-grow overflow-y-auto space-y-3 pr-2 mb-4">
                {transcripts.length === 0 && !interimTranscript ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs font-mono text-gray-600">
                      {t.timelineEmpty}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-2 max-w-[200px]">
                      {t.timelineEmptyDesc}
                    </p>
                  </div>
                ) : (
                  transcripts.map((tItem) => (
                    <div key={tItem.id} className={`p-2.5 rounded border transition-colors ${
                      isLightMode
                        ? 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300/80'
                        : 'bg-black/30 border-white/5 hover:border-white/10'
                    }`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-mono ${isLightMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {tItem.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-[9px] font-mono text-cyber-cyan bg-cyan-950/20 px-1 rounded">
                          {t.final}
                        </span>
                      </div>
                      <p className={`text-xs font-mono break-words leading-relaxed select-text transition-colors ${
                        isLightMode ? 'text-slate-700 font-medium' : 'text-gray-300'
                      }`}>
                        {tItem.text}
                      </p>
                    </div>
                  ))
                )}

                {/* Interim Transcript (Real time preview) */}
                {interimTranscript && (
                  <div className="p-2.5 rounded bg-cyan-950/10 border border-cyber-cyan/20 animate-pulse">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-cyber-cyan">
                        {t.nowSpeaking}
                      </span>
                      <span className="text-[9px] font-mono text-cyber-cyan bg-cyan-900/30 px-1 rounded">
                        {t.interim}
                      </span>
                    </div>
                    <p className="text-xs text-cyber-cyan/90 font-mono italic break-words select-text">
                      {interimTranscript}
                    </p>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Manual Text Input form */}
              <form onSubmit={handleAddManualSpeech} className="mt-auto border-t border-white/5 pt-4 flex space-x-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={t.placeholderManual}
                  className={`flex-grow px-3 py-2 border rounded-lg text-xs font-mono transition-all ${
                    isLightMode
                      ? 'border-slate-300 bg-slate-50 text-slate-800 placeholder-slate-400 focus:ring-cyber-cyan focus:border-cyber-cyan'
                      : 'border-white/10 bg-black/50 text-gray-300 placeholder-gray-600 focus:ring-cyber-cyan focus:border-cyber-cyan'
                  }`}
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-cyber-cyan/25 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/35 active:scale-95 transition-all cursor-pointer"
                  title="Send speech text"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </section>
        </main>
      ) : (
        /* TAB 2: API KEY GET GUIDE (SUBPAGE) */
        <main className={`w-full max-w-4xl mx-auto flex-grow border rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
          isLightMode ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/55' : 'bg-[#12131a]/95 border-white/10 text-gray-100'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center space-x-3 border-b pb-4 mb-6 border-inherit/10">
            <HelpCircle className="w-6 h-6 text-cyber-cyan" />
            <div>
              <h2 className="text-xl font-bold font-mono">
                Gemini API キー 無料取得手順ガイド
              </h2>
              <p className="text-xs text-gray-500">How to get a Google Gemini API Key for free</p>
            </div>
          </div>

          <div className="space-y-6 leading-relaxed font-sans text-sm">
            
            {/* Free Tier Callout Box */}
            <div className={`p-4 rounded-lg flex items-start space-x-3 shadow-lg border ${
              isLightMode
                ? 'bg-cyan-50 border-cyan-200/70 text-cyan-900'
                : 'bg-cyan-950/20 border-cyber-cyan/30 text-gray-300'
            }`}>
              <Info className="w-5 h-5 text-cyber-cyan flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-cyber-cyan font-mono">完全無料で利用できます！</h3>
                <p className="text-xs leading-relaxed">
                  Google AI Studioが提供する <strong>Gemini API</strong> の無料利用枠 (Free Tier) は、
                  <strong>1分間に15リクエスト、1日に1,500リクエストまで</strong> 料金が一切かかりません。
                  本アプリの空気自動解析は <strong>18秒に1回</strong>（1分間に3〜4リクエスト程度）しかリクエストを行わないため、
                  何時間連続で稼働させても無料枠をオーバーすることはなく、<strong>課金される心配はありません。</strong>
                </p>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4">
              <h3 className="text-base font-bold border-l-2 border-cyber-purple pl-2 font-mono">
                取得ステップ（所要時間: 約1分）
              </h3>
              
              <ol className="relative border-l ml-3 space-y-6 border-inherit/10">
                
                <li className="ml-6">
                  <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-black/80 border border-cyber-purple text-xs font-mono font-bold text-cyber-purple">
                    1
                  </span>
                  <h4 className="text-sm font-bold font-mono">
                    Google AI Studio を開く
                  </h4>
                  <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    Google公式の開発者ポータルである以下のサイトにアクセスします。
                  </p>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 mt-2 px-3.5 py-1.5 rounded bg-cyber-purple/20 border border-cyber-purple/40 hover:bg-cyber-purple/30 text-xs font-mono text-white transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                  >
                    <span>Google AI Studio を開く</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>

                <li className="ml-6">
                  <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-black/80 border border-white/20 text-xs font-mono font-bold text-gray-400">
                    2
                  </span>
                  <h4 className="text-sm font-bold font-mono">
                    Googleアカウントでログイン
                  </h4>
                  <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    お持ちの通常のGoogleアカウント（Gmailアドレスなど）でログインしてください。利用規約の同意画面が出た場合は、内容を確認して同意します。
                  </p>
                </li>

                <li className="ml-6">
                  <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-black/80 border border-white/20 text-xs font-mono font-bold text-gray-400">
                    3
                  </span>
                  <h4 className="text-sm font-bold font-mono">
                    「Get API Key」をクリック
                  </h4>
                  <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    ログイン後、画面の左上にある青い **「Get API key」** または **「Create API key」** ボタンをクリックします。
                  </p>
                </li>

                <li className="ml-6">
                  <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-black/80 border border-white/20 text-xs font-mono font-bold text-gray-400">
                    4
                  </span>
                  <h4 className="text-sm font-bold font-mono">
                    キーの作成とコピー
                  </h4>
                  <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    表示された画面で「Create API key in new project」を選んでキーを作成し、生成された `AIzaSy...` で始まる文字列をコピーします。
                  </p>
                </li>

                <li className="ml-6">
                  <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-black/80 border border-cyber-cyan text-xs font-mono font-bold text-cyber-cyan shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                    5
                  </span>
                  <h4 className="text-sm font-bold font-mono">
                    Chime-Out Radar に貼り付けて保存
                  </h4>
                  <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    上のタブから「**{t.tabDashboard}**」に戻り、左側の「**Gemini API キー**」の入力欄に貼り付け、「**キーを保存**」を押します。
                  </p>
                </li>

              </ol>
            </div>

            {/* Security Note */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h3 className="text-sm font-bold font-mono flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>セキュリティとプライバシーについて</span>
              </h3>
              <p className={`text-xs leading-relaxed pl-5 ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                入力したAPIキーはブラウザの保存領域（LocalStorage）にのみ安全に保存されます。
                APIキーや文字起こしデータが、本アプリの開発者や第三者の外部サーバーに転送されたり、
                GitHubのソースコード内に保存されたりすることは一切ありません。すべての通信はあなたのPCとGoogle社のサーバー間で直接かつ安全に処理されます。
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-2 rounded-lg border text-xs font-mono transition-all active:scale-95 cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                }`}
              >
                ← レーダー画面に戻る
              </button>
            </div>

          </div>
        </main>
      )}

      {/* Footer Area: Historical Log and System Event Logs */}
      {activeTab === 'dashboard' && (
        <footer className="w-full max-w-7xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Atmosphere scan history */}
          <div className={`border rounded-xl p-4 shadow-xl flex flex-col h-[200px] transition-all duration-300 ${
            isLightMode ? 'bg-white border-slate-200 shadow-slate-100 text-slate-800' : 'bg-[#12131a]/85 border-white/5 text-gray-100'
          }`}>
            <div className="flex items-center space-x-1.5 border-b pb-2 mb-2 border-inherit/10">
              <Activity className="w-3.5 h-3.5 text-cyber-purple" />
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                {t.scanLog}
              </span>
            </div>
            <div className={`flex-grow overflow-y-auto space-y-1.5 text-xs font-mono pr-1 ${isLightMode ? 'text-slate-700' : 'text-gray-400'}`}>
              {analysisHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-[10px]">
                  {t.noScanLog}
                </div>
              ) : (
                analysisHistory.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-inherit/10">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">[{item.timestamp.toLocaleTimeString()}]</span>
                      <span className={`max-w-[200px] md:max-w-md truncate select-text font-medium ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                        {item.texts.length > 0 ? item.texts.join(', ') : '(No text)'}
                      </span>
                    </div>
                    <span className={`font-bold ${item.score >= 70 ? 'text-cyber-red' : item.score >= 40 ? 'text-cyber-pink' : 'text-cyber-cyan'}`}>
                      {item.score}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System logs */}
          <div className={`border rounded-xl p-4 shadow-xl flex flex-col h-[200px] transition-all duration-300 ${
            isLightMode ? 'bg-white border-slate-200 shadow-slate-100 text-slate-800' : 'bg-[#12131a]/85 border-white/5 text-gray-100'
          }`}>
            <div className="flex items-center space-x-1.5 border-b pb-2 mb-2 border-inherit/10">
              <Terminal className="w-3.5 h-3.5 text-gray-400" />
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                {t.systemLog}
              </span>
            </div>
            <div className={`flex-grow overflow-y-auto space-y-1 text-[10px] font-mono pr-1 ${isLightMode ? 'text-slate-500' : 'text-gray-500'}`}>
              {systemLogs.map((log, index) => (
                <div key={index} className="leading-normal break-words select-text">
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

        </footer>
      )}
    </div>
  );
}
