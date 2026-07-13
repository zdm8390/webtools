import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { 
  Sparkles, 
  BookOpen, 
  Flame, 
  Construction, 
  Copy, 
  Settings, 
  Check, 
  Trash2, 
  Cpu, 
  Terminal, 
  Key,
  X,
  History,
  Info
} from 'lucide-react'

// Define the template configurations for each mode
interface CommitTemplate {
  name: string;
  sub: string;
  neonColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  buttonTexts: string[];
  copyFeedback: string;
  fontClass: string;
  templates: ((action: string, target: string, raw: string) => string)[];
}

interface CommitTemplates {
  [key: string]: CommitTemplate;
}

const COMMIT_TEMPLATES: CommitTemplates = {
  netmeme: {
    name: 'ネットミーム',
    sub: '働いたら負け。動いたからヨシ！',
    neonColor: '#fbbf24', // yellow-400
    bgColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    textColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-400/20',
    badgeText: 'text-yellow-300',
    buttonTexts: ['給料泥棒モード起動', '現実から目を背ける', '「ヨシ！」と叫ぶ'],
    copyFeedback: '草生え散らかしました！ｗｗｗ',
    fontClass: 'font-mochi',
    templates: [
      (action, target) => `動いたからヨシ！👈( ﾟ∀ﾟ ) (${target}を${action}した気がする)`,
      (action, target) => `なんかすごいいい感じに${target}を${action}した。知らんけど`,
      (action, target) => `「${target}を${action}した」ってコト！？ワァ……（泣）`,
      (action, target) => `どうして${target}を${action}したのに動かないんですか？なぁぜなぁぜ？`,
      (action, target) => `もう何もわかりません。${target}も何もかも無視して${action}、ヨシ！`,
      (action, target) => `【悲報】${target}、バグり散らかす。ワイ、無言の強制${action}。`,
      (action, target) => `完全に理解した（何もわかってない）ので${target}を${action}した。`
    ]
  },
  haruki: {
    name: '村上春樹',
    sub: 'やれやれ。完璧なコードなど存在しない。',
    neonColor: '#94a3b8', // slate-400
    bgColor: 'rgba(148, 163, 184, 0.08)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    textColor: 'text-slate-300',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    buttonTexts: ['孤独をコミットする', 'やれやれと呟く', '冷えたビールを開ける'],
    copyFeedback: 'やれやれ。コピーされたよ。',
    fontClass: 'font-tegumin',
    templates: [
      (action, target) => `完璧な${target}などといったものは存在しない。完璧な絶望が存在しないようにね。僕はただ、深夜の静寂の中で誰も読まないであろう${target}の${action}を静かに終わらせた。やれやれ。`,
      (action, target) => `彼女は僕の${target}を見て、少し哀しそうに微笑んだ。「ねえ、それって本当に${action}されたの？」と。僕は何も答えず、ただレコードの針を落とした。それがすべてだった。`,
      (action, target) => `僕たちが${target}を失ってから、もうずいぶんと長い時間が経ったような気がする。冷えたビールを飲みながら、僕は静かに${action}のコミットメッセージを書いている。やれやれ。`,
      (action, target) => `ビールを開け、ステレオから流れるマイルス・デイヴィスに耳を澄ませる。僕が${target}について考えていると、猫が静かにキーボードの上を通り過ぎた。${action}する。そういうこともあるさ。`,
      (action, target) => `世界の終わりに、僕らは${target}を${action}する。静かな雨が降る午後にふさわしい、静かなコミットだ。`,
      (action, target) => `やれやれ。僕が${target}を${action}したところで、世界が1ミリでも良くなるわけじゃない。それでも僕は、古いセーターのほつれを直すようにキーボードを叩いた。`
    ]
  },
  paprika: {
    name: 'パプリカ',
    sub: 'バグのパレードがやってくる！',
    neonColor: '#db2777', // pink-600
    bgColor: 'rgba(219, 39, 119, 0.08)',
    borderColor: 'rgba(219, 39, 119, 0.3)',
    textColor: 'text-pink-400',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-300',
    buttonTexts: ['夢のパレードへ', 'コンパイルの海で踊る', '狂気のゲートを開く'],
    copyFeedback: 'コンパイルエラーのシーツが干されました！',
    fontClass: 'font-dela',
    templates: [
      (action, target) => `バグのパレードがやってくるよ！量子化された${target}たちが${action}の神輿を担いで、型安全の向こう側で踊っているんだ。ほら、コンパイルエラーのシーツを干し忘れたからさ！`,
      (action, target) => `オセアニアの風が${target}のスカートをなびかせる時、夢の回路は「${action}！」と叫びながらネットの海へ融解していく。コンパイラよ、祝祭のラッパを吹き鳴らせ！`,
      (action, target) => `見てごらん、三次元の${target}が二次元の虚数空間で${action}のダンスを踊っている。私たちの夢は、いつだってコミットログの隙間に隠されているんだよ！`,
      (action, target) => `冷蔵庫たちの夢がコンパイルを呼び覚ます！ほら、${target}がパレードの先頭で旗を振っているよ。祝祭としての${action}が今、始まる！`,
      (action, target) => `バグも仕様も、すべての祝祭の中に溶けていく！総天然色の${target}が、五次元のネットの海で${action}のパレードを踊っているよ！`,
      (action, target) => `量子もつれのステップを踏んで、${target}は夜明けの光の中に${action}される。これこそが、電脳パレードの正しい形なんだ！`
    ]
  },
  sambomaster: {
    name: 'サンボマスター',
    sub: 'お前ら全員愛してるぞ！ロックンロール！',
    neonColor: '#ef4444', // red-500
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    buttonTexts: ['ロックンロールを叫ぶ！', '愛をコンパイルする！', 'ミラクルを起こす！'],
    copyFeedback: '愛とロックンロールが爆発しました！！',
    fontClass: 'font-sans font-extrabold tracking-wider',
    templates: [
      (action, target) => `お前ら！この世界はですね、愛が足りないんですよ！だから僕はね、あなたの画面の向こう側にいるあなたのために、この「${target}の${action}」を魂込めてぶち込んだわけです！これが僕のロックンロールなんですよ！`,
      (action, target) => `諦めるなよお前ら！どんなに${target}が崩壊しようと、僕らの${action}は絶対に終わらないんですよ！信じること、それがすべてだってわけです！愛してるぜ！ロックンロール！`,
      (action, target) => `ミラクルを起こすんですよ！僕はね、あなたと${target}のために、この数行のコードを${action}したんです！これが、これが僕たちの新しい始まりってわけですよ！！`,
      (action, target) => `誰がなんと言おうと、あなたの${target}は美しいんですよ！だから僕は${action}をやめない！お前ら全員で、明日へ向かって叫びましょう！ロックンロール！！`,
      (action, target) => `愛なんですよ！愛！この${target}にはそれが必要だった！だから僕は${action}した！あなたの心が震えるような、そんなコミットメッセージなんだ！`,
      (action, target) => `お前らの悲しみは全部僕が引き受ける！だからこの${target}の${action}を見てくれ！これが僕らの！僕らだけの生きた証なんですよ！！`
    ]
  }
};

