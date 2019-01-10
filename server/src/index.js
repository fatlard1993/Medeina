const util = require('util');
const Serialport = require('serialport');

const Hub = require('./hub');

const stdin = process.openStdin();

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

stdin.addListener('data', function(data){
	var cmd = data.toString().trim();

	console.log(`CMD: ${cmd}`);

	if(cmd.startsWith('send')){
		openPorts[Object.keys(openPorts)[0]].send(cmd.replace('send', '{') +'}');
	}

	else if(cmd === 't'){
		console.log(util.inspect(openPorts[Object.keys(openPorts)[0]].things, { depth: Infinity }));
	}

	else if(cmd === 's'){
		console.log(util.inspect(openPorts[Object.keys(openPorts)[0]].settings, { depth: Infinity }));
	}
});