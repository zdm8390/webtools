import os

isolation_rule_md = """

---

# Project Output Isolation Rule (成果物フォルダ隔離規則)

本フレームワークを用いて新しい論文作成・研究プロジェクトを実行する場合、ENGINEおよび全エージェントは必ず以下のルールを遵守すること。

1. **専用フォルダの自動生成**:
   研究開始時に、研究テーマまたはプロジェクト識別子に基づく専用出力ディレクトリ（例: `output/{project_name}/` または `projects/{project_name}/`）を新たに作成する。
2. **生成ファイルの隔離保存**:
   各Phaseで生成されるすべての成果物・中間ドキュメント・ログ・PDF・HTML・`state.json`等は、例外なく上記で作成した専用フォルダ内のみに保存・出力する。
3. **システム定義領域の保護**:
   `ENGINE.md` や `PROJECT_GUIDE.md` などのシステム管理指示ファイルが配置されているルート直下へ直接成果物を出力・混在させてはならない。
"""

files_to_update = [
    "ENGINE.md", "PROJECT_GUIDE.md", "WORKFLOW.md", "AGENT_RULES.md", "STATE_MACHINE.md"
]

def update_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if "Project Output Isolation Rule" not in content:
        # Append isolation rule neatly before Design Principles or at the end
        new_content = content + isolation_rule_md
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated isolation rule in: {filepath}")

def main():
    root = os.path.abspath(".")
    sys_dir = os.path.join(root, "system_instructions")

    for fname in files_to_update:
        update_file(os.path.join(root, fname))
        update_file(os.path.join(sys_dir, fname))

    # Also update Phase00A in both locations
    p00a_rule = """

---

# Output Directory Notice
本Phaseの実行開始時、ENGINEは必ず本プロジェクト専用の出力フォルダ（`output/{project_name}/`）を作成し、`research_interview.md` を含む以降の全成果物をそのフォルダ内に作成・格納すること。
"""
    for p_path in [os.path.join(root, "Phase00A_ResearchInterview.md"), os.path.join(sys_dir, "Phase00A_ResearchInterview.md")]:
        if os.path.exists(p_path):
            with open(p_path, "r", encoding="utf-8") as f:
                c = f.read()
            if "Output Directory Notice" not in c:
                with open(p_path, "w", encoding="utf-8") as f:
                    f.write(c + p00a_rule)
                print(f"Updated Phase00A in: {p_path}")

if __name__ == "__main__":
    main()
