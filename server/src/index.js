const util = require('util');
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


var stdin = process.openStdin();

stdin.addListener('data', function(data){
	var cmd = data.toString().trim();

	console.log(`CMD: ${cmd}`);

	if(cmd === '1'){
		openPorts[Object.keys(openPorts)[0]].send('grey=on');
	}

	else if(cmd === '0'){
		openPorts[Object.keys(openPorts)[0]].send('grey=off');
	}

	else if(cmd === 't'){
		console.log(util.inspect(openPorts[Object.keys(openPorts)[0]].things, { depth: Infinity }));
	}

	else if(cmd === 'c'){
		console.log(util.inspect(openPorts[Object.keys(openPorts)[0]].charts, { depth: Infinity }));
	}
});