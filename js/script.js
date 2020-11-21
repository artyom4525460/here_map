import * as data from './sample.json'
import { config } from './config'

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
  

  var svgCircle = '<svg width="1" height="1" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
      '</svg>'
  
  var svgCircleFirst = '<svg width="40" height="40" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="20" cy="20" r="10" fill="white" stroke="black" stroke-width="3"/>' +
      '</svg>'
  
  var svgCircleFirstCross = '<svg width="40" height="40" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
  '<circle cx="20" cy="20" r="10" fill="black" stroke="black" stroke-width="3"/>' +
  '<line x1="25" y1="25" x2="15" y2="15" stroke="white" stroke-width="3"/>' + 
  '<line x1="25" y1="15" x2="15" y2="25" stroke="white" stroke-width="3"/>' + 
  '</svg>'

  var lineCoords = new H.geo.LineString()
  var poligonMarkers = []
  var polyline = null
  var polygon = null
  var allowPoligonDraw = false
  var result = []

  var drawButton = document.getElementById('drawButton')
  var cancelDrawButton = document.getElementById('cancelDrawButton')
  console.log(drawButton)
  drawButton.addEventListener('click', function(e){
    e.preventDefault()
    if(polygon !== null){
      map.removeObject(polygon)
      polygon = null
      polyline = null
      poligonMarkers.map(function(item){
        map.removeObject(item)
      })
      poligonMarkers = []
      lineCoords = new H.geo.LineString()
      map.removeLayer(clusteringLayer)
      result = []
    }
    allowPoligonDraw = true
    map.removeLayer(clusteringLayer)
    cancelDrawButton.style.display = 'block'
    drawButton.style.display = 'none'
  })
  cancelDrawButton.addEventListener('click', function(e){
    e.preventDefault()
    
    map.removeObject(polyline)
    polyline = null
    poligonMarkers.map(function(item){
      map.removeObject(item)
    })
    poligonMarkers = []
    lineCoords = new H.geo.LineString()
    map.removeLayer(clusteringLayer)
    startClustering(map, markers)
    result = []

    cancelDrawButton.style.display = 'none'
    drawButton.style.display = 'block'
  })

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
        lineCoords, { style: { lineWidth: 2, strokeColor: 'rgb(150,150,150)' }}
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
        style: {fillColor: 'rgba(0, 50, 50, .4)', lineWidth: 1}
      }
    )
    map.removeObject(polyline)
    map.addObject(polygon)
    poligonMarkers[0].setIcon(new H.map.Icon(svgCircleFirstCross, { anchor: {x: 20, y: 20} } ) )

    map.removeLayer(clusteringLayer)
    startClustering(map, markers, polygon)
    console.log(result)  //  output result
    cancelDrawButton.style.display = 'none'
    drawButton.style.display = 'block'
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
    //poligonControl.setDisabled(false)
    result = []
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
      if(polygon !== null){
        result.push(item)
      }
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


  showMarkers()


  /**
   * 
   *  Create Control Button
   * 
   */
/*
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
 
    this.increaseBtn_ = new H.ui.base.Button({
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
*/
  /**
   * 
   *  End Create Control Button
   * 
   */

  }

document.addEventListener('DOMContentLoaded', function() {
  loadMap()
});