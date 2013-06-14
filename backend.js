var express = require('express'),
     mongoq = require('mongoq'),
          _ = require('underscore');

var app = express();
var db = mongoq(process.env.MONGOHQ_URL || "ottoapp");

app.use(express.bodyParser()); // Automatically parse JSON in POST requests
app.use(express.static(__dirname + '/client')); // Serve static files from public (e.g http://localhost:8080/index.html)

// POST location
// data format
// {"id": "abc", "lat": 12.34, "lng": 56.78, 100}
app.post('/api/location', function(req, res) {
	console.log('POST location request:', req.body, ' - ', typeof req.body);
	var data = req.body;
	data.timestamp = new Date();
	
	db.collection('locations').insert(data, {safe: true}).done(function(success) {
		res.json({success: success}, success ? 200 : 404);
	});
});

app.get('/api/location', function(req, res) {
	db.collection('locations').find().toArray().done(function(locations) {
		var people = _.groupBy(locations, function(it) { return it.id });
		var newest = _.map(people, function(it) {
			return _.max(it, function(it) {
				return it.timestamp;
			});
		});
        res.json(newest);
    });
});

app.get('/api/targets', function(req, res) {
	db.collection('targets').find().toArray().done(function(targets) {
        res.json(targets);
    });
});

var port = process.env.PORT || 5000;
app.listen(port);