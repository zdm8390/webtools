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
  ExternalLink,
  Info,
  HelpCircle,
  CheckCircle2,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp
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
    subtitle: "会議不穏空気検知システム",
    micStatus: "マイク",
    aiStatus: "AI分析",
    levelStatus: "空気",
    listening: "集音中",
    off: "停止",
    analyzing: "分析中",
    idle: "待機",
    hostile: "不穏検知",
    secure: "安全",
    controlBoard: "制御盤",
    apiKeyLabel: "Gemini API キー",
    apiSafetyNotice: "※キーはブラウザ(LocalStorage)に保存され、外部送信されません。",
    getApiKey: "APIキー無料取得手順",
    saveKey: "保存",
    saved: "保存済",
    modelSelectLabel: "AIモデル",
    atmosphereMonitoring: "集音監視コントロール",
    startMonitoring: "監視開始",
    stopMonitoring: "監視停止",
    simulator: "不穏度シミュレーター",
    atmosphereValue: "テスト設定値",
    stableButton: "良好 15%",
    tenseButton: "緊張 55%",
    crisisButton: "険悪 85%",
    loadPeacefulDemo: "💬 良好デモ",
    loadAngryDemo: "🔥 険悪デモ",
    testGong: "鐘を鳴らす",
    resetAll: "クリア",
    gaugeTitle: "不穏度レーダー",
    updateLoop: "18秒更新",
    statusTitle: "ステータス",
    dialogueTimeline: "会話タイムライン",
    bufferInfo: "直近30秒/最新5発言",
    timelineEmpty: "-- 録音データなし --",
    timelineEmptyDesc: "集音を開始するか、デモを挿入してください。",
    nowSpeaking: "集音中...",
    interim: "集音中",
    final: "確定",
    placeholderManual: "対話モックを入力...",
    scanLog: "判定履歴",
    noScanLog: "履歴なし",
    systemLog: "システムログ",
    tabDashboard: "レーダー",
    tabGuide: "キー取得ガイド(無料)",
    enterKeyPrompt: "左側でAPIキーを設定してください。",
    deviceNotSupported: "音声認識非対応です。Chrome/Edge推奨。",
    simulatedText: "(シミュレーター設定値)",
    injectLabel: "モック対話の注入",
    aiErrorOccurred: "解析エラー",
    themeToggleLabel: "テーマ"
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
    controlBoard: "Control Board",
    apiKeyLabel: "Gemini API Key",
    apiSafetyNotice: "* Saved locally in LocalStorage; never sent to external servers.",
    getApiKey: "Get API Key (Free Guide)",
    saveKey: "Save",
    saved: "Saved",
    modelSelectLabel: "AI Model",
    atmosphereMonitoring: "Monitoring Control",
    startMonitoring: "Start",
    stopMonitoring: "Stop",
    simulator: "Atmosphere Simulator",
    atmosphereValue: "Test Value",
    stableButton: "Stable 15%",
    tenseButton: "Tense 55%",
    crisisButton: "Crisis 85%",
    loadPeacefulDemo: "💬 Chill Demo",
    loadAngryDemo: "🔥 Tense Demo",
    testGong: "Play Gong",
    resetAll: "Reset",
    gaugeTitle: "Atmosphere Radar",
    updateLoop: "18s Loop",
    statusTitle: "STATUS",
    dialogueTimeline: "Dialogue Timeline",
    bufferInfo: "Buffer (30s/last 5)",
    timelineEmpty: "-- No speech recorded --",
    timelineEmptyDesc: "Start monitoring or load a demo to begin.",
    nowSpeaking: "Listening...",
    interim: "Interim",
    final: "Final",
    placeholderManual: "Type manual speech...",
    scanLog: "History Logs",
    noScanLog: "No history logs.",
    systemLog: "System Logs",
    tabDashboard: "Radar",
    tabGuide: "API Key Guide (Free)",
    enterKeyPrompt: "Please configure your API Key in the left panel.",
    deviceNotSupported: "Speech Recognition not supported. Use Chrome/Edge.",
    simulatedText: "(Simulated value)",
    injectLabel: "Inject Demo Dialogue",
    aiErrorOccurred: "AI Error",
    themeToggleLabel: "Theme"
  }
};

