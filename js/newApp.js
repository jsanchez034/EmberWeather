App = Ember.Application.create({
	ready: function() {
		cosm.setKey( "prXnPTW5cdY7Hnl6QBl__UYyxl6SAKxsb1ZVSzM1SjBrOD0g" ); 
		var router = this.get('router');
		router.get('findTempsController').connectControllers('application');
		Ember.ENV.RAISE_ON_DEPRECATION = true;
		Gmap.lat = '44.7964';
		Gmap.lon = '-73.962';
		Gmap.loadMap();

	}
});

App.ApplicationView = Ember.View.extend({
  templateName: 'application'
  
});
App.ApplicationController = Ember.Controller.extend({
	loading: false,
	GloadInc: "width:10%"
});

App.FindTempsController = Ember.ObjectController.extend({
	content: {},
	applicationController: null,
	loadingBinding: "applicationController.loading",
	loadIncBinding: "applicationController.GloadInc",
	loadIncObs: function(obj, keyName) {
		var val = this.get(keyName),
		    newInc,
			newIncStyle;
		if (val > -1) {
			newInc = Math.round(val * 100);
			newIncStyle = "width: " + newInc + "%";
			this.set('loadInc', newIncStyle);
			if (newInc >= 101) {
				this.set(keyName, -1);
			}
		}

	}.observes('content.currLoadint'),
	contentObs: function() {
		var isDoneLoading = this.get('content.isLoading');
		this.set('loading', isDoneLoading);
	}.observes('content.isLoading'),
	latlongObs: function(obj, keyName) {
		if (this.get(keyName)) {
			this.changePosition();
		}

	}.observes('content.changePos'),
	changePosition: function(){
		var content = this.get('content')
			lat = content.get('lat'),
			lon = content.get('lon');
		App.get('router').send('changeLat', {
			lat: lat,
			lon: lon
		});

	  }
});

App.FindTempsView = Ember.View.extend({
  templateName: 'temperatures'
});

