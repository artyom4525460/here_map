import * as data from './sample.json'
import * as data from './config'
import { config } from './config';

const markers = data.result

function loadMap() {
  var platform = new H.service.Platform({
    'app_id' : config.app_id,
    'apikey': config.apikey
  });

  var defaultLayers = platform.createDefaultLayers();

  var map = new H.Map(
    document.getElementById('mapContainer'),
    defaultLayers.vector.normal.map,
    {
      zoom: 9,
      center: { lat: 40.40, lng: -3.60 },
    }
  )

  var ui = H.ui.UI.createDefault(map, defaultLayers);

  ui.getControl('zoom').setDisabled(false)

  window.addEventListener('resize', function () {
    map.getViewPort().resize(); 
  })

  var mapEvents = new H.mapevents.MapEvents(map);

  var behavior = new H.mapevents.Behavior(mapEvents);
  

  var svgCircle = '<svg width="10" height="10" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="5" cy="5" r="3" fill="transparent" stroke="red" stroke-width="3"/>' +
      '</svg>'
  
  var svgCircleFirst = '<svg width="40" height="40" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="20" cy="20" r="10" fill="transparent" stroke="red" stroke-width="3"/>' +
      '</svg>'
  
  var svgCircleFirstCross = '<svg width="40" height="40" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
  '<circle cx="20" cy="20" r="10" fill="white" stroke="red" stroke-width="3"/>' +
  '<line x1="25" y1="25" x2="15" y2="15" stroke="red" stroke-width="3"/>' + 
  '<line x1="25" y1="15" x2="15" y2="25" stroke="red" stroke-width="3"/>' + 
  '</svg>'

  var lineCoords = new H.geo.LineString()
  var poligonMarkers = []
  var polyline = null
  var polygon = null
  var allowPoligonDraw = false

  map.addEventListener('pointerdown', function(evt){
    if( !allowPoligonDraw ){
      return
    }
    if(polygon !== null){
      return
    }
    if(evt.target == poligonMarkers[0]){
      return
    }
    let firstFlag = poligonMarkers.length == 0
    var coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
    let currentMarker = new H.map.Marker(
      {
        lat: coord.lat.toFixed(4),
        lng: coord.lng.toFixed(4)
      },
      {
        icon: new H.map.Icon( firstFlag ? svgCircleFirst : svgCircle, {anchor:firstFlag ? {x: 20, y: 20} : {x: 5, y: 5} } ),
      }
    )
    map.addObject(currentMarker)
    poligonMarkers.push(currentMarker)
    lineCoords.pushLatLngAlt(coord.lat.toFixed(4), coord.lng.toFixed(4), 0)
    if( polyline !== null ){
      polyline.setGeometry(lineCoords)
    }
    if( poligonMarkers.length == 2 ){
      polyline = new H.map.Polyline(
        lineCoords, { style: { lineWidth: 4 }}
      )
      map.addObject(polyline)
    }

    if(firstFlag){
      currentMarker.addEventListener('tap', clickFirstMarker);
    }
  })

  function clickFirstMarker(evt){
    evt.preventDefault()
    if(poligonMarkers.length <= 2){
      return
    }
    else{
      if(polygon === null){
        createPolygon()
        allowPoligonDraw = false
      }
      else{
        removePolygon()
      }
    }
    
  }

  function createPolygon() {
    polygon = new H.map.Polygon(
      new H.geo.Polygon(lineCoords),
      {
        style: {fillColor: 'rgba(0, 150, 0, .4)', lineWidth: 1}
      }
    )
    map.removeObject(polyline)
    map.addObject(polygon)
    poligonMarkers[0].setIcon(new H.map.Icon(svgCircleFirstCross, { anchor: {x: 20, y: 20} } ) )

    map.removeLayer(clusteringLayer)
    startClustering(map, markers, polygon)
  }

  function removePolygon() {
    map.removeObject(polygon)
    polygon = null
    polyline = null
    poligonMarkers.map(function(item){
      map.removeObject(item)
    })
    poligonMarkers = []
    lineCoords = new H.geo.LineString()


    map.removeLayer(clusteringLayer)
    startClustering(map, markers)
    poligonControl.setDisabled(false)
  }

  var clusteredDataProvider
  var clusteringLayer

  function startClustering(map, data, polygon = null) {
    if(polygon !== null){
      var convertPoligonCoords = polygon.toGeoJSON().geometry.coordinates[0].map(function(coord){
        return [coord[1],coord[0]]
      })
    }
    var dataPoints = data
    .filter(function(item) {
      if( polygon !== null ){
        if(
          turf.booleanPointInPolygon(
            turf.point(
              [item.latitude, item.longitude]
            ),
            turf.polygon(
              [convertPoligonCoords]
            )
          )
        ){
          return true
        }
        else{
          return false
        }
      }
      else{
        return true
      }
    })
    .map(function (item) {
      return new H.clustering.DataPoint(parseFloat(item.latitude), parseFloat(item.longitude));
    });
  
    clusteredDataProvider = new H.clustering.Provider(dataPoints, {
      clusteringOptions: {
        eps: 32,
        minWeight: 2
      }
    });
  
    clusteringLayer = new H.map.layer.ObjectLayer(clusteredDataProvider);

    map.addLayer(clusteringLayer);
  }


  function showMarkers(){
    startClustering(map, markers)
  }

  /*var testPolygon = new H.map.Polygon(
    new H.geo.Polygon(
      new H.geo.LineString(
        [40.54071645525099, -4.165761533809863, 0, 40.48744345410659, -3.61918942886437, 0, 40.1615621829243, -3.6472187675795236, 0, 40.26323486562559, -4.17977620316744, 0]
      )
    ),
    {
      style: {fillColor: 'rgba(150, 0, 0, .8)', lineWidth: 0}
    }
  )

  map.addObject(testPolygon)*/

  showMarkers()

  //map.addObject(polygon);

  var inherits = function(childCtor, parentCtor) {   
    function tempCtor() {}  
    tempCtor.prototype = parentCtor.prototype;   
    childCtor.superClass_ = parentCtor.prototype;   
    childCtor.prototype = new tempCtor();   
    childCtor.prototype.constructor = childCtor;   
    childCtor.base = function(me, methodName, var_args) {
      var args = new Array(arguments.length - 2);
      for (var i = 2; i < arguments.length; i++) {
        args[i - 2] = arguments[i];
      }
      return parentCtor.prototype[methodName].apply(me, args);   
    }; 
  };

  var PoligonControl = function(opt_options) {   
    'use strict';   
    var options = opt_options || {};

    H.ui.Control.call(this);   
    this.onButtonClick = this.onButtonClick.bind(this);

    // create a button element   
    this.increaseBtn_ = new H.ui.base.Button({
      // 'label': '<svg class="H_icon H_icon" viewBox="0 0 25 25">' +
      //   '<path d="M 18.5,11 H 14 V 6.5 c 0,-.8 -.7,-1.5 -1.5,-1.5 -.8,0 -1.5,.7 -1.5,1.5 V 11 H 6' +
      //   '.5 C 5.7,11 5,11.7 5,12.5 5,13.3 5.7,14 6.5,14 H 11 v 4.5 c 0,.8 .7,1.5 1.5,1.5 .8,0 1.5,' +
      //   '-.7 1.5,-1.5 V 14 h 4.5 C 19.3,14 20,13.3 20,12.5 20,11.7 19.3,11 18.5,11 z" />' +
      //   '</svg>',
      'label': '<svg class="H_icon H_icon" viewBox="0 0 25 25">' +
        '<polygon points="10,0 25,10 18,18 0,25"/>' +
        '</svg>',
      'onStateChange': this.onButtonClick   
    });

    this.addChild(this.increaseBtn_);

    this.setAlignment(options['alignment'] || 'top-right');

    this.options_ = options; }; 
    inherits(PoligonControl, H.ui.Control);

    PoligonControl.prototype.onButtonClick = function(evt) {   
      'use strict';   
      if (evt.currentTarget.getState() === 'down') {
          allowPoligonDraw = true
          this.setDisabled(true)
      } 
    };

    var poligonControl = new PoligonControl(); 
    ui.addControl('poligonControl', poligonControl);

  //#endregion
  }

document.addEventListener('DOMContentLoaded', function() {
  loadMap()
});

// window.onload = function(){
//   loadMap()
// }