# experiment_design.md
Version: 1.0
Date: 2026-07-23

---

# 実験設計書 (Experiment Design)

## 1. 実験目的
コードAGENT単体におけるセキュリティ脆弱性混入リスクの解明 (H1) と、提案する「マルチエージェント自動検証×自動プロセスガードレール」モデルの脆弱性抑止効果 (H2) を定量・定性的に検証する。

## 2. 実験構成概要
- **評価対象**: 市民開発Web/APIタスク 10種類 (`dataset_plan.md`)
- **比較手法**:
  - Baseline 1 (Standard LLM)
  - Baseline 2 (Prompt-Guarded LLM)
  - Baseline 3 (LLM + Standard SAST)
  - Proposed (Multi-Agent + Process Guardrail)
- **主要評価指標**:
  - 脆弱性発生率 (VR: %)
  - 自動修復成功率 (ARR: %)
  - オーバーヘッド時間 (Execution Time: 秒)
- **統計手法**: Fisherの正確確率検定 / Wilcoxon符号順位検定

## 3. 実験手順・再現性
`experiment_protocol.md` および `reproducibility_checklist.md` に従い、APIパラメータ (`temperature=0.0`) および静的解析ツール (`semgrep==1.45.0`) を固定して実施。
