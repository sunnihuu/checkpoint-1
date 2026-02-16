

if (!window.mapboxgl) {
  console.error("Mapbox GL not loaded. Check script tag / network.");
}
mapboxgl.accessToken = 'pk.eyJ1Ijoic3VubmlodSIsImEiOiJjbWxvcDgybjkwcXl5M2tva29ibG5tc2VmIn0.Irx4occMNtG5dMKorBjDJA';

const MAP_KEYS = [
  "supplyGap",
  "farmersMarkets",
  "emergencyFood",
  "freshZoning",
  "truckRoutes",
  "floodRisk",
];

const maps = new Map();

const DATA_SOURCES = {
  supplyGap:       "/Users/sunni/Desktop/GitHub/checkpoint-1/data/nta_supply_gap_2024.geojson",
  farmersMarkets:  "/Users/sunni/Desktop/GitHub/checkpoint-1/data/nyc_farmers_markets.geojson",   // ✅ 转换后的 geojson
  emergencyFood:   "/Users/sunni/Desktop/GitHub/checkpoint-1/data/cfc_food_sites.geojson",
  freshZoning:     "/Users/sunni/Desktop/GitHub/checkpoint-1/data/nyc-fresh-zoning.geojson",      // ✅ 建议你重命名为 zoning
  truckRoutes:     "/Users/sunni/Desktop/GitHub/checkpoint-1/data/nyc-truck-routes-2026.geojson",
  floodRisk:       "/Users/sunni/Desktop/GitHub/checkpoint-1/data/stormwater-flood.geojson"       // ✅ 建议你重命名为 stormwater
};

// --- Layers per map ---
function addLayersForKey(map, key) {
  if (key === "supplyGap") {
    map.addSource("supplyGap", { type: "geojson", data: DATA_SOURCES.supplyGap });

    map.addLayer({
      id: "supplyGap-fill",
      type: "fill",
      source: "supplyGap",
      paint: {
        "fill-color": [
          "interpolate", ["linear"], ["coalesce", ["get", "gap_rank"], 0],
          1, "#dbeafe",
          10, "#1d4ed8"
        ],
        "fill-opacity": 0.65
      }
    });

    map.addLayer({
      id: "supplyGap-outline",
      type: "line",
      source: "supplyGap",
      paint: { "line-color": "#1d4ed8", "line-width": 1 }
    });
  }

  if (key === "farmersMarkets") {
    map.addSource("farmersMarkets", { type: "geojson", data: DATA_SOURCES.farmersMarkets });

    map.addLayer({
      id: "farmersMarkets",
      type: "circle",
      source: "farmersMarkets",
      paint: {
        "circle-radius": 5,
        "circle-color": "#16a34a",
        "circle-opacity": 0.85,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1
      }
    });
  }

  if (key === "emergencyFood") {
    map.addSource("emergencyFood", { type: "geojson", data: DATA_SOURCES.emergencyFood });

    map.addLayer({
      id: "emergencyFood",
      type: "circle",
      source: "emergencyFood",
      paint: {
        "circle-radius": 5,
        "circle-color": "#dc2626",
        "circle-opacity": 0.75,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1
      }
    });
  }

  if (key === "freshZoning") {
    map.addSource("freshZoning", { type: "geojson", data: DATA_SOURCES.freshZoning });

    map.addLayer({
      id: "freshZoning",
      type: "line",
      source: "freshZoning",
      paint: { "line-color": "#f97316", "line-width": 2 }
    });
  }

  if (key === "truckRoutes") {
    map.addSource("truckRoutes", { type: "geojson", data: DATA_SOURCES.truckRoutes });

    map.addLayer({
      id: "truckRoutes",
      type: "line",
      source: "truckRoutes",
      paint: { "line-color": "#111827", "line-width": 2 }
    });
  }

  if (key === "floodRisk") {
    map.addSource("floodRisk", { type: "geojson", data: DATA_SOURCES.floodRisk });

    map.addLayer({
      id: "floodRisk-fill",
      type: "fill",
      source: "floodRisk",
      paint: { "fill-color": "#38bdf8", "fill-opacity": 0.35 }
    });

    map.addLayer({
      id: "floodRisk-outline",
      type: "line",
      source: "floodRisk",
      paint: { "line-color": "#0284c7", "line-width": 1 }
    });
  }
}

