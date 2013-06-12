var peruskartta = {
  map: undefined,
  marker: undefined,
  circle: undefined,
  defaultLocation: new L.LatLng(60.2275,24.9335),
  panned: false,
  remotes: {},
  targets: [],
  
  initialize: function() {
    // initialize the map on the "map" div
    this.map = new L.Map('map');

    var tileurl = 'http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg';
    var basemap = new L.TileLayer(tileurl, {
        attribution: 'Map data &copy; <a href="http://www.maanmittauslaitos.fi">Maanmittauslaitos</a>, tile service by <a href="http://kartat.kapsi.fi">Kapsi</a>&nbsp;&nbsp;',
        scheme: 'tms',
        errorTileUrl: 'notfound.png'
    });

    var center = this.defaultLocation;
    // add the CloudMade layer to the map set the view to a given center and zoom
    this.map.addLayer(basemap).setView(center, 7);

    // create a marker in the given location and add it to the map
    this.marker = new L.Marker(center);
    this.circle = new L.Circle(center, 100, {weight: 2});
    this.map.addLayer(this.marker);
    this.map.addLayer(this.circle);
    
    // observe moving to disable auto pan to location if user has moved the map
    this.map.on('movestart', function(e) {
      this.panned = true;
    }, this);

    this.map.on('locationfound', window.proxy(this, function(e) {
      this.setLocation(e.latlng, e.accuracy);
    }));

    /*this.map.on('locationerror', window.proxy(this, function(e) {
      console.log('Could not get your location. Please allow Geolocation in your browser.');
    }));*/

    var mapChanged = window.proxy(this, function(e) {
      var center = this.map.getCenter();
      var zoom = this.map.getZoom();

      this.setHash({center: center, zoom: zoom});
    });

    this.map.on('moveend', mapChanged);
    this.map.on('zoomend', mapChanged);

    var location = this.getHash();
    if (location.center && location.zoom) {
      this.map.setView(location.center, location.zoom);
    }
    
    //window.setInterval(window.proxy(this, this.updateLocation), 10000);
    window.setInterval(window.proxy(this, this.updateRemotes), 3000);
    this.updateRemotes();
    this.updateLocation();
    this.addTargets();

    if (window.applicationCache) {
      applicationCache.addEventListener('updateready', function() {
        console.log('App update is now ready');
        if (confirm('An update is available. Reload now?')) {
          window.location.reload();
        }
      });

      applicationCache.addEventListener('cached', function() {
        console.log('stuff has now been cached');
      })
    }
    
  },
  isInLocation: function(latlng) {
    var center = this.map.getCenter();
    if (center.equals(latlng)) {
      return true;
    }
    
    return false;
  },
  setLocation: function(pos, accuracy) {
    if (this.marker) {
      this.marker.setLatLng(pos);
      
      if (!this.circle) {
        this.circle = new L.Circle(pos, accuracy);
        this.map.addLayer(this.circle);
      }
      
      this.circle.setLatLng(pos);
      this.circle.setRadius(accuracy);
      
    } else {
      this.marker = new L.Marker(pos);
      this.map.addLayer(this.marker);
    }
    
    this.marker.bindPopup('You');
    
    // if not panned by user, pan to own location 
    if (!this.panned) {
      this.map.panTo(pos);
    }
  },
  updateLocation: function() {
    this.map.locate({enableHighAccuracy: true, watch: true});
  },
  setHash: function(opts) {
    if (!opts) {
      this.setHash({center: this.map.getCenter(), zoom: this.map.getZoom()});
    } else {
      var hash = '#' + opts.center.lat + ',' + opts.center.lng + '/' + opts.zoom;
      document.location.hash = hash;
    }
  },
  getHash: function() {
    var hash = document.location.hash.substring(1);

    var parts = hash.split('/');
    if (parts.length < 2) {
      return {};
    }

    var center = parts[0].split(',');
    if (center.length < 2) {
      return {};
    }

    return {center: new L.LatLng(center[0], center[1]), zoom: parts[1]};
  },
  updateRemotes: function() {
  	$.getJSON('api/location').then(window.proxy(this, function(data) {
  		for (var i in data) {
  			var remote = data[i];
  			var latlng = new L.LatLng(remote.lat, remote.lng);
  			if (this.remotes[remote.id]) {
  				this.remotes[remote.id].setLatLng(latlng);
  			} else {
  				this.remotes[remote.id] = new L.Marker(latlng, {icon: new L.Icon({iconUrl:'img/remote-marker-icon.png', iconAnchor: [13, 41]})});
  				this.map.addLayer(this.remotes[remote.id]);
  			}
  			var timestampStr = moment(remote.timestamp).fromNow();
  			this.remotes[remote.id].bindPopup(remote.id + ' - ' + timestampStr);
  		}
  	}));
  },
  addTargets: function() {
  	$.getJSON('api/targets').then(window.proxy(this, function(data) {
  		for (var i in data) {
  			var target = data[i];
  			var latlng = new L.LatLng(target.lat, target.lng);
  			if (this.targets[target.number]) {
  				this.targets[target.number].setLatLng(latlng);
  			} else {
  				this.targets[target.number] = new L.Marker(latlng, {icon: new L.Icon({iconUrl:'img/target-marker-icon.png', iconAnchor: [13, 41]})});
  				this.map.addLayer(this.targets[target.number]);
  			}
  			this.targets[target.number].bindPopup('Rasti ' + target.number + ': ' + target.name);
  		}
  	}));
  }
}

// modified from spine.js
window.proxy = function(context, func) {
  var _this = context;
  return function() {
    return func.apply(_this, arguments);
  };
};
