const uuid = require('uuid/v4');
const EventEmitter = require('events');

const Serialport = require('serialport');
const Readline = require('@serialport/parser-readline');

const DBG = process.env.DBG || 0;

function schedule(task, hour, min, daysAway){
	var now = new Date();

	// year, month (0-11), day, hour, min, sec, msec
	var eta_ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (daysAway || 0), hour, min || 0).getTime() - now;

	if(eta_ms < 0){
		eta_ms += 864e5; // same bat time tomorrow

		task(true);
	}

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

			try{
				data = JSON.parse(data.toString());
			}
			catch(e){
				console.error(data.toString(), e);

				data = {};
			}

			if(DBG) console.log('\nReceived data:', data);

			if(data.type === 'connected'){
				console.log(`Connected to ${data.payload}`);

				this.id = data.payload;

				this.upkeepLights();

				this.reportInterval = setInterval(() => {
					console.log(`Report ${new Date().getHours()}: `, this.things);
				}, 6e6);// every hour
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

				if(data.payload.thing === 'motion'){
					clearTimeout(this.deskLightTimeout);

					if(this.things.motion.state === '1'){
						if(this.things.blue.state === 'off') this.send('blue=on');
						if(this.things.grey.state === 'off') this.send('grey=on');
					}

					else{
						this.deskLightTimeout = setTimeout(() => {
							if(this.things.blue.state === 'on') this.send('blue=off');
							if(this.things.grey.state === 'on') this.send('grey=off');
						}, 15 * 6e4);
					}
				}

				else if(data.payload.thing === 'temp_humidity'){
					// lara's temp and humidity requirements
					// 87-90 temp high side
					// 74-80 temp low side
					// 70-75 temp night
					// 30-40% humid

					this.things[data.payload.thing].tempReadings = this.things[data.payload.thing].tempReadings || [];
					this.things[data.payload.thing].humidityReadings = this.things[data.payload.thing].humidityReadings || [];

					this.things[data.payload.thing].tempReadings.push(parseInt(data.payload.state.temp));
					this.things[data.payload.thing].humidityReadings.push(parseInt(data.payload.state.humidity));

					var tempCalibration = 4;
					var humidityCalibration = -1;

					if(this.things[data.payload.thing].tempReadings.length === 5){
						var tempReadingSum = this.things[data.payload.thing].tempReadings.reduce((total, num) => { return total + num; });

						this.things[data.payload.thing].averageTemp = (tempReadingSum / 5) + tempCalibration;

						if(DBG) console.log('Temp: ', tempReadingSum, this.things[data.payload.thing].averageTemp);

						this.things[data.payload.thing].tempReadings = [];

						if(this.things[data.payload.thing].averageTemp > 90){
							if(this.things.brown.state === 'on') this.send('brown=off');
						}

						else if(this.things[data.payload.thing].averageTemp < 87){
							if(this.things.brown.state === 'off') this.send('brown=on');
						}
					}

					if(this.things[data.payload.thing].humidityReadings.length === 5){
						var humidityReadingSum = this.things[data.payload.thing].humidityReadings.reduce((total, num) => { return total + num; });

						this.things[data.payload.thing].averageHumidity = (humidityReadingSum / 5) + humidityCalibration;

						this.things[data.payload.thing].humidityReadings = [];

						if(DBG) console.log('Humidity: ', tempReadingSum, this.things[data.payload.thing].averageHumidity);

						if(this.things[data.payload.thing].averageHumidity > 40){
							console.log(`Humidity is high - ${this.things[data.payload.thing].averageHumidity}%`);
						}

						else if(this.things[data.payload.thing].averageHumidity < 30){
							console.log(`Humidity is low - ${this.things[data.payload.thing].averageHumidity}%`);
						}
					}
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

	// lara's light requirements
	// 14-10 in summer
	// 12-12 in winter

	this.lightOnSchedule = schedule((catchup) => {
		if(this.things.yellow.state === 'off') this.send('yellow=on');

		if(!catchup) this.upkeepLights();
	}, 10);

	this.lightOffSchedule = schedule((catchup) => {
		if(this.things.yellow.state === 'on') this.send('yellow=off');

		if(!catchup) this.upkeepLights();
	}, 22);
};

module.exports = Hub;