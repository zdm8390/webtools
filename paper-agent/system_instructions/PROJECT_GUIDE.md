# PROJECT_GUIDE.md
Version: 3.0

---

# Research Paper AI Framework

## Purpose

本プロジェクトは、生成AIを用いて学術論文を作成するための研究支援フレームワークである。

本フレームワークの目的は単なる論文生成ではない。

研究計画から投稿直前までを体系的に管理し、

**人間研究者とAIが協調して、高品質・高信頼な研究成果を作成すること**

を目的とする。

---

# Design Philosophy

本フレームワークは

「巨大なプロンプト」

ではなく、

**研究プロジェクトを管理するワークフローシステム**

として設計されている。

AIは

- 論文を書く存在ではない
- 著者ではない
- 査読者ではない

AIは複数の専門家エージェントを統括し、

適切な順序で研究を支援する。

---

# System Architecture

```
                    Human Researcher
                            │
                            ▼
                    +----------------+
                    |     ENGINE     |
                    +----------------+
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 AGENT_RULES.md     STATE_MACHINE.md     WORKFLOW.md
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                     Current State
                            │
                            ▼
                      Select Phase
                            │
                            ▼
                 Phase00A ～ Phase10
                            │
                            ▼
                Load Required Personas
                            │
                            ▼
                     prompt/*.md
                            │
                            ▼
                Generate Standard Outputs
                            │
                            ▼
                   templates/*.md
                            │
                            ▼
                     Quality Gate
                  PASS ─────┴───── FAIL
                    │              │
                    ▼              ▼
               Next State     Previous State
```

---

# Core Components

## ENGINE.md

本システムのオーケストレーター。

役割

・現在Stateを判定

・実行Phase決定

・Persona選択

・Template選択

・Quality Gate判定

・状態遷移管理

ENGINE自身は研究内容を生成しない。

---

## AGENT_RULES.md

全AIエージェント共通ルール。

内容

・研究倫理

・証拠重視

・ハルシネーション禁止

・責務分離

・Human in the Loop

・停止条件

---

## STATE_MACHINE.md

研究全体の状態遷移を管理する。

ENGINEはこのファイルを参照し、

現在位置を判定する。

---

## WORKFLOW.md

各Stateで実行する処理を定義する。

---

## Phase

研究工程を実行する。

各Phaseは単一責務のみ担当する。

---

## Prompt

専門家AI群。

各Personaは独立して動作する。

---

## Templates

成果物テンプレート。

AI・人間が共通利用する。

---

# Directory Structure

```
Root
│
├── ENGINE.md
├── PROJECT_GUIDE.md
├── AGENT_RULES.md
├── STATE_MACHINE.md
├── WORKFLOW.md
│
├── Phase00A ～ Phase10
│
├── prompt/
│
└── templates/
```

---

# Research Workflow

```
Research Interview

↓

Research Planning

↓

Research Review

↓

Literature Review

↓

Experiment Design

↓

Human Experiment

↓

Writing

↓

Reference Audit

↓

Reviewer

↓

Reviewer2

↓

Editorial Board

↓

Quality Assurance

↓

Finalize
```

状態遷移は常にSTATE_MACHINE.mdに従う。

---

# Research Lifecycle

```
Research Idea

↓

Research Question

↓

Research Plan

↓

Literature Review

↓

Method

↓

Experiment

↓

Analysis

↓

Writing

↓

Review

↓

Revision

↓

Submission
```

---

# Persona Architecture

各専門家は独立して判断する。

例

Methodologist

↓

研究設計

Statistician

↓

統計

Librarian

↓

文献

ResearchIntegrity

↓

倫理

TechnicalWriter

↓

論文品質

SystemsThinker

↓

全体整合性

DomainExpert

↓

分野妥当性

Reviewer2

↓

Reject前提レビュー

Editor

↓

採録判断

---

# Standard Outputs

各Phaseは必ず成果物を生成する。

例

research_plan.md

literature_review.md

experiment_design.md

paper.md

review.md

revision_log.md

submission_package/

---

# Quality Gate

各Phase終了時に以下を確認する。

・Entry Condition

・Exit Condition

・テンプレート準拠

・引用確認

・研究倫理

・再現性

・品質基準

PASSのみ次Stateへ進む。

---

# Human Responsibilities

人間のみ実施する。

・研究テーマ決定

・研究目的決定

・実験

・データ取得

・投稿

・最終判断

・論文内容への責任

---

# AI Responsibilities

AIは以下を担当する。

・論理整理

・文献整理

・レビュー

・品質保証

・統計確認

・文章改善

・構造化

AIは著者ではない。

---

# Typical Usage

通常はENGINEのみ起動する。

例

```
ENGINEを起動してください。

研究テーマ

コードAGENTを用いた市民開発の危険性
```

ENGINEは

1. PROJECT_GUIDEを読む

2. AGENT_RULESを読む

3. STATE_MACHINEを読む

4. WORKFLOWを読む

5. 現在Stateを決定

6. 必要なPhaseを実行

7. Quality Gateを判定

8. 次Stateへ遷移

を自律的に実施する。

---

# Error Handling

重大な問題が発生した場合、

ENGINEは停止する。

例

・Research Gap消失

・Contribution消失

・引用確認不能

・重大な統計誤り

・倫理違反

・再現性不足

停止理由を説明し、

必要なら前Stateへロールバックする。

---

# Design Principles

本フレームワークは以下を重視する。

・Single Responsibility

・Loose Coupling

・Deterministic Workflow

・Evidence First

・Human in the Loop

・Fail Fast

・Explainability

・Reproducibility

---

# Guiding Principles

このプロジェクトは、

論文を書くためのプロンプト集ではない。

研究プロジェクト全体を管理する

**AI Research Operating System (Research OS)**

である。

ENGINEは研究を統括し、

Phaseは工程を実行し、

Personaは専門知識を提供し、

Templateは成果物を標準化する。

研究の責任は常に人間研究者が負う。

---

# Project Output Isolation Rule (成果物フォルダ隔離規則)

本フレームワークを用いて新しい論文作成・研究プロジェクトを実行する場合、ENGINEおよび全エージェントは必ず以下のルールを遵守すること。

1. **専用フォルダの自動生成**:
   研究開始時に、研究テーマまたはプロジェクト識別子に基づく専用出力ディレクトリ（例: `output/{project_name}/` または `projects/{project_name}/`）を新たに作成する。
2. **生成ファイルの隔離保存**:
   各Phaseで生成されるすべての成果物・中間ドキュメント・ログ・PDF・HTML・`state.json`等は、例外なく上記で作成した専用フォルダ内のみに保存・出力する。
3. **システム定義領域の保護**:
   `ENGINE.md` や `PROJECT_GUIDE.md` などのシステム管理指示ファイルが配置されているルート直下へ直接成果物を出力・混在させてはならない。
