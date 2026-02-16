document.addEventListener('DOMContentLoaded', function() {
        // Layer toggle logic with mode-based visibility and styling
        function setLayerVisibility(layerId, visible) {
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
            }
        }
        function setLayerOpacity(layerId, opacity) {
            if (map.getLayer(layerId)) {
                if (layerId === 'nta-shortfall') {
                    map.setPaintProperty(layerId, 'fill-opacity', opacity);
                } else if (layerId === 'emergency-food-sites-all-circle' || layerId === 'farmers-markets-geojson-circle') {
                    map.setPaintProperty(layerId, 'circle-opacity', opacity);
                } else if (layerId === 'fresh-zoning') {
                    map.setPaintProperty(layerId, 'line-opacity', opacity);
                }
            }
        }
        function setLayerStyle(mode) {
            // Reset all layers
            setLayerVisibility('nta-shortfall', false);
            setLayerVisibility('emergency-food-sites-all-circle', false);
            setLayerVisibility('farmers-markets-geojson-circle', false);
            setLayerVisibility('fresh-zoning', false);
            // Mode logic
            if (mode === 'need') {
                setLayerVisibility('nta-shortfall', true);
                setLayerOpacity('nta-shortfall', 0.6);
            } else if (mode === 'emergency') {
                setLayerVisibility('nta-shortfall', true);
                setLayerOpacity('nta-shortfall', 0.3);
                setLayerVisibility('emergency-food-sites-all-circle', true);
                setLayerOpacity('emergency-food-sites-all-circle', 0.7);
            } else if (mode === 'fresh') {
                setLayerVisibility('nta-shortfall', true);
                setLayerOpacity('nta-shortfall', 0.2);
                setLayerVisibility('farmers-markets-geojson-circle', true);
                setLayerOpacity('farmers-markets-geojson-circle', 0.7);
            } else if (mode === 'policy') {
                setLayerVisibility('fresh-zoning', true);
                setLayerOpacity('fresh-zoning', 1.0);
                setLayerVisibility('nta-shortfall', false);
            } else if (mode === 'mismatch') {
                // Only show mismatch layer (advanced: add filter/highlight)
                setLayerVisibility('nta-shortfall', true);
                setLayerOpacity('nta-shortfall', 0.8);
                setLayerVisibility('emergency-food-sites-all-circle', false);
                setLayerVisibility('farmers-markets-geojson-circle', false);
                setLayerVisibility('fresh-zoning', false);
                // Optionally highlight mismatch NTAs
                alert('Mismatch Index: High shortfall, low fresh access, low FRESH zoning. (Advanced highlighting can be added)');
            }
        }
        // UI toggle underline
        function setActiveToggle(mode) {
            document.querySelectorAll('.toggle-item').forEach(item => {
                item.classList.remove('active');
                item.style.borderBottom = '2px solid transparent';
            });
            const active = document.getElementById('toggle-' + mode);
            if (active) {
                active.classList.add('active');
                active.style.borderBottom = '2px solid #222';
            }
        }
        document.getElementById('toggle-shortfall').onclick = () => {
            setLayerStyle('need');
            setActiveToggle('shortfall');
        };
        document.getElementById('toggle-emergency').onclick = () => {
            setLayerStyle('emergency');
            setActiveToggle('emergency');
        };
        document.getElementById('toggle-fresh').onclick = () => {
            setLayerStyle('fresh');
            setActiveToggle('fresh');
        };
        document.getElementById('toggle-policy').onclick = () => {
            setLayerStyle('policy');
            setActiveToggle('policy');
        };
        document.getElementById('toggle-mismatch').onclick = () => {
            setLayerStyle('mismatch');
            setActiveToggle('mismatch');
        };
        // Default mode
        setLayerStyle('need');
        setActiveToggle('shortfall');
    mapboxgl.accessToken = 'pk.eyJ1Ijoic3VubmlodSIsImEiOiJjbWxvcDgybjkwcXl5M2tva29ibG5tc2VmIn0.Irx4occMNtG5dMKorBjDJA';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-73.94, 40.70],
        zoom: 10
    });

    // Add all emergency food sites from combined GeoJSON
    map.on('load', () => {
        map.addSource('emergency-food-sites-all', {
            type: 'geojson',
            data: 'data/emergency_food_sites_all.geojson'
        });
        map.addLayer({
            id: 'emergency-food-sites-all-circle',
            type: 'circle',
            source: 'emergency-food-sites-all',
            paint: {
                'circle-radius': 8,
                'circle-color': '#1976d2',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
                'circle-opacity': 0.95
            }
        });
        map.on('click', 'emergency-food-sites-all-circle', function(e) {
            const props = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.features[0].geometry.coordinates)
                .setHTML(
                    `<strong>${props['provider']}</strong><br>` +
                    `${props['address']}<br>` +
                    `Borough: ${props['borough']}`
                )
                .addTo(map);
        });
        map.on('mouseenter', 'emergency-food-sites-all-circle', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'emergency-food-sites-all-circle', () => {
            map.getCanvas().style.cursor = '';
        });
    });

    // Utility: fetch CSV and convert to GeoJSON
    function csvToGeoJSON(csvUrl, callback) {
        fetch(csvUrl)
            .then(response => response.text())
            .then(text => {
                // Robust CSV parsing for quoted fields
                const rows = text.split(/\r?\n/);
                const header = rows[0].replace(/\r/g, '').split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
                const features = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i].replace(/\r/g, '').split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
                    if (row.length < 6) continue;
                    const lat = parseFloat(row[header.indexOf('Latitude')]);
                    const lon = parseFloat(row[header.indexOf('Longitude')]);
                    if (isNaN(lat) || isNaN(lon)) continue;
                    const props = {};
                    header.forEach((h, idx) => props[h.replace(/"/g, '')] = row[idx] ? row[idx].replace(/"/g, '') : '');
                    features.push({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [lon, lat] },
                        properties: props
                    });
                }
                console.log('Farmers market points loaded:', features.length);
                callback({ type: 'FeatureCollection', features });
            });
    }

    // Add farmers market points from GeoJSON file
    map.on('load', () => {
        map.addSource('farmers-markets-geojson', {
            type: 'geojson',
            data: 'data/NYC_Farmers_Markets_20260216_cleaned.geojson'
        });
        map.addLayer({
            id: 'farmers-markets-geojson-circle',
            type: 'circle',
            source: 'farmers-markets-geojson',
            paint: {
                'circle-radius': 8,
                'circle-color': '#ff5722',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
                'circle-opacity': 1
            }
        });
        map.on('click', 'farmers-markets-geojson-circle', function(e) {
            const props = e.features[0].properties;
            new mapboxgl.Popup()
                .setLngLat(e.features[0].geometry.coordinates)
                .setHTML(
                    `<strong>${props['Market Name']}</strong><br>` +
                    `${props['Street Address']}<br>` +
                    `Borough: ${props['Borough']}`
                )
                .addTo(map);
        });
        map.on('mouseenter', 'farmers-markets-geojson-circle', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'farmers-markets-geojson-circle', () => {
            map.getCanvas().style.cursor = '';
        });
    });

    map.on('load', () => {
                        // Add emergency food sites as points
                        map.addSource('emergency-food-sites', {
                            type: 'geojson',
                            data: 'data/emergency_food_sites.geojson'
                        });
                        map.addLayer({
                            id: 'emergency-food-sites-circle',
                            type: 'circle',
                            source: 'emergency-food-sites',
                            paint: {
                                'circle-radius': 8,
                                'circle-color': '#1976d2',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#fff',
                                'circle-opacity': 0.95
                            }
                        });
                        map.on('click', 'emergency-food-sites-circle', function(e) {
                            const props = e.features[0].properties;
                            new mapboxgl.Popup()
                                .setLngLat(e.features[0].geometry.coordinates)
                                .setHTML(
                                    `<strong>${props['provider']}</strong><br>` +
                                    `${props['address']}<br>` +
                                    `Borough: ${props['borough']}`
                                )
                                .addTo(map);
                        });
                        map.on('mouseenter', 'emergency-food-sites-circle', () => {
                            map.getCanvas().style.cursor = 'pointer';
                        });
                        map.on('mouseleave', 'emergency-food-sites-circle', () => {
                            map.getCanvas().style.cursor = '';
                        });
                // Load farmers market points after map is ready
                csvToGeoJSON('data/NYC_Farmers_Markets_20260216_cleaned.csv', function(geojson) {
                    map.addSource('farmers-markets', {
                        type: 'geojson',
                        data: geojson
                    });
                    map.addLayer({
                        id: 'farmers-markets-circle',
                        type: 'circle',
                        source: 'farmers-markets',
                        paint: {
                            'circle-radius': 8,
                            'circle-color': '#ff5722',
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#fff',
                            'circle-opacity': 1
                        }
                    });
                    // Show popup on click
                    map.on('click', 'farmers-markets-circle', function(e) {
                        const props = e.features[0].properties;
                        new mapboxgl.Popup()
                            .setLngLat(e.features[0].geometry.coordinates)
                            .setHTML(
                                `<strong>${props['Market Name']}</strong><br>` +
                                `${props['Street Address']}<br>` +
                                `Borough: ${props['Borough']}`
                            )
                            .addTo(map);
                    });
                    // Change cursor on hover
                    map.on('mouseenter', 'farmers-markets-circle', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    });
                    map.on('mouseleave', 'farmers-markets-circle', () => {
                        map.getCanvas().style.cursor = '';
                    });
                });
        map.addSource('nta', {
            type: 'geojson',
            data: 'data/nta_supply_gap_2024.geojson'
        });

        // Add NYC Fresh Zoning source
        map.addSource('fresh-zoning', {
            type: 'geojson',
            data: 'data/nyc-fresh-zoining.geojson'
        });

        // Add NYC Fresh Zoning layer with categorical colors
        map.addLayer({
            id: 'fresh-zoning-fill',
            type: 'fill',
            source: 'fresh-zoning',
            paint: {
                'fill-color': [
                    'match',
                    ['get', 'name'],
                    'Discretionary tax incentives', '#ffd600',
                    'Zoning incentives', '#00bcd4',
                    'Zoning and discretionary tax incentives', '#8bc34a',
                    /* default */ '#eeeeee'
                ],
                'fill-opacity': 0.25
            }
        }, 'nta-gap'); // Insert below NTA gap layer

        map.addLayer({
            id: 'fresh-zoning-outline',
            type: 'line',
            source: 'fresh-zoning',
            paint: {
                'line-color': [
                    'match',
                    ['get', 'name'],
                    'Discretionary tax incentives', '#ffd600',
                    'Zoning incentives', '#00bcd4',
                    'Zoning and discretionary tax incentives', '#8bc34a',
                    /* default */ '#888888'
                ],
                'line-width': 2,
                'line-opacity': 0.7
            }
        });

        // Add a feature-state driven fill-opacity for hover effect
        map.addLayer({
            id: 'nta-gap',
            type: 'fill',
            source: 'nta',
            paint: {
                'fill-color': [
                    'case',
                        ['has', 'log_gap'],
                        [
                            'interpolate',
                            ['linear'],
                            ['get', 'log_gap'],
                            4.12, '#f2f2f2',   // min
                            5.4,  '#fde0dd',   // lower-mid
                            5.7,  '#fca5a5',   // start cluster
                            5.9,  '#fb6a4a',   // middle cluster
                            6.1,  '#cb181d',   // upper cluster
                            6.63, '#67000d'    // max
                        ],
                        '#cccccc' // No data: light gray
                ],
                'fill-opacity': [
                    'case',
                        ['boolean', ['feature-state', 'hover'], false], 0.9,
                        0.4
                ]
            }
        });

        map.addLayer({
            id: 'nta-outline',
            type: 'line',
            source: 'nta',
            paint: {
                'line-color': [
                    'case',
                        ['boolean', ['feature-state', 'hover'], false], '#333',
                        '#ffffff'
                ],
                'line-width': [
                    'case',
                        ['boolean', ['feature-state', 'hover'], false], 2,
                        0.5
                ],
                'line-opacity': 0.5
            }
        });

        // Hover highlight and info panel logic
        let hoveredId = null;
        let selectedId = null;
        map.on('mousemove', 'nta-gap', (e) => {
            if (e.features.length > 0) {
                if (hoveredId !== null && hoveredId !== selectedId) {
                    map.setFeatureState(
                        { source: 'nta', id: hoveredId },
                        { hover: false }
                    );
                }
                hoveredId = e.features[0].id;
                if (hoveredId !== selectedId) {
                    map.setFeatureState(
                        { source: 'nta', id: hoveredId },
                        { hover: true }
                    );
                }
                const props = e.features[0].properties;
                let gap = props.supply_gap_lbs;
                if (typeof gap === 'string') {
                    gap = gap.replace(/,/g, '');
                }
                let gapNum = Number(gap);
                let gapDisplay = isNaN(gapNum) ? 'N/A' : gapNum.toLocaleString();
                let foodInsecure = props.food_insecure_percentage;
                if (typeof foodInsecure === 'string') {
                    foodInsecure = foodInsecure.replace(/%+$/, '');
                }
                if (!selectedId) {
                    document.getElementById('info').innerHTML = `
                        <strong>Neighborhood:</strong> ${props.nta_name}<br>
                        Food Shortfall: <strong>${gapDisplay}</strong> lbs<br>
                        Food Insecurity Rate: ${foodInsecure}%
                    `;
                }
            }
        });
        map.on('mouseleave', 'nta-gap', () => {
            if (hoveredId !== null && hoveredId !== selectedId) {
                map.setFeatureState(
                    { source: 'nta', id: hoveredId },
                    { hover: false }
                );
            }
            hoveredId = null;
            if (!selectedId) {
                document.getElementById('info').innerHTML = '';
            }
        });

        map.on('click', 'nta-gap', (e) => {
            if (e.features.length > 0) {
                // Remove previous selection highlight
                if (selectedId !== null) {
                    map.setFeatureState(
                        { source: 'nta', id: selectedId },
                        { hover: false }
                    );
                }
                selectedId = e.features[0].id;
                map.setFeatureState(
                    { source: 'nta', id: selectedId },
                    { hover: true }
                );
                const props = e.features[0].properties;
                let gap = props.supply_gap_lbs;
                if (typeof gap === 'string') {
                    gap = gap.replace(/,/g, '');
                }
                let gapNum = Number(gap);
                let gapDisplay = isNaN(gapNum) ? 'N/A' : gapNum.toLocaleString();
                let foodInsecure = props.food_insecure_percentage;
                if (typeof foodInsecure === 'string') {
                    foodInsecure = foodInsecure.replace(/%+$/, '');
                }
                document.getElementById('info').innerHTML = `
                    <strong>Neighborhood:</strong> ${props.nta_name}<br>
                    Food Shortfall: <strong>${gapDisplay}</strong> lbs<br>
                    Food Insecurity Rate: ${foodInsecure}%<br>
                    <span style="color:#888;font-size:12px;">(Click again to reset)</span>
                `;
                // Zoom to neighborhood
                const coordinates = e.features[0].geometry.coordinates;
                let bounds = new mapboxgl.LngLatBounds();
                // MultiPolygon: coordinates[0][0] is the outer ring
                coordinates.forEach(poly => {
                    poly[0].forEach(coord => bounds.extend(coord));
                });
                map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
            }
        });

        map.on('click', (e) => {
            // Reset selection if clicking outside a neighborhood
            const features = map.queryRenderedFeatures(e.point, { layers: ['nta-gap'] });
            if (features.length === 0 && selectedId !== null) {
                map.setFeatureState(
                    { source: 'nta', id: selectedId },
                    { hover: false }
                );
                selectedId = null;
                document.getElementById('info').innerHTML = '';
            }
        });
    });
});

