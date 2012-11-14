(function(){
var D= new Date('2011-06-02T09:34:29+02:00');
if(isNaN(D) || D.getUTCMonth()!== 5 || D.getUTCDate()!== 2 ||
D.getUTCHours()!== 7 || D.getUTCMinutes()!== 34){
    Date.fromISO= function(s){
        var day, tz,
        rx=/^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
        p= rx.exec(s) || [];
        if(p[1]){
            day= p[1].split(/\D/);
            for(var i= 0, L= day.length; i<L; i++){
                day[i]= parseInt(day[i], 10) || 0;
            }
            day[1]-= 1;
            day= new Date(Date.UTC.apply(Date, day));
            if(!day.getDate()) return NaN;
            if(p[5]){
                tz= (parseInt(p[5], 10)*60);
                if(p[6]) tz+= parseInt(p[6], 10);
                if(p[4]== '+') tz*= -1;
                if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);
            }
            return day;
        }
        return NaN;
    }
}
else{
    Date.fromISO= function(s){
        return new Date(s);
    }
}
})()

App = Ember.Application.create({
	ready: function() {
		cosm.setKey( "TvtHeLkibFVnaKBu4zQxgbQHv4iSAKxydDlEUDBTa0lQZz0g" ); 
		var router = this.get('router');
		router.get('findTempsController').connectControllers('application');
		Ember.ENV.RAISE_ON_DEPRECATION = true;
		Gmap.lat = '44.7964';
		Gmap.lon = '-73.962';
		Gmap.loadMap();

	}
});

App.o = Ember.Object.create({

		});

App.ApplicationView = Ember.View.extend({
  templateName: 'application'
  
});
App.ApplicationController = Ember.Controller.extend({
	dloading: false,
	GloadInc: "width:10%"
});

App.FindTempsController = Ember.ArrayController.extend({
	content: [],
	applicationController: null,
	doneLoadingBinding: "applicationController.dloading",
	loadIncBinding: "applicationController.GloadInc",
	latestNode: null,
	contentArrayDidChange: function(item, idx, removedCnt, addedCnt) {
		var loc = item[idx];
		if (addedCnt > 0) {
			this.latestNode = loc;
			loc.loadTemps();
			Gmap.currentNode = loc;
		}
	},
	loadIncObs: function(obj, keyName) {
		var loadingNode = this.latestNode;
		if (this.latestNode !== null) {
			var val = loadingNode.get('currLoadint'),
				newInc,
				newIncStyle;
			if (val > -1) {
				newInc = Math.round(val * 100);
				newIncStyle = "width: " + newInc + "%";
				this.set('loadInc', newIncStyle);
				if (newInc >= 101) {
					this.set(keyName, -1);
					this.set('loadInc', "width: 10%");
				}
			}
		}
	}.observes('content.@each.currLoadint'),
	contentObs: function(obj, keyName, value) {
		var isDoneLoading = this.findProperty('isDoneLoading', true),
			selected;
		
		if (typeof isDoneLoading !== 'undefined') {
			this.set('doneLoading', true);
			selected = this.get('array').findProperty('item', this.latestNode ).hash;
			$('.nav.nav-tabs li a[data-target="' + selected + '"]').trigger('click');
		} 
		if (this.findProperty('isDoneLoading', false)) {
			this.set('doneLoading', false);
		}
	}.observes('content.@each.isDoneLoading'),
	latlongObs: function(obj, keyName) {
		var loc = this.findProperty('changePos', true),
			selected;
		if (loc) {
			this.latestNode = loc;
			selected = this.get('array').findProperty('item', this.latestNode ).hash;
			$('.nav.nav-tabs li a[data-target="' + selected + '"]').trigger('click');
			loc.loadTemps();
			Gmap.currentNode = loc;
		}

	}.observes('content.@each.changePos'),
	array: function() {
	  return this.map(function(i, idx) {
		var trueI = parseInt(idx) + 1;
		return { hash: ".tab-" + trueI, tabname: "tab" + trueI, item: i, index: trueI};
	  });
	}.property('@each')
});

App.FindTempsView = Ember.View.extend({
  templateName: 'temperature-view'
});

App.TabsCollectionView = Ember.CollectionView.extend({
	classNames: ['tab-content']
});

App.LocaleView = Ember.View.extend({
  tagName: "div",
  classNameBindings: ['itemId'],
  templateName: 'locale-view',
  itemId: function() {
        return "tab-pane tab-%@".fmt(this.get('content.index'));
    }.property('content.index')/*,
  loadngObs: function(obj, keyName, value) {
		var isDoneLoading = this.get('content.isDoneLoading');
		if (typeof isDoneLoading === true) {
			$('.nav.nav-tabs li:last a').trigger('click');
		}
	}.observes('content.isDoneLoading')*/
});

