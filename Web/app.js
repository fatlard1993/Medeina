console.log("Loading libaries...");

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var fs = require('fs');
var spawn = require('child_process').spawn;
var moment = require('moment');
var i2c = require('i2c');
var Camelittle = require('camelittle');

console.log("Loading config...");

var config = require('./config.json');

var port = process.env.PORT || 8087;

console.log("Setting up server...");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static(__dirname + '/public', { maxAge: 86400000 }));

var init = function (){
	console.log("Initalizing modules...");
	config.modules.forEach(function (module){
		init[module.type](module.name, module.address, module.sensors || module.settings);
	});
}
init.sensor = function (name, address, sensors){
	console.log("Sensor module: "+name+" at address: "+address+" has been loaded!");
	var wire = new i2c(address, { device: '/dev/i2c-1' });
	sensors.forEach(function (sensor){
		console.log("> Sensor "+sensor.id+" is a "+sensor.type+" sensor attatched to: "+name+" at address: "+address+"!");
		function repeat(){
			setTimeout(function() {
				wire.write(sensor.id, function(err) {
					if(err) console.log(err);
					setTimeout(function() {
						wire.read(sensor.bytes, function (err, result) {
							if(err) console.log(err);
							io.emit("id_"+sensor.id, result.toString());
							sensor.lastVal = result.toString();
							repeat();
						});
					}, 250);
				});
			}, sensor.update);
		}
		repeat();
		app.get("/api/sensor/"+name+"/"+sensor.id, function (req, res, next){
			
		});
	});
}
init.camera = function (name, address, settings){
	console.log("Camera module: "+name+" at address: "+address+" has been loaded!");

	var name = new Camelittle({
	    device: address,
	    resolution: settings.resolution,
	    frames: 5,
	    'no-banner': null
	});
}
init.power = function(name, address, settings){
	console.log("Power module: "+name+" at address: "+address+" has been loaded!");
	var wire = new i2c(address, { device: '/dev/i2c-1' });
	app.post("/api/power/"+name, function (req, res, next){
		var outletNum = req.body.OutletNum.charCodeAt(), action = req.body.Action.charCodeAt(), length = 1, timeout = 200;
		if(action == 114 && outletNum == 97){ // If action is read and outletNum is all
			length = settings.outlets;
			timeout = 500;
		}
		wire.write([action, outletNum], function(err) {
			if(err) console.log(err);
			setTimeout(function() {
				wire.read(length, function (err, result) {
					if(err) console.log(err);
					res.send(result.toString());
				});
			}, timeout);
		});
	});
}
init(config);

io.on('connection', function(socket){
  //console.log('a user connected');
  socket.on('disconnect', function(){
    //console.log('user disconnected');
  });
});

app.get("/api/config", function (req, res, next){
	fs.readFile("./config.json", function (err, file){
		if(err) return next(err);
		res.send(file);
	});
}).post("/api/config", function (req, res, next){
	var data = req.body;
	fs.writeFile('./config.js', data, function (err) {
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
}).get("/test", function(req, res, next){
	res.send("TEST!");
	// clInstance.grab(function(err, image){
	//     fs.writeFileSync('callback.jpg', val, 'binary');
	// });
});

server.listen(port, function () {
  console.log('Server listening at port %d', port);
  console.log("Ready! - "+moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
});
