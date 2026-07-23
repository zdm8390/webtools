# literature_review.md
Version: 1.0
Date: 2026-07-23

---

# 文献調査と体系的分析レポート (Phase01)

**専門家ペルソナ**: Librarian (文献情報専門家) & Domain Expert (ソフトウェアセキュリティ/AIガバナンス専門家)

---

# 1. 調査分野の概要と構造
本研究「コードAGENTを用いた市民開発の危険性とガバナンス」に関連する先行研究を、以下の3つの主要ドメインに分類して体系的調査を実施した。

1. **ドメイン1: AI/LLMによるコード自動生成とセキュリティ脆弱性 (LLM Code Security)**
   - 概要: GitHub Copilot, Codex, Claude等のコード生成AIが出力するソースコード内に、どのようなセキュリティ脆弱性（CWE Top 25等）が含まれるかを定量・定性評価する研究群。
   - 代表文献: Pearce et al. (2022), Asare et al. (2023), Sandoval et al. (2023).
2. **ドメイン2: 市民開発（Low-Code / No-Code / Citizen Development）と組織ガバナンス**
   - 概要: 非IT部門の職員がローコード/ノーコードプラットフォーム等で自作アプリを構築する際のリスク管理、シャドーIT問題、組織ガバナンスフレームワーク。
   - 代表文献: Gartner Research (2022/2023), Hyrynsalmi et al. (2020), OWASP Citizen Development Security Standard.
3. **ドメイン3: セキュリティ自動検証とマルチエージェント型LLMアーキテクチャ**
   - 概要: ソフトウェア開発パイプラインにおいて複数のLLMエージェントが相互監理・静的解析を行い、脆弱性を自動発見・修復する技術的枠組み。
   - 代表文献: Wu et al. (2023) [AutoGen], Hong et al. (2023) [MetaGPT], OWASP Top 10 for LLM Applications (2023/2024).

---

# 2. 主要文献の分析・要約

## 文献1: Pearce et al. (2022)
- **タイトル**: Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions
- **発表誌**: IEEE Symposium on Security and Privacy (S&P 2022)
- **概要**: 89のセキュリティ関連コーディングシナリオにおいて、GitHub Copilotが生成した1,689個のプログラムを評価。全体の約40%にセキュリティ脆弱性（CWE-79 XSS, CWE-89 SQLi, CWE-119 バッファオーバーフロー等）が含まれることを実証した。
- **本研究との関係**: コードAGENTが本質的に「セキュリティ保護コードの自動欠落」を起こす根拠（H1の証拠）として使用。

## 文献2: Sandoval et al. (2023)
- **タイトル**: Lost at C: A User Study on the Security Implications of Large Language Models Post-Trained on Code
- **発表誌**: USENIX Security Symposium 2023
- **概要**: 58名の人間（プログラマ）を対象に、LLMコード補完ツールを利用した場合と非利用の場合で生成コードのセキュリティ品質を比較したユーザスタディ。LLM利用者はセキュリティ脆弱性を混入させやすくなり、かつ自らのコードが安全であると過信（Overconfidence）する傾向を報告。
- **本研究との関係**: 「開発者の知識不足と過信が相乗して脆弱性が見落とされる」人間要因の証拠。

## 文献3: Asare et al. (2023)
- **タイトル**: Is GitHub Copilot a Security Risk for Peer Review?
- **発表誌**: Empirical Software Engineering / arXiv
- **概要**: AI生成コードに対する既存のコードレビューや静的解析ツール（SAST）の検知能力を評価。従来のレビュー手法のみではAI固有の難読化された脆弱性や論理欠陥を見落としやすいことを示唆。
- **本研究との関係**: 「既存のコードレビュー・SASTの限界（RQ1の課題）」を裏付ける文献。

## 文献4: OWASP Top 10 for LLM Applications (2023/2024)
- **タイトル**: OWASP Top 10 for Large Language Model Applications
- **発行元**: OWASP Foundation
- **概要**: LLMアプリケーションにおける主要リスク（Prompt Injection, Excessive Agency, System Prompt Leakage, Excessive Agency, Insecure Output Handling 等）の体系化。
- **本研究との関係**: ガバナンスモデルにおける「プロセスのガードレール」項目定義の基盤。

---

# 3. 本研究の立ち位置 (Positioning)
既存研究は「コード生成AIの脆弱性評価（Pearce等）」または「高度なエンジニアを対象としたユーザスタディ（Sandoval等）」に偏重している。
本研究は、**「プログラミング知識の乏しい市民開発者」**を対象とし、かつ単なる脆弱性の指摘にとどまらず、**「マルチエージェント自動検証×プロセスガードレール」という技術と組織プロセスを融合した具体的ガバナンスモデルを提案・評価する点**に明確な独自性と差別化が存在する。
