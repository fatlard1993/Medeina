var fs = require('fs'), express = require('express'), i2c = require('i2c-bus'), bodyParser = require('body-parser'), spawn = require('child_process').spawn;
var app = express();

var oneDay = 86400000;
var ON = 49, OFF = 48;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.get("/getConfig", function(req, res, next){
	fs.readFile("./config.json", function(err, file){
		if(err) return next(err);
		res.send(file);
	});
}).post("/saveConfig", function(req, res, next){
	var data = req.body;
	fs.writeFile('./config.js', "module.exports = "+data, function (err) {
	    if (err) {
			console.log('There has been an error saving your configuration data.');
			console.log(err.message);
			return;
	    }
	    console.log(req.body);
	    console.log('Configuration saved successfully.');
	});
}).get("/images", function(req, res, next){
	fs.readdir('/home/pi/node/public/images/', function(err, files){
		if(err) return next(err);
		files.sort(function(a,b){return b.replace(/\D/g, '') - a.replace(/\D/g, '')});
		res.send(JSON.stringify(files));
	});
}).post("/turnOnOutlet", function(req, res, next){
	var test;
	var outletNum = new Buffer(req.body.outletNum);
	var i2c1 = i2c.openSync(1);
	i2c1.writeI2cBlockSync(0x04, ON, 1, outletNum);
	test = i2c1.readByteSync(0x04, 1);
	i2c1.closeSync();
	console.log(test);
	res.send("TEST");
}).post("/turnOffOutlet", function(req, res, next){
	var outletNum = new Buffer(req.body.outletNum);
	var i2c1 = i2c.openSync(1);
	i2c1.writeI2cBlockSync(0x04, OFF, 1, outletNum);
	i2c1.closeSync();
}).get("/test", function(req, res, next){
	res.send("TEST!");
});

app.use(express.static(__dirname + '/public', { maxAge: oneDay }));

app.listen(process.env.PORT || 8087);
