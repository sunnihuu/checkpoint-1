document.addEventListener('DOMContentLoaded', function() {
        console.log('Page loaded!');
});
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

    map.addLayer({
        id: 'nta-gap',
        type: 'fill',
        source: 'nta',
        paint: {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'log_gap'],
                0, '#f7f7f7',
                4, '#fb6a4a',
                6, '#67000d'
            ],
            'fill-opacity': 0.75
        }
    });

    // Set water color to gray
    map.setPaintProperty('water', 'fill-color', '#f5f5f5');

    map.on('mousemove', 'nta-gap', (e) => {
        const props = e.features[0].properties;
            const props = e.features[0].properties;
            let gap = props.supply_gap_lbs;
            // Remove commas and parse as float
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
    });
});
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded!');
});
