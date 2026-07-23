import os
import shutil

root_dir = os.path.abspath(".")
sys_dir = os.path.join(root_dir, "system_instructions")
gen_dir = os.path.join(root_dir, "generated_paper")

system_files = [
    "ENGINE.md", "PROJECT_GUIDE.md", "AGENT_RULES.md", "STATE_MACHINE.md", "WORKFLOW.md",
    "Phase00A_ResearchInterview.md", "Phase00B_ResearchPlanning.md", "Phase00C_ResearchReview.md",
    "Phase01_LiteratureReview.md", "Phase03_ExperimentDesign.md", "Phase04_Writing.md",
    "Phase05_ReferenceAudit.md", "Phase06_Reviewer.md", "Phase07_Reviewer2.md",
    "Phase08_EditorialBoard.md", "Phase09_QualityAssurance.md", "Phase10_Finalize.md"
]

def main():
    os.makedirs(sys_dir, exist_ok=True)
    os.makedirs(gen_dir, exist_ok=True)

    for sf in system_files:
        src = os.path.join(root_dir, sf)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(sys_dir, sf))
            print(f"Synced system file: {sf} -> system_instructions/")

    for folder in ["prompt", "templates"]:
        src_folder = os.path.join(root_dir, folder)
        if os.path.exists(src_folder):
            dest_folder = os.path.join(sys_dir, folder)
            if os.path.exists(dest_folder):
                shutil.rmtree(dest_folder)
            shutil.copytree(src_folder, dest_folder)
            print(f"Synced folder: {folder} -> system_instructions/{folder}")

    print("\nAll system instruction files and directories successfully updated and synced!")

if __name__ == "__main__":
    main()
