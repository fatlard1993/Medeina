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


console.log("Loading Modules...");

serialport.list(function(err, ports) {
	if(ports){
		ports.forEach(function(port) {
	    console.log(port.comName);
	    var thisPort = new SerialPort(port.comName, { 
	    	baudrate: 9600,
				parser: serialport.parsers.readline("\n")
	    });
	    thisPort.on("open", function() {
			  console.log('opened: '+port.comName);
			  var niggaCount = 10;
			  thisPort.on('data', function(data) {
			  	data = data.trim();
		      console.log("From "+port.comName+": "+data);
		      if(data == "Im a module!"){
		      	thisPort.write("good", function(err) { if(err) console.error('ERROR - '+err) });
		      } else if(data == "connected"){
		      	console.log("CONNECTED");
		      } else if(/^{/.test(data)){
		      	$.jsonParse(data.replace(/({)([a-zA-Z0-9]+)(:)/,'$1"$2"$3'));
		      } else if(data == "nigga"){
		      	niggaCount--;
		      	if(niggaCount <= 0){
		      		niggaCount = 10;
		      		console.log("Server: Man, stop that shiit!");
		      		thisPort.write("stop", function(err) { if(err) console.error('ERROR - '+err) });
		      	}
		      }
		  	});
			});
		});
	} else{
		console.warn("There were no modules detected.")
	}
});
