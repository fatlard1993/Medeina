var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

serialport.list(function(err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    var testPort = new SerialPort(port.comName, { 
    	baudrate: 9600,
			parser: serialport.parsers.readline("\n")
    });
    testPort.on("open", function() {
		  console.log('open');
		  testPort.on('data', function(data) {
		  	data = data.trim();
	      console.log('data received: ' + data);
	      if(data == "Im #1"){
	      	testPort.write("good", function(err) { if(err) console.error('ERROR - '+err) });
	      } else if(data == "nigga"){
					//testPort.write("stop", function(err) { if(err) console.error('ERROR - '+err) });
	      }
	  	});
		});
	});
});
