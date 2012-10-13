//cosm.request({url:"http://api.cosm.com/v2/feeds.json?lat=40.7964&lon=-73.962&distance=100&q=temperature", done: test}) -- Find all temperature Nodes!!
cosm.setKey( 'TvtHeLkibFVnaKBu4zQxgbQHv4iSAKxydDlEUDBTa0lQZz0g' ); 
App = Ember.Application.create({
	ready: function() {
		var router = this.get('router');
		router.get('findTempsController').connectControllers('application');
	}
});

App.ApplicationView = Ember.View.extend({
  templateName: 'application'
  
});
App.ApplicationController = Ember.Controller.extend({
	loading: true,
});

App.FindTempsController = Ember.ObjectController.extend({
	content: {},
	applicationController: null,
	loadingBinding: "applicationController.loading",
	contentObs: function() {
		var isDoneLoading = this.get('content').isLoading;
		this.set('loading', isDoneLoading);
	}.observes('content.isLoading'),
	changePosition: function(){
		var newLat = (parseFloat(this.content.lat) + 1).toString();
		App.get('router').send('changeLat', {
		  lat: newLat,
		  lon: '-73.974'
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
  isLoading: null,
  init: function() {
	this._super();
	this.set('indoorNodes',[]);
	this.set('outdoorNodes',[]);
	this.set('notSpecNodes',[]);
  },
  allTemps: function(){
		return {
			indoor: this.get('indoorNodes'),
			outdoor: this.get('outdoorNodes'),
			special: this.get('notSpecNodes')
		}
	}.property('indoorNodes', 'outdoorNodes', 'notSpecNodes'),

	getTemp: function(unts) {
		var dtstream = this.get('datastream'),
			tempVal,
			units = 'C';
		var i = dtstream.length;
		while(i--) {
			var thisdtstream = dtstream[i];
			var tags = thisdtstream.tags;
			if (typeof thisdtstream.unit != 'undefined') { 
			  if (typeof thisdtstream.unit.symbol != 'undefined')
			       units = thisdtstream.unit.symbol.replace(/[^CF]/g,'');
			  if (typeof thisdtstream.unit.label != 'undefined')
				   units = thisdtstream.unit.label.replace(/[^CF]/g,'');	
			}
			if (thisdtstream.id.toLowerCase() == 'temperature') {
			  tempVal = thisdtstream.current_value;
			  break;
			}
			for(var t in tags){
			  if(tags[t].toLowerCase() === 'temperature') {
			    //tempVal = thisdtstream.current_value < 0 || thisdtstream.current_value > 130 ? 0 : thisdtstream.current_value ;
				tempVal = thisdtstream.current_value;
				break;
			  }
			}
		}
		
		switch(units.toUpperCase())
		{
			case 'C':
			  if (unts == 'F') tempVal = ((9/5) * (parseFloat(tempVal)+32));
			  break;
			case 'F':
			  if (unts == 'C') tempVal = ((5/9) * (parseFloat(tempVal)-32));
			  break;
		}
		
		return parseFloat(tempVal) || 0;
	},
		
	loadTemps: function() {
		var self = this;
		self.set('isLoading',true);
		
		cosm.request(
			{
			 url:"http://api.cosm.com/v2/feeds.json?lat=" + self.lat + "&lon=" + self.lon + "&distance=100&q=temperature",
			 done: function(response) {
				var res = response.results,
					i = res.length,
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
					}
					
					self.set('isLoading',false);
					
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
			initialState: 'temperatures'
        }),
		temperatures: Ember.Route.extend({
			route: '/temp/:lat/:lon',
			changeLat: Ember.Route.transitionTo('temperatures'),
			connectOutlets: function(router, temps){
				 var currtemp = Ember.typeOf(temps) === 'instance' ? temps : App.Temperature.create({ lat: temps.lat, lon: temps.lon });

				 router.get('applicationController').connectOutlet({
							  name: 'findTemps',
							  context: currtemp.loadTemps()
							});
			},
			serialize: function(router, context){
				
                return {lat: context.lat, lon: context.lon};
            },
            deserialize: function(router, urlParams){
                return {lat: urlParams.lat, lon: urlParams.lon};
            }
		})
	})
});

App.initialize();