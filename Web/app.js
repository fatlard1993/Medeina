var fs = require('fs'), express = require('express'), i2c = require('i2c'), bodyParser = require('body-parser'), spawn = require('child_process').spawn, config = require('/config.json');
var app = express();

var oneDay = 86400000;
var outletSlaveAddress = 0x04;

var Camelittle = require('camelittle');
var clInstance = new Camelittle({
    device: '/dev/video0',
    resolution: '1920x1080',
    frames: 5,
    'no-banner': null
});
clInstance.grab(function(err, image){
    fs.writeFileSync('callback.jpg', val, 'binary');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

var init = function(config){
	config.modules.forEach(function(module){
		init[module.type](module.name, module.address, module.sensors || module.component);
	});
}
init.sensor = function(name, address, sensors){
	sensors.forEach(function(sensor){
		
	});
}
init.camera = function(name, address, component){

}
init.power = function(name, adress, component){

}

app.get("/getConfig", function (req, res, next){
	fs.readFile("./config.json", function (err, file){
		if(err) return next(err);
		res.send(file);
	});
}).post("/saveConfig", function (req, res, next){
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
}).get("/images", function (req, res, next){
	fs.readdir('/home/pi/node/public/images/', function (err, files){
		if(err) return next(err);
		files.sort(function (a,b){return b.replace(/\D/g, '') - a.replace(/\D/g, '')});
		res.send(JSON.stringify(files));
	});
}).post("/outlet", function (req, res, next){
	var outletNum = req.body.OutletNum.charCodeAt();
	var action = req.body.Action.charCodeAt();
	var wire = new i2c(outletSlaveAddress, { device: '/dev/i2c-1' });
	
	wire.write([action, outletNum], function(err) {
		if(err) return next(err);
		setTimeout(function() {
			wire.read(1, function (err, result) {
				if(err) return next(err);
				console.log(result);
				res.send(result.toString());
			});
		}, 200);
	});
}).get("/test", function(req, res, next){
	res.send("TEST!");
});

app.use(express.static(__dirname + '/public', { maxAge: oneDay }));

app.listen(process.env.PORT || 8087);