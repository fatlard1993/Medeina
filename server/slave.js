const uuid = require('uuid/v4');

const EventEmitter = require('events');
const serialport = require('serialport');

const Hub = require('./hub');

const DBG = 0;

class Slave extends EventEmitter {
  constructor(name, settings){
		super();

		this.id = uuid();
		this.name = name;
		this.settings = settings;
		this.hubs = {};

		setInterval(this.autoConnect.bind(this), 2e3);
	}

	getSerialportList(done){
		serialport.list(function(err, ports){
			if(err) return console.error(err);

			ports = ports.map((item) => { return item.manufacturer && item.comName; }).filter((item) => { return item !== undefined; });

			if(!done || DBG) console.log('\nFound serialports: ', ports);

			if(done) done(ports);
		});
	}

	autoConnect(){
		this.getSerialportList((list) => { list.forEach(this.connect.bind(this)); });
	}

	connect(path){
		if(this.hubs[path]) return;

		this.hubs[path] = new Hub(path, this.settings);

		this.hubs[path].on('disconnect', () => { delete this.hubs[path]; });

		this.hubs[path].on('state', (thing) => { this.emit('state', this.hubs[path], thing); });
	}
}

module.exports = Slave;