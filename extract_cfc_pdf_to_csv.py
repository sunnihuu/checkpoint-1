import pdfplumber
import csv

pdf_path = "data/CFC_ACTIVE.pdf"
csv_path = "data/cfc_food_sites.csv"

# 你可以根据实际PDF表格结构调整这些字段
fieldnames = ["id", "type", "org_name", "phone", "address", "borough", "zip", "days", "hours"]

rows = []

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        table = page.extract_table()
        if not table:
            continue
        for i, row in enumerate(table):
            # 跳过表头
            if i == 0 and any(h in row[0].lower() for h in ["id", "type", "org"]):
                continue
            # 跳过空行
            if not any(row):
                continue
            # 补全或截断字段
            row = (row + [""] * len(fieldnames))[:len(fieldnames)]
            rows.append(dict(zip(fieldnames, row)))

with open(csv_path, "w", newline='', encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)

print(f"提取完成，已保存为 {csv_path}")
