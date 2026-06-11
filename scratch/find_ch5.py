with open(r"d:\He Quan Tri CSDL\FE_RDBMS\scratch\baimau_extracted.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "chương 5" in line.lower() or "chương v" in line.lower() or "chuong 5" in line.lower() or "chuong v" in line.lower():
        print(f"Line {i+1}")