App.Temperature = Ember.Object.extend({
  lat: null,
  lon: null,
  indoorNodes: null, 
  outdoorNodes: null,
  notSpecNodes: null,
  changePos: null,
  isLoading: null,
  currLoadint: null,
  tempUnts: 'F',
  init: function() {
	this._super();
	this.set('indoorNodes',[]);
	this.set('outdoorNodes',[]);
	this.set('notSpecNodes',[]);
	this.set('currLoadint', 0);
  },
  
  allTemps: function(){
		return {
			indoor: this.get('indoorNodes'),
			outdoor: this.get('outdoorNodes'),
			special: this.get('notSpecNodes')
		}
	}.property('indoorNodes', 'outdoorNodes', 'notSpecNodes'),
	
	getLastUpdateDate: function() {
		var d = this.get('updated'),
			date_arr,
			time_arr,
			sec;
			
		if(d) { 
			d = d.split("T");
			date_arr = d[0].split("-");
			time_arr = d[1].split(":");
			sec = time_arr[2].split("Z")[0].split(".")[0];
		
		return date_arr[1] + "/" + date_arr[2] + "/" + date_arr[0] + " " + time_arr[0] + ":" + time_arr[1] + ":" + sec;
		
		}
	}.property('updated'),
	
	getCreator: function() {
		var crArr = this.get('creator').split("/");
		return crArr[crArr.length -1];
	}.property('creator'),
	
	getTags: function() {
		var tags = this.get('tags');
		if (tags) {
			return tags.toString();
		}
		return "";
		
	}.property('tags'),
	
	getTemp: function() {
		var dtstream = this.get('datastreams'),
			unts = this.get('tempUnts'),
			tempVal,
			units = 'C',
			sym = /^[^A-z0-9]?C$|^[^A-z0-9]?F$/gi,
			mCel = /(celsius|celcius|C$)/gi,
			mFar = /(fahrenheit|F$)/gi,
			thisdtstream,
			tags,
			t,
			i;
			
			if(dtstream) i = dtstream.length;

		while(i--) {
			thisdtstream = dtstream[i];
			tags = thisdtstream.tags;
			if (typeof thisdtstream.unit != 'undefined') { 
			  if (typeof thisdtstream.unit.symbol != 'undefined' && sym.test(thisdtstream.unit.symbol)) {
			       units = thisdtstream.unit.symbol.replace(/[^CF]/g,'');
				   if (units !== "") {
					tempVal = thisdtstream.current_value;
					break;
					}
				}
			  if (typeof thisdtstream.unit.label != 'undefined') {
				   if (mCel.test(thisdtstream.unit.label)) {
					units = "C";
					tempVal = thisdtstream.current_value;
					break;
				   } else if(mFar.test(thisdtstream.unit.label)) {
					units = "F";
					tempVal = thisdtstream.current_value;
					break;
				   }
				}
			} 
			
			if (thisdtstream.id.toLowerCase() == 'temperature') {
			  tempVal = thisdtstream.current_value;
			  break;
			}
			for(t in tags){
			  if(tags.hasOwnProperty(t) && tags[t].toLowerCase() === 'temperature') {
				tempVal = thisdtstream.current_value;
				break;
			  }
			}
		}
		
		switch(units.toUpperCase())
		{
			case 'C':
			  if (unts == 'F') tempVal = ((parseFloat(tempVal) * (9/5)) + 32);
			  break;
			case 'F':
			  if (unts == 'C') tempVal = ((5/9) * (parseFloat(tempVal)-32));
			  break;
		}
		
		if (parseFloat(tempVal)) {
			return parseFloat(tempVal).toFixed(2) + " " + unts;
		} else {
			return "Bad Data!!";
		}
	}.property('tempUnts', 'datastreams'),
		
	loadTemps: function() {
		var self = this;
		self.set('isLoading',true);
		self.set('currLoadint', 0.10);
		
		cosm.request(
			{
			 url:"http://api.cosm.com/v2/feeds.json?lat=" + self.lat + "&lon=" + self.lon + "&distance=100&q=temperature&key=xc2IDXBLap9ht5uTLuizhWb-FM2SAKx5eXR1N3lLMVpBOD0g",
			 done: function(response) {
				var res = response.results,
					i = res.length,
					begin = 1,
					incUnit = 1/i,
					resl;
					
					
					
					while(i--) {
						resl = res[i].location;
						exposure = (typeof resl !== 'undefined' && resl.hasOwnProperty('exposure')) ? resl.exposure : null;
						switch(exposure)
						{
							case 'indoor':
							  self.indoorNodes.addObject(App.Temperature.create(res[i]));
							  break;
							case 'outdoor':
							  self.outdoorNodes.addObject(App.Temperature.create(res[i]));
							  break;
							default:
							  self.notSpecNodes.addObject(App.Temperature.create(res[i]));
						}
						self.set('currLoadint', begin * incUnit);
						begin = begin + 1;
					}
					
					Gmap.TempModel = self;

					self.set('changePos', false);	
					setTimeout(function() {
						self.set('currLoadint', 102);
						self.set('isLoading',false);
						}, 600);
			 }
			});

		return self;
	}

});

App.Router = Ember.Router.extend({
    enableLogging: true,
    root: Ember.Route.extend({
		aRoute: Ember.Route.extend({
            route: '/',
			goToTemp: Ember.Route.transitionTo('temperatures')
        }),
		temperatures: Ember.Route.extend({
			route: '/temp/:lat/:lon',
			changeLat: Ember.Route.transitionTo('temperatures'),
			connectOutlets: function(router, temps){
				 var currtemp = App.Temperature.create({ lat: temps.lat, lon: temps.lon });

				 router.get('applicationController').connectOutlet({
							  name: 'findTemps',
							  context: currtemp.loadTemps()
							});
				  
			},
			serialize: function(router, context){
				
                return {lat: context.lat, lon: context.lon};
            },
            deserialize: function(router, urlParams){
				router.get('applicationController').set('loading', true);
				if (typeof window.google === 'undefined')  {
					Gmap.lat = urlParams.lat;
					Gmap.lon = urlParams.lon;
				} else { 
					Gmap.setMyCenter(urlParams.lat, urlParams.lon);
				}
                return {lat: urlParams.lat, lon: urlParams.lon};
            }
		})
	})
});

App.initialize();