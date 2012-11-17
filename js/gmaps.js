Gmap = {
  TempModel: null,
  currentNode: null,
  lat: null,
  lon: null,
  latLong: null,
  map: null,
  marker: null,
  geoflag: null,
  etimeout: null,
  count: 1,
  markerArr: [],
  intialize: function() {
	  var self = this,
	      center,
	      mapOptions = {
			zoom: 8,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		  },
		  currRoute = App.get('router'),
		  intialNode = null;
	  center = new google.maps.LatLng(self.lat, self.lon);
	  self.latLong = center;
	  self.map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
	  self.map.setCenter(center);
	  self.marker = new google.maps.Marker({
		position: center,
		map: self.map,
		draggable: true,
		title: "Marker " + (self.count)
	  });
	  
	  
	  google.maps.event.addListener(this.map, 'dblclick', function(event) {
		self.count = self.count + 1;
		self.createNewMarker(event.latLng);
	  });
	  
	  if (currRoute.currentState.name === 'aRoute') {
		self.etimeout = setTimeout(self.getDefaultLocal, 10000);
	  	navigator.geolocation.getCurrentPosition(self.getCurrentLocal, self.getDefaultLocal,{timeout:5000});
		
	  }
	  
	  if (this.TempModel) this.addDragHandle(this.TempModel.get('tempTabArr')[0], this.marker);
	},
  setTempModel: function(mdl) {
	this.TempModel= mdl;
	if (typeof google === 'undefined') return;
	this.addDragHandle(this.TempModel.get('tempTabArr')[0], this.marker);
  },
  getCurrentLocal: function(p) {
	clearTimeout(Gmap.etimeout);
	var lat = p.coords.latitude,
		lon = p.coords.longitude,
		handler = App.get('router').currentState.name === 'aRoute' ? 'goToTemp' : 'changeLat';
		
		Gmap.setMyCenter(lat, lon);
		App.get('router').send(handler, {
			cord: lat + "%" + lon
		});		
  },
  getDefaultLocal: function(err) {
		clearTimeout(Gmap.etimeout);
		var LAT = '25.6925',
			LON = '-80.2596',
			handler = App.get('router').currentState.name === 'aRoute' ? 'goToTemp' : 'changeLat';
  		
		Gmap.setMyCenter(LAT, LON);
		App.get('router').send(handler, {
			cord: LAT + "%" + LON
		});

  },
  addDragHandle: function(node, marker) {
		var self = this;
  		google.maps.event.addListener(marker, 'dragend', function(event) {
			var thisNode = node;
			self.marker = marker;
			self.setNewPosition(event.latLng, thisNode);
		  })
  
  },
  loadMap: function() {
	  var script = document.createElement("script");
	  if (!document.getElementById("gmaps")) {
		  script.id = "gmaps"
		  script.type = "text/javascript";
		  script.src = "http://maps.googleapis.com/maps/api/js?key=AIzaSyBN9sWx5KtunbDEB3xBs1urR_yWstUKmzs&sensor=true&callback=Gmap.intialize";
		  document.scripts[0].appendChild(script);
	  } else {
	    script = "";
	  }
	},
  setNewPosition: function(LatLong, node) {
	if (node) this.currentNode = node;
    var cNode = this.currentNode;
	
		this.latLong = LatLong;
		this.marker.setPosition(LatLong);
			
		cNode.set('isLoading', true);	
		cNode.set('lat', LatLong.lat().toString());
		cNode.set('lon', LatLong.lng().toString());
		cNode.set('changePos', true);

   },
  setMyCenter: function(lat, lon) {
		this.latLong = new google.maps.LatLng(lat, lon);
		this.map.setCenter(this.latLong);
		this.marker.setPosition(this.latLong);
  },
  createNewMarker: function(LatLong) {
	var self = this,
		mTitle = "Marker " + self.count,
		nMarker = new google.maps.Marker({
		position: LatLong,
		map: this.map,
		draggable: true,
		title: mTitle
	  }),
	  node;
	  
	  self.markerArr.push(nMarker);
	  node = this.TempModel.addNode(LatLong);
	  
	  this.addDragHandle(node, nMarker);
  
  },
  clearAllMarkers: function() {
	this.count = 1;
	var i = this.markerArr.length;
    for (; i--; ) {
		this.markerArr[i].setMap(null);
	}
  }
};