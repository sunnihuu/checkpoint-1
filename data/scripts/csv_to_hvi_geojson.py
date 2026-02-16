import csv, json
from pathlib import Path

csv_path = Path('data/Heat_Vulnerability_Index_Rankings_20260216.csv')
geojson_path = Path('data/Modified_Zip_Code_Tabulation_Areas_(MODZCTA)_20260216.geojson')
out_path = Path('data/Heat_Vulnerability_Index_Rankings_20260216.geojson')

with open(csv_path, newline='') as f:
    reader = csv.DictReader(f)
    hvi_by_zip = {row['ZIP Code Tabulation Area (ZCTA) 2020'].zfill(5): int(row['Heat Vulnerability Index (HVI)']) for row in reader}

with open(geojson_path) as f:
    modzcta = json.load(f)

features = []
for feat in modzcta['features']:
    zip_code = feat['properties'].get('modzcta', '').zfill(5)
    if zip_code in hvi_by_zip:
        new_feat = {
            'type': 'Feature',
            'geometry': feat['geometry'],
            'properties': {
                'zip': zip_code,
                'hvi': hvi_by_zip[zip_code]
            }
        }
        features.append(new_feat)

with open(out_path, 'w') as f:
    json.dump({'type': 'FeatureCollection', 'features': features}, f, indent=2)
print(f"Wrote {len(features)} features with HVI to {out_path}")
