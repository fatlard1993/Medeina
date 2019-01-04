const uuid = require('uuid/v4');
const EventEmitter = require('events');

const Serialport = require('serialport');
const Readline = require('@serialport/parser-readline');

const DBG = process.env.DBG || 0;

class Hub extends EventEmitter {
  constructor(path, close){
		super();

		this.id = uuid();
		this.things = {};

		console.log('\nConnecting to: ', path);

		this.port = new Serialport(path, {
			baudRate: 115200
		});

		this.parser = new Readline();
		this.port.pipe(this.parser);

		this.parser.on('data', (data) => {
			if(DBG) console.log(data.toString());

			data = JSON.parse(data.toString());

			if(DBG) console.log('\nReceived data:', data);

			if(data.type === 'connected'){
				console.log(`Connected to ${data.payload}`);

				this.id = data.payload;
			}

			else if(data.type === 'things'){
				if(DBG) console.log(`Things:`, data.payload);

				Object.assign(this.things, data.payload);
			}

			else if(data.type === 'error'){
				console.error(`Error:`, data.payload);
			}

			else if(data.type === 'state'){
				if(DBG) console.log(`State:`, data.payload);

				if(!this.things || !this.things[data.payload.thing]) return console.error(`Thing "${data.payload.thing}" doesn't exist`);

				this.things[data.payload.thing].state = data.payload.state;
			}
		});

		this.port.on('error', (err) => {
			console.log('\nError: ', err.message);
		});

		this.port.on('open', () => {
			console.log('Open: ', path);

			this.send('connection_request');
		});

		this.port.on('close', (err) => {
			console.log('\nClose: ', path,  err);

			close(path);
		});
	}
}

Hub.prototype.sendAndDrain = function(data, cb){
	console.log('\nSending: ', `{${data}}`);

	this.port.write(`{${data}}`);
	this.port.drain(cb);
};

Hub.prototype.send = function(data){
	console.log('\nSending: ', `{${data}}`);

	this.port.write(`{${data}}`, function(err){
		if(err) return console.log('Error on write: ', err.message);

		console.log('- message written - ', data);
	});
};

module.exports = Hub;