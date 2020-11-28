import * as data from './sample.json'
import { config } from './config'
import _ from 'lodash'

const markers = data.result

mapboxgl.accessToken = config.mapbox_token;
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-3.60, 40.40],
    zoom: 9
});

var markersLayer
var filterMarkersLayer

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

var points = []

map.on('load', function () {
    map.addSource('points', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': globalFeatures
        },
        'generateId': true
    });

    markersLayer = {
        'id': 'points',
        'type': 'circle',
        'source': 'points',

        'paint': {
            'circle-radius': 6,
            'circle-color': '#00aa00',
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'circle-opacity': 0.8
        },
        'filter': ['==', '$type', 'Point']
    }
    
    map.addLayer(markersLayer)
});



const NewSimpleSelect = _.extend(MapboxDraw.modes.simple_select, {
    dragMove() {}
});
  
const NewDirectSelect = _.extend(MapboxDraw.modes.direct_select, {
    dragFeature() {}
});

var draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        //polygon: true
    },
    boxSelect: false,
    styles: [
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
        {
          "id": "gl-draw-polygon-and-line-vertex-halo-active",
          "type": "circle",
          "paint": {
            "circle-radius": 0,
            "circle-color": "#FFF"
          }
        },
        {
          "id": "gl-draw-polygon-and-line-vertex-active",
          "type": "circle",
          "paint": {
            "circle-radius": 0,
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
      ],
      modes: {
        ...MapboxDraw.modes,
        simple_select: NewSimpleSelect,
        direct_select: NewDirectSelect
      }
});

map.addControl(draw);

map.on('mousemove', 'gl-draw-polygon-fill', function(){
    map.getCanvas().style.cursor = 'pointer';
})
    
map.on('draw.create', drawCreate);
map.on('draw.delete', drawDelete);
map.on('draw.update', drawUpdate);

var pointID = null;
map.on('mousemove', 'points', (e) => {
    if(draw.getMode() == 'simple_select'){
        pointID = e.features[0].id
        map.getCanvas().style.cursor = 'pointer'
    }
})

map.on('click', (e) => {
    if(pointID){
        console.log(e.lngLat)
    }
})

map.on("mouseleave", "points", function() {
    pointID = null
    map.getCanvas().style.cursor = ''
})
    
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
    createCloseMarker()
    //map.moveLayer(yourLandmarkLayerId, someAnotheLayerId);
    //console.log(map.getStyle().layers);
    //var layerId = layers[i].id;
    //draw.boxSelect();
    //draw.deleteAll()
    createdPolygone()
}


var el = document.createElement('div')
var closeMarker
var createCloseMarker = function()
{
    el.className = 'close-marker'
    el.style.backgroundImage ='url("https://www.freeiconspng.com/thumbs/close-button-png/black-circle-close-button-png-5.png")';
    el.style.width = '20px';
    el.style.height = '20px';
    
    el.addEventListener('click', drawDelete);
    
    closeMarker = new mapboxgl.Marker(el)
        .setLngLat(draw.getAll().features[0].geometry.coordinates[0][0])
        .addTo(map);
}

function drawDelete(e){

    poligonCreate = false

    map.removeLayer('filteredPoints')
    map.removeSource('filteredPoints')
    drawButton.style.display = "block"
    cancelDrawButton.style.display = 'none'
    closeMarker.remove()
    
    map.removeLayer('resultPolygone')
    map.removeSource('maine')
    map.addLayer(markersLayer)
}

map.on('click', 'drag', function (e) {
    console.log('click')
})


//var drawPoligonButton = document.getElementsByClassName('mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_polygon');

var poligonCreate = false
/*drawPoligonButton[0].addEventListener('click', function(e){
    if(poligonCreate){
        console.log('already created')
    }
    else{
        map.removeLayer('points')
    }
})*/


var filteredFeatures
var filteredMarkersLayer

function filterMarkers(coords){

    let filteredMarkers = markers.filter(function(item) {
        if(
          turf.booleanPointInPolygon(
            turf.point(
              [item.longitude, item.latitude]
            ),
            turf.polygon(
              [coords]
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
        },
        'generateId': true
    });

    filteredMarkersLayer = {
        'id': 'filteredPoints',
        'type': 'circle',
        'source': 'filteredPoints',
        'paint': {
            'circle-radius': 6,
            'circle-color': '#00aa00',
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1,
            'circle-opacity': 0.8
        },
    }
    
    map.addLayer(filteredMarkersLayer)

    //filteredPoints
    let pointID = null
    map.on('mousemove', 'filteredPoints', (e) => {
        if(draw.getMode() == 'simple_select'){
            pointID = e.features[0].id
            map.getCanvas().style.cursor = 'pointer'
        }
    })
    
    map.on('click', (e) => {
        if(pointID){
            console.log(e.lngLat)
        }
    })
    
    map.on("mouseleave", "filteredPoints", function() {
        pointID = null
        map.getCanvas().style.cursor = ''
    })

}


var drawButton = document.getElementById('drawButton')
var cancelDrawButton = document.getElementById('cancelDrawButton')

drawButton.addEventListener('click', function(e){
    draw.changeMode('draw_polygon');
    if(!poligonCreate){
        map.removeLayer('points')
    }
    drawButton.style.display = "none"
    cancelDrawButton.style.display = 'block'
})

cancelDrawButton.addEventListener('click', function(e){
    drawDelete(e)
})

  
var resultPolygone

let createdPolygone = function(){
    let coords = draw.getAll().features[0].geometry.coordinates[0]
    /*let coords = draw.getAll().features[0].geometry.coordinates[0].map(function(coord){
        return {
            longitude : coord.longitude,
            latitude : coord.latitude
        }
    })
    console.log(coords)*/
    map.addSource('maine', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [
                    
                        draw.getAll().features[0].geometry.coordinates[0]
                    
                ]
            }
        }
    });

    resultPolygone = {
        'id': 'resultPolygone',
        'type': 'fill',
        'source': 'maine',
        'layout': {},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.8
        }
    }

    map.addLayer(resultPolygone);

    draw.deleteAll()

    filterMarkers(coords)    
}