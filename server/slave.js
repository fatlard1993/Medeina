const uuid = require('uuid/v4');

const EventEmitter = require('events');
const serialport = require('serialport');
const log = require('log');

const Hub = require('./hub');

class Slave extends EventEmitter {
  constructor(name, settings = {}){
		super();

		this.id = uuid();
		this.name = name;
		this.settings = settings;
		this.hubs = {};

		setInterval(this.autoConnect.bind(this), 2e3);
	}

	getSerialportList(done){
		serialport.list(function(err, ports){
			if(err) return log.error(err);

			ports = ports.map((item) => { return item.manufacturer && item.comName; }).filter((item) => { return item !== undefined; });

			log(1)('\nFound serialports: ', ports);

			if(done) done(ports);
		});
	}

	autoConnect(){
		this.getSerialportList((list) => { list.forEach(this.connect.bind(this)); });
	}

	connect(path){
		//todo add a connection timeout (disconnect after Xms if not connected)

		if(this.hubs[path]) return;

		this.hubs[path] = new Hub(path, this.settings);

		this.hubs[path].on('disconnect', () => { delete this.hubs[path]; });

		this.hubs[path].on('state', (thing) => { this.emit('state', thing); });
	}
}

module.exports = Slave;