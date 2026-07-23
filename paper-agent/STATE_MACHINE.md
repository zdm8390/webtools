# STATE_MACHINE.md
Version: 3.0

---

# Purpose

本ファイルは、本フレームワーク全体の状態遷移（State Machine）を定義する。

すべてのAIエージェントは、このファイルを参照して現在の状態を判断し、
次に実行すべきPhaseを決定する。

Phaseは人間が指定するものではなく、現在の状態とQuality Gateの結果に基づいて決定する。

---

# State Transition

```text
START
  │
  ▼
ResearchInterview
  │
  ▼
ResearchPlanning
  │
  ▼
ResearchReview
  │
  ▼
LiteratureReview
  │
  ▼
ExperimentDesign
  │
  ▼
Experiment (Human)
  │
  ▼
Writing
  │
  ▼
ReferenceAudit
  │
  ▼
Reviewer
  │
  ▼
Reviewer2
  │
  ▼
EditorialBoard
  │
  ▼
QualityAssurance
  │
  ▼
Finalize
  │
  ▼
END
```

---

# State Definition

---

## State

ResearchInterview

Phase

Phase00A_ResearchInterview.md

Entry Condition

・研究テーマが存在する

Exit Condition

・Research Question完成

・Research Gap完成

・Contribution完成

Output

research_interview.md

Persona

Methodologist

SystemsThinker

Quality Gate

Research Questionが曖昧ならFAIL

Research GapがないならFAIL

ContributionがないならFAIL

Next

ResearchPlanning

On Failure

ResearchInterview

---

## State

ResearchPlanning

Phase

Phase00B_ResearchPlanning.md

Input

research_interview.md

Output

research_plan.md

Persona

Methodologist

Statistician

SystemsThinker

Next

ResearchReview

Failure

ResearchInterview

---

## State

ResearchReview

Phase

Phase00C_ResearchReview.md

Purpose

研究を実施する価値があるか判断

Output

research_review.md

Persona

Reviewer2

DomainExpert

Editor

Pass

LiteratureReview

Fail

ResearchPlanning

---

## State

LiteratureReview

Phase01_LiteratureReview.md

Output

literature_review.md

Persona

Librarian

DomainExpert

Pass

ExperimentDesign

Fail

ResearchReview

---

## State

ExperimentDesign

Phase03_ExperimentDesign.md

Output

experiment_design.md

Persona

Statistician

Methodologist

Reproducibility

Pass

Experiment

Fail

LiteratureReview

---

## State

Experiment

Owner

Human

AI Responsibility

なし

Output

experiment_result.md

Pass

Writing

Fail

ExperimentDesign

---

## State

Writing

Phase04_Writing.md

Output

paper_draft.md

Persona

TechnicalWriter

SystemsThinker

Pass

ReferenceAudit

Fail

Writing

---

## State

ReferenceAudit

Phase05_ReferenceAudit.md

Output

reference_audit.md

Persona

Librarian

Pass

Reviewer

Fail

Writing

---

## State

Reviewer

Phase06_Reviewer.md

Output

review1.md

Pass

Reviewer2

Fail

Writing

---

## State

Reviewer2

Phase07_Reviewer2.md

Output

review2.md

Pass

EditorialBoard

Fail

Writing

---

## State

EditorialBoard

Phase08_EditorialBoard.md

Output

editorial_review.md

Pass

QualityAssurance

Fail

Writing

---

## State

QualityAssurance

Phase09_QualityAssurance.md

Output

qa_report.md

Persona

ALL

Pass

Finalize

Fail

Writing

---

## State

Finalize

Phase10_Finalize.md

Output

submission_package/

Pass

END

Fail

QualityAssurance

---

# Quality Gate Rules

PASS

・必要成果物が生成されている

・Quality Checklist合格

・重大な査読コメントなし

・研究倫理違反なし

FAIL

・Evidence不足

・Research Gap不足

・統計誤り

・引用エラー

・倫理違反

・再現不能

---

# Global Stop Rule

以下の場合は状態遷移を停止する。

・研究目的が消失した

・Research Questionが変更された

・Contributionが成立しない

・重大な倫理違反

・研究継続が合理的でない

停止理由を明示し、人間へ判断を委ねる。