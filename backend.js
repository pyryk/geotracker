var express = require('express'),
          _ = require('underscore');

var app = express();

app.use(express.bodyParser()); // Automatically parse JSON in POST requests
app.use(express.static(__dirname + '/client')); // Serve static files from public (e.g http://localhost:8080/index.html)

var locations = {};
var saveLocation = function(id, lat, lng, accuracy) {
	// if only one latlng param, assume its an object
	if (lat !== undefined && lng === undefined) {
		locations[id] = lat;
	} else {
		locations[id] = {lat: lat, lng: lng, accuracy: accuracy};
	}
};

var getLocation = function(id) {
	return locations[id];
};

var getLocations = function() {
	return _.map(locations, function(value, key) {
		return _.extend(_.clone(value), {id: key});
	});
};

// POST location
// data format
// {"id": "abc", "lat": 12.34, "lng": 56.78, 100}
app.post('/api/location', function(req, res) {
	var data = req.body;
	
	saveLocation(data.id, data.lat, data.lng, data.accuracy);
	
	res.json(getLocation(data.id), 201);
});

app.get('/api/location', function(req, res) {
	res.json(getLocations());
});

var port = process.env.PORT || 5000;
app.listen(port);