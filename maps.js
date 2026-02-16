// Legend HTML for each map (first 4)
const LEGEND_HTML = [
  // Emergency Food Supply Gap
  `<div style="display:flex;align-items:center;justify-content:center;gap:8px;">
    <span style='display:inline-block;width:18px;height:18px;background:#f7fbff;border:1px solid #bbb;'></span> Low
    <span style='display:inline-block;width:18px;height:18px;background:#6baed6;border:1px solid #bbb;'></span> Medium
    <span style='display:inline-block;width:18px;height:18px;background:#08306b;border:1px solid #bbb;'></span> High
  </div>
  <span style='font-size:0.85em;color:#888;'>Supply gap (log scale)</span>`,
  // NYC Farmers Markets
  `<span style='display:inline-block;width:18px;height:18px;background:#2ca02c;border-radius:50%;border:1.5px solid #222;vertical-align:middle;'></span> Market Location`,
  // Emergency Food Sites
  `<span style='display:inline-block;width:18px;height:18px;background:#e31a1c;border-radius:50%;border:1.5px solid #222;vertical-align:middle;'></span> Food Site`,
  // NYC Fresh Zoning
  `<span style='display:inline-block;width:32px;height:6px;background:#ff7f00;border-radius:3px;display:inline-block;vertical-align:middle;'></span> FRESH Zoning Boundary`,
  // Heat Vulnerability Index (HVI)
  `<div style="display:flex;align-items:center;justify-content:center;gap:8px;">
    <span style='display:inline-block;width:18px;height:18px;background:#ffffcc;border:1px solid #bbb;'></span> 1 (Lowest)
    <span style='display:inline-block;width:18px;height:18px;background:#a1dab4;border:1px solid #bbb;'></span> 2
    <span style='display:inline-block;width:18px;height:18px;background:#41b6c4;border:1px solid #bbb;'></span> 3
    <span style='display:inline-block;width:18px;height:18px;background:#2c7fb8;border:1px solid #bbb;'></span> 4
    <span style='display:inline-block;width:18px;height:18px;background:#253494;border:1px solid #bbb;'></span> 5 (Highest)
  </div>
  <span style='font-size:0.85em;color:#888;'>NYC Heat Vulnerability Index by ZIP</span>`,
  // NYC Truck Routes
  `<span style='display:inline-block;width:32px;height:6px;background:#222;border-radius:3px;display:inline-block;vertical-align:middle;'></span> Truck Route`,
  // Stormwater Flood Risk
  `<span style='display:inline-block;width:18px;height:18px;background:#3182bd;border-radius:3px;border:1.5px solid #222;vertical-align:middle;'></span> Flood Risk Area`
];

// Set legend HTML for all 8 maps (first 7 now defined)
for (let i = 0; i < 7; i++) {
  const legend = document.getElementById('legend' + i);
  if (legend) legend.innerHTML = LEGEND_HTML[i];
}
mapboxgl.accessToken = 'pk.eyJ1Ijoic3VubmlodSIsImEiOiJjbWxvcDgybjkwcXl5M2tva29ibG5tc2VmIn0.Irx4occMNtG5dMKorBjDJA'; // Replace with your token

const mapCount = 8;
const maps = [];
let isSyncing = false;

const initialCenter = [-73.97, 40.75]; // Midtown Manhattan
const initialZoom = 10.5;

for (let i = 0; i < mapCount; i++) {
  const map = new mapboxgl.Map({
    container: `map${i}`,
    style: 'mapbox://styles/mapbox/light-v11',
    center: initialCenter,
    zoom: initialZoom,
    attributionControl: false
  });
  maps.push(map);
}

function syncMaps(originMap) {
  if (isSyncing) return;
  isSyncing = true;
  const center = originMap.getCenter();
  const zoom = originMap.getZoom();
  const bearing = originMap.getBearing();
  const pitch = originMap.getPitch();
  maps.forEach(m => {
    if (m !== originMap) {
      m.jumpTo({ center, zoom, bearing, pitch });
    }
  });
  isSyncing = false;
}

maps.forEach(map => {
  map.on('moveend', () => syncMaps(map));
});

// Add data layers to each map in the specified order
// 0: Emergency Food Supply Gap
// 1: NYC Farmers Markets
// 2: Emergency Food Sites
// 3: NYC Fresh Zoning

const DATA_PATHS = [
  'data/nta_supply_gap_2024.geojson',
  'data/NYC_Farmers_Markets_20260216_cleaned.geojson',
  'data/emergency_food_sites_all.geojson',
  'data/nyc-fresh-zoining.geojson',
  'data/cfc_food_sites.geojson',
  'data/nyc-truck-routes-2026.geojson',
  'data/stormewater-flood.geojson'
];

// Layer configs for each map
const LAYER_CONFIGS = [
  // Emergency Food Supply Gap (polygons, fill)
  {
    id: 'supply-gap',
    type: 'fill',
    paint: {
      'fill-color': [
        'interpolate', ['linear'], ['get', 'log_gap'],
        5, '#f7fbff',
        6, '#6baed6',
        7, '#08306b'
      ],
      'fill-opacity': 0.7,
      'fill-outline-color': '#222'
    }
  },
  // NYC Farmers Markets (points, circle)
  {
    id: 'farmers-markets',
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#2ca02c',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#222',
      'circle-opacity': 0.85
    }
  },
  // CFC Food Sites (replaces Emergency Food Sites)
  {
    id: 'cfc-food-sites',
    type: 'circle',
    paint: {
      'circle-radius': 5,
      'circle-color': '#e31a1c',
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#222',
      'circle-opacity': 0.85
    }
  },
  // NYC Fresh Zoning (polygons, line)
  {
    id: 'fresh-zoning',
    type: 'line',
    paint: {
      'line-color': '#ff7f00',
      'line-width': 2.5,
      'line-opacity': 0.85
    }
  },
  // Heat Vulnerability Index (HVI) by ZIP (polygons, fill)
  {
    id: 'hvi-zip',
    type: 'fill',
    paint: {
      'fill-color': [
        'match', ['get', 'hvi'],
        1, '#ffffcc',
        2, '#a1dab4',
        3, '#41b6c4',
        4, '#2c7fb8',
        5, '#253494',
        '#ccc'
      ],
      'fill-opacity': 0.7,
      'fill-outline-color': '#222'
    }
  },
  // NYC Truck Routes (lines)
  {
    id: 'truck-routes',
    type: 'line',
    paint: {
      'line-color': '#222',
      'line-width': 2.5,
      'line-opacity': 0.85
    }
  },
  // Stormwater Flood Risk (polygons, fill)
  {
    id: 'stormwater-flood',
    type: 'fill',
    paint: {
      'fill-color': '#3182bd',
      'fill-opacity': 0.5,
      'fill-outline-color': '#222'
    }
  }
];

// Add layers to the first 7 maps (including truck routes and flood risk)
for (let i = 0; i < 7; i++) {
  maps[i].on('load', () => {
    fetch(DATA_PATHS[i])
      .then(r => r.json())
      .then(data => {
        maps[i].addSource(LAYER_CONFIGS[i].id + '-src', {
          type: 'geojson',
          data
        });
        maps[i].addLayer({
          id: LAYER_CONFIGS[i].id,
          type: LAYER_CONFIGS[i].type,
          source: LAYER_CONFIGS[i].id + '-src',
          paint: LAYER_CONFIGS[i].paint,
          layout: { visibility: 'visible' }
        });
      });
  });
}
