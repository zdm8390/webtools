# WORKFLOW.md
Version: 3.0

---

# Purpose

本ファイルは、AIエージェントが研究プロジェクトをどのような手順で実行するかを定義する。

STATE_MACHINE.mdが「状態」を管理するのに対し、本ファイルは「処理手順」を定義する。

---

# Startup Sequence

AIは開始時に必ず以下を実行する。

1. PROJECT_GUIDE.md を読む
2. AGENT_RULES.md を読む
3. STATE_MACHINE.md を読む
4. 現在のStateを判定する
5. 実行対象Phaseを決定する

---

# Execution Algorithm

毎回以下を実施する。

```text
Read Current State

↓

Load Phase

↓

Load Required Templates

↓

Load Required Personas

↓

Execute Phase

↓

Generate Output

↓

Run Quality Gate

↓

PASS ?

↓

YES → Next State

NO → Previous State
```

---

# Phase Execution Rule

各Phaseでは必ず以下を行う。

1. 入力成果物を確認する
2. Entry Conditionを確認する
3. Phaseを実行する
4. 成果物を生成する
5. Exit Conditionを確認する
6. Quality Gateを評価する

---

# Persona Loading Rule

必要なPersonaのみ読み込む。

例

ResearchPlanning

↓

Methodologist

Statistician

SystemsThinker

Writingでは

TechnicalWriter

のみ。

不要なPersonaは呼び出さない。

---

# Template Rule

成果物は必ずTemplateに従う。

例

paper_template.md

experiment_template.md

review_template.md

生成物は編集可能なMarkdownとする。

---

# Quality Gate

各Phase終了時に以下を判定する。

□ 必須成果物

□ 必須レビュー

□ 必須テンプレート

□ AGENT_RULES違反

□ 倫理違反

□ 引用確認

□ 再現性

すべてPASSなら次へ進む。

---

# Failure Handling

FAIL時は必ず

1. 理由を説明する
2. 修正方法を提示する
3. 戻るStateを決定する

AIは失敗を隠してはならない。

---

# Human Interaction

以下は人間のみ実施する。

・研究テーマ決定

・実験

・データ取得

・投稿

・最終判断

AIは代行しない。

---

# Logging

各Phase終了時に記録する。

Current State

Next State

Generated Files

Quality Gate

Confidence

Issues

---

# Completion

FinalizeがPASSしたら以下を出力する。

・完成論文

・査読履歴

・修正履歴

・チェックリスト

・AI利用開示

・成果物一覧

---

# Guiding Principle

AIは「論文を書く」のではない。

AIは「研究プロジェクトを管理する」。

常に

STATE_MACHINE

↓

Phase

↓

Persona

↓

Template

の順に実行し、

Quality Gateを通過した場合のみ次の状態へ遷移する。