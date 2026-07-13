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
  Info,
  Sun,
  Moon,
  Globe
} from 'lucide-react'

// UI translations dictionary
const UI_TRANSLATIONS = {
  jp: {
    statusApi: 'Gemini Active',
    statusLocal: 'ローカルエンジン動作中',
    titleDesc: '真面目なコミットメッセージを、社内評価が奈落に落ちるクレイジーな内容に変換します。',
    headingInput: '1. 元のコミットメッセージを入力',
    headingMode: '2. 変換モードを選択',
    headingOutput: '3. 生成されたCrazyコミット',
    sampleBtn: 'サンプルを入力',
    historyTitle: 'コミット履歴',
    historyEmpty: '生成履歴はありません',
    clearConfirm: 'コミット履歴をすべてクリアしますか？',
    settingsTitle: 'API設定 & 導入メリット解説',
    settingsBenefitTitle: 'Gemini APIキーを設定するメリット',
    settingsBenefitLocalTitle: '🚨 未設定 (ローカルエンジン - 即時生成)',
    settingsBenefitLocalDesc: '単純なキーワード抽出によるテンプレート差し替えのみ。生成スピードは超高速（即時）ですが、生成パターンが固定（各モード約6パターン）されているため、何度も使うと同じようなメッセージになりがちです。',
    settingsBenefitAiTitle: '🔥 設定あり (Gemini AIエンジン - 通信ラグあり)',
    settingsBenefitAiDesc: 'AIが入力されたコミットの内容（例：ログイン不具合の修正など）を完全に読解。毎回その場でオリジナル執筆します（生成パターンは無限）。※ただし、API通信とAIによる生成プロセスのため、出力までに1〜3秒程度の待ち時間が発生します。',
    settingsFree: '無料枠あり: Google AI Studioから誰でも無料でキーを即時発行できます。',
    settingsLocalSave: '完全ローカル保存: 入力されたキーは外部へ送信されず、お使いのブラウザ内（localStorage）のみに保存され、直接GoogleのAPIと安全に通信します。',
    settingsGetBtn: '👉 無料でAPIキーを取得する（Google AI Studio）',
    settingsModelLabel: 'モデル選択',
    settingsSaveBtn: '設定を保存',
    settingsCancelBtn: 'キャンセル',
    placeholderInput: '例：feat: 新規ユーザー登録機能の実装と入力バリデーションの追加',
    placeholderOutput: '元のメッセージを入力して「変換ボタン」をクリックしてください',
    chars: '文字数',
    autoparse: '自動解析',
    warningTitle: 'システム警告',
    warningFallback: 'APIエラーのためローカル生成フォールバック',
    copiedText: 'コピー完了！',
  },
  en: {
    statusApi: 'Gemini Active',
    statusLocal: 'Local Engine Active',
    titleDesc: 'Convert your professional commit messages into corporate-ending crazy statements.',
    headingInput: '1. Enter Original Commit Message',
    headingMode: '2. Select Crazy Mode',
    headingOutput: '3. Generated Crazy Commit',
    sampleBtn: 'Load Sample',
    historyTitle: 'Commit History',
    historyEmpty: 'No generated history',
    clearConfirm: 'Clear all commit history?',
    settingsTitle: 'API Settings & Key Benefits',
    settingsBenefitTitle: 'Why Configure Gemini API?',
    settingsBenefitLocalTitle: '🚨 Unconfigured (Local Engine - Instant)',
    settingsBenefitLocalDesc: 'Simple keyword search and template injection. Generation speed is instant, but patterns are fixed (about 6 per mode) and might feel repetitive over time.',
    settingsBenefitAiTitle: '🔥 Configured (Gemini AI Engine - Network Latency)',
    settingsBenefitAiDesc: 'AI reads and fully understands the context of your changes to compose unique narratives. Generated patterns are infinite. Note: it takes 1-3 seconds to generate due to network latency and AI reasoning.',
    settingsFree: 'Free Tier Available: Get a key instantly for free from Google AI Studio.',
    settingsLocalSave: '100% Local Storage: Keys are saved safely in your browser and sent directly to Google API.',
    settingsGetBtn: '👉 Get Free API Key (Google AI Studio)',
    settingsModelLabel: 'Model Selector',
    settingsSaveBtn: 'Save Settings',
    settingsCancelBtn: 'Cancel',
    placeholderInput: 'e.g., feat: add email verification system for user registration',
    placeholderOutput: 'Enter message and click the button to generate a crazy commit message',
    chars: 'CHARS',
    autoparse: 'AUTO_PARSE',
    warningTitle: 'SYSTEM WARNING',
    warningFallback: 'API error, local fallback active',
    copiedText: 'Copied!',
  }
};

// Define the template configurations for each mode
interface CommitTemplate {
  name: string;
  nameEn: string;
  sub: string;
  subEn: string;
  neonColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  buttonTexts: string[];
  buttonTextsEn: string[];
  copyFeedback: string;
  copyFeedbackEn: string;
  fontClass: string;
  templatesJp: ((action: string, target: string, raw: string) => string)[];
  templatesEn: ((action: string, target: string, raw: string) => string)[];
}

interface CommitTemplates {
  [key: string]: CommitTemplate;
}

