import os
import glob

def clean_md_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    cleaned_lines = []
    for line in lines:
        # Strip trailing whitespaces while preserving newlines
        cleaned_lines.append(line.rstrip() + "\n")

    # Join and strip excess empty lines at end of file
    content = "".join(cleaned_lines).rstrip() + "\n"

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    root = os.path.abspath(".")
    
    # Target directories to check and clean
    target_dirs = [
        os.path.join(root, "prompt"),
        os.path.join(root, "templates"),
        os.path.join(root, "system_instructions", "prompt"),
        os.path.join(root, "system_instructions", "templates"),
        os.path.join(root, "system_instructions")
    ]

    count = 0
    for d in target_dirs:
        if os.path.exists(d):
            md_files = glob.glob(os.path.join(d, "*.md"))
            for mf in md_files:
                clean_md_file(mf)
                count += 1
                print(f"Audited and formatted: {os.path.relpath(mf, root)}")

    print(f"\nCompleted audit and formatting for {count} Markdown files.")

if __name__ == "__main__":
    main()