App.Temperatures = Ember.Object.extend({
  tempTabArr: null,
  init: function() {
	this.tempTabArr = [];
  },
  addNode: function(LatLong) {
    var node = App.Locale.create({ lat: LatLong.lat().toString(), 
										 lon: LatLong.lng().toString(), 
										 indoorNodes: [], 
										 outdoorNodes: [], 
										 notSpecNodes: [] });
	this.tempTabArr.pushObject(node);
	return node;
  }
});

App.Locale = Ember.Object.extend({
  lat: null,
  lon: null,
  indoorNodes: null, 
  outdoorNodes: null,
  notSpecNodes: null,
  changePos: null,
  isDoneLoading: null,
  currLoadint: null,
  tempUnts: 'F',
  lastUpdate: null,
  //TODO: Create latitude/Longitude array!!!!
  init: function() {
	this._super();
	this.set('currLoadint', 0.10);
  },
  
  allTemps: function(){
		return {
			indoor: this.get('indoorNodes'),
			outdoor: this.get('outdoorNodes'),
			special: this.get('notSpecNodes')
		}
	}.property('indoorNodes', 'outdoorNodes', 'notSpecNodes'),
	
	getLastUpdateDate: function() {
		var d = this.get('lastUpdate') || this.get('updated');
			
		if(d) { 
			d = Date.fromISO(d);
		
		return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
		
		}
	}.property('lastUpdate'),
	
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
					this.set('lastUpdate', thisdtstream.at);
					break;
					}
				}
			  if (typeof thisdtstream.unit.label != 'undefined') {
				   if (mCel.test(thisdtstream.unit.label)) {
					units = "C";
					tempVal = thisdtstream.current_value;
					this.set('lastUpdate', thisdtstream.at);
					break;
				   } else if(mFar.test(thisdtstream.unit.label)) {
					units = "F";
					tempVal = thisdtstream.current_value;
					this.set('lastUpdate', thisdtstream.at);
					break;
				   }
				}
			} 
			
			if (thisdtstream.id.toLowerCase() == 'temperature') {
			  tempVal = thisdtstream.current_value;
			  this.set('lastUpdate', thisdtstream.at);
			  break;
			}
			for(t in tags){
			  if(tags.hasOwnProperty(t) && tags[t].toLowerCase() === 'temperature') {
				tempVal = thisdtstream.current_value;
				this.set('lastUpdate', thisdtstream.at);
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
		self.set('isDoneLoading',false);
		
		cosm.request(
			{
			 url:"http://api.cosm.com/v2/feeds.json?lat=" + self.lat + "&lon=" + self.lon + "&distance=100&q=temperature&key=TvtHeLkibFVnaKBu4zQxgbQHv4iSAKxydDlEUDBTa0lQZz0g",
			 done: function(response) {
				var res = response.results,
					i = res.length,
					begin = 1,
					incUnit = 1/i,
					resl;
					
					self.set('indoorNodes',[]);
					self.set('outdoorNodes',[]);
					self.set('notSpecNodes',[]);
					
					while(i--) {
						resl = res[i].location;
						exposure = (typeof resl !== 'undefined' && resl.hasOwnProperty('exposure')) ? resl.exposure : null;
						switch(exposure)
						{
							case 'indoor':
							  self.indoorNodes.addObject(App.Locale.create(res[i]));
							  break;
							case 'outdoor':
							  self.outdoorNodes.addObject(App.Locale.create(res[i]));
							  break;
							default:
							  self.notSpecNodes.addObject(App.Locale.create(res[i]));
						}
						self.set('currLoadint', begin * incUnit);
						begin = begin + 1;
					}
					

					self.set('changePos', false);	
					setTimeout(function() {
						self.set('currLoadint', 102);
						self.set('isDoneLoading',true);
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
			goToTemp: Ember.Route.transitionTo('temperatures.index')
        }),
		temperatures: Ember.Route.extend({
			route: '/temp',
			changeLat: Ember.Route.transitionTo('index'),
			index: Ember.Route.extend({
				route: '/:lat/:lon',
				connectOutlets: function(router, temps){
					 var mpoint = App.Locale.create({ lat: temps.lat, 
															 lon: temps.lon, 
															 indoorNodes: [], 
															 outdoorNodes: [], 
															 notSpecNodes: [] }),
						 tabsTemp = App.Temperatures.create();											

					 router.get('applicationController').connectOutlet({
								  name: 'findTemps',
								  context: tabsTemp.tempTabArr
								});
					
					 var testing = tabsTemp.get('tempTabArr');
					
					 testing.pushObject(mpoint);
					 Gmap.clearAllMarkers();
					 Gmap.TempModel = tabsTemp;
					
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
			//,
			//temptwo: Ember.Route.extend({
			//	route: '/'
			
		//	})
		})
	})
});

App.initialize();