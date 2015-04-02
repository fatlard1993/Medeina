console.log("Loading libaries...");

var express = require('express'),
app = express(),
server = require('http').createServer(app),
io = require('socket.io')(server),
bodyParser = require('body-parser'),
fs = require('fs'),
spawn = require('child_process').spawn,
Camelittle = require('camelittle'),
serialport = require("serialport"),
SerialPort = serialport.SerialPort;

console.log("Loading config...");

var config = require('./config.json');

var port = process.env.PORT || 8087;

console.log("Setting up server...");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public', { maxAge: 86400000 }));

var init = function (){
	console.log("Checking for modules...");
	serialport.list(function(err, ports) {
		if(ports){
			ports.forEach(function(port) {
		    var thisPort = new SerialPort(port.comName, { baudrate: 9600, parser: serialport.parsers.readline("\n") });
		    thisPort.on("open", function() {
				  console.log('opened: '+port.comName);
				  thisPort.on('data', function(data) {
				  	data = data.trim();
			      console.log("From "+port.comName+": "+data);
			      if(data == "Im a module!"){
							console.log("Its a module!!");
			    		thisPort.write("good", function(err) { if(err) console.error('ERROR - '+err) });
			      } else if(data == "connected"){
			      	console.log("CONNECTED TO "+port.comName);
			      } else if(/^{/.test(data)){
							console.log("==================");
							var data = data.replace(/\'/g, "\"");
			      	var JSONdata = JSON.parse(data);
							console.log(port.comName+" is a "+JSONdata.type+" module");
			      }
			  	});
				});
			});
		} else{
			console.warn("There were no modules detected.")
		}
	});
	// config.modules.forEach(function (module){
	// 	init[module.type](module.name, module.address, module.sensors || module.settings);
	// });
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