// --- Init maps ---
window.addEventListener("load", () => {
  if (!window.mapboxgl) {
    console.error("Mapbox GL not loaded.");
    return;
  }
  MAP_KEYS.forEach((key) => {
    const map = new mapboxgl.Map({
      container: `map-${key}`,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-73.95, 40.73],
      zoom: 10.5,
      interactive: true,
    });
    maps.set(key, map);
    map.on("load", () => {
      map.resize();
      addLayersForKey(map, key);
    });
    map.on("error", (e) => {
      console.error("Map error:", key, e?.error);
    });
  });
});

// --- Map sync (safe) ---
let isSyncing = false;
function syncFrom(sourceKey) {
  if (isSyncing) return;
  isSyncing = true;

  const sourceMap = maps.get(sourceKey);
  const center = sourceMap.getCenter();
  const zoom = sourceMap.getZoom();
  const bearing = sourceMap.getBearing();
  const pitch = sourceMap.getPitch();

  maps.forEach((m, key) => {
    if (key === sourceKey) return;
    m.jumpTo({ center, zoom, bearing, pitch });
  });

  isSyncing = false;
}

maps.forEach((map, key) => {
  map.on("move", () => syncFrom(key));
});

// --- Legend config (colors match layers) ---
const LEGENDS = {
  supplyGap: {
    title: "Supply Gap",
    subtitle: "Unmet emergency food need (rank 1–10)",
    items: [{ type: "ramp", label: "Low → High", ramp: ["#dbeafe", "#1d4ed8"] }],
  },
  farmersMarkets: {
    title: "NYC Farmers Markets",
    subtitle: "Market locations",
    items: [{ type: "dot", label: "Farmers Market", color: "#16a34a" }],
  },
  emergencyFood: {
    title: "Emergency Food Sites",
    subtitle: "CFC program locations",
    items: [{ type: "dot", label: "Food Site", color: "#dc2626" }],
  },
  freshZoning: {
    title: "NYC FRESH Zoning",
    subtitle: "Zoning districts",
    items: [{ type: "line", label: "FRESH boundary", color: "#f97316" }],
  },
  truckRoutes: {
    title: "Truck Routes",
    subtitle: "Designated truck routes",
    items: [{ type: "line", label: "Truck Route", color: "#111827" }],
  },
  floodRisk: {
    title: "Flood Risk",
    subtitle: "Stormwater flood risk areas",
    items: [{ type: "fill", label: "Flood Risk Area", color: "#38bdf8" }],
  },
};

function renderLegend(key) {
  const cfg = LEGENDS[key];
  document.getElementById("legendTitle").textContent = cfg?.title ?? "Legend";
  document.getElementById("legendSubtitle").textContent = cfg?.subtitle ?? "";

  const wrap = document.getElementById("legendContent");
  wrap.innerHTML = "";

  (cfg?.items ?? []).forEach((it) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "10px";
    row.style.padding = "8px 0";
    row.style.borderBottom = "1px solid #f0f0f0";

    const swatch = document.createElement("div");

    if (it.type === "dot") {
      swatch.style.width = "14px";
      swatch.style.height = "14px";
      swatch.style.borderRadius = "999px";
      swatch.style.background = it.color ?? "#999";
      swatch.style.border = "1px solid #fff";
    } else if (it.type === "line") {
      swatch.style.width = "26px";
      swatch.style.height = "4px";
      swatch.style.borderRadius = "6px";
      swatch.style.background = it.color ?? "#999";
    } else if (it.type === "fill") {
      swatch.style.width = "18px";
      swatch.style.height = "18px";
      swatch.style.borderRadius = "6px";
      swatch.style.background = it.color ?? "#999";
      swatch.style.opacity = "0.7";
    } else if (it.type === "ramp") {
      const [c1, c2] = it.ramp ?? ["#eee", "#111"];
      swatch.style.width = "90px";
      swatch.style.height = "10px";
      swatch.style.borderRadius = "6px";
      swatch.style.background = `linear-gradient(90deg, ${c1}, ${c2})`;
    }

    const label = document.createElement("div");
    label.textContent = it.label;

    row.appendChild(swatch);
    row.appendChild(label);
    wrap.appendChild(row);
  });
}

// --- Map selection ---
function setActive(key) {
  document.querySelectorAll(".cell").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.mapkey === key);
    // 如果你按我之前建议把 cell 改成 button，可以加 aria-pressed
    // el.setAttribute("aria-pressed", el.dataset.mapkey === key ? "true" : "false");
  });
  renderLegend(key);
}

document.querySelectorAll(".cell").forEach((cell) => {
  cell.addEventListener("click", () => setActive(cell.dataset.mapkey));
});

setActive("supplyGap");
