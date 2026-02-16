document.addEventListener('DOMContentLoaded', function() {
    mapboxgl.accessToken = 'pk.eyJ1Ijoic3VubmlodSIsImEiOiJjbWxvcDgybjkwcXl5M2tva29ibG5tc2VmIn0.Irx4occMNtG5dMKorBjDJA';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-73.94, 40.70],
        zoom: 10
    });

    map.on('load', () => {
        map.addSource('nta', {
            type: 'geojson',
            data: 'data/nta_supply_gap_2024.geojson'
        });

        // Add a feature-state driven fill-opacity for hover effect
        map.addLayer({
            id: 'nta-gap',
            type: 'fill',
            source: 'nta',
            paint: {
                'fill-color': [
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
        map.on('mousemove', 'nta-gap', (e) => {
            if (e.features.length > 0) {
                if (hoveredId !== null) {
                    map.setFeatureState(
                        { source: 'nta', id: hoveredId },
                        { hover: false }
                    );
                }
                hoveredId = e.features[0].id;
                map.setFeatureState(
                    { source: 'nta', id: hoveredId },
                    { hover: true }
                );
                const props = e.features[0].properties;
                let gap = props.supply_gap_lbs;
                if (typeof gap === 'string') {
                    gap = gap.replace(/,/g, '');
                }
                let gapNum = Number(gap);
                let gapDisplay = isNaN(gapNum) ? 'N/A' : gapNum.toLocaleString();
                document.getElementById('info').innerHTML = `
                    <strong>${props.nta_name}</strong><br>
                    Supply Gap: <strong>${gapDisplay}</strong> lbs<br>
                    Food Insecure: ${props.food_insecure_percentage}%
                `;
            }
        });
        map.on('mouseleave', 'nta-gap', () => {
            if (hoveredId !== null) {
                map.setFeatureState(
                    { source: 'nta', id: hoveredId },
                    { hover: false }
                );
            }
            hoveredId = null;
            document.getElementById('info').innerHTML = '';
        });
    });
});

