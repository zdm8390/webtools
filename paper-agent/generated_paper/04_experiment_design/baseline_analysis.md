# baseline_analysis.md
Version: 1.0
Date: 2026-07-23

# 比較ベースライン分析 (Baseline Analysis)

## 比較手法の定義（計4手法）

| 手法 ID | 手法名称 | 構成 | 採用理由・役割 |
|:---:|:---|:---|:---|
| **B1** | Standard Single LLM | LLM標準指示（追加ガードレールなし） | 一般的なコードAGENTのデフォルト挙動を示す（最下限ベースライン）。 |
| **B2** | Prompt-Guarded LLM | システムプロンプトに「セキュリティ対策を徹底せよ」と付加 | 単一プロンプトチューニングのみでの限界を示す比較対象。 |
| **B3** | LLM + Standard SAST | LLM生成物を既存SAST（Semgrep）でスキャンし、警告を出力 | 従来の「ツール併用」アプローチの限界（非技術者がログを解釈不可）を示す。 |
| **Proposed** | Multi-Agent + Process Guardrail | 開発AGENT＋検証AGENT＋自動プロセス制御 | **本研究提案手法**。技術自動修復と組織ガードレールの多層防御。 |
