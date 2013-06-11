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
	var data = req.body;
	data.timestamp = new Date();
	
	db.collection('locations').update({id: data.id}, data, {safe: true, upsert: true}).done(function(success) {
		res.json({success: success}, success ? 200 : 404);
	});
});

app.get('/api/location', function(req, res) {
	db.collection('locations').find().toArray().done(function(locations) {
        res.json(locations);
    });
});

var port = process.env.PORT || 5000;
app.listen(port);