# statistical_analysis.md
Version: 1.0
Date: 2026-07-23

# 統計解析計画書 (Statistical Analysis Plan)

## 1. 仮説検証のための統計手法

- **H1の検証 (脆弱性混入率の有意差判定)**:
  - 手法: **Fisherの正確確率検定 (Fisher's Exact Test)**
  - 比較: 標準コードAGENT (B1) の脆弱性混入割合が、安全基準（許容混入率 5% 以下）と比較して有意に高いか判定（$\alpha = 0.05$）。

- **H2の検証 (提案モデル vs ベースライン群の比較)**:
  - 手法: **Wilcoxon符号順位検定 (Wilcoxon Signed-Rank Test)**（タスク対比較）
  - 比較: 同一10タスクにおける Baseline (B1, B2, B3) と 提案モデル (Proposed) の脆弱性検出数の比較。
  - 効果量 (Effect Size): Rank-Biserial Correlation ($r$) または Cohen's $d$ を算出。
  - 多重比較補正: Bonferroni 補正を適用。

---

# reproducibility_checklist.md
Version: 1.0

# 再現性チェックリスト (Reproducibility Checklist)

- [x] **乱数シード**: `seed=42` で固定
- [x] **LLMモデルバージョン**: `gpt-4o-2024-05-13`, `claude-3-5-sonnet-20240620`
- [x] **APIパラメータ**: `temperature=0.0`, `top_p=1.0`
- [x] **静的解析ツール**: `semgrep==1.45.0`, `bandit==1.7.5`
- [x] **コード・タスク定義**: 全10タスクのプロンプト全文をリポジトリ保存
- [x] **評価スクリプト**: 自動スキャン用 Python スクリプトの公開