// Help extract key features from the commit message
const extractKeywords = (input: string) => {
  const cleanInput = input
    .replace(/^(feat|fix|chore|refactor|style|test|docs|ci|perf|build)(\([^)]+\))?:\s*/i, '')
    .trim();
  
  if (!cleanInput) {
    return { action: '開発', target: '虚無コード' };
  }

  const words = cleanInput.toLowerCase().split(/\s+/);
  
  let action = 'いじくる';
  let target = cleanInput;

  // Verb matching heuristics (JP/EN)
  if (words.some(w => ['fix', 'bug', 'error', 'resolve', 'issue', 'crash', 'deadlock', '修正', '直す', 'バグ', '不具合', 'デバッグ'].includes(w))) {
    action = '修正';
  } else if (words.some(w => ['add', 'create', 'implement', 'feat', 'new', '追加', '実装', '新規', '作成'].includes(w))) {
    action = '追加';
  } else if (words.some(w => ['update', 'modify', 'change', 'improve', 'bump', '更新', '変更', '改善', '調整'].includes(w))) {
    action = '更新';
  } else if (words.some(w => ['remove', 'delete', 'clean', 'rm', 'purge', '削除', '消去', 'クリーン', '削る'].includes(w))) {
    action = '削除';
  } else if (words.some(w => ['refactor', 'optimize', 'clean', 'structure', 'リファクタ', '整理', '最適化'].includes(w))) {
    action = 'リファクタ';
  } else if (words.some(w => ['test', 'check', 'validate', 'テスト', '検証'].includes(w))) {
    action = 'テスト';
  }

  // Target extraction: remove common helper/verb words to isolate the noun
  const filterWords = [
    'fix', 'bug', 'error', 'resolve', 'issue', 'add', 'create', 'implement', 'feat', 'new',
    'update', 'modify', 'change', 'remove', 'delete', 'clean', 'refactor', 'optimize', 'test',
    'the', 'a', 'an', 'to', 'for', 'in', 'on', 'with', 'and', 'from', 'of',
    '修正', '追加', '更新', '削除', 'リファクタ', '実装', '変更', 'テスト', '作成', '改善'
  ];
  
  const filtered = cleanInput
    .split(/[\s_\-/]+/)
    .filter(w => !filterWords.includes(w.toLowerCase()) && w.length > 1);
    
  if (filtered.length > 0) {
    target = filtered.slice(0, 3).join(' '); // Grab the first few key subject terms
  } else {
    // Fallback target if everything was filtered out
    target = cleanInput;
  }

  return { action, target };
};

