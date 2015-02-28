var fs = require('fs'), express = require('express'), i2c = require('i2c-bus'), spawn = require('child_process').spawn;
var app = express();
var oneDay = 86400000;

var ON = 49, OFF = 48;
var outletNum = new Buffer("1");

app.get("/images", function(req, res, next){
	fs.readdir('/home/pi/node/public/images/', function(err, files){
		if(err) return next(err);
		files.sort(function(a,b){return b.replace(/\D/g, '') - a.replace(/\D/g, '')});
		res.send(JSON.stringify(files));
	});
}).get("/turnOnOutlet", function(req, res, next){
	var i2c1 = i2c.openSync(1);
	i2c1.writeI2cBlockSync(0x04, ON, 1, outletNum);
	i2c1.closeSync();
	res.send("done!");
}).get("/turnOffOutlet", function(req, res, next){
	var i2c1 = i2c.openSync(1);
	i2c1.writeI2cBlockSync(0x04, OFF, 1, outletNum);
	i2c1.closeSync();
	res.send("done!");
}).get("/test", function(req, res, next){
	res.send("TEST!");
});

app.use(express.static(__dirname + '/public', { maxAge: oneDay }));

app.listen(process.env.PORT || 8087);
