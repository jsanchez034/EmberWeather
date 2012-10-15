Gmap = {
  TempModel: null,
  lat: null,
  lon: null,
  map: null,
  marker: null,
  mCenter: null,
  intialize: function(reset) {
	  var self = this,
	      center = new google.maps.LatLng(self.lat, self.lon),
	      mapOptions = {
			zoom: 8,
			center: center,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		  };
	  self.mCenter = center;
	  self.map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions),
	  self.marker = new google.maps.Marker({
		position: center,
		map: self.map
	  });
	  
	  google.maps.event.addListener(this.map, 'click', function(event) {
		self.setNewPosition(event.latLng);
	  });
	},
  loadMap: function() {
	  var script = document.createElement("script");
	  if (!document.getElementById("gmaps")) {
		  script.id = "gmaps"
		  script.type = "text/javascript";
		  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyBN9sWx5KtunbDEB3xBs1urR_yWstUKmzs&sensor=true&callback=Gmap.intialize";
		  document.body.appendChild(script);
	  } else {
	    script = "";
	  }
	},
  setNewPosition: function(LatLong) {
    var tModel = this.TempModel;
    this.lat = LatLong.lat();
	this.lon = LatLong.lng();
	this.marker.setPosition(LatLong);
	this.map.panTo(LatLong);
	
	tModel.set('isLoading', true);
	tModel.set('lat', LatLong.lat().toString());
	tModel.set('lon', LatLong.lng().toString());
	tModel.set('changePos', true);	
   }
};