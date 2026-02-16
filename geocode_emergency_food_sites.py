import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderQuotaExceeded
import time

input_csv = 'data/emergency_food_sites_all.csv'
output_csv = 'data/emergency_food_sites_all_geocoded.csv'

# Read input CSV
df = pd.read_csv(input_csv)

geolocator = Nominatim(user_agent="nyc-food-geocoder")
results = []
skipped = []

for idx, row in df.iterrows():
    address = row['address']
    try:
        location = geolocator.geocode(address, timeout=10)
        if location:
            results.append({
                'provider': row['provider'],
                'borough': row['borough'],
                'address': address,
                'latitude': location.latitude,
                'longitude': location.longitude
            })
        else:
            skipped.append(address)
    except (GeocoderTimedOut, GeocoderQuotaExceeded):
        skipped.append(address)
    except Exception:
        skipped.append(address)
    time.sleep(1)  # Respect Nominatim rate limits

# Write successful geocodes
gc_df = pd.DataFrame(results)
gc_df.to_csv(output_csv, index=False)

# Add comment about skipped rows
with open(output_csv, 'a') as f:
    if skipped:
        f.write('\n# The following addresses could not be geocoded due to errors or rate limits:\n')
        for addr in skipped:
            f.write(f'# {addr}\n')
