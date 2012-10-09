//cosm.request({url:"http://api.cosm.com/v2/feeds.json?lat=40.7964&lon=-73.962&distance=100&q=temperature", done: test}) -- Find all temperature Nodes!!
cosm.setKey( 'TvtHeLkibFVnaKBu4zQxgbQHv4iSAKxydDlEUDBTa0lQZz0g' ); 
App = Ember.Application.create();

App.ApplicationView = Ember.View.extend({
  templateName: 'application'
});
App.ApplicationController = Ember.Controller.extend();

App.AllContributorsController = Ember.ArrayController.extend();
App.AllContributorsView = Ember.View.extend({
  templateName: 'contributors'
});

App.OneContributorView = Ember.View.extend({
  templateName: 'a-contributor'
});
App.OneContributorController = Ember.ObjectController.extend();

App.DetailsView = Ember.View.extend({
  templateName: 'contributor-details'
});
App.ReposView = Ember.View.extend({
    templateName: 'repos'
});

App.AllContributorsController = Ember.ArrayController.extend();
App.AllContributorsView = Ember.View.extend({
  templateName: 'contributors'
});

App.FindTempsController = Ember.ObjectController.extend({
	
});

App.FindTempsView = Ember.View.extend({
  templateName: 'temperatures'
});

App.Temperature = Ember.Object.extend({
  lat: null,
  lon: null,
  indoorNodes: [], 
  outdoorNodes: [],
  notSpecNodes: [],
  doneLoading: false,
  
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
	}

});

App.Temperature.reopenClass({
	
	loadTemps: function(lat, lon) {
		var self = this
			tempObj = App.Temperature.create({
				lat: lat,
				lon: lon,
				indoorNodes: [], 
				outdoorNodes: [],
				notSpecNodes: []
			});
		cosm.request(
			{
			 url:"http://api.cosm.com/v2/feeds.json?lat=" + lat + "&lon=" + lon + "&distance=100&q=temperature",
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
							  tempObj.indoorNodes.addObject(App.Temperature.create(res[i]));
							  break;
							case 'outdoor':
							  tempObj.outdoorNodes.addObject(App.Temperature.create(res[i]));
							  break;
							default:
							  tempObj.notSpecNodes.addObject(App.Temperature.create(res[i]));
						}
					}
					
					tempObj.set('doneLoading',true);
					
			 }
			});

		return tempObj;
	}
});

App.Contributor = Ember.Object.extend({
  loadMoreDetails: function(){
    $.ajax({
      url: 'https://api.github.com/users/%@'.fmt(this.get('login')),
      context: this,
      dataType: 'jsonp',
      success: function(response){
        this.setProperties(response.data);
      }
    })
  }, 
  loadRepos: function(){
      $.ajax({
        url: 'https://api.github.com/users/%@/repos'.fmt(this.get('login')),
        context: this,
        dataType: 'jsonp',
        success: function(response){
          this.set('repos',response.data);
        }
    });
  }
});
App.Contributor.reopenClass({
  allContributors: [],
  find: function(){
	this.allContributors = [];
    $.ajax({
      url: 'https://api.github.com/repos/emberjs/ember.js/contributors',
      dataType: 'jsonp',
      context: this,
      success: function(response){
        this.allContributors.addObjects(
            response.data.map(function(raw){
                return App.Contributor.create(raw);
            })
        );
      }
    })
    return this.allContributors;
  }, 
  findOne: function(username){
    var contributor = App.Contributor.create({
      login: username
    });

    $.ajax({
      url: 'https://api.github.com/repos/emberjs/ember.js/contributors',
      dataType: 'jsonp',
      context: contributor,
      success: function(response){
        this.setProperties(response.data.filterProperty('login', username));
      }
    });
    return contributor;
  } 
});

App.Router = Ember.Router.extend({
    enableLogging: true,
    root: Ember.Route.extend({
        contributors: Ember.Route.extend({
            route: '/',
            showContributor: Ember.Route.transitionTo('aContributor'),
            connectOutlets: function(router){
                router.get('applicationController').connectOutlet(
                    'allContributors', App.Contributor.find());
            }
        }),
		temperatures: Ember.Route.extend({
			route: '/temp/:lat/:lon',
			connectOutlets: function(router, context){
				 router.get('applicationController').connectOutlet(
                    'findTemps', context);
			},
			serialize: function(router, context){
                return {lat: context.get('lat'), lon: context.get('lon')};
            },
            deserialize: function(router, urlParams){
                return App.Temperature.loadTemps(urlParams.lat, urlParams.lon);
            }
		}),
        aContributor: Ember.Route.extend({
            route: '/t/:githubUserName',
            showAllContributors: Ember.Route.transitionTo('contributors'),
            showDetails: Ember.Route.transitionTo('details'),
            showRepos: Ember.Route.transitionTo('repos'),
            connectOutlets: function(router, context){
                router.get('applicationController').connectOutlet(
                    'oneContributor', context);        
            },
            serialize: function(router, context){
                return {githubUserName: context.get('login')};
            },
            deserialize: function(router, urlParams){
                return App.Contributor.findOne(urlParams.githubUserName);
            }, 
            // child states
			initialState: 'details',
			details: Ember.Route.extend({
			  route: '/',
			  connectOutlets: function(router){
				  router.get('oneContributorController.content').loadMoreDetails();
				  router.get('oneContributorController').connectOutlet('details');
			  }
			}),
			repos: Ember.Route.extend({
			  route: '/repos',
			  connectOutlets: function(router){
				router.get('oneContributorController.content').loadRepos();  
				router.get('oneContributorController').connectOutlet('repos');
			  }
			})
        })
    })
});

App.initialize();