const uuid = require('uuid/v4');
const EventEmitter = require('events');

const Serialport = require('serialport');
const Readline = require('@serialport/parser-readline');

const DBG = process.env.DBG || 0;

function schedule(task, hour, min, daysAway){
	var now = new Date();

	// year, month (0-11), day, hour, min, sec, msec
	var eta_ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (daysAway || 0), hour, min || 0).getTime() - now;

	if(eta_ms < 0) eta_ms += 864e5; // same bat time tomorrow

	console.log(`Task scheduled for ${eta_ms}ms in the future`);

	return setTimeout(task, eta_ms);
}

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

				this.upkeepLights();
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

				if(data.payload.thing === 'motion' && this.things.motion.state === '1'){
					if(this.things.blue.state === 'off') this.send('blue=on');
					if(this.things.grey.state === 'off') this.send('grey=on');

					clearTimeout(this.deskLightTimeout);

					this.deskLightTimeout = setTimeout(() => {
						if(this.things.blue.state === 'on') this.send('blue=off');
						if(this.things.grey.state === 'on') this.send('grey=off');
					}, 15 * 60 * 1000);
				}
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

Hub.prototype.upkeepLights = function(){
	clearTimeout(this.lightOnSchedule);
	clearTimeout(this.lightOffSchedule);

	var now = new Date();

	// year, month (0-11), day, hour, min, sec, msec
	var eta_ms = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11).getTime() - now;

	this.send(`yellow=${eta_ms > 0 ? 'on' : 'off'}`);

	// lara's light requirements
	// 14-10 in summer
	// 12-12 in winter

	this.lightOnSchedule = schedule(() => {
		if(this.things.yellow.state === 'off') this.send('yellow=on');

		this.upkeepLights();
	}, 11);

	this.lightOffSchedule = schedule(() => {
		if(this.things.yellow.state === 'on') this.send('yellow=off');

		this.upkeepLights();
	}, 23);
};

module.exports = Hub;