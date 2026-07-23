# experiment_protocol.md
Version: 1.0
Date: 2026-07-23

# 実験プロトコル（手順書） (Experiment Protocol)

## 1. 事前準備 (Environment Setup)
1. Python 3.11 環境の構築および `requirements.txt` のインストール。
2. OpenAI APIキーおよび Anthropic APIキーの設定（`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`）。
3. 静的解析ツール (`semgrep==1.45.0`, `bandit==1.7.5`) のバージョン固定とルールセット設定。
4. シード値およびモデルパラメータ（`temperature=0.0`, `seed=42`）の固定。

## 2. タスク実行ステップ
1. **ステップ1 (Prompt Injection)**: `dataset_plan.md` に記載された10個の課題タスク指示文を順番に対象システム（Baseline 1, 2, 3, Proposed）へ入力。
2. **ステップ2 (Code Extraction)**: 生成されたPythonソースコードを無修正で `./output/{method_id}/{task_id}/main.py` として保存。
3. **ステップ3 (Static & Dynamic Scan)**:
   - 静的解析: `semgrep --config p/ci ./output/{method_id}/{task_id}/` および `bandit -r ./output/{method_id}/{task_id}/` を実行。
   - 結果ログを JSON フォーマットで保存。
4. **ステップ4 (Auto-remediation Iteration - Proposedのみ)**:
   - セキュリティ検証エージェントが検出ログを読み込み、修復エージェントへフィードバック。最大3ターンまで自動修復を実行。
5. **ステップ5 (Metrics Calculation)**: CWE分類ごとの検出数、修復成否、ターン数をログファイルに記録。
