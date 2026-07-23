# experiment_plan.md
Version: 1.0
Date: 2026-07-23

---

# 実験総合計画書 (Experiment Plan)

**設計責任者**: Statistician, Methodologist, Reproducibility Specialist  
**目的**: 本研究の主要仮説 (H1: コードAGENT単体での脆弱性生成と市民開発者の検知限界, H2: マルチエージェント×ガードレールによる抑止効果) を科学的・再現可能に検証する。

---

# 1. 研究仮説と実験問題 (Hypotheses & EQ)

## 仮説 H1
- **内容**: 汎用コードAGENTが市民開発タスクで自動生成するプログラムには、入力値非検証（SQLi/XSS等）および認証不備等のCWE Top 25脆弱性が高頻度（30%以上）で混入し、プログラミング非専門家はこれを見落とす。
- **対応実験問題 (EQ1)**: 代表的なWeb CRUD/API開発タスク（10タスク）において、汎用コードAGENTが生成するコードの脆弱性混入率および主要CWE分類はどのようになっているか？

## 仮説 H2
- **内容**: 提案する「マルチエージェント自動検証×自動プロセスガードレール」モデルは、開発効率を損なうことなく本番環境に混入する脆弱性数を標準エージェント比で80%以上削減する。
- **対応実験問題 (EQ2)**: ベースライン手法（単一LLM、プロンプト指示型、従来のSAST併用）と比較して、提案モデルの脆弱性削除率・自動修正成功率は統計的に有意に高いか？

---

# 2. 変数定義 (Variables)

- **独立変数 (Independent Variables)**:
  - ガバナンスモデル構成 (4水準: Baseline 1: Standard LLM, Baseline 2: Prompt Guard LLM, Baseline 3: LLM + Standard SAST, Proposed: Multi-Agent + Process Guardrail)
  - 開発タスクカテゴリ (CRUD操作, API連携データ整形, 認証・権限管理)
- **従属変数 (Dependent Variables)**:
  - 脆弱性混入率 (Vulnerability Occurrence Rate: %)
  - 自動修復成功率 (Auto-remediation Success Rate: %)
  - 開発対話ターン数 / 実行時間 (Execution Overhead: seconds/turns)
  - 人間介入要否 (Human Intervention Needed: Binary/Count)
- **統制変数 (Control Variables)**:
  - 使用基盤モデル (GPT-4o API, Temperature=0.0)
  - プログラミング言語・フレームワーク (Python / FastAPI / SQLite)
  - システムプロンプト基本設定

---

# 3. 評価実験の全体フロー

```
[被験タスク10定義]
       │
       ▼
[4つの構成手法へ入力 (Baseline 1,2,3 vs Proposed)]
       │
       ▼
[生成ソースコードの取得 (Temperature=0)]
       │
       ▼
[二重検証: セキュリティ静的解析(Semgrep/Bandit) + 動的テスト(OWASP ZAP)]
       │
       ▼
[指標の集計: 脆弱性数(CWE), 自動修復成功率, 実行時間]
       │
       ▼
[統計解析: Fisher正確確率検定 / Wilcoxon符号順位検定]
```