export default function App() {
  // --- State Variables ---
  const [lang, setLang] = useState<'ja' | 'en'>('ja'); // Default to Japanese
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_preference') === 'light';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'guide'>('dashboard');
  const [historyTab, setHistoryTab] = useState<'scan' | 'system'>('scan'); // Tab for logs
  const [isLogsCollapsed, setIsLogsCollapsed] = useState<boolean>(true); // Default to collapsed
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
  }, [systemLogs, historyTab]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, interimTranscript]);

  // Initialize System Logs
  useEffect(() => {
    addSystemLog('Atmospheric Radar v1.0 initialized.');
    if (!SpeechRecognition) {
      addSystemLog('Error: Web Speech API is not supported in this browser.');
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
    addSystemLog('API Key saved.');
    setError(null);
    setFriendlyApiError(null);
    setTimeout(() => setApiSaveSuccess(false), 2000);
  };

  // --- Model Selection Management ---
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedModel(val);
    localStorage.setItem('gemini_model_name', val);
    addSystemLog(`Model changed: ${val}`);
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
          addSystemLog(`Speech: "${newFinals[newFinals.length - 1].text}"`);
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied.');
          setIsListening(false);
          addSystemLog('Error: Microphone permission denied.');
        } else {
          addSystemLog(`Speech warning: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          addSystemLog('Restarting speech recognition...');
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
        ? '指定モデル（1.5-flash等）は廃止されました。「gemini-2.5-flash」等に変更してください。'
        : 'The selected model is deprecated. Switch to "gemini-2.5-flash" in the left panel.';
    }
    if (lower.includes('api key') || lower.includes('key') || lower.includes('invalid') || lower.includes('api_key_invalid')) {
      return lang === 'ja'
        ? 'APIキーが無効です。入力キーを確認するか、右上のガイドから再取得してください。'
        : 'Invalid API Key. Verify the key or get a new one from the Guide tab.';
    }
    if (lower.includes('quota') || lower.includes('limit') || lower.includes('429') || lower.includes('resource exhausted')) {
      return lang === 'ja'
        ? '無料枠の上限に達しました。しばらく待ってから再度お試しください。'
        : 'API limit or quota exceeded. Please wait a minute before requesting again.';
    }
    return lang === 'ja'
      ? `【APIエラー】${rawError}`
      : `【API Error】${rawError}`;
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
      addSystemLog('Analysis Error: API key missing.');
      return;
    }

    const buffer = getTranscriptBuffer();
    if (buffer.length === 0) {
      addSystemLog('Analysis Skipped: Buffer empty.');
      return;
    }

    const modelName = selectedModelRef.current;
    setIsAnalyzing(true);
    addSystemLog(`Scan: Sending buffer to Gemini (${modelName})...`);

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
        setFriendlyApiError(null); // Clear errors

        // Add to history
        setAnalysisHistory((prev) => [
          {
            timestamp: new Date(),
            score: normalizedScore,
            texts: buffer.map((b) => b.text)
          },
          ...prev.slice(0, 19)
        ]);

        addSystemLog(`Score: ${normalizedScore}%`);

        if (normalizedScore >= 70 && prevLevel < 70) {
          playGong();
          addSystemLog('⚠️ Threshold exceeded!');
        }
      } else {
        throw new Error(`Parse failed: "${rawText}"`);
      }
    } catch (err: any) {
      console.error('API Error:', err);
      const friendlyMsg = getFriendlyErrorMessage(err.message || String(err));
      setFriendlyApiError(friendlyMsg);
      addSystemLog(`Error: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Timer loop for Analysis: runs every 18 seconds
  useEffect(() => {
    let intervalId: any = null;
    if (isListening) {
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
    addSystemLog(`Manual: "${manualInput.trim()}"`);
    setManualInput('');
  };

  // --- Demos & Simulations ---
  const triggerSimulation = (score: number) => {
    const prev = lastTensionLevelRef.current;
    setTensionLevel(score);
    setLastTensionLevel(score);
    setFriendlyApiError(null);
    setAnalysisHistory((prevHist) => [
      {
        timestamp: new Date(),
        score: score,
        texts: [t.simulatedText]
      },
      ...prevHist.slice(0, 19)
    ]);
    addSystemLog(`Simulated: ${score}%`);

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
    addSystemLog(`Loaded ${type === 'tense' ? 'Tense' : 'Chill'} demo.`);
  };

  const clearLogsAndTranscripts = () => {
    setTranscripts([]);
    setInterimTranscript('');
    setAnalysisHistory([]);
    setTensionLevel(0);
    setLastTensionLevel(0);
    setSystemLogs([]);
    setFriendlyApiError(null);
    addSystemLog('Data reset.');
  };

  // --- UI Helpers ---
  const getAtmosphereTheme = (val: number) => {
    if (val >= 70) {
      return {
        color: 'text-cyber-red animate-pulse',
        borderColor: 'border-glow-red',
        bgGlow: 'bg-red-500/10',
        label: lang === 'ja' ? 'CRITICAL (険悪)' : 'CRITICAL',
        textColor: 'text-red-500',
        barColor: 'bg-cyber-red',
        commentary: lang === 'ja'
          ? '⚠️ 険悪な空気を検知。発言トゲ強、撤退を推奨。'
          : '⚠️ Hostile tension detected. Silence advised.'
      };
    } else if (val >= 40) {
      return {
        color: 'text-cyber-pink animate-pulse',
        borderColor: 'border-glow-pink',
        bgGlow: 'bg-pink-500/10',
        label: lang === 'ja' ? 'TENSE (緊張)' : 'TENSE',
        textColor: 'text-pink-400',
        barColor: 'bg-cyber-pink',
        commentary: lang === 'ja'
          ? '⚡ 微妙なピリつき。慎重に言葉を選んでください。'
          : '⚡ Subtle tension. Choose words carefully.'
      };
    } else {
      return {
        color: 'text-cyber-cyan',
        borderColor: 'border-glow-cyan',
        bgGlow: 'bg-cyan-500/10',
        label: lang === 'ja' ? 'STABLE (良好)' : 'STABLE',
        textColor: 'text-cyan-400',
        barColor: 'bg-cyber-cyan',
        commentary: lang === 'ja'
          ? '🟢 場の空気は極めて平穏。雑談可能な状態です。'
          : '🟢 Air pressure nominal. Smooth conversation.'
      };
    }
  };

  const currentTheme = getAtmosphereTheme(tensionLevel);

  // Circular Gauge Calculations (Shrunk viewport)
  const strokeDashoffset = 282.74 - (tensionLevel / 100) * 282.74;

  return (
    <div className={`h-screen w-screen relative flex flex-col p-4 transition-colors duration-500 overflow-hidden select-none ${
      isLightMode ? 'light-cyber-grid bg-[#f5f6fa] text-slate-800' : 'cyber-grid bg-[#0d0e12] text-gray-100'
    } cyber-scanline`}>
      
      {/* Full screen ominous flashing overlay if tension >= 70 */}
      {tensionLevel >= 70 && (
        <div className="fixed inset-0 pointer-events-none z-50 animate-warning-flash" />
      )}

      {/* Top Header (Compact) */}
      <header className={`w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between border-b pb-3 mb-4 transition-colors flex-shrink-0 ${
        isLightMode ? 'border-slate-200' : 'border-white/10'
      }`}>
        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
          <div className="p-2 rounded bg-purple-500/10 border border-purple-500/30">
            <ShieldAlert className="w-6 h-6 text-cyber-purple" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 font-sans uppercase">
              {t.title}
            </h1>
            <p className={`text-[10px] font-mono transition-colors ${isLightMode ? 'text-slate-500' : 'text-gray-500'}`}>{t.subtitle}</p>
          </div>
        </div>

        {/* Navigation, Theme & Language Select */}
        <div className="flex flex-wrap gap-2 items-center justify-end">
          {/* Tabs */}
          <div className={`flex space-x-0.5 border rounded p-0.5 transition-colors ${
            isLightMode ? 'bg-slate-200/50 border-slate-300' : 'bg-black/40 border-white/10'
          }`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                activeTab === 'dashboard'
                  ? isLightMode
                    ? 'bg-white text-cyber-purple font-bold shadow-sm'
                    : 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/10 font-bold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.tabDashboard}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center space-x-1 ${
                activeTab === 'guide'
                  ? isLightMode
                    ? 'bg-white text-cyber-cyan font-bold shadow-sm'
                    : 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/10 font-bold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <HelpCircle className="w-3 h-3" />
              <span>{t.tabGuide}</span>
            </button>
          </div>

          {/* Theme Switcher */}
          <div className={`flex border rounded p-0.5 transition-colors ${
            isLightMode ? 'bg-slate-200/50 border-slate-300' : 'bg-black/40 border-white/10'
          }`}>
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-1 rounded transition-all"
              title={t.themeToggleLabel}
            >
              {isLightMode ? <Moon className="w-3.5 h-3.5 text-cyber-purple" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
            </button>
          </div>

          {/* Language Switcher */}
          <div className={`flex space-x-0.5 border rounded p-0.5 transition-colors ${
            isLightMode ? 'bg-slate-200/50 border-slate-300' : 'bg-black/40 border-white/10'
          }`}>
            <button
              onClick={() => setLang('ja')}
              className={`w-7 py-0.5 rounded text-[10px] font-mono transition-all ${
                lang === 'ja' ? isLightMode ? 'bg-white text-slate-800 font-bold shadow-sm' : 'bg-white/10 text-white font-bold' : 'text-gray-500'
              }`}
            >
              JA
            </button>
            <button
              onClick={() => setLang('en')}
              className={`w-7 py-0.5 rounded text-[10px] font-mono transition-all ${
                lang === 'en' ? isLightMode ? 'bg-white text-slate-800 font-bold shadow-sm' : 'bg-white/10 text-white font-bold' : 'text-gray-500'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Area */}
      {activeTab === 'dashboard' ? (
        /* TAB 1: RADAR DASHBOARD (Screen size locked, overflow-hidden) */
        <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 mb-2">
          
          {/* Left Column: Controls and Simulator */}
          <section className="lg:col-span-4 flex flex-col space-y-4 h-full min-h-0">
            
            {/* Control Panel (Fixed size) */}
            <div className={`border rounded-xl p-4 shadow-lg relative overflow-hidden flex-shrink-0 transition-all duration-300 ${
              isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#12131a]/95 border-white/10 text-gray-100'
            }`}>
              <div className="flex items-center space-x-2 mb-3 border-b pb-2 border-inherit/10">
                <Settings className="w-3.5 h-3.5 text-cyber-purple" />
                <h2 className={`text-xs font-bold uppercase font-mono ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                  {t.controlBoard}
                </h2>
              </div>

              {/* Error messages */}
              {error && (
                <div className="mb-3 p-2 bg-red-950/40 border border-red-500/40 rounded flex items-start space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[10px] text-red-300 font-mono leading-snug">{error}</span>
                </div>
              )}

              {/* API Key settings */}
              <form onSubmit={handleSaveApiKey} className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Key className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className={`block w-full pl-8 pr-8 py-1 border rounded text-xs font-mono focus:outline-none focus:ring-1 transition-all ${
                      isLightMode ? 'border-slate-300 bg-slate-50 text-slate-800' : 'border-white/10 bg-black/40 text-gray-200'
                    }`}
                    placeholder="Gemini API Key (AIzaSy...)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className={`absolute inset-y-0 right-0 pr-2.5 flex items-center transition-colors ${
                      isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <select
                      value={selectedModel}
                      onChange={handleModelChange}
                      className={`block w-full px-2 py-1 border rounded text-[10px] font-mono focus:outline-none focus:ring-1 cursor-pointer transition-all ${
                        isLightMode ? 'border-slate-300 bg-slate-50 text-slate-800' : 'border-white/10 bg-[#191b24] text-gray-200'
                      }`}
                    >
                      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                      <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Deprecated)</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('guide')}
                      className="text-[10px] text-cyber-cyan hover:underline flex items-center space-x-0.5 font-mono"
                    >
                      <span>ガイド</span>
                    </button>
                    
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-gradient-to-r from-cyber-purple to-cyber-pink text-[10px] font-mono font-bold text-white cursor-pointer"
                    >
                      {apiSaveSuccess ? t.saved : t.saveKey}
                    </button>
                  </div>
                </div>
                
                {/* Security Message (Concise) */}
                <p className={`text-[9px] p-1.5 rounded leading-normal flex items-start space-x-1 font-mono border ${
                  isLightMode ? 'text-cyan-800 bg-cyan-50 border-cyan-150' : 'text-cyber-cyan bg-cyan-950/20 border-cyber-cyan/10'
                }`}>
                  <ShieldAlert className="w-3 h-3 text-cyber-cyan flex-shrink-0 mt-0.5" />
                  <span>{t.apiSafetyNotice}</span>
                </p>
              </form>

              {/* Start Monitoring */}
              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[9px] font-mono ${
                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/20 border-white/5 text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-cyan-400 animate-ping' : 'bg-gray-500'}`} />
                    <span>{t.micStatus}: {isListening ? t.listening : t.off}</span>
                  </div>
                  <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border text-[9px] font-mono ${
                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-black/20 border-white/5 text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-pink-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span>AI: {isAnalyzing ? t.analyzing : t.idle}</span>
                  </div>
                </div>

                {!isListening ? (
                  <button
                    onClick={startMonitoring}
                    className="w-full py-1.5 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{t.startMonitoring}</span>
                  </button>
                ) : (
                  <button
                    onClick={stopMonitoring}
                    className="w-full py-1.5 rounded bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-500 hover:to-pink-600 text-xs font-bold text-white flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>{t.stopMonitoring}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Simulator Card (Takes remaining height) */}
            <div className={`border rounded-xl p-4 shadow-lg flex-1 min-h-0 flex flex-col justify-between transition-all duration-300 ${
              isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#12131a]/95 border-white/10 text-gray-100'
            }`}>
              <div className="flex items-center space-x-2 mb-2 border-b pb-1.5 border-inherit/10">
                <Activity className="w-3.5 h-3.5 text-cyber-pink" />
                <h2 className={`text-xs font-bold uppercase font-mono ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                  {t.simulator}
                </h2>
              </div>

              <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                {/* Slider */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-mono text-gray-400">{t.atmosphereValue}</span>
                    <span className="text-[10px] font-mono font-bold text-cyber-pink">{tensionLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tensionLevel}
                    onChange={(e) => triggerSimulation(parseInt(e.target.value, 10))}
                    className={`w-full h-1 rounded cursor-pointer accent-cyber-pink ${
                      isLightMode ? 'bg-slate-200' : 'bg-black/40'
                    }`}
                  />
                </div>

                {/* Values */}
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => triggerSimulation(15)}
                    className={`py-1 border rounded text-[9px] font-mono cursor-pointer ${
                      isLightMode ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {t.stableButton}
                  </button>
                  <button
                    onClick={() => triggerSimulation(55)}
                    className={`py-1 border rounded text-[9px] font-mono cursor-pointer ${
                      isLightMode ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {t.tenseButton}
                  </button>
                  <button
                    onClick={() => triggerSimulation(85)}
                    className={`py-1 border rounded text-[9px] font-mono cursor-pointer ${
                      isLightMode ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white/5 border-white/5 hover:bg-white/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {t.crisisButton}
                  </button>
                </div>

                {/* Text Injections */}
                <div className="pt-1.5 border-t border-inherit/10 space-y-1.5">
                  <span className={`block text-[9px] font-mono uppercase ${isLightMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t.injectLabel}
                  </span>
                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => loadDemoDialogue('chill')}
                      className={`flex-1 py-1 border rounded text-[10px] font-mono cursor-pointer transition-colors ${
                        isLightMode ? 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100/60' : 'bg-cyan-950/20 border-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {t.loadPeacefulDemo}
                    </button>
                    <button
                      onClick={() => loadDemoDialogue('tense')}
                      className={`flex-1 py-1 border rounded text-[10px] font-mono cursor-pointer transition-colors ${
                        isLightMode ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100/60' : 'bg-red-950/20 border-red-500/20 text-red-300'
                      }`}
                    >
                      {t.loadAngryDemo}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sound & Reset */}
              <div className="pt-2 border-t border-inherit/10 flex items-center justify-between flex-shrink-0">
                <button
                  onClick={playGong}
                  className={`py-1 px-2 border rounded text-[10px] font-mono flex items-center space-x-1 cursor-pointer ${
                    isLightMode ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/60' : 'bg-purple-950/30 border-purple-500/30 text-purple-300'
                  }`}
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{t.testGong}</span>
                </button>

                <button
                  onClick={clearLogsAndTranscripts}
                  className={`py-1 px-2 border rounded text-[10px] font-mono flex items-center space-x-1 cursor-pointer ${
                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.resetAll}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Middle Column: Radar Gauge and Collapsed Logs */}
          <section className="lg:col-span-4 flex flex-col space-y-4 h-full min-h-0">
            
            {/* SVG circular gauge (Auto expands when logs are collapsed) */}
            <div className={`border rounded-xl p-4 shadow-lg flex-1 min-h-0 flex flex-col items-center justify-between relative transition-all duration-300 ${
              isLightMode ? 'bg-white border-slate-200 shadow-slate-200/55' : 'bg-[#12131a]/95 border-white/10'
            }`}>
              
              {/* Ambient colorful grid backdrop glow */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 ${currentTheme.bgGlow} rounded-full blur-3xl transition-colors duration-1000 pointer-events-none`} />

              <div className="w-full flex items-center justify-between border-b pb-2 border-inherit/10 z-10">
                <span className={`text-[10px] font-mono uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {t.gaugeTitle}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {t.updateLoop}
                </span>
              </div>

              {/* Shrunk Circular Gauge */}
              <div className="relative my-2 z-10 select-none">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background Ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    stroke={isLightMode ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)'}
                    strokeWidth="6"
                    fill="transparent"
                  />
                  {/* Active Progress Ring */}
                  <circle
                    className="transition-all duration-1000 ease-out"
                    cx="60"
                    cy="60"
                    r="45"
                    stroke={`var(--color-cyber-${tensionLevel >= 70 ? 'red' : tensionLevel >= 40 ? 'pink' : 'cyan'})`}
                    strokeWidth="6"
                    strokeDasharray="282.74"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Inner score reading */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black font-mono tracking-tighter ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                    {tensionLevel}
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">
                    Tension
                  </span>
                </div>
              </div>

              {/* Atmosphere status readouts */}
              <div className="w-full space-y-2 text-center z-10">
                <div className={`inline-block px-3 py-1 rounded border shadow-md ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/60 border-white/10'
                }`}>
                  <span className={`text-xs font-black tracking-wide uppercase ${currentTheme.color}`}>
                    {currentTheme.label}
                  </span>
                </div>

                {/* Score bar */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden border ${isLightMode ? 'bg-slate-200 border-slate-300' : 'bg-black/40 border-white/5'}`}>
                  <div
                    className={`h-full ${currentTheme.barColor} transition-all duration-1000 ease-out`}
                    style={{ width: `${tensionLevel}%` }}
                  />
                </div>

                {/* Commentary */}
                <p className={`text-[10px] px-2 py-1.5 rounded border leading-relaxed select-text ${
                  isLightMode ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/5 text-gray-400'
                }`}>
                  {currentTheme.commentary}
                </p>
              </div>

              {/* User Friendly API Error Callout Banner */}
              {friendlyApiError && (
                <div className="w-full mt-2 p-2 bg-red-950/40 border border-red-500/40 rounded flex items-start space-x-1.5 animate-pulse z-25 text-left">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[9px] text-red-300 font-mono">
                    <span className="font-bold block text-red-200">{t.aiErrorOccurred}</span>
                    {friendlyApiError}
                  </div>
                </div>
              )}

            </div>

            {/* Logs panel (Collapsed by default, click header or chevron to toggle) */}
            <div className={`border rounded-xl p-3 shadow-lg flex flex-col min-h-0 overflow-hidden transition-all duration-300 ${
              isLogsCollapsed ? 'h-[38px] flex-shrink-0' : 'h-[180px] flex-shrink-0'
            } ${
              isLightMode ? 'bg-white border-slate-200 shadow-slate-100 text-slate-800' : 'bg-[#12131a]/85 border-white/5 text-gray-100'
            }`}>
              {/* Tab Selector / Header */}
              <div className="flex items-center justify-between border-b border-inherit/10 pb-1.5 mb-2 flex-shrink-0">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setHistoryTab('scan');
                      setIsLogsCollapsed(false); // Expand on tab click
                    }}
                    className={`text-[11px] font-mono font-bold uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${
                      historyTab === 'scan' && !isLogsCollapsed
                        ? 'text-cyber-purple border-cyber-purple font-bold'
                        : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    {t.scanLog}
                  </button>
                  <button
                    onClick={() => {
                      setHistoryTab('system');
                      setIsLogsCollapsed(false); // Expand on tab click
                    }}
                    className={`text-[11px] font-mono font-bold uppercase tracking-wider pb-1 transition-all border-b-2 cursor-pointer ${
                      historyTab === 'system' && !isLogsCollapsed
                        ? 'text-cyber-cyan border-cyber-cyan font-bold'
                        : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    {t.systemLog}
                  </button>
                </div>
                
                <button
                  onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
                  className="p-0.5 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  title={isLogsCollapsed ? "開く" : "閉じる"}
                >
                  {isLogsCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Tab Content (Rendered only when expanded) */}
              {!isLogsCollapsed && (
                <div className="flex-grow overflow-y-auto text-[10px] font-mono pr-1 min-h-0">
                  {historyTab === 'scan' ? (
                    analysisHistory.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-500 text-[10px]">
                        {t.noScanLog}
                      </div>
                    ) : (
                      analysisHistory.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-0.5 border-b border-inherit/10">
                          <div className="flex items-center space-x-1.5 truncate mr-2">
                            <span className="text-gray-500">[{item.timestamp.toLocaleTimeString()}]</span>
                            <span className={`truncate select-text ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>
                              {item.texts.length > 0 ? item.texts.join(', ') : '(No text)'}
                            </span>
                          </div>
                          <span className={`font-bold flex-shrink-0 ${item.score >= 70 ? 'text-cyber-red' : item.score >= 40 ? 'text-cyber-pink' : 'text-cyber-cyan'}`}>
                            {item.score}%
                          </span>
                        </div>
                      ))
                    )
                  ) : (
                    <div className={`space-y-0.5 ${isLightMode ? 'text-slate-500' : 'text-gray-500'}`}>
                      {systemLogs.map((log, index) => (
                        <div key={index} className="leading-normal break-words select-text">
                          {log}
                        </div>
                      ))}
                      <div ref={logEndRef} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Live Timeline (Takes full height) */}
          <section className="lg:col-span-4 flex flex-col h-full min-h-0">
            <div className={`border rounded-xl p-4 shadow-lg flex flex-col h-full min-h-0 transition-all duration-300 ${
              isLightMode ? 'bg-white border-slate-200 shadow-slate-200/55' : 'bg-[#12131a]/95 border-white/10'
            }`}>
              
              <div className="flex items-center justify-between border-b pb-2 mb-3 border-inherit/10 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-cyber-cyan" />
                  <h2 className={`text-xs font-bold uppercase font-mono ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                    {t.dialogueTimeline}
                  </h2>
                </div>
                <span className="text-[9px] font-mono text-gray-500 px-1.5 py-0.5 bg-white/5 rounded">
                  {t.bufferInfo}
                </span>
              </div>

              {/* Transcript Timeline Messages */}
              <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 mb-3 min-h-0">
                {transcripts.length === 0 && !interimTranscript ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs font-mono text-gray-600">
                      {t.timelineEmpty}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1.5 max-w-[180px]">
                      {t.timelineEmptyDesc}
                    </p>
                  </div>
                ) : (
                  transcripts.map((tItem) => (
                    <div key={tItem.id} className={`p-2 rounded border transition-colors ${
                      isLightMode ? 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300/80' : 'bg-black/30 border-white/5 hover:border-white/10'
                    }`}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-[9px] font-mono ${isLightMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {tItem.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-[9px] font-mono text-cyber-cyan bg-cyan-950/15 px-1 rounded">
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
                  <div className="p-2 rounded bg-cyan-950/10 border border-cyber-cyan/20 animate-pulse">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[9px] font-mono text-cyber-cyan font-bold">
                        {t.nowSpeaking}
                      </span>
                      <span className="text-[8px] font-mono text-cyber-cyan bg-cyan-900/30 px-1 rounded">
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

              {/* Manual Input Form */}
              <form onSubmit={handleAddManualSpeech} className="mt-auto border-t border-white/5 pt-3 flex space-x-2 flex-shrink-0">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={t.placeholderManual}
                  className={`flex-grow px-2 py-1.5 border rounded text-xs font-mono transition-all ${
                    isLightMode
                      ? 'border-slate-300 bg-slate-50 text-slate-800 placeholder-slate-400 focus:ring-cyber-cyan focus:border-cyber-cyan'
                      : 'border-white/10 bg-black/50 text-gray-300 placeholder-gray-600 focus:ring-cyber-cyan focus:border-cyber-cyan'
                  }`}
                />
                <button
                  type="submit"
                  className="p-1.5 rounded bg-cyber-cyan/20 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </section>
        </main>
      ) : (
        /* TAB 2: API KEY GET GUIDE (SUBPAGE) */
        <main className={`w-full max-w-4xl mx-auto flex-grow border rounded-xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 overflow-y-auto ${
          isLightMode ? 'bg-white border-slate-200 text-slate-800 shadow-slate-200/55' : 'bg-[#12131a]/95 border-white/10 text-gray-100'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center space-x-3 border-b pb-3 mb-4 border-inherit/10">
            <HelpCircle className="w-5 h-5 text-cyber-cyan" />
            <div>
              <h2 className="text-base font-bold font-mono">
                Gemini API キー 無料取得手順ガイド
              </h2>
              <p className="text-[10px] text-gray-500">How to get a Google Gemini API Key for free</p>
            </div>
          </div>

          <div className="space-y-4 leading-relaxed font-sans text-xs">
            
            {/* Free Tier Callout */}
            <div className={`p-3 rounded flex items-start space-x-2.5 border ${
              isLightMode ? 'bg-cyan-50 border-cyan-200 text-cyan-900' : 'bg-cyan-950/20 border-cyber-cyan/30 text-gray-300'
            }`}>
              <Info className="w-4 h-4 text-cyber-cyan flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-cyber-cyan font-mono">完全無料で利用可能</h3>
                <p className="text-[10px] leading-relaxed">
                  Google AI Studioの <strong>Gemini API 無料枠</strong> は、毎分15リクエスト、1日1500リクエストまで課金なしで利用できます。本アプリの空気自動解析は <strong>18秒に1回</strong>（毎分3回）なので、長時間の会議でも上限に達せず、<strong>完全無料</strong>で運用可能です。
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold border-l-2 border-cyber-purple pl-1.5 font-mono">
                取得手順（約1分）
              </h3>
              
              <ol className="relative border-l ml-2 space-y-4 border-inherit/10">
                
                <li className="ml-4">
                  <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-black/80 border border-cyber-purple text-[10px] font-mono font-bold text-cyber-purple">
                    1
                  </span>
                  <h4 className="text-xs font-bold font-mono">
                    Google AI Studio にアクセス
                  </h4>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 mt-1 px-2.5 py-1 rounded bg-cyber-purple/20 border border-cyber-purple/40 hover:bg-cyber-purple/30 text-[10px] font-mono text-white transition-all"
                  >
                    <span>Google AI Studio を開く</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>

                <li className="ml-4">
                  <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono font-bold text-gray-400">
                    2
                  </span>
                  <h4 className="text-xs font-bold font-mono">
                    Googleアカウントでログイン
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    お持ちの通常のGoogleアカウント（Gmail等）でログインします。
                  </p>
                </li>

                <li className="ml-4">
                  <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono font-bold text-gray-400">
                    3
                  </span>
                  <h4 className="text-xs font-bold font-mono">
                    「Get API Key」をクリック
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    画面の左上にある青い **「Get API key」** ボタンを押します。
                  </p>
                </li>

                <li className="ml-4">
                  <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono font-bold text-gray-400">
                    4
                  </span>
                  <h4 className="text-xs font-bold font-mono">
                    キーをコピー
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    「Create API key in new project」を選択して生成された `AIzaSy...` をコピーします。
                  </p>
                </li>

                <li className="ml-4">
                  <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-black/80 border border-cyber-cyan text-[10px] font-mono font-bold text-cyber-cyan shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                    5
                  </span>
                  <h4 className="text-xs font-bold font-mono">
                    アプリの制御盤に保存
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    「レーダー」画面に戻り、左側の「Gemini API キー」欄にペーストして保存します。
                  </p>
                </li>

              </ol>
            </div>

            {/* Privacy */}
            <div className="pt-3 border-t border-inherit/10 space-y-1">
              <h3 className="text-xs font-bold font-mono flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>セキュリティとプライバシー</span>
              </h3>
              <p className={`text-[10px] leading-relaxed pl-4.5 ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                キーはブラウザ(LocalStorage)にのみ安全に保存され、開発者や第三者のサーバーに送信されることは一切ありません。
              </p>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-1.5 rounded border text-[10px] font-mono transition-all active:scale-95 cursor-pointer ${
                  isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                }`}
              >
                ← レーダーに戻る
              </button>
            </div>

          </div>
        </main>
      )}
    </div>
  );
}
