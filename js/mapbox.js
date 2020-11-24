import * as data from './sample.json'
import { config } from './config'

const markers = data.result

mapboxgl.accessToken = config.mapbox_token;
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
    center: [-3.60, 40.40], // starting position [lng, lat]
    zoom: 9 // starting zoom
});

var markersLayer
var filterMarkersLayer
//var globalFeatures = []

var globalFeatures = markers.map(function(item){
    return {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [
                item.longitude,
                item.latitude,
            ]
        }
    }
})

map.on('load', function () {
    // Add an image to use as a custom marker
    map.loadImage(
        'https://upload.wikimedia.org/wikipedia/commons/1/11/Pan_Green_Circle.png',
        function (error, image) {
            if (error) throw error;
            map.addImage('custom-marker', image);
            // Add a GeoJSON source with 2 points
            map.addSource('points', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': globalFeatures
                }
            });

            markersLayer = {
                'id': 'points',
                'type': 'symbol',
                'source': 'points',
                'layout': {
                    'icon-image': 'custom-marker',
                    "icon-size": 0.02,
                    // get the title name from the source's "title" property
                    'text-field': ['get', 'title'],
                    'text-font': [
                        'Open Sans Semibold',
                        'Arial Unicode MS Bold'
                    ],
                    'text-offset': [0, 1.25],
                    'text-anchor': 'top'
                }
            }
            
            // Add a symbol layer
            map.addLayer(markersLayer)
        }
    );
});

var draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        polygon: true,
        trash: true
    },
    styles: [
        // Set the line style for the user-input coordinates
        {
          "id": "gl-draw-line",
          "type": "line",
          "layout": {
            "line-cap": "round",
            "line-join": "round"
          },
          "paint": {
            "line-color": "#438EE4",
            "line-dasharray": [0.2, 2],
            "line-width": 4,
            "line-opacity": 0.7,
          }
        },
        // Style the vertex point halos
        {
          "id": "gl-draw-polygon-and-line-vertex-halo-active",
          "type": "circle",
          "paint": {
            "circle-radius": 12,
            "circle-color": "#FFF"
          }
        },
        // Style the vertex points
        {
          "id": "gl-draw-polygon-and-line-vertex-active",
          "type": "circle",
          "paint": {
            "circle-radius": 8,
            "circle-color": "#438EE4",
          }
        },
        {
            "id": 'gl-draw-polygon-fill',
            "type": 'fill',
            "paint": {
                'fill-color': '#D20C0C',
                'fill-outline-color': '#D20C0C',
                'fill-opacity': 0.1,
            },
        }
      ]
});

map.addControl(draw);
    
map.on('draw.create', drawCreate);
map.on('draw.delete', drawDelete);
map.on('draw.update', drawUpdate);
    
function updateArea(e) {
    var data = draw.getAll();
    var answer = document.getElementById('calculated-area');
}

function drawUpdate(e){
    if (e.action === 'move') {
        //draw.deleteAll();
    }
}

function drawCreate(e){
    poligonCreate = true
    drawPoligonButton[0].disabled = true;
    filterMarkers()
}

function drawDelete(e){

    poligonCreate = false
    drawPoligonButton[0].disabled = false;

    map.removeLayer('filteredPoints')
    map.removeSource('filteredPoints')
    map.addLayer(markersLayer)
}

map.on('click', 'drag', function (e) {
    console.log('click')
})


var drawPoligonButton = document.getElementsByClassName('mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_polygon');

//console.log(drawPoligonButton[0])
var poligonCreate = false
drawPoligonButton[0].addEventListener('click', function(e){
    if(poligonCreate){
        console.log('already created')
    }
    else{
        map.removeLayer('points')
    }
})


var filteredFeatures
var filteredMarkersLayer

function filterMarkers(){

    let filteredMarkers = markers.filter(function(item) {
        if(
          turf.booleanPointInPolygon(
            turf.point(
              [item.longitude, item.latitude]
            ),
            turf.polygon(
              [draw.getAll().features[0].geometry.coordinates[0]]
            )
          )
        ){
          return true
        }
        else{
          return false
        }
    })

    console.log(filteredMarkers)

    filteredFeatures = filteredMarkers.map(function(item){
        return {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    item.longitude,
                    item.latitude,
                ]
            }
        }
    })

    map.addSource('filteredPoints', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': filteredFeatures
        }
    });

    filteredMarkersLayer = {
        'id': 'filteredPoints',
        'type': 'symbol',
        'source': 'filteredPoints',
        'layout': {
            'icon-image': 'custom-marker',
            "icon-size": 0.02,
            // get the title name from the source's "title" property
            'text-field': ['get', 'title'],
            'text-font': [
                'Open Sans Semibold',
                'Arial Unicode MS Bold'
            ],
            'text-offset': [0, 1.25],
            'text-anchor': 'top'
        }
    }
    
    // Add a symbol layer
    map.addLayer(filteredMarkersLayer)
}
