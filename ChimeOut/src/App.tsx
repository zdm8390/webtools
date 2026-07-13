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
  ExternalLink
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

export default function App() {
  // --- State Variables ---
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
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

  // --- Refs ---
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(isListening);
  const apiKeyRef = useRef<string>(apiKey);
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
    transcriptsRef.current = transcripts;
  }, [transcripts]);

  useEffect(() => {
    lastTensionLevelRef.current = lastTensionLevel;
  }, [lastTensionLevel]);

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
    setTimeout(() => setApiSaveSuccess(false), 2000);
  };

  // --- Speech Recognition Logic ---
  const startMonitoring = () => {
    if (!SpeechRecognition) {
      setError('Your browser does not support Speech Recognition. Please use Chrome or Edge.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please input and save your Gemini API Key first.');
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

    setIsAnalyzing(true);
    addSystemLog('Atmosphere Scan: Sending buffer to Gemini 1.5 Flash...');

    // Format transcripts
    const bufferText = buffer
      .map((t) => {
        const timeStr = t.timestamp.toLocaleTimeString();
        return `[${timeStr}] ${t.text}`;
      })
      .join('\n');

    const prompt = `以下の会議の発言ログを分析し、場の空気の『不穏さ・ピリつき度・険悪さ』を0から100の数値だけで評価してください。余計な解説、挨拶、文字は一切出力せず、必ず半角数字（例: 75）のみを返してください。

■ 発言ログ：
${bufferText}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
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
      addSystemLog(`Scan Error: ${err.message}`);
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
    setAnalysisHistory((prevHist) => [
      {
        timestamp: new Date(),
        score: score,
        texts: ['(Simulated evaluation values)']
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
    addSystemLog('Logs and speech buffers cleared.');
  };

  // --- UI Helpers ---
  const getAtmosphereTheme = (val: number) => {
    if (val >= 70) {
      return {
        color: 'text-cyber-red',
        borderColor: 'border-glow-red',
        bgGlow: 'bg-red-500/10',
        label: 'CRITICAL (険悪)',
        textColor: 'text-red-500',
        barColor: 'bg-cyber-red',
        commentary: '⚠️ 険悪な空気を検知。発言者の声調・単語のトゲが強まっています。防音装備または撤退を推奨。'
      };
    } else if (val >= 40) {
      return {
        color: 'text-cyber-pink animate-pulse',
        borderColor: 'border-glow-pink',
        bgGlow: 'bg-pink-500/10',
        label: 'TENSE (緊張)',
        textColor: 'text-pink-400',
        barColor: 'bg-cyber-pink',
        commentary: '⚡ 微妙なピリつき、または沈黙が発生している可能性があります。慎重に言葉を選んでください。'
      };
    } else {
      return {
        color: 'text-cyber-cyan',
        borderColor: 'border-glow-cyan',
        bgGlow: 'bg-cyan-500/10',
        label: 'STABLE (良好)',
        textColor: 'text-cyan-400',
        barColor: 'bg-cyber-cyan',
        commentary: '🟢 場の空気は極めて平穏です。ユーモアや軽い雑談も受け入れられるコンディションです。'
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
    <div className="min-h-screen w-full relative flex flex-col p-4 md:p-6 cyber-grid cyber-scanline select-none">
      
      {/* Full screen ominous flashing overlay if tension >= 70 */}
      {tensionLevel >= 70 && (
        <div className="fixed inset-0 pointer-events-none z-50 animate-warning-flash" />
      )}

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <ShieldAlert className="w-8 h-8 text-cyber-purple glow-purple" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 font-sans uppercase">
              Chime-Out Radar
            </h1>
            <p className="text-xs text-gray-500 font-mono">Atmosphere & Tension Detector v1.0.2</p>
          </div>
        </div>

        {/* Dynamic State Indicators */}
        <div className="flex flex-wrap gap-2 items-center justify-end">
          {/* Microphone status badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-cyan-400 animate-ping' : 'bg-gray-500'}`} />
            <span className="text-xs font-mono uppercase text-gray-300">
              Mic: {isListening ? 'Listening' : 'Off'}
            </span>
          </div>

          {/* AI scan status badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className={`w-2.5 h-2.5 rounded-full ${isAnalyzing ? 'bg-pink-400 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-xs font-mono uppercase text-gray-300">
              AI: {isAnalyzing ? 'Analyzing' : 'Idle'}
            </span>
          </div>

          {/* Threat level indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className={`w-2.5 h-2.5 rounded-full ${tensionLevel >= 70 ? 'bg-red-500 animate-ping' : 'bg-gray-500'}`} />
            <span className="text-xs font-mono uppercase text-gray-300">
              Level: {tensionLevel >= 70 ? 'Hostile' : 'Secure'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Section */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* Left Side: Controller / Setup */}
        <section className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Card 1: Configuration Panel */}
          <div className="bg-[#12131a]/95 border border-white/10 rounded-xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center space-x-2 mb-4 border-b border-white/5 pb-3">
              <Settings className="w-4 h-4 text-cyber-purple" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-gray-300 font-mono">
                System Control Board
              </h2>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-lg flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-300 font-mono">{error}</span>
              </div>
            )}

            {/* API Key Form */}
            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <label className="block text-xs font-mono text-gray-400 uppercase">
                Gemini API Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4.5 w-4.5 text-gray-500" />
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 border border-white/10 rounded-lg bg-black/40 text-gray-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-cyber-purple focus:border-cyber-purple"
                  placeholder="AIzaSy..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex justify-between items-center pt-1">
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyber-cyan hover:underline flex items-center space-x-0.5"
                >
                  <span>Get Gemini API Key</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-gradient-to-r from-cyber-purple to-cyber-pink text-xs font-mono font-bold text-white hover:opacity-90 active:scale-95 transition-all duration-150 flex items-center space-x-1"
                >
                  {apiSaveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save Key</span>
                  )}
                </button>
              </div>
            </form>

            {/* Speech Recognition Controls */}
            <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
              <label className="block text-xs font-mono text-gray-400 uppercase">
                Atmosphere Monitoring
              </label>

              {!isListening ? (
                <button
                  onClick={startMonitoring}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-sm font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-[0.98]"
                >
                  <Mic className="w-4.5 h-4.5 animate-pulse" />
                  <span>Start Monitoring</span>
                </button>
              ) : (
                <button
                  onClick={stopMonitoring}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-500 hover:to-pink-600 text-sm font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-[0.98]"
                >
                  <MicOff className="w-4.5 h-4.5" />
                  <span>Stop Monitoring</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Simulation Panel (Crucial for Demo/Testing) */}
          <div className="bg-[#12131a]/95 border border-white/10 rounded-xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-2 mb-4 border-b border-white/5 pb-3">
              <Activity className="w-4 h-4 text-cyber-pink" />
              <h2 className="text-sm font-bold tracking-wider uppercase text-gray-300 font-mono">
                Atmosphere Simulator
              </h2>
            </div>

            <div className="space-y-4">
              {/* Slider simulation */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono text-gray-400">Atmosphere Value</span>
                  <span className="text-xs font-mono font-bold text-cyber-pink">{tensionLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tensionLevel}
                  onChange={(e) => triggerSimulation(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-cyber-pink"
                />
              </div>

              {/* Quick simulation buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => triggerSimulation(15)}
                  className="py-1.5 px-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded text-[10px] font-mono text-cyan-400"
                >
                  Stable (15%)
                </button>
                <button
                  onClick={() => triggerSimulation(55)}
                  className="py-1.5 px-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded text-[10px] font-mono text-pink-400"
                >
                  Tense (55%)
                </button>
                <button
                  onClick={() => triggerSimulation(85)}
                  className="py-1.5 px-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded text-[10px] font-mono text-red-400 animate-pulse border-red-500/30"
                >
                  Crisis (85%)
                </button>
              </div>

              {/* Demo text loaders */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <span className="block text-[10px] font-mono text-gray-500 uppercase">Inject Dialogue Snippets</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadDemoDialogue('chill')}
                    className="flex-1 py-1.5 bg-cyan-950/20 border border-cyan-500/20 hover:bg-cyan-900/30 rounded text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    💬 Load Peaceful Demo
                  </button>
                  <button
                    onClick={() => loadDemoDialogue('tense')}
                    className="flex-1 py-1.5 bg-red-950/20 border border-red-500/20 hover:bg-red-900/30 rounded text-xs font-mono text-red-300 hover:text-red-200 transition-colors"
                  >
                    🔥 Load Angry Demo
                  </button>
                </div>
              </div>

              {/* Test Audio & Reset */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={playGong}
                  className="py-1.5 px-3 bg-purple-950/30 border border-purple-500/30 hover:bg-purple-900/40 rounded text-xs font-mono text-purple-300 flex items-center space-x-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Gong Sound</span>
                </button>

                <button
                  onClick={clearLogsAndTranscripts}
                  className="py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded text-xs font-mono text-gray-400 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Center: Tension Visualizer Gauge */}
        <section className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-[#12131a]/95 border border-white/10 rounded-xl p-6 shadow-2xl flex flex-col items-center justify-between flex-grow min-h-[400px] relative overflow-hidden">
            
            {/* Ambient colorful grid backdrop glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${currentTheme.bgGlow} rounded-full blur-3xl transition-colors duration-1000 pointer-events-none`} />

            <div className="w-full flex items-center justify-between border-b border-white/5 pb-3 z-10">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Atmosphere Scanner Gauge
              </span>
              <span className="text-xs font-mono text-gray-500">
                18s Update Loop
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
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Glowing border ring */}
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.05)"
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
                <span className="text-6xl font-black font-mono tracking-tighter text-white select-text">
                  {tensionLevel}
                </span>
                <span className="text-xs font-mono tracking-widest text-gray-500 uppercase">
                  Tension %
                </span>
              </div>
            </div>

            {/* Atmosphere status readouts */}
            <div className="w-full space-y-4 text-center z-10">
              <div className="inline-block px-4 py-1.5 rounded border border-white/10 bg-black/60 shadow-lg">
                <span className="text-xs font-mono text-gray-400 block mb-0.5">ATMOSPHERE STATUS</span>
                <span className={`text-base font-extrabold tracking-wide uppercase ${currentTheme.color} transition-all duration-500`}>
                  {currentTheme.label}
                </span>
              </div>

              {/* Score bar */}
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full ${currentTheme.barColor} transition-all duration-1000 ease-out`}
                  style={{ width: `${tensionLevel}%` }}
                />
              </div>

              {/* Fun / Snarky advice banner */}
              <p className="text-xs text-gray-400 italic bg-white/5 border border-white/5 p-3 rounded-lg leading-relaxed select-text">
                {currentTheme.commentary}
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Live Timeline */}
        <section className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-[#12131a]/95 border border-white/10 rounded-xl p-5 shadow-2xl flex flex-col h-[500px] relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyber-cyan" />
                <h2 className="text-sm font-bold tracking-wider uppercase text-gray-300 font-mono">
                  Dialogue Timeline
                </h2>
              </div>
              <span className="text-[10px] font-mono text-gray-500 px-2 py-0.5 bg-white/5 rounded">
                Buffer (30s / last 5)
              </span>
            </div>

            {/* Transcript Timeline Messages */}
            <div className="flex-grow overflow-y-auto space-y-3 pr-2 mb-4">
              {transcripts.length === 0 && !interimTranscript ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs font-mono text-gray-600">
                    -- TIMELINE IS EMPTY --
                  </p>
                  <p className="text-[11px] text-gray-500 mt-2 max-w-[200px]">
                    Start monitoring or load a demo dialogue to begin tracking tension.
                  </p>
                </div>
              ) : (
                transcripts.map((t) => (
                  <div key={t.id} className="p-2.5 rounded bg-black/30 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-gray-500">
                        {t.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-[9px] font-mono text-cyber-cyan bg-cyan-950/20 px-1 rounded">
                        Final
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono break-words leading-relaxed select-text">
                      {t.text}
                    </p>
                  </div>
                ))
              )}

              {/* Interim Transcript (Real time preview) */}
              {interimTranscript && (
                <div className="p-2.5 rounded bg-cyan-950/10 border border-cyber-cyan/20 animate-pulse">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono text-cyber-cyan">
                      Now speaking...
                    </span>
                    <span className="text-[9px] font-mono text-cyber-cyan bg-cyan-900/30 px-1 rounded">
                      Interim
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
                placeholder="Type manual speech text..."
                className="flex-grow px-3 py-2 border border-white/10 rounded-lg bg-black/50 text-xs font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyber-cyan focus:border-cyber-cyan"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyber-cyan hover:bg-cyan-900/50 active:scale-95 transition-all"
                title="Send speech text"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer Area: Historical Log and System Event Logs */}
      <footer className="w-full max-w-7xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Atmosphere scan history */}
        <div className="bg-[#12131a]/85 border border-white/5 rounded-xl p-4 shadow-xl flex flex-col h-[200px]">
          <div className="flex items-center space-x-1.5 border-b border-white/5 pb-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-cyber-purple" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
              Atmosphere Scan Log (History)
            </span>
          </div>
          <div className="flex-grow overflow-y-auto space-y-1.5 text-xs font-mono pr-1">
            {analysisHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600 text-[10px]">
                No evaluations recorded yet.
              </div>
            ) : (
              analysisHistory.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">[{item.timestamp.toLocaleTimeString()}]</span>
                    <span className="text-gray-300 max-w-[200px] truncate">
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
        <div className="bg-[#12131a]/85 border border-white/5 rounded-xl p-4 shadow-xl flex flex-col h-[200px]">
          <div className="flex items-center space-x-1.5 border-b border-white/5 pb-2 mb-2">
            <Terminal className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
              System Operations Logs
            </span>
          </div>
          <div className="flex-grow overflow-y-auto space-y-1 text-[10px] font-mono text-gray-500 pr-1">
            {systemLogs.map((log, index) => (
              <div key={index} className="leading-normal break-words select-text">
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

      </footer>
    </div>
  );
}
