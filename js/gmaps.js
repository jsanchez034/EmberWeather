Gmap = {
  TempModel: null,
  lat: null,
  lon: null,
  latLong: null,
  map: null,
  marker: null,
  geoflag: null,
  intialize: function(lat, lon) {
	  var self = this,
	      center,
	      mapOptions = {
			zoom: 8,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		  },
		  currRoute = App.get('router');
	  center = new google.maps.LatLng(self.lat, self.lon);
	  self.latLong = center;
	  self.map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
	  self.map.setCenter(center);
	  self.marker = new google.maps.Marker({
		position: center,
		map: self.map,
		draggable: true
	  });
	  
	  google.maps.event.addListener(self.marker, 'dragend', function(event) {
		self.setNewPosition(event.latLng);
	  });
	  
	  google.maps.event.addListener(this.map, 'dblclick', function(event) {
		self.setNewPosition(event.latLng);
	  });
	  
	  if (currRoute.currentState.name === 'aRoute') {
	  	navigator.geolocation.getCurrentPosition(self.getCurrentLocal, self.getDefaultLocal);
		setTimeout(function() {
			if (self.geoflag === null){
				self.getDefaultLocal();
			};
		}, 3000);
	  }
	  
	},
  getCurrentLocal: function(p) {
	var lat = p.coords.latitude,
		lon = p.coords.longitude,
		handler = App.get('router').currentState.name === 'aRoute' ? 'goToTemp' : 'changeLat';
		
		Gmap.setMyCenter(lat, lon);
		App.get('router').send(handler, {
			lat: lat,
			lon: lon
		});
		
		Gmap.geoflag = 1;
		
  },
  getDefaultLocal: function(err) {
		var LAT = '25.6925',
			LON = '-80.2596',
			handler = App.get('router').currentState.name === 'aRoute' ? 'goToTemp' : 'changeLat';
  		
		Gmap.setMyCenter(LAT, LON);
		App.get('router').send(handler, {
			lat: LAT,
			lon: LON
		});
		
		Gmap.geoflag = 1;
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
	
		this.latLong = LatLong;
		this.marker.setPosition(LatLong);
			
		tModel.set('isLoading', true);
		tModel.set('lat', LatLong.lat().toString());
		tModel.set('lon', LatLong.lng().toString());
		tModel.set('changePos', true);	
   },
  setMyCenter: function(lat, lon) {
		this.latLong = new google.maps.LatLng(lat, lon);
		this.map.setCenter(this.latLong);
		this.marker.setPosition(this.latLong);
  }
};