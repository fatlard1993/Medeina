const Serialport = require('serialport');

const Hub = require('./hub');

const openPorts = {};
const DBG = 0;

function getList(cb){
	Serialport.list(function(err, ports){
		if(err) return console.error(err);

		ports = ports.map((item) => { return item.manufacturer && item.comName; }).filter((item) => { return item !== undefined; });

		if(DBG) console.log('\nFound serialports: ', ports);

		cb(ports);
	});
}

function autoConnect(){
	getList((list) => {
		list.forEach(function(path){
			if(!openPorts[path]) openPorts[path] = new Hub(path, function(path){ delete openPorts[path]; });
		});
	});
}

autoConnect();

setInterval(autoConnect, 2e3);