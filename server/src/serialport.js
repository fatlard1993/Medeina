const usb = require('usb-detection');

const Serialport = require('serialport');
const Delimiter = Serialport.parsers.Delimiter;

const openPorts = {};

const DBG = 0;

function cerealBowl(path){
	if(openPorts[path]) return console.log('\nAlready open: ', path);

	console.log('\nAttempting to connect to: ', path);

	openPorts[path] = 1;

	console.log(`${Object.keys(openPorts).length} open ports`);

	const port = new Serialport(path, {
		baudRate: 115200
	});

	const parser = port.pipe(new Delimiter({ delimiter: '\n' }));

	function writeAndDrain(data, cb){
		port.write(`{${data}}`);
		port.drain(cb);
	}

	function write(data){
		port.write(`{${data}}`, function(err){
			if(err) return console.log('Error on write: ', err.message);

			console.log('\n- message written - ', data);
		});
	}

	parser.on('data', function(data){
		data = data.toString();

		console.log('\nReceived data:', data);

		if(data === 'connected') write('connection_acknowledged');
	});

	port.on('error', function(err){
		console.log('\nError: ', err.message);
	});

	port.on('open', function(){
		console.log('Open: ', path);

		write('connection_request');
	});

	port.on('close', function(err){
		console.log('\nClose: ', path,  err);

		delete openPorts[path];

		console.log(`${Object.keys(openPorts).length} open ports`);
	});
}

function getList(cb){
	Serialport.list(function(err, ports){
		if(err) return console.error(err);

		ports = ports.map((item) => { return item.manufacturer && item.comName; }).filter((item) => { return item !== undefined; });

		if(DBG) console.log('\nFound serialports: ', ports);

		cb(ports);
	});
}

function autoConnect(){
	getList((list) => { list.forEach(cerealBowl); });
}

function start(){
	usb.startMonitoring();

	usb.on('add:6790', function(device){
		if(DBG) console.log('\nUSB device addded: ', device);

		autoConnect();
	});

	autoConnect();
}

start();