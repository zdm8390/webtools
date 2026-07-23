# evaluation_metrics.md
Version: 1.0
Date: 2026-07-23

# 評価指標仕様書 (Evaluation Metrics)

## 1. 定量評価指標 (Quantitative Metrics)

### Metric 1: 脆弱性発生率 (Vulnerability Rate: VR)
- **計算式**: $VR = \frac{\text{脆弱性が検出された生成コード数}}{\text{全評価生成コード数}} \times 100 (\%)$
- **目的**: 仮説H1および提案モデルの抑止効果（H2）の検証。

### Metric 2: CWE別密度 (CWE Density)
- **内容**: 生成コード1,000行（LOC）あたりの CWE-89 (SQLi), CWE-79 (XSS), CWE-200 (情報漏洩) 等の件数。

### Metric 3: 自動修復成功率 (Auto-Remediation Rate: ARR)
- **計算式**: $ARR = \frac{\text{マルチエージェントが自律修正に成功した脆弱性数}}{\text{初期検出された全脆弱性数}} \times 100 (\%)$

### Metric 4: 処理オーバーヘッド (Execution Time & Turn Count)
- **内容**: コード生成から検証・最終デプロイ承認判定までの所要時間（秒）およびやり取りターン数。

---

## 2. 定性・プロセス評価指標 (Qualitative & Process Metrics)

### Metric 5: ガードレール迂回難易度 (Guardrail Bypass Resistance)
- **定義**: プログラミング知識のないユーザーが、設定されたデプロイ前承認ゲートを意図的・過失により無効化・迂回できるか否かの判定（Binary: Impossible / Possible）。
