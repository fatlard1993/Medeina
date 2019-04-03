const uuid = require('uuid/v4');
const EventEmitter = require('events');

const log = require('log');
const Serialport = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');

const Sensor = require('./sensor');
const Device = require('./device');

class Hub extends EventEmitter {
  constructor(path, settings = {}){
		super();

		this.id = uuid();
		this.things = {};
		this.settings = settings;

		log('\nConnecting to: ', path);

		this.port = new Serialport(path, {
			baudRate: 115200
		});

		this.parser = new Delimiter({ delimiter: '\n' });
		this.port.pipe(this.parser);

		this.parser.on('data', (data) => {
			log(1)(data.toString());

			try{
				data = JSON.parse(data.toString());
			}

			catch(e){
				log.error(data.toString(), e);

				clearTimeout(this.reconnect_TO);

				this.reconnect_TO = setTimeout(() => { this.send('connection_request'); }, 2000);

				data = {};
			}

			log(1)('\nReceived data:', data);

			const type = Object.keys(data)[0];
			const payload = data[type];

			if(type === 'connected'){
				this.name = payload;
				this.connectedTime = new Date();

				log(`Connected to ${payload} @ ${this.connectedTime.getHours()}:${this.connectedTime.getMinutes()}`);

				this.emit('connected');
			}

			else if(type === 'things'){
				var thingNames = Object.keys(payload);

				for(var x = 0, count = thingNames.length; x < count; ++x){
					var thingName = thingNames[x];

					if(payload[thingName] === 'in'){
						this.things[thingName] = new Sensor(thingName, settings[thingName]);
					}

					else if(payload[thingName] === 'out'){
						this.things[thingName] = new Device(thingName, settings[thingName]);
					}

					this.things[thingName].on('state', (thing) => { this.emit('state', thing); });
				}
			}

			else if(type === 'error'){
				log.error(`Error:`, payload);
			}

			else if(this.things[type]){
				this.things[type].setState(payload);
			}
		});

		this.port.on('error', (err) => {
			log.error('\nError: ', err.message);
		});

		this.port.on('open', () => {
			log('Open: ', path);

			setTimeout(() => { this.send('connection_request'); }, 2000);
		});

		this.port.on('close', (err) => {
			log('\nClose: ', path,  err);

			this.emit('disconnect');
		});
	}
}

Hub.prototype.sendAndDrain = function(data, cb){
	log(1)('\nSending: ', `{${data}}`);

	this.port.write(`{${data}}`);
	this.port.drain(cb);
};

Hub.prototype.send = function(data){
	log(1)('\nSending: ', `{${data}}`);

	this.port.write(`{${data}}`, function(err){
		if(err) return log('Error on write: ', err.message);

		log(1)('- message written - ', data);
	});
};

module.exports = Hub;