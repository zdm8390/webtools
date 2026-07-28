# 🥊 Urban Breaker 3D (三人称3D街中破壊格闘ゲーム)

Windowsローカル環境およびコントローラーパッド（ゲームパッド）操作に完全対応した三人称視点の3D街中破壊アクション格闘ゲームです。

## 📘 開発ドキュメント
- 🎮 [GAME_SPECIFICATION.md](file:///C:/Users/hana/Documents/GitHub/webtools/local-gamepad-game/GAME_SPECIFICATION.md) : 三人称格闘・オブジェクト破壊メカニクス・コントローラーバインド詳細仕様
- 👥 [ROLES_AND_PERSONAS.md](file:///C:/Users/hana/Documents/GitHub/webtools/local-gamepad-game/ROLES_AND_PERSONAS.md) : 開発体制と5つのペルソナ定義
- 🛠️ [DEVELOPMENT_PROCESS.md](file:///C:/Users/hana/Documents/GitHub/webtools/local-gamepad-game/DEVELOPMENT_PROCESS.md) : 開発手順ロードマップ・検証ガイドライン

---

## 🕹️ コントローラー操作方法 (Gamepad Controls)

| コントローラー操作 | アクション |
| :--- | :--- |
| **左アナログスティック / WASD** | 3D移動 (カメラ方向に合わせた360°自由移動) |
| **右アナログスティック / 矢印キー** | 三人称視点 360°カメラ自由回転 |
| **Xボタン / 🟦 (Jキー)** | 🥊 パンチ (コンボ・打撃効果音・ヒット振動) |
| **Yボタン / 🟩 (Kキー)** | 💥 キック (高威力・木箱/街灯/車等の破壊力大) |
| **Bボタン / 🔴 (Lキー)** | 🛡️ ガード (防御姿勢・ガード音) |
| **Aボタン / ✖️ (Space)** | ⚡ ステップダッシュ (回避動作) |

---

## 🚀 ローカル起動・プレイ手順

### 方法1: 直接ブラウザで開く (最も簡単)
- フォルダ内の [index.html](file:///C:/Users/hana/Documents/GitHub/webtools/local-gamepad-game/index.html) をダブルクリックして、Chrome / Edge などのブラウザで直接開いてください。
- コントローラーの任意のボタンを押すと自動的にゲームパッドが認識されます。

### 方法2: ローカル開発サーバーで起動
```bash
# プロジェクトフォルダへ移動
cd C:\Users\hana\Documents\GitHub\webtools\local-gamepad-game

# ローカルサーバー起動
npm start
```
ブラウザで `http://localhost:3000` を開くと動作します。
