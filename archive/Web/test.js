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
SerialPort = serialport.SerialPort,
config = require('./config.json'),
port = process.env.PORT || 8087,
foundModules = [];

var init = function (){
	console.log("Checking for modules...");
	serialport.list(function(err, ports) {
		if(ports){
			console.log(ports.length);
			ports.forEach(function(port) {
				var counter = 0;
		    var thisPort = new SerialPort(port.comName, { baudrate: 9600, parser: serialport.parsers.readline("\n") });
		    thisPort.on("open", function() {
				  console.log('opened: '+port.comName);
				  thisPort.on('data', function(data) {
				  	data = data.trim();
			      // console.log("From "+port.comName+": "+data);
			      if(data == "Im a module!"){
							console.log("Its a module!!");
			    		thisPort.write("good", function(err) { if(err) console.error('ERROR - '+err) });
			      } else if(/^J/.test(data)){
							data = data.replace(/^J/, "").replace(/\'/g, "\"");
			      	var JSONdata = JSON.parse(data);
							if(JSONdata.dataType == "info"){
								console.log(port.comName+" is a "+JSONdata.type+" module at address: "+JSONdata.address);
								console.log("==================");
								foundModules[counter] = {"port": thisPort, "address": JSONdata.address, "type": JSONdata.type};
								// console.log(counter);
								counter++;
								if(counter == ports.length){ // Last one!
									console.log(foundModules);
									config.hardModules.forEach(function (module){
										init[module.type](module.name, module.address, module.sensors || module.settings);
									});
									console.log("Setting up server...");
									app.use(bodyParser.json());
									app.use(bodyParser.urlencoded({ extended: true }));
									app.use(express.static(__dirname + '/public', { maxAge: 86400000 }));
								}
							} else if(JSONdata.dataType == "sensorData"){
								switch(JSONdata.type){
									case 'temp_humidity':
										var data = JSONdata.data.split(",");
										console.log("Sensor "+JSONdata.hostAddress+"."+JSONdata.id+", Temp: "+data[0]+" | Humidity: "+data[1]);
										break;
									case 'waterLevel':
										console.log("Sensor "+JSONdata.hostAddress+"."+JSONdata.id+", Water level: "+JSONdata.data);
										break;
									case 'soilMoisture':
										console.log("Sensor "+JSONdata.hostAddress+"."+JSONdata.id+", Soil moisture: "+JSONdata.data);
										break;
									default:
										console.log("Unknown sensor type!");
								}
							}
			      }
			  	});
				});
			});
		} else{
			console.log("There were no modules detected.");
		}
	});
}
init.sensor = function (name, address, sensors){
	// if address found in foundModules
	// 	if each sensor matches sensors reported
	// 		load module
	// 	else throw error
	// else throw error

	// console.log("Sensor module: "+name+" at address: "+address+" has been loaded!");
	// var wire = new i2c(address, { device: '/dev/i2c-1' });
	// sensors.forEach(function (sensor){
	// 	console.log("> Sensor "+sensor.id+" is a "+sensor.type+" sensor attatched to: "+name+" at address: "+address+"!");
	// 	function repeat(){
	// 		setTimeout(function() {
	// 			wire.write(sensor.id, function(err) {
	// 				if(err) console.log(err);
	// 				setTimeout(function() {
	// 					wire.read(sensor.bytes, function (err, result) {
	// 						if(err) console.log(err);
	// 						io.emit("id_"+sensor.id, result.toString());
	// 						sensor.lastVal = result.toString();
	// 						repeat();
	// 					});
	// 				}, 250);
	// 			});
	// 		}, sensor.update);
	// 	}
	// 	repeat();
	// 	app.get("/api/sensor/"+name+"/"+sensor.id, function (req, res, next){
	//
	// 	});
	// });
}
init.power = function(name, address, settings){
	// console.log("Power module: "+name+" at address: "+address+" has been loaded!");
	// var wire = new i2c(address, { device: '/dev/i2c-1' });
	// app.post("/api/power/"+name, function (req, res, next){
	// 	var outletNum = req.body.OutletNum.charCodeAt(), action = req.body.Action.charCodeAt(), length = 1, timeout = 200;
	// 	if(action == 114 && outletNum == 97){ // If action is read and outletNum is all
	// 		length = settings.outlets;
	// 		timeout = 500;
	// 	}
	// 	wire.write([action, outletNum], function(err) {
	// 		if(err) console.log(err);
	// 		setTimeout(function() {
	// 			wire.read(length, function (err, result) {
	// 				if(err) console.log(err);
	// 				res.send(result.toString());
	// 			});
	// 		}, timeout);
	// 	});
	// });
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
// init(config);
var ls = spawn('ls', '/sys/bus/usb-serial/devices/');

ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

ls.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

ls.on('close', function (code) {
  console.log('child process exited with code ' + code);
});
