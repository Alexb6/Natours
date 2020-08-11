
export const displayMap = locations => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWxleGI2IiwiYSI6ImNrYnQ2bGkwYzA2dnEyc21pd2x3MXM1NWoifQ.9ObM9BceYAOwfrwI1_MG7Q';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/alexb6/ckbt8vida0ntp1iohx0bstvcw',
        // center: [-118.568314, 34.183908],
        // zoom: 4
    });
    // Set the limits of the map (mapbox uses 2 points => a rectangle)
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create the marker's html element to insert a marker img
        const el = document.createElement('div');
        el.className = 'marker';
        // Add the marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom' // the location is at the bottom of the marker img
        }).setLngLat(loc.coordinates).addTo(map);
        // Add a Popup
        new mapboxgl.Popup({ offset: 32 })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);
        // Extend map's bounds to include current location
        bounds.extend(loc.coordinates);
    });

    // Call fitBounds on map to execute the moving & zooming 
    map.fitBounds(bounds, {
        padding: { // Add padding to the map's anchor point
            top: 200,
            bottom: 100,
            left: 100,
            right: 100
        }
    });
};


