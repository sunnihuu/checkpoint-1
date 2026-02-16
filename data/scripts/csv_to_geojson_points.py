import csv, json

INFILE = "../NYC_Farmers_Markets_20260216.csv"
OUTFILE = "../nyc_farmers_markets.geojson"

features = []
with open(INFILE, newline="", encoding="utf-8") as f:
    r = csv.DictReader(f)
    for row in r:
        lat = row.get("Latitude") or row.get("lat") or row.get("LATITUDE")
        lon = row.get("Longitude") or row.get("lon") or row.get("LONGITUDE")
        if not lat or not lon:
            continue
        features.append({
            "type": "Feature",
            "properties": row,
            "geometry": {"type":"Point","coordinates":[float(lon), float(lat)]}
        })

g = {"type":"FeatureCollection","features":features}
with open(OUTFILE, "w", encoding="utf-8") as f:
    json.dump(g, f)

print("Wrote", OUTFILE, "features:", len(features))
