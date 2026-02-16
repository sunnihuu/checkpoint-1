import csv
import requests
import json
import time

MAPBOX_TOKEN = "pk.eyJ1Ijoic3VubmlodSIsImEiOiJjbWxvcDgybjkwcXl5M2tva29ibG5tc2VmIn0.Irx4occMNtG5dMKorBjDJA"

input_file = "cfc_food_sites.csv"
output_file = "cfc_food_sites.geojson"

features = []

def geocode(address):
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"
    params = {
        "access_token": MAPBOX_TOKEN,
        "limit": 1
    }
    response = requests.get(url, params=params)
    try:
        data = response.json()
        if "features" in data and data["features"]:
            return data["features"][0]["geometry"]["coordinates"]
        else:
            print(f"No geocode result for: {address}")
            return None
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
        return None

with open(input_file, newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    
    for row in reader:
        full_address = f"{row['address']}, NYC {row['zip']}"
        coords = geocode(full_address)
        
        if coords:
            feature = {
                "type": "Feature",
                "properties": {
                    "id": row["id"],
                    "type": row["type"],
                    "org_name": row["org_name"],
                    "borough": row["borough"],
                    "zip": row["zip"],
                    "days": row["days"],
                    "hours": row["hours"]
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": coords
                }
            }
            features.append(feature)
        
        time.sleep(0.2)  # avoid rate limit

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(geojson, f, indent=2)

print("GeoJSON created successfully!")