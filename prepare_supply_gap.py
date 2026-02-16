import pandas as pd
import geopandas as gpd
import numpy as np

# 1️⃣ 读取 NTA 边界
nta = gpd.read_file("data/nta_boundary.geojson")

# 2️⃣ 读取 Supply Gap CSV
gap = pd.read_csv("data/Emergency_Food_Supply_Gap.csv")

# 3️⃣ 只保留 2024
gap_2024 = gap[gap["Year"] == 2024].copy()

# 4️⃣ 计算 log_gap（避免极端值主导）
gap_2024["log_gap"] = np.log10(gap_2024["Supply Gap (lbs.)"].replace({',':''}, regex=True).astype(float).abs() + 1)

# 5️⃣ 确保 join 字段一致（全部转字符串）
nta["nta"] = nta["nta2020"].astype(str)
gap_2024["nta"] = gap_2024["Neighborhood Tabulation Area NTA)"].astype(str)

# 6️⃣ Join
merged = nta.merge(gap_2024, on="nta", how="left")

# 7️⃣ 只保留必要字段
final = merged[[
    "nta",
    "ntaname",
    "Supply Gap (lbs.)",
    "Food Insecure Percentage",
    "log_gap",
    "geometry"
]]

# 8️⃣ 导出 GeoJSON
final = final.rename(columns={
    "ntaname": "nta_name",
    "Supply Gap (lbs.)": "supply_gap_lbs",
    "Food Insecure Percentage": "food_insecure_percentage"
})
final.to_file("data/nta_supply_gap_2024.geojson", driver="GeoJSON")

print("✅ GeoJSON created successfully!")