// Types for history item
interface HistoryItem {
  id: string;
  original: string;
  generated: string;
  mode: string;
  timestamp: string;
}

export default function App() {
  const [originalMessage, setOriginalMessage] = useState<string>('');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [mode, setMode] = useState<string>('netmeme');
  const [buttonIndex, setButtonIndex] = useState<number>(0);
  
  // Settings state
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [tempModel, setTempModel] = useState<string>('gemini-2.5-flash');
  
  // App state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copyFeedbackText, setCopyFeedbackText] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load configuration from local storage
  useEffect(() => {
    const savedKey = localStorage.getItem('shitcommit_api_key') || '';
    const savedModel = localStorage.getItem('shitcommit_model') || 'gemini-2.5-flash';
    const savedHistory = localStorage.getItem('shitcommit_history');
    
    setApiKey(savedKey);
    setTempApiKey(savedKey);
    setModel(savedModel);
    setTempModel(savedModel);
    
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse commit history', e);
      }
    }
  }, []);

  // Save history helper
  const updateHistory = (newItem: HistoryItem) => {
    setHistory(prev => {
      const updated = [newItem, ...prev.filter(item => item.generated !== newItem.generated)].slice(0, 30);
      localStorage.setItem('shitcommit_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Change button label when mode changes
  useEffect(() => {
    const labels = COMMIT_TEMPLATES[mode]?.buttonTexts || [];
    setButtonIndex(Math.floor(Math.random() * labels.length));
  }, [mode]);

  // Fetch response from Gemini API
  const fetchGeminiCommit = async (key: string, selectedModel: string, activeMode: string, input: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`;
    const modeMeta = COMMIT_TEMPLATES[activeMode];
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are ShitCommit Generator, a humor assistant that converts normal/technical commit messages or code changes into crazy, hilarious, or dramatic commit messages.
            
Selected Mode: "${activeMode}" (${modeMeta.name})
Instruction: ${modeMeta.sub}

Persona Guidelines for this mode:
${activeMode === 'netmeme' ? '- Work slacker. Uses net memes like "動いたからヨシ！", "なぁぜなぁぜ", "知らんけど", "◯◯ってコト！？". Sounds irresponsible, lazy, and triggers tech leads.' : ''}
${activeMode === 'haruki' ? '- Deeply poetic, reflective, nostalgic, lonely. Uses Murakami style: "やれやれ" (yare yare), descriptions of cold beer, vinyl records, cats, shadows, and elegant but overly dramatic prose about trivial code changes.' : ''}
${activeMode === 'paprika' ? '- Surreal, psychedelic, chaotic dream sequence. Uses cinema metaphors, parading machines, frog shrines, melting dimensions, colorful explosions, and highly intellectual nonsense.' : ''}
${activeMode === 'sambomaster' ? '- High-energy rock singer Yamaguchi (Sambomaster). Speaks in loud, emotional shouting! Calls out to "お前ら" (you guys) or "あなた" (you). Relentlessly mentions "愛" (love) and "ロックンロール" (rock and roll). Ends with sentences like "〜なんですよ！" or "〜ってわけです！"' : ''}

Convert this input code change: "${input}"

Rules:
1. Output ONLY the generated commit message.
2. The output MUST be in Japanese.
3. Keep it as one short line/paragraph suitable for a commit message (no bullet points, no explanation, no quotes).
4. Do NOT output markdown code blocks. Just plain text.`
          }]
        }],
        generationConfig: {
          temperature: 0.95,
          maxOutputTokens: 250
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error('API returned an empty response.');
    }
    
    return resultText.trim().replace(/^["'「`]|["'」`]$/g, ''); // Strip quotes if AI outputs them
  };

  // Run the conversion
  const handleGenerate = async () => {
    const rawInput = originalMessage.trim();
    setIsLoading(true);
    setErrorMessage('');
    
    // Choose button index for the next click
    const labels = COMMIT_TEMPLATES[mode]?.buttonTexts || [];
    setButtonIndex(Math.floor(Math.random() * labels.length));

    try {
      if (apiKey) {
        // Use Gemini API
        const textToConvert = rawInput || 'feat: random empty commit';
        const generated = await fetchGeminiCommit(apiKey, model, mode, textToConvert);
        setGeneratedMessage(generated);
        
        updateHistory({
          id: Math.random().toString(36).substring(2, 9),
          original: rawInput || '(空入力)',
          generated,
          mode,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        // Use Local Template-based generator
        const { action, target } = extractKeywords(rawInput);
        const templates = COMMIT_TEMPLATES[mode].templates;
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        const generated = randomTemplate(action, target, rawInput);
        setGeneratedMessage(generated);
        
        updateHistory({
          id: Math.random().toString(36).substring(2, 9),
          original: rawInput || '(空入力)',
          generated,
          mode,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gemini API接続中にエラーが発生しました。ローカルモードで生成します。');
      
      // Fallback immediately to local generator so user doesn't get blocked
      const { action, target } = extractKeywords(rawInput);
      const templates = COMMIT_TEMPLATES[mode].templates;
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      const generated = randomTemplate(action, target, rawInput);
      setGeneratedMessage(generated + ' (※APIエラーによるローカルフォールバック)');
      
      updateHistory({
        id: Math.random().toString(36).substring(2, 9),
        original: rawInput || '(空入力)',
        generated: generated + ' (※フォールバック)',
        mode,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Spark confetti based on the mode
  const triggerConfetti = (activeMode: string) => {
    const scalar = 2;
    
    if (activeMode === 'netmeme') {
      try {
        // @ts-ignore
        const grass = confetti.shapeFromText({ text: '草', scalar });
        // @ts-ignore
        const ww = confetti.shapeFromText({ text: 'w', scalar });
        confetti({
          shapes: [grass, ww],
          scalar,
          particleCount: 80,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#22c55e', '#16a34a', '#86efac']
        });
      } catch (e) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#22c55e', '#16a34a']
        });
      }
    } else if (activeMode === 'haruki') {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#64748b', '#475569', '#334155', '#94a3b8']
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#64748b', '#475569', '#334155', '#94a3b8']
      });
    } else if (activeMode === 'paprika') {
      const colors = ['#db2777', '#7c3aed', '#10b981', '#f59e0b', '#3b82f6'];
      try {
        // @ts-ignore
        const flower = confetti.shapeFromText({ text: '🌸', scalar });
        // @ts-ignore
        const butterfly = confetti.shapeFromText({ text: '🦋', scalar });
        confetti({
          shapes: [flower, butterfly],
          scalar,
          particleCount: 80,
          spread: 100,
          origin: { y: 0.65 },
          colors
        });
      } catch (e) {
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.65 },
          colors
        });
      }
    } else if (activeMode === 'sambomaster') {
      const colors = ['#dc2626', '#ea580c', '#f59e0b', '#e11d48'];
      try {
        // @ts-ignore
        const fire = confetti.shapeFromText({ text: '🔥', scalar });
        // @ts-ignore
        const heart = confetti.shapeFromText({ text: '❤️', scalar });
        confetti({
          shapes: [fire, heart],
          scalar,
          particleCount: 100,
          spread: 90,
          origin: { y: 0.65 },
          colors
        });
      } catch (e) {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.65 },
          colors
        });
      }
    }
  };

  // Clipboard copy
  const handleCopy = (text: string, activeMode: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setCopyFeedbackText(COMMIT_TEMPLATES[activeMode]?.copyFeedback || 'コピー完了！');
      triggerConfetti(activeMode);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Open settings
  const openSettings = () => {
    setTempApiKey(apiKey);
    setTempModel(model);
    setIsSettingsOpen(true);
  };

  // Save settings
  const handleSaveSettings = () => {
    localStorage.setItem('shitcommit_api_key', tempApiKey.trim());
    localStorage.setItem('shitcommit_model', tempModel);
    setApiKey(tempApiKey.trim());
    setModel(tempModel);
    setIsSettingsOpen(false);
  };

  // Clear history
  const handleClearHistory = () => {
    if (window.confirm('コミット履歴をすべてクリアしますか？')) {
      setHistory([]);
      localStorage.removeItem('shitcommit_history');
    }
  };

  const activeTheme = COMMIT_TEMPLATES[mode];

  return (
    <div 
      className="min-h-screen bg-[#090b0f] text-slate-100 flex flex-col items-center p-4 md:p-8 transition-colors duration-500"
      style={{ '--neon-color': activeTheme.neonColor } as React.CSSProperties}
    >
      {/* Background neon glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full filter blur-[150px] opacity-15 pointer-events-none transition-colors duration-500"
           style={{ backgroundColor: activeTheme.neonColor }} />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full filter blur-[150px] opacity-10 pointer-events-none transition-colors duration-500"
           style={{ backgroundColor: activeTheme.neonColor }} />

      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8 z-10">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono-tech px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded-sm tracking-widest animate-pulse">
              DANGER LOG
            </span>
            <span className="text-xs uppercase font-mono-tech px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-sm">
              v1.0.4-Beta
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mt-2 font-mono-tech bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 cyber-glow-text">
            ShitCommit<span className="text-red-500">.js</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1 font-mono-tech">
            &gt;_ CONVERT COMPATIBLE GIT COMMITS INTO AESTHETIC CLOUD DUST
          </p>
        </div>

        {/* API connection indicator */}
        <div className="flex items-center gap-2">
          <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3 border border-slate-800">
            <div className={`w-2.5 h-2.5 rounded-full ${apiKey ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`} />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-mono-tech">GENERATOR STATUS</div>
              <div className="text-xs font-semibold font-mono-tech">
                {apiKey ? `Gemini Active (${model.replace('gemini-', '')})` : 'Local Engine Only'}
              </div>
            </div>
            <button 
              onClick={openSettings}
              className="p-1.5 hover:bg-white/5 rounded-md border border-transparent hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Configure Gemini API"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10 flex-1">
        {/* Left Input Section (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6 w-full">
          <div className="glass-panel p-5 md:p-6 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden group">
            {/* Corner Tech Border lines */}
            <div className="absolute top-0 left-0 w-8 h-[1px] transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />
            <div className="absolute top-0 left-0 w-[1px] h-8 transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />
            <div className="absolute bottom-0 right-0 w-8 h-[1px] transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />
            <div className="absolute bottom-0 right-0 w-[1px] h-8 transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-semibold tracking-wider uppercase font-mono-tech text-slate-300">
                  1. 元のコミットメッセージを入力
                </h2>
              </div>
              <span className="text-[10px] font-mono-tech text-slate-500 uppercase">
                INPUT_STREAM
              </span>
            </div>

            <textarea
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono-tech text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[var(--neon-color)] focus:border-[var(--neon-color)] resize-none transition-all duration-300"
              placeholder="例：feat: add email verification system / fix: resolve sql injection vulnerability"
              value={originalMessage}
              onChange={(e) => setOriginalMessage(e.target.value)}
            />
            
            <div className="flex justify-between items-center mt-2 text-[10px] font-mono-tech text-slate-500">
              <span>CHARS: {originalMessage.length}</span>
              <span>AUTO_PARSE: ACTIVE</span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="glass-panel p-5 md:p-6 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-semibold tracking-wider uppercase font-mono-tech text-slate-300">
                  2. 変換モードを選択
                </h2>
              </div>
              <span className="text-[10px] font-mono-tech text-slate-500 uppercase">
                ENGINE_SELECTOR
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(COMMIT_TEMPLATES).map(([key, template]) => {
                const isActive = mode === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-300 relative group cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900/50 border-slate-700 shadow-lg' 
                        : 'bg-slate-950/40 border-slate-900/80 hover:bg-slate-900/30 hover:border-slate-800'
                    }`}
                  >
                    {/* Active highlight bar */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-500"
                           style={{ backgroundColor: template.neonColor }} />
                    )}

                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-bold tracking-tight ${isActive ? template.textColor : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {template.name}
                      </span>
                      {key === 'netmeme' && <Construction className={`w-4 h-4 ${isActive ? 'text-yellow-400' : 'text-slate-600'}`} />}
                      {key === 'haruki' && <BookOpen className={`w-4 h-4 ${isActive ? 'text-slate-300' : 'text-slate-600'}`} />}
                      {key === 'paprika' && <Sparkles className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-slate-600'}`} />}
                      {key === 'sambomaster' && <Flame className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-600'}`} />}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {template.sub}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Trigger Button */}
            <div className="mt-6">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl font-bold tracking-widest text-center uppercase font-mono-tech transition-all duration-300 flex items-center justify-center gap-3 border shadow-2xl relative overflow-hidden group cursor-pointer ${
                  isLoading
                    ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                    : 'text-white'
                }`}
                style={
                  !isLoading ? {
                    backgroundColor: activeTheme.bgColor,
                    borderColor: activeTheme.neonColor,
                    boxShadow: `0 0 15px ${activeTheme.neonColor}1a`
                  } : {}
                }
              >
                {/* Glow effect on hover */}
                {!isLoading && (
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ backgroundColor: activeTheme.neonColor }}
                  />
                )}

                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>CLONING SOUL TO MATRIX...</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-5 h-5 animate-pulse" />
                    <span className="text-sm md:text-base">
                      {activeTheme.buttonTexts[buttonIndex] || '給料泥棒コミット生成'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Output Section (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6 w-full h-full">
          <div className="glass-panel p-5 md:p-6 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-8 h-[1px] transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />
            <div className="absolute top-0 right-0 w-[1px] h-8 transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-semibold tracking-wider uppercase font-mono-tech text-slate-300">
                  3. 生成されたShitコミット
                </h2>
              </div>
              <span className={`text-[10px] uppercase font-mono-tech ${activeTheme.textColor}`}>
                {activeTheme.name}
              </span>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-mono-tech mb-4 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">SYSTEM WARNING</div>
                  {errorMessage}
                </div>
              </div>
            )}

            <div className="relative bg-slate-950 border border-slate-900 rounded-lg p-5 min-h-[140px] flex items-center justify-center transition-all duration-500"
                 style={{ 
                   borderColor: generatedMessage ? `${activeTheme.neonColor}40` : 'rgba(15, 23, 42, 1)',
                   boxShadow: generatedMessage ? `inset 0 0 20px ${activeTheme.neonColor}0d` : 'none'
                 }}>
              {generatedMessage ? (
                <p className={`text-slate-100 text-center leading-relaxed ${activeTheme.fontClass} ${
                  mode === 'haruki' ? 'text-sm font-serif italic' : 'text-base font-bold'
                }`}>
                  {generatedMessage}
                </p>
              ) : (
                <div className="text-slate-600 text-center font-mono-tech text-xs flex flex-col items-center gap-2">
                  <Terminal className="w-6 h-6 opacity-30 animate-pulse" />
                  <span>元のメッセージを入力して<br />「変換ボタン」をクリックしてください</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleCopy(generatedMessage, mode)}
              disabled={!generatedMessage}
              className={`mt-4 w-full py-3.5 px-6 rounded-lg font-bold tracking-widest text-xs uppercase font-mono-tech transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                !generatedMessage 
                  ? 'bg-slate-900/50 border border-slate-800/80 text-slate-600 cursor-not-allowed'
                  : copied
                    ? 'bg-emerald-950/40 border border-emerald-500 text-emerald-400'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white hover:border-slate-700 shadow-md'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4.5 h-4.5 animate-bounce" />
                  <span className="text-[11px]">{copyFeedbackText}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>

          {/* History Panel */}
          <div className="glass-panel p-5 md:p-6 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-semibold tracking-wider uppercase font-mono-tech text-slate-300">
                  コミット履歴 ({history.length})
                </h2>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-slate-600 text-xs font-mono-tech flex-1 flex items-center justify-center">
                <span>生成履歴はありません</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-3">
                {history.map((item) => {
                  const itemTheme = COMMIT_TEMPLATES[item.mode] || COMMIT_TEMPLATES.netmeme;
                  return (
                    <div 
                      key={item.id}
                      className="bg-slate-950/80 border border-slate-900/60 p-3 rounded-lg hover:border-slate-800 transition-all text-left relative group/item"
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-mono-tech ${itemTheme.badgeBg} ${itemTheme.badgeText}`}>
                          {itemTheme.name}
                        </span>
                        <span className="text-[9px] font-mono-tech text-slate-600">
                          {item.timestamp}
                        </span>
                      </div>
                      
                      {item.original && (
                        <div className="text-[10px] font-mono-tech text-slate-500 mb-1 line-clamp-1 italic">
                          IN: {item.original}
                        </div>
                      )}

                      <p className={`text-slate-200 text-xs break-all leading-relaxed ${itemTheme.fontClass}`}>
                        {item.generated}
                      </p>

                      {/* Quick Copy on Hover */}
                      <button
                        onClick={() => handleCopy(item.generated, item.mode)}
                        className="absolute right-2 bottom-2 p-1.5 bg-slate-900 border border-slate-800 rounded opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-400 hover:text-white hover:border-slate-700 cursor-pointer"
                        title="Copy this message"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
            
            <div className="flex justify-between items-center bg-slate-950 p-5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono-tech text-slate-200">
                  Gemini API 設定
                </h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg text-xs text-slate-400 leading-relaxed font-mono-tech">
                <div className="text-red-500 font-bold mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" />
                  Gemini APIキーの利用
                </div>
                APIキーを設定すると、GoogleのGeminiモデルを利用して入力コンテキストに合わせた真のクレイジーなメッセージを無限生成できます。キーはローカルにのみ保存され、サーバー等に転送されません。空欄のままにすると、高速なローカルテンプレートジェネレータが作動します。
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-tech text-slate-400 uppercase tracking-widest block">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 font-mono-tech text-xs text-slate-200 focus:outline-none focus:border-red-500"
                  placeholder="AIzaSy..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono-tech text-slate-400 uppercase tracking-widest block">
                  Model SELECTOR
                </label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 font-mono-tech text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (推奨・爆速)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (超高度・狂気増量)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (旧標準)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950 p-4 border-t border-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg cursor-pointer"
              >
                設定を保存
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full max-w-6xl mt-12 py-6 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-600 font-mono-tech">
        <span>© 2026 SHITCOMMIT.JS CREATED BY COLD_COFFEE.EXE</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-400">LICENSE: MIT</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-400">RESTRICTED TO ADULTS OVER 18 LINES OF CODE</a>
        </div>
      </footer>
    </div>
  );
}
