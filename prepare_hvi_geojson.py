import json
import csv

# File paths
geojson_path = "data/Modified_Zip_Code_Tabulation_Areas_(MODZCTA)_20260216.geojson"
csv_path = "data/Heat_Vulnerability_Index_Rankings_20260216.csv"
output_path = "data/Heat_Vulnerability_Index_Rankings_20260216.geojson"

# Load HVI data from CSV
hvi_lookup = {}
with open(csv_path, newline="") as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        zip_code = row["ZIP Code Tabulation Area (ZCTA) 2020"].strip()
        hvi = row["Heat Vulnerability Index (HVI)"].strip()
        if zip_code and hvi:
            hvi_lookup[zip_code] = int(hvi)

# Load GeoJSON
with open(geojson_path) as f:
    geojson = json.load(f)

# Build new features with HVI property
new_features = []
for feature in geojson["features"]:
    modzcta = feature["properties"].get("modzcta", "").strip()
    if modzcta in hvi_lookup:
        new_feature = {
            "type": "Feature",
            "geometry": feature["geometry"],
            "properties": {
                "modzcta": modzcta,
                "hvi": hvi_lookup[modzcta]
            }
        }
        new_features.append(new_feature)

# Output FeatureCollection
output = {
    "type": "FeatureCollection",
    "features": new_features
}

with open(output_path, "w") as f:
    json.dump(output, f)
