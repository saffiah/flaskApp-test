require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/request"],

function(Map, MapView, FeatureLayer, esriRequest){

  var natGasL = new FeatureLayer({
    url: "http://services2.arcgis.com/VofPZYDe2pLxSP5G/arcgis/rest/services/CA_Natural_Gas_Pipeline/FeatureServer/0",
    id: "natgas",
    opacity: 0.9,
    visible: true
  });
  var GensL = new FeatureLayer({
    url: "https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Generator/FeatureServer/0",
    id: "gen",
    opacity: 0.9,
    visible: true
  });

  var map = new Map({
    basemap: "gray"
  });
  map.add(natGasL);
  map.add(GensL);

  var view = new MapView({
    container: "viewDiv",  // Reference to the scene div created in step 5
    map: map,  // Reference to the map object created before the scene
    zoom: 10,  // Sets zoom level based on level of detail (LOD)
    center: [-118.2437, 34.0522]  // Sets center point of view using longitude,latitude; 34.0522° N, 118.2437° W
  });

  view.ui.add(document.getElementById('dlButton'));
  //view.ui.add(document.getElementById('upButton'));
  //once the view loads...then define extent

  $("#dlButton").click(function () {
    view.when(function() {
    xmin=view.extent.xmin;
    ymin=view.extent.ymin;
    xmax=view.extent.xmax;
    ymax=view.extent.ymax;
    console.log(xmin,ymin,xmax,ymax);

    var url2 = natGasL.url+'/'+natGasL.layerId.toString() + '/query/?f=geojson&geometryType=esriGeometryEnvelope&geometry='+xmin+','+ymin+','+xmax+','+ymax+'&returnGeometry=true&outFields=*';
    console.log(url2)
    downloadGeoJson(url2,natGasL.title);
    var cars = [
      { "make":"Porsche", "model":"911S" },
      { "make":"Mercedes-Benz", "model":"220SE" },
      { "make":"Jaguar","model": "Mark VII" }
    ];
    console.log(cars)
    // $.post("receiver", JSON.stringify(cars), function(results) {
    // console.log(results)
    // // stop link reloading the page
    // event.preventDefault();

  });
  });


  function downloadGeoJson(layerURL,layerTitle){
    esriRequest(layerURL,{responseType: 'geojson'}).then(function(results){
    console.log(results)
    var geoJsonFeats = JSON.parse(results.data);
    console.log(geoJsonFeats.features.length)
    if (geoJsonFeats.features.length ===0) {
        console.log('Nothing to download')
        alert("No feature data to download.");

    }
    else {
    console.log(geoJsonFeats.features[0].geometry.type);
    console.log(JSON.stringify(geoJsonFeats))

    // if features exist in the map extent, then save that file with filename the same as the layer's title (with underscore replacing the space)
    $.post("receiver", JSON.stringify(geoJsonFeats), function(results2) {
    console.log(results2.length)
    console.log(geoJsonFeats.features[0].geometry.type)
    //console.log(type(geoJsonFeats.features[0].geometry.type))
    // stop link reloading the page
    event.preventDefault();
    //if the length of the results2 string is equal to zero, then alert the user with a popup saying so. Otherwise download the file.

    if (geoJsonFeats.features[0].geometry.type == 'Point') {
        var DLfilename = 'PointFeatures.dxf'
    }
    else if (geoJsonFeats.features[0].geometry.type == 'LineString') {
        var DLfilename = 'LineFeatures.dxf'
    }

    if (results2.length != 0) {
        console.log(DLfilename)
        var blob=new Blob([results2]);
        var link=document.createElement('a');
        link.href=window.URL.createObjectURL(blob);
        link.download=DLfilename;
        link.click();
    }
    });
    }
  });
  }




});