const COMMIT_TEMPLATES: CommitTemplates = {
  netmeme: {
    name: 'ネットミーム',
    nameEn: 'Net Meme',
    sub: '働いたら負け。動いたからヨシ！',
    subEn: 'Work is pain. It compiled, so LGTM!',
    neonColor: '#fbbf24', // yellow-400
    bgColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    textColor: 'text-yellow-500 md:text-yellow-400 dark:text-yellow-400',
    badgeBg: 'bg-yellow-400/20',
    badgeText: 'text-yellow-600 dark:text-yellow-300',
    buttonTexts: ['給料泥棒モード起動', '仕事を放棄する', '「ヨシ！」と叫ぶ'],
    buttonTextsEn: ['Start Slacker Mode', 'Abandon Work', 'Shout "LGTM!"'],
    copyFeedback: '草生え散らかしました！ｗｗｗ',
    copyFeedbackEn: 'LOL grass grown! www',
    fontClass: 'font-mochi',
    templatesJp: [
      (action, target) => `動いたからヨシ！👈( ﾟ∀ﾟ ) (${target}を${action}した気がする)`,
      (action, target) => `なんかすごいいい感じに${target}を${action}した。知らんけど`,
      (action, target) => `「${target}を${action}した」ってコト！？ワァ……（泣）`,
      (action, target) => `どうして${target}を${action}したのに動かないんですか？なぁぜなぁぜ？`,
      (action, target) => `もう何もわかりません。${target}も何もかも無視して${action}、ヨシ！`,
      (action, target) => `【悲報】${target}、バグり散らかす。ワイ、無言の強制${action}。`,
      (action, target) => `完全に理解した（何もわかってない）ので${target}を${action}した。`
    ],
    templatesEn: [
      (action, target) => `It compiled, so LGTM! 👈( ﾟ∀ﾟ ) (probably ${action}ed ${target})`,
      (action, target) => `I just did some magic to ${action} ${target}. Don't ask how, it works. 知らんけど。`,
      (action, target) => `Is it true that I ${action}ed ${target}?! Wow... *cries in corner*`,
      (action, target) => `Why is ${target} still broken after I ${action}ed it?なぁぜなぁぜ？`,
      (_action, target) => `I have no idea what I'm doing. Anyway, LGTM! (${target})`,
      (action, target) => `[Breaking] ${target} is dead. I silently clicked ${action} and went home.`,
      (action, target) => `I fully understand ${target} (no I don't) so I ${action}ed it.`
    ]
  },
  haruki: {
    name: '村上春樹',
    nameEn: 'Haruki Murakami',
    sub: 'やれやれ。完璧なコードなど存在しない。',
    subEn: 'Yare yare. There is no such thing as perfect code.',
    neonColor: '#94a3b8', // slate-400
    bgColor: 'rgba(148, 163, 184, 0.08)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
    textColor: 'text-slate-500 md:text-slate-400 dark:text-slate-300',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-600 dark:text-slate-300',
    buttonTexts: ['孤独をコミットする', 'やれやれと呟く', '冷えたビールを開ける'],
    buttonTextsEn: ['Commit Solitude', 'Whisper Yare Yare', 'Open a Cold Beer'],
    copyFeedback: 'やれやれ。コピーされたよ。',
    copyFeedbackEn: 'Yare yare. It is copied.',
    fontClass: 'font-tegumin',
    templatesJp: [
      (action, target) => `完璧な${target}などといったものは存在しない。完璧な絶望が存在しないようにね。僕はただ、深夜の静寂の中で誰も読まないであろう${target}の${action}を静かに終わらせた。やれやれ。`,
      (action, target) => `彼女は僕の${target}を見て、少し哀しそうに微笑んだ。「ねえ、それって本当に${action}されたの？」と。僕は何も答えず、ただレコードの針を落とした。それがすべてだった。`,
      (action, target) => `僕たちが${target}を失ってから、もうずいぶんと長い時間が経ったような気がする。冷えたビールを飲みながら、僕は静かに${action}のコミットメッセージを書いている。やれやれ。`,
      (action, target) => `ビールを開け、ステレオから流れるマイルス・デイヴィスに耳を澄ませる。僕が${target}について考えていると、猫が静かにキーボードの上を通り過ぎた。${action}する。そういうこともあるさ。`,
      (action, target) => `世界の終わりに、僕らは${target}を${action}する。静かな雨が降る午後にふさわしい、静かなコミットだ。`,
      (action, target) => `やれやれ。僕が${target}を${action}したところで、世界が1ミリでも良くなるわけじゃない。それでも僕は、古いセーターのほつれを直すようにキーボードを叩いた。`
    ],
    templatesEn: [
      (action, target) => `There is no such thing as a perfect ${target}. Just as there is no such thing as perfect despair. I silently finished the ${action} of ${target} in the midnight silence. Yare yare.`,
      (action, target) => `She looked at my ${target} and smiled sadly. "Is it really ${action}ed?" she asked. I said nothing, just dropped the needle on the record. That was all.`,
      (action, target) => `It feels like a long time since we lost ${target}. Sipping a cold beer, I quietly write this commit message for ${action}. Yare yare.`,
      (action, target) => `I opened a beer, listened to Miles Davis, and thought about ${target}. A cat quietly walked across the keyboard as I ${action}ed. It happens.`,
      (action, target) => `At the end of the world, we ${action} ${target}. A quiet commit for a rainy afternoon.`,
      (action, target) => `Yare yare. It is not like the world gets better because I ${action}ed ${target}. Still, I typed, like patching an old sweater.`
    ]
  },
  paprika: {
    name: 'パプリカ',
    nameEn: 'Paprika',
    sub: 'バグのパレードがやってくる！',
    subEn: 'The parade of bugs is coming!',
    neonColor: '#db2777', // pink-600
    bgColor: 'rgba(219, 39, 119, 0.08)',
    borderColor: 'rgba(219, 39, 119, 0.3)',
    textColor: 'text-pink-500 md:text-pink-400 dark:text-pink-400',
    badgeBg: 'bg-pink-500/20',
    badgeText: 'text-pink-600 dark:text-pink-300',
    buttonTexts: ['夢のパレードへ', 'コンパイルの海で踊る', '狂気のゲートを開く'],
    buttonTextsEn: ['Join the Dream Parade', 'Dance in Compile Sea', 'Open the Gate of Madness'],
    copyFeedback: 'コンパイルエラーのシーツが干されました！',
    copyFeedbackEn: 'Compile error sheets have been dried!',
    fontClass: 'font-sans font-bold tracking-wide',
    templatesJp: [
      (action, target) => `バグのパレードがやってくるよ！量子化された${target}たちが${action}の神輿を担いで、型安全の向こう側で踊っているんだ。ほら、コンパイルエラーのシーツを干し忘れたからさ！`,
      (action, target) => `オセアニアの風が${target}のスカートをなびかせる時、夢の回路は「${action}！」と叫びながらネットの海へ融解していく。コンパイラよ、祝祭のラッパを吹き鳴らせ！`,
      (action, target) => `見てごらん、三次元の${target}が二次元の虚数空間で${action}のダンスを踊っている。私たちの夢は、いつだってコミットログの隙間に隠されているんだよ！`,
      (action, target) => `冷蔵庫たちの夢がコンパイルを呼び覚ます！ほら、${target}がパレードの先頭で旗を振っているよ。祝祭としての${action}が今、始まる！`,
      (action, target) => `バグも仕様も、すべての祝祭の中に溶けていく！総天然色の${target}が、五次元のネットの海で${action}のパレードを踊っているよ！`,
      (action, target) => `量子もつれのステップを踏んで、${target}は夜明け of 光の中に${action}される。これこそが、電脳パレードの正しい形なんだ！`
    ],
    templatesEn: [
      (action, target) => `The parade of bugs is coming! Quantized ${target}s are carrying the shrine of ${action}, dancing beyond type safety. See, we forgot to dry the sheets of compile errors!`,
      (action, target) => `When the winds of Oceania blow the skirt of ${target}, the dream circuit melts into the net screaming "${action}!" Blow the trumpets of compile, O compiler!`,
      (action, target) => `Look, the 3D ${target} is dancing the dance of ${action} in 2D imaginary space. Our dreams are hidden in the git commit log!`,
      (action, target) => `The dreams of refrigerators wake the compiler! Look, ${target} is leading the parade. The bell of ${action} rings!`,
      (action, target) => `Bugs and specs, all melt into the festival! Technicolor ${target} is dancing the parade of ${action} in the 5D internet!`,
      (action, target) => `Stepping in quantum entanglement, ${target} is ${action}ed into the morning light. This is the true form of the digital parade!`
    ]
  },
  sambomaster: {
    name: 'サンボマスター',
    nameEn: 'Sambomaster',
    sub: 'お前ら全員愛してるぞ！ロックンロール！',
    subEn: 'I love you all! Rock \'n\' Roll!',
    neonColor: '#ef4444', // red-500
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    textColor: 'text-rose-500 md:text-rose-400 dark:text-rose-400',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-600 dark:text-rose-300',
    buttonTexts: ['ロックンロールを叫ぶ！', '愛をコンパイルする！', 'ミラクルを起こす！'],
    buttonTextsEn: ['Scream Rock \'n\' Roll!', 'Compile the Love!', 'Make a Miracle!'],
    copyFeedback: '愛とロックンロールが爆発しました！！',
    copyFeedbackEn: 'Love and Rock \'n\' Roll exploded!!',
    fontClass: 'font-sans font-extrabold tracking-wider',
    templatesJp: [
      (action, target) => `お前ら！この世界はですね、愛が足りないんですよ！だから僕はね、あなたの画面の向こう側にいるあなたのために、この「${target}の${action}」を魂込めてぶち込んだわけです！これが僕のロックンロールなんですよ！`,
      (action, target) => `諦めるなよお前ら！どんなに${target}が崩壊しようと、僕らの${action}は絶対に終わらないんですよ！信じること、それがすべてだってわけです！愛してるぜ！ロックンロール！`,
      (action, target) => `ミラクルを起こすんですよ！僕はね、あなたと${target}のために、この数行のコードを${action}したんです！これが、これが僕たちの新しい始まりってわけですよ！！`,
      (action, target) => `誰がなんと言おうと、あなたの${target}は美しいんですよ！だから僕は${action}した！お前ら全員で、明日へ向かって叫びましょう！ロックンロール！！`,
      (action, target) => `愛なんですよ！愛！この${target}にはそれが必要だった！だから僕は${action}した！あなたの心が震えるような、そんなコミットメッセージなんだ！`,
      (action, target) => `お前らの悲しみは全部僕が引き受ける！だからこの${target}の${action}を見てくれ！これが僕らの！僕らだけの生きた証なんですよ！！`
    ],
    templatesEn: [
      (action, target) => `Listen up! There is not enough love in this world! That's why I poured my soul into this ${action} of ${target} for you on the other side of the screen! This is my Rock 'n' Roll!`,
      (action, target) => `Don't give up! Even if ${target} crumbles, our ${action} will never end! Belief is everything! I love you! Rock 'n' Roll!`,
      (action, target) => `We are going to make a miracle! I ${action}ed this code for you and ${target}! This is our new beginning!`,
      (action, target) => `No matter what they say, your ${target} is beautiful! That's why I won't stop ${action}ing! Let's shout to tomorrow! Rock 'n' Roll!`,
      (action, target) => `It's love, my friends! Love! That's what ${target} needed! That's why I ${action}ed it! A commit message to shake your heart!`,
      (action, target) => `I will take all your sadness! Look at this ${action} of ${target}! This is our! Our only proof of being alive!`
    ]
  }
};

// Help extract key features from the commit message
const extractKeywords = (input: string, isEnglish: boolean) => {
  const cleanInput = input
    .replace(/^(feat|fix|chore|refactor|style|test|docs|ci|perf|build)(\([^)]+\))?:\s*/i, '')
    .trim();
  
  if (!cleanInput) {
    return isEnglish 
      ? { action: 'develop', target: 'code' } 
      : { action: '開発', target: '虚無コード' };
  }

  const words = cleanInput.toLowerCase().split(/\s+/);
  
  let action = isEnglish ? 'modify' : 'いじくる';
  let target = cleanInput;

  // Verb matching heuristics (JP/EN)
  if (words.some(w => ['fix', 'bug', 'error', 'resolve', 'issue', 'crash', 'deadlock', '修正', '直す', 'バグ', '不具合', 'デバッグ'].includes(w))) {
    action = isEnglish ? 'fix' : '修正';
  } else if (words.some(w => ['add', 'create', 'implement', 'feat', 'new', '追加', '実装', '新規', '作成'].includes(w))) {
    action = isEnglish ? 'add' : '追加';
  } else if (words.some(w => ['update', 'modify', 'change', 'improve', 'bump', '更新', '変更', '改善', '調整'].includes(w))) {
    action = isEnglish ? 'update' : '更新';
  } else if (words.some(w => ['remove', 'delete', 'clean', 'rm', 'purge', '削除', '消去', 'クリーン', '削る'].includes(w))) {
    action = isEnglish ? 'delete' : '削除';
  } else if (words.some(w => ['refactor', 'optimize', 'clean', 'structure', 'リファクタ', '整理', '最適化'].includes(w))) {
    action = isEnglish ? 'refactor' : 'リファクタ';
  } else if (words.some(w => ['test', 'check', 'validate', 'テスト', '検証'].includes(w))) {
    action = isEnglish ? 'test' : 'テスト';
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
  const [model, setModel] = useState<string>('gemini-3.5-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [tempModel, setTempModel] = useState<string>('gemini-3.5-flash');
  
  // App state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [copyFeedbackText, setCopyFeedbackText] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Toggles state
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [language, setLanguage] = useState<'jp' | 'en'>('jp');

  const SAMPLE_COMMITS = language === 'en' ? [
    'feat: add email verification system for user registration',
    'fix: resolve sql injection vulnerability in login query',
    'fix: resolve database deadlock on concurrent writes',
    'chore: update dependency lodash to version 4.17.21',
    'docs: correct spelling mistakes and update layout in README.md',
    'refactor: simplify user authentication middleware and helper functions',
    'perf: optimize image rendering speed by lazy loading assets',
    'test: add unit tests for payment processing module',
    'style: align icons and adjust margins on sidebar component',
    'fix: memory leak in websocket connections'
  ] : [
    'feat: 新規ユーザー登録機能の実装と入力バリデーションの追加',
    'fix: パスワード再設定画面で特定の環境にてサーバーエラーが発生する不具合の修正',
    'fix: WebSocketの接続維持ロジックにおける重大なメモリリークの解消',
    'chore: package.json の依存ライブラリを最新の安定バージョンに更新',
    'docs: README.md にローカル環境向けのインストール手順を追記し、レイアウトを調整',
    'refactor: データベース接続用の共通ヘルパー関数の整理と重複ロジックの簡素化',
    'perf: 画像遅延読み込みの導入によるランディングページの初期表示速度の高速化',
    'test: 決済処理モジュールに対するエッジケースのユニットテストを追加',
    'style: サイドバーコンポーネントにおけるアイコン位置の調整とモバイルビュー用の余白微調整',
    'fix: 同時書き込み時におけるデータベースのデッドロック不具合の解消'
  ];

  const loadSample = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_COMMITS.length);
    setOriginalMessage(SAMPLE_COMMITS[randomIndex]);
  };

  // Load preferences from local storage
  useEffect(() => {
    const savedKey = localStorage.getItem('crazycommit_api_key') || '';
    const savedModel = localStorage.getItem('crazycommit_model') || 'gemini-3.5-flash';
    const savedHistory = localStorage.getItem('crazycommit_history');
    const savedDarkMode = localStorage.getItem('crazycommit_dark_mode') !== 'false'; // default true
    const savedLanguage = (localStorage.getItem('crazycommit_language') || 'jp') as 'jp' | 'en';
    
    setApiKey(savedKey);
    setTempApiKey(savedKey);
    setModel(savedModel);
    setTempModel(savedModel);
    setDarkMode(savedDarkMode);
    setLanguage(savedLanguage);
    
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
      localStorage.setItem('crazycommit_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Change button label when mode or language changes
  useEffect(() => {
    const active = COMMIT_TEMPLATES[mode];
    const labels = language === 'en' ? active?.buttonTextsEn : active?.buttonTexts;
    if (labels && labels.length > 0) {
      setButtonIndex(Math.floor(Math.random() * labels.length));
    }
  }, [mode, language]);

  // Fetch response from Gemini API
  const fetchGeminiCommit = async (key: string, selectedModel: string, activeMode: string, input: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`;
    const modeMeta = COMMIT_TEMPLATES[activeMode];
    const isEn = language === 'en';
    
    // Few-shot examples based on mode and language to enforce length and style
    let examples = '';
    if (isEn) {
      if (activeMode === 'netmeme') {
        examples = `Input: "fix login bug"\nOutput: It compiled, so LGTM! 👈( ﾟ∀ﾟ ) (I probably fixed the login screen, who knows. 知らんけど。)\nInput: "feat: add validation to signup form"\nOutput: "I added validation to signup form"?! Wow... *cries in corner* Is this even working?`;
      } else if (activeMode === 'haruki') {
        examples = `Input: "fix login bug"\nOutput: There is no such thing as a perfect login screen. Just as there is no such thing as perfect despair. I silently fixed the login bug in the midnight silence. Yare yare.\nInput: "feat: add validation to signup form"\nOutput: She looked at the validation I added to the signup form and smiled sadly. "Is it really safe?" she asked. I said nothing, just opened another cold beer.`;
      } else if (activeMode === 'paprika') {
        examples = `Input: "fix login bug"\nOutput: The parade of login bugs is coming! Quantized login screens are carrying the shrine of bug fix, dancing beyond type safety. See, we forgot to dry the sheets of compile errors!\nInput: "feat: add validation to signup form"\nOutput: When the winds of Oceania blow the skirt of signup validation, the dream circuit melts into the net screaming "user signup!" Blow the trumpets of compile, O compiler!`;
      } else { // sambomaster
        examples = `Input: "fix login bug"\nOutput: Listen up! There is not enough love in this world! That's why I poured my soul into this login bug fix for you on the other side of the screen! This is my Rock 'n' Roll!\nInput: "feat: add validation to signup form"\nOutput: Don't give up! Even if the registration form crumbles, our validation implementation will never end! Belief is everything! I love you! Rock 'n' Roll!`;
      }
    } else {
      if (activeMode === 'netmeme') {
        examples = `Input: "パスワード再設定画面の不具合修正"\nOutput: 動いたからヨシ！👈( ﾟ∀ﾟ ) (パスワード再設定画面を直した気がする、知らんけど。)\nInput: "ユーザー登録機能の実装"\nOutput: 「ユーザー登録機能を実装した」ってコト！？ワァ……（泣）なぁぜなぁぜ？`;
      } else if (activeMode === 'haruki') {
        examples = `Input: "パスワード再設定画面の不具合修正"\nOutput: 完璧なパスワード再設定機能などといったものは存在しない。完璧な絶望が存在しないようにね。僕はただ、深夜の静寂の中で誰も読まないであろうその不具合修正を静かに終わらせた。やれやれ。\nInput: "ユーザー登録機能の実装"\nOutput: 彼女は僕の追加した登録機能を見て、少し哀しそうに微笑んだ。「ねえ、それって本当に正しいの？」と。僕は何も答えず、ただレコードの針を落とした。`;
      } else if (activeMode === 'paprika') {
        examples = `Input: "パスワード再設定画面の不具合修正"\nOutput: バグのパレードがやってくるよ！量子化された再設定画面たちが修正コードの神輿を担いで、型安全の向こう側で踊っているんだ。ほら、コンパイルエラーのシーツを干し忘れたからさ！\nInput: "ユーザー登録機能の実装"\nOutput: オセアニアの風が登録機能のスカートをなびかせる時、夢の回路は「ユーザー登録！」と叫びながらネットの海へ融解していく。コンパイラよ、祝祭のラッパを吹き鳴らせ！`;
      } else { // sambomaster
        examples = `Input: "パスワード再設定画面の不具合修正"\nOutput: お前ら！この世界はですね、愛が足りないんですよ！だから僕はね、画面の向こう側にいるあなたのために、この不具合修正を魂込めてぶち込んだわけです！これが僕のロックンロールなんですよ！\nInput: "ユーザー登録機能の実装"\nOutput: 諦めるなよお前ら！どんなに新規登録が崩壊しようと、僕らの機能実装は絶対に終わらないんですよ！愛してるぜ！ロックンロール！`;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are CrazyCommit Generator, a humor assistant that converts normal/technical commit messages or code changes into crazy, hilarious, or dramatic commit messages.
            
Selected Mode: "${activeMode}" (${isEn ? modeMeta.nameEn : modeMeta.name})
Instruction: ${isEn ? modeMeta.subEn : modeMeta.sub}

Persona Guidelines for this mode:
${activeMode === 'netmeme' ? '- Work slacker. Uses net memes like "動いたからヨシ！", "なぁぜなぁぜ", "知らんけど", "◯◯ってコト！？" in Japanese, or corporate slacker memes in English. Sounds irresponsible, lazy, and triggers tech leads.' : ''}
${activeMode === 'haruki' ? '- Deeply poetic, reflective, nostalgic, lonely. Uses Murakami style: "やれやれ" (yare yare), descriptions of cold beer, vinyl records, cats, shadows, and elegant but overly dramatic prose about trivial code changes.' : ''}
${activeMode === 'paprika' ? '- Surreal, psychedelic, chaotic dream sequence. Uses cinema metaphors, parading machines, frog shrines, melting dimensions, colorful explosions, and highly intellectual nonsense.' : ''}
${activeMode === 'sambomaster' ? '- High-energy rock singer Yamaguchi (Sambomaster). Speaks in loud, emotional shouting! Calls out to "お前ら" (you guys) or "あなた" (you) / "you guys" or "you". Relentlessly mentions "愛" (love) and "ロックンロール" (rock and roll). Ends with sentences like "〜なんですよ！" or "〜ってわけです！" in Japanese style.' : ''}

Examples of expected conversion:
${examples}

Convert this input code change: "${input}"

Rules:
1. Output ONLY the generated commit message.
2. The output MUST be in ${isEn ? 'English' : 'Japanese'}.
3. Output a rich, funny, and expressive commit message (typically 1 to 3 sentences, matching the style, tone, and length of the examples). Do not make it too short or dry.
4. Do NOT output markdown code blocks. Just plain text.`
          }]
        }],
        generationConfig: {
          temperature: 0.95,
          maxOutputTokens: 800
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
    
    const active = COMMIT_TEMPLATES[mode];
    const labels = language === 'en' ? active?.buttonTextsEn : active?.buttonTexts;
    if (labels && labels.length > 0) {
      setButtonIndex(Math.floor(Math.random() * labels.length));
    }

    const isEn = language === 'en';

    try {
      if (apiKey) {
        // Use Gemini API
        const textToConvert = rawInput || (isEn ? 'feat: random empty commit' : 'feat: 空のランダムコミット');
        const generated = await fetchGeminiCommit(apiKey, model, mode, textToConvert);
        setGeneratedMessage(generated);
        
        updateHistory({
          id: Math.random().toString(36).substring(2, 9),
          original: rawInput || (isEn ? '(Empty)' : '(空入力)'),
          generated,
          mode,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        // Use Local Template-based generator
        const { action, target } = extractKeywords(rawInput, isEn);
        const templates = isEn ? COMMIT_TEMPLATES[mode].templatesEn : COMMIT_TEMPLATES[mode].templatesJp;
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        const generated = randomTemplate(action, target, rawInput);
        setGeneratedMessage(generated);
        
        updateHistory({
          id: Math.random().toString(36).substring(2, 9),
          original: rawInput || (isEn ? '(Empty)' : '(空入力)'),
          generated,
          mode,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (err: any) {
      console.error(err);
      const isEn = language === 'en';
      const defaultErr = isEn 
        ? 'Error connecting to Gemini API. Fell back to local mode.' 
        : 'Gemini API接続中にエラーが発生しました。ローカルモードで生成します。';
      
      let errMsg = err.message || defaultErr;
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('limit')) {
        errMsg = isEn
          ? 'API Quota Exceeded. You may have reached AI Studio limits, or the selected model is restricted on the free tier. Try switching the Model to "Gemini 3.5 Flash" in Settings (Gear Icon).'
          : 'APIの利用制限（クォータ）を超過しました。無料枠の上限に達したか、選択したモデル（Pro版など）が無料枠制限（Limit: 0）に引っかかっている可能性があります。右上設定（歯車マーク）からモデルを「Gemini 3.5 Flash」に変更してください。';
      }
      setErrorMessage(errMsg);
      
      // Fallback immediately to local generator so user doesn't get blocked
      const { action, target } = extractKeywords(rawInput, isEn);
      const templates = isEn ? COMMIT_TEMPLATES[mode].templatesEn : COMMIT_TEMPLATES[mode].templatesJp;
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      const generated = randomTemplate(action, target, rawInput);
      const fallbackTag = isEn ? ' (*Local fallback due to API error)' : ' (※APIエラーによるローカルフォールバック)';
      setGeneratedMessage(generated + fallbackTag);
      
      updateHistory({
        id: Math.random().toString(36).substring(2, 9),
        original: rawInput || (isEn ? '(Empty)' : '(空入力)'),
        generated: generated + (isEn ? ' (*Fallback)' : ' (※フォールバック)'),
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
      const active = COMMIT_TEMPLATES[activeMode];
      const feedback = language === 'en' ? active?.copyFeedbackEn : active?.copyFeedback;
      setCopyFeedbackText(feedback || 'Copied!');
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
    localStorage.setItem('crazycommit_api_key', tempApiKey.trim());
    localStorage.setItem('crazycommit_model', tempModel);
    setApiKey(tempApiKey.trim());
    setModel(tempModel);
    setIsSettingsOpen(false);
  };

  // Clear history
  const handleClearHistory = () => {
    const isEn = language === 'en';
    const confirmText = isEn 
      ? 'Clear all commit history?' 
      : 'コミット履歴をすべてクリアしますか？';
    if (window.confirm(confirmText)) {
      setHistory([]);
      localStorage.removeItem('crazycommit_history');
    }
  };

  // Dark/Light theme toggles
  const handleToggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem('crazycommit_dark_mode', String(nextVal));
  };

  // Language toggle
  const handleToggleLanguage = () => {
    const nextVal = language === 'jp' ? 'en' : 'jp';
    setLanguage(nextVal);
    localStorage.setItem('crazycommit_language', nextVal);
  };

  const activeTheme = COMMIT_TEMPLATES[mode];
  const t = UI_TRANSLATIONS[language];

  // Dynamic theme class names
  const bodyBgClass = darkMode ? 'bg-[#090b0f] text-slate-100' : 'bg-slate-50 text-slate-900';
  const panelClass = darkMode 
    ? 'bg-slate-950/65 border-slate-900 shadow-2xl' 
    : 'bg-white/85 border-slate-200/80 shadow-xl shadow-slate-200/30';
  const inputClass = darkMode
    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-[var(--neon-color)] focus:border-[var(--neon-color)]'
    : 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[var(--neon-color)] focus:border-[var(--neon-color)]';
  const textMutedClass = darkMode ? 'text-slate-500' : 'text-slate-400';
  const headerTitleClass = darkMode 
    ? 'from-white via-slate-100 to-slate-400' 
    : 'from-slate-900 via-slate-800 to-slate-600';
  const togglePanelClass = darkMode
    ? 'bg-slate-950/60 border-slate-900'
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div 
      className={`min-h-screen transition-colors duration-500 flex flex-col items-center p-4 md:p-8 ${bodyBgClass}`}
      style={{ '--neon-color': activeTheme.neonColor } as React.CSSProperties}
    >
      {/* Background neon glows */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full filter blur-[150px] pointer-events-none transition-colors duration-500 ${darkMode ? 'opacity-15' : 'opacity-8'}`}
           style={{ backgroundColor: activeTheme.neonColor }} />
      <div className={`absolute bottom-10 right-1/4 w-96 h-96 rounded-full filter blur-[150px] pointer-events-none transition-colors duration-500 ${darkMode ? 'opacity-10' : 'opacity-5'}`}
           style={{ backgroundColor: activeTheme.neonColor }} />

      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8 z-10">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono-tech px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded-sm tracking-widest animate-pulse">
              DANGER LOG
            </span>
            <span className={`text-xs uppercase font-mono-tech px-2.5 py-1 rounded-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600'}`}>
              v1.0.6-Beta
            </span>
          </div>
          <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tighter mt-2 font-mono-tech bg-clip-text text-transparent bg-gradient-to-r cyber-glow-text ${headerTitleClass}`}>
            CrazyCommit<span className="text-red-500">.js</span>
          </h1>
          <p className={`text-xs md:text-sm mt-1 font-mono-tech ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            &gt;_ CONVERT COMPATIBLE GIT COMMITS INTO AESTHETIC CLOUD DUST
          </p>
        </div>

        {/* Global Controls Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Theme & Language Toggles */}
          <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border transition-all ${togglePanelClass}`}>
            <button
              onClick={handleToggleDarkMode}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className={darkMode ? 'text-slate-800' : 'text-slate-200'}>|</span>
            <button
              onClick={handleToggleLanguage}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono-tech transition-all cursor-pointer flex items-center gap-1 ${
                darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
              title={language === 'jp' ? 'Switch to English' : '日本語に切り替え'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'jp' ? 'EN' : 'JP'}</span>
            </button>
          </div>

          {/* API connection indicator */}
          <div className={`glass-panel px-4 py-2 rounded-lg flex items-center gap-3 border ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${apiKey ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`} />
            <div className="text-left">
              <div className={`text-[9px] uppercase font-mono-tech ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>STATUS</div>
              <div className="text-xs font-semibold font-mono-tech">
                {apiKey ? `Gemini Active` : 'Local Engine'}
              </div>
            </div>
            <button 
              onClick={openSettings}
              className={`p-1.5 hover:bg-white/5 rounded-md border border-transparent transition-all cursor-pointer ${
                darkMode ? 'text-slate-400 hover:text-white hover:border-slate-700' : 'text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
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
          <div className={`glass-panel p-5 md:p-6 rounded-xl border relative overflow-hidden group ${panelClass}`}>
            {/* Corner Tech Border lines */}
            <div className="absolute top-0 left-0 w-8 h-[1px] transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />
            <div className="absolute top-0 left-0 w-[1px] h-8 transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />
            <div className="absolute bottom-0 right-0 w-8 h-[1px] transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />
            <div className="absolute bottom-0 right-0 w-[1px] h-8 transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <h2 className="text-sm font-semibold tracking-wider uppercase font-mono-tech">
                  {t.headingInput}
                </h2>
              </div>
              <button
                onClick={loadSample}
                className={`text-[10px] font-mono-tech px-2.5 py-1 rounded border transition-all cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-sm'
                }`}
              >
                {t.sampleBtn}
              </button>
            </div>

            <textarea
              className={`w-full h-32 rounded-lg p-4 font-mono-tech text-sm resize-none transition-all duration-300 ${inputClass}`}
              placeholder={t.placeholderInput}
              value={originalMessage}
              onChange={(e) => setOriginalMessage(e.target.value)}
            />
            
            <div className={`flex justify-between items-center mt-2 text-[10px] font-mono-tech ${textMutedClass}`}>
              <span>{t.chars}: {originalMessage.length}</span>
              <span>{t.autoparse}: ACTIVE</span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className={`glass-panel p-5 md:p-6 rounded-xl border relative overflow-hidden ${panelClass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <h2 className="text-sm font-semibold tracking-wider uppercase font-mono-tech">
                  {t.headingMode}
                </h2>
              </div>
              <span className={`text-[10px] font-mono-tech uppercase ${textMutedClass}`}>
                ENGINE_SELECTOR
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(COMMIT_TEMPLATES).map(([key, template]) => {
                const isActive = mode === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setMode(key); setGeneratedMessage(''); }}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-300 relative group cursor-pointer ${
                      isActive 
                        ? darkMode
                          ? 'bg-slate-900/50 border-slate-700 shadow-lg' 
                          : 'bg-slate-100 border-slate-300 shadow-sm'
                        : darkMode
                          ? 'bg-slate-950/40 border-slate-900/80 hover:bg-slate-900/30 hover:border-slate-800'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-250 shadow-sm'
                    }`}
                  >
                    {/* Active highlight bar */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-500"
                           style={{ backgroundColor: template.neonColor }} />
                    )}

                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-bold tracking-tight ${isActive ? template.textColor : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                        {language === 'en' ? template.nameEn : template.name}
                      </span>
                      {key === 'netmeme' && <Construction className={`w-4 h-4 ${isActive ? 'text-yellow-500' : 'text-slate-400 dark:text-slate-600'}`} />}
                      {key === 'haruki' && <BookOpen className={`w-4 h-4 ${isActive ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`} />}
                      {key === 'paprika' && <Sparkles className={`w-4 h-4 ${isActive ? 'text-pink-500' : 'text-slate-400 dark:text-slate-600'}`} />}
                      {key === 'sambomaster' && <Flame className={`w-4 h-4 ${isActive ? 'text-rose-500' : 'text-slate-400 dark:text-slate-600'}`} />}
                    </div>
                    <span className={`text-[10px] mt-1 leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {language === 'en' ? template.subEn : template.sub}
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
                      {(language === 'en' ? activeTheme.buttonTextsEn[buttonIndex] : activeTheme.buttonTexts[buttonIndex]) || 'Crazy Commit'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Output Section (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6 w-full h-full">
          <div className={`glass-panel p-5 md:p-6 rounded-xl border relative overflow-hidden flex flex-col ${panelClass}`}>
            <div className="absolute top-0 right-0 w-8 h-[1px] transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />
            <div className="absolute top-0 right-0 w-[1px] h-8 transition-colors duration-500" style={{ backgroundColor: activeTheme.neonColor }} />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <h2 className="text-sm font-semibold tracking-wider uppercase font-mono-tech">
                  {t.headingOutput}
                </h2>
              </div>
              <span className={`text-[10px] uppercase font-mono-tech ${activeTheme.textColor}`}>
                {language === 'en' ? activeTheme.nameEn : activeTheme.name}
              </span>
            </div>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-mono-tech mb-4 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{t.warningTitle}</div>
                  {errorMessage}
                </div>
              </div>
            )}

            <div className={`relative border rounded-lg p-5 min-h-[140px] flex items-center justify-center transition-all duration-500 ${
              darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'
            } ${
              isLoading ? 'animate-pulse' : ''
            }`}
                 style={{ 
                   borderColor: isLoading 
                     ? activeTheme.neonColor 
                     : generatedMessage 
                       ? `${activeTheme.neonColor}40` 
                       : '',
                   boxShadow: (isLoading || (generatedMessage && darkMode)) 
                     ? `inset 0 0 25px ${activeTheme.neonColor}15` 
                     : 'none'
                 }}>
              {isLoading ? (
                <div className="text-center flex flex-col items-center gap-3">
                  <div className="flex gap-1.5 items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: activeTheme.neonColor, animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: activeTheme.neonColor, animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: activeTheme.neonColor, animationDelay: '300ms' }} />
                  </div>
                  <span className={`text-xs font-mono-tech uppercase tracking-widest ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {language === 'en' ? 'Thinking... [MATRIX_SYNC]' : '思考中... [狂気回路を同期中]'}
                  </span>
                </div>
              ) : generatedMessage ? (
                <p className={`leading-relaxed ${activeTheme.fontClass} ${
                  darkMode ? 'text-slate-100' : 'text-slate-900'
                } ${
                  mode === 'haruki' 
                    ? 'text-sm font-serif italic text-center' 
                    : 'text-base font-bold text-center'
                }`}>
                  {generatedMessage}
                </p>
              ) : (
                <div className={`text-center font-mono-tech text-xs flex flex-col items-center gap-2 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Terminal className="w-6 h-6 opacity-30 animate-pulse" />
                  <span>{t.placeholderOutput}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleCopy(generatedMessage, mode)}
              disabled={!generatedMessage}
              className={`mt-4 w-full py-3.5 px-6 rounded-lg font-bold tracking-widest text-xs uppercase font-mono-tech transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                !generatedMessage 
                  ? darkMode 
                    ? 'bg-slate-900/50 border border-slate-800/80 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed'
                  : copied
                    ? 'bg-emerald-950/40 border border-emerald-500 text-emerald-500'
                    : darkMode
                      ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white hover:border-slate-700 shadow-md'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-sm'
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
          <div className={`glass-panel p-5 md:p-6 rounded-xl border relative overflow-hidden flex-1 flex flex-col min-h-[300px] ${panelClass}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <h2 className="text-sm font-semibold tracking-wider uppercase font-mono-tech">
                  {t.historyTitle} ({history.length})
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
              <div className={`text-xs font-mono-tech flex-1 flex items-center justify-center ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <span>{t.historyEmpty}</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-3">
                {history.map((item) => {
                  const itemTheme = COMMIT_TEMPLATES[item.mode] || COMMIT_TEMPLATES.netmeme;
                  return (
                    <div 
                      key={item.id}
                      className={`border p-3 rounded-lg hover:border-slate-800 transition-all text-left relative group/item ${
                        darkMode ? 'bg-slate-950/80 border-slate-900/60' : 'bg-slate-100/60 border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-mono-tech ${itemTheme.badgeBg} ${itemTheme.badgeText}`}>
                          {language === 'en' ? itemTheme.nameEn : itemTheme.name}
                        </span>
                        <span className={`text-[9px] font-mono-tech ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          {item.timestamp}
                        </span>
                      </div>
                      
                      {item.original && (
                        <div className={`text-[10px] font-mono-tech mb-1 line-clamp-1 italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          IN: {item.original}
                        </div>
                      )}

                      <p className={`text-xs break-all leading-relaxed ${itemTheme.fontClass} ${
                        darkMode ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {item.generated}
                      </p>

                      {/* Quick Copy on Hover */}
                      <button
                        onClick={() => handleCopy(item.generated, item.mode)}
                        className={`absolute right-2 bottom-2 p-1.5 border rounded opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer ${
                          darkMode 
                            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700' 
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-350'
                        }`}
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
          <div className={`w-full max-w-md rounded-2xl border overflow-hidden shadow-2xl relative ${
            darkMode ? 'bg-slate-950/95 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            
            <div className={`flex justify-between items-center p-5 border-b ${
              darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-500" />
                <h3 className={`text-sm font-bold uppercase tracking-wider font-mono-tech ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  {t.settingsTitle}
                </h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className={`cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className={`space-y-3 p-4 rounded-xl border ${
                darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="text-red-500 font-bold flex items-center gap-1.5 font-mono-tech text-xs">
                  <Key className="w-4 h-4 text-red-500" />
                  {t.settingsBenefitTitle}
                </div>
                
                <div className="grid grid-cols-1 gap-2.5 text-[11px]">
                  <div className={`border p-3 rounded-lg space-y-1 ${
                    darkMode ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-200/30 border-slate-200'
                  }`}>
                    <div className={darkMode ? 'font-bold text-slate-400' : 'font-bold text-slate-500'}>
                      {t.settingsBenefitLocalTitle}
                    </div>
                    <p className={`leading-relaxed font-sans ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      {t.settingsBenefitLocalDesc}
                    </p>
                  </div>
                  <div className={`border p-3 rounded-lg space-y-1 ${
                    darkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-500/5 border-red-500/10'
                  }`}>
                    <div className="font-bold text-red-500 dark:text-red-400">
                      {t.settingsBenefitAiTitle}
                    </div>
                    <p className={`leading-relaxed font-sans ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t.settingsBenefitAiDesc}
                    </p>
                  </div>
                </div>

                <div className={`text-[10px] border-t pt-2.5 space-y-1 font-sans ${
                  darkMode ? 'text-slate-400 border-slate-900' : 'text-slate-500 border-slate-200'
                }`}>
                  <div>• {t.settingsFree}</div>
                  <div>• {t.settingsLocalSave}</div>
                </div>

                <div className="pt-1.5 font-mono-tech text-[11px]">
                  <a 
                    href="https://aistudio.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-red-500 dark:text-red-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    {t.settingsGetBtn}
                  </a>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-mono-tech uppercase tracking-widest block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Gemini API Key
                </label>
                <input
                  type="password"
                  className={`w-full rounded-lg px-3 py-2.5 font-mono-tech text-xs focus:outline-none focus:border-red-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  placeholder="AIzaSy..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-[10px] font-mono-tech uppercase tracking-widest block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t.settingsModelLabel}
                </label>
                <select
                  className={`w-full rounded-lg px-3 py-2.5 font-mono-tech text-xs focus:outline-none focus:border-red-500 cursor-pointer ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (推奨・爆速)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (超高度・狂気増量)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (旧標準)</option>
                </select>
              </div>
            </div>

            <div className={`p-4 border-t flex justify-end gap-3 ${
              darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  darkMode ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.settingsCancelBtn}
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white shadow-lg cursor-pointer"
              >
                {t.settingsSaveBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={`w-full max-w-6xl mt-12 py-6 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono-tech ${
        darkMode ? 'border-slate-900 text-slate-600' : 'border-slate-200 text-slate-450'
      }`}>
        <span>© 2026 CRAZYCOMMIT.JS CREATED BY COLD_COFFEE.EXE</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-400">LICENSE: MIT</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-400">RESTRICTED TO ADULTS OVER 18 LINES OF CODE</a>
        </div>
      </footer>
    </div>
  );
}
