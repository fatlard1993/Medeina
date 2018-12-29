const uuid = require('uuid/v4');
const EventEmitter = require('events');

const Serialport = require('serialport');
const Readline = require('@serialport/parser-readline');

class Hub extends EventEmitter {
  constructor(path, close){
		super();

		this.id = uuid();

		console.log('\nConnecting to: ', path);

		this.port = new Serialport(path, {
			baudRate: 115200
		});

		this.parser = new Readline();
		this.port.pipe(this.parser);

		this.parser.on('data', (data) => {
			data = JSON.parse(data.toString());

			console.log('\nReceived data:', data);

			if(data.connected){
				console.log(`Connected to ${data.connected}`);

				this.deviceId = data.connected;

				this.send('request_capabilities');
			}

			else if(data.capabilities){
				console.log(`Capabilities: ${data.capabilities}`);
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