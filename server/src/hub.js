const uuid = require('uuid/v4');
const EventEmitter = require('events');

const Serialport = require('serialport');
const Readline = require('@serialport/parser-readline');

const DBG = process.env.DBG || 0;

function schedule(task, hour, min = 0, daysAway = 0){
	var now = new Date();

	// year, month, day, hour, min, sec, msec
	var eta_ms = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAway, hour, min).getTime() - now;

	if(eta_ms < 0){
		eta_ms += 864e5; // same bat time tomorrow

		task(true);
	}

	console.log(`Task scheduled for ${hour}:${min > 10 ? '' :'0'}${min} (${eta_ms}ms in the future)`);

	return setTimeout(task, eta_ms);
}

function withinTimeWindow(minHours, maxHours){
	var now = new Date().getHours();

	return now < minHours && now > maxHours;
}

function scheduleReoccurring(task, minutes, hours = 0){
	console.log(`Task scheduled for every${hours ? hours +' hours and' : ''} ${minutes} minutes in the future`);

	return setInterval(task, (hours * 6e6) + (minutes * 6e4));
}

function sumArr(arr){
	return arr.reduce((total, num) => { return total + num; });
}

function avgArr(arr){
	return sumArr(arr) / arr.length;
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

				this.connectedTime = new Date();
				this.id = data.payload;

				if(!this.things.temp_humidity) return console.error('Error connecting!');

				this.things.temp_humidity.averageReadingCount = 6;
				this.things.temp_humidity.tempCalibration = 3;
				this.things.temp_humidity.humidityCalibration = -5;

				this.chartTask = schedule(() => {
					this.chartTask = scheduleReoccurring(() => { this.chart(this.things.temp_humidity, 'temp_humidity'); }, 10);
				}, this.connectedTime.getHours(), Math.ceil(this.connectedTime.getMinutes() / 10) * 10);

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
					// 30-40% humidity

					this.things.temp_humidity.tempReadings = this.things.temp_humidity.tempReadings || [];
					this.things.temp_humidity.humidityReadings = this.things.temp_humidity.humidityReadings || [];

					this.things.temp_humidity.tempReadings.push(parseInt(data.payload.state.temp));
					this.things.temp_humidity.humidityReadings.push(parseInt(data.payload.state.humidity));

					if(this.things.temp_humidity.tempReadings.length === this.things.temp_humidity.averageReadingCount){
						this.things.temp_humidity.averageTemp = parseInt(avgArr(this.things.temp_humidity.tempReadings) + this.things.temp_humidity.tempCalibration);

						this.things.temp_humidity.tempReadings = [];

						if(DBG) console.log('Temp: ', this.things.temp_humidity.averageTemp);

						if(this.things.temp_humidity.averageTemp > 90){
							if(this.things.brown.state === 'on') this.send('brown=off');
						}

						else if(this.things.temp_humidity.averageTemp < 87){
							if(this.things.brown.state === 'off') this.send('brown=on');
						}
					}

					if(this.things.temp_humidity.humidityReadings.length === this.things.temp_humidity.averageReadingCount){
						this.things.temp_humidity.averageHumidity = parseInt(avgArr(this.things.temp_humidity.humidityReadings) + this.things.temp_humidity.humidityCalibration);

						this.things.temp_humidity.humidityReadings = [];

						if(DBG) console.log('Humidity: ', this.things.temp_humidity.averageHumidity);

						if(this.things.temp_humidity.averageHumidity > 40){
							console.log(`Humidity is high - ${this.things.temp_humidity.averageHumidity}%`);
						}

						else if(this.things.temp_humidity.averageHumidity < 30){
							if(DBG) console.log(`Humidity is low - ${this.things.temp_humidity.averageHumidity}%`);
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
	if(DBG) console.log('\nSending: ', `{${data}}`);

	this.port.write(`{${data}}`);
	this.port.drain(cb);
};

Hub.prototype.send = function(data){
	if(DBG) console.log('\nSending: ', `{${data}}`);

	this.port.write(`{${data}}`, function(err){
		if(err) return console.log('Error on write: ', err.message);

		if(DBG) console.log('- message written - ', data);
	});
};

Hub.prototype.chart = function(thing, type){
	var readingTime = new Date();
	var chartHour = readingTime.getHours();
	var chartTime = readingTime.getMinutes();

	thing.charts = thing.charts || {};
	thing.charts[chartHour] = thing.charts[chartHour] || (type === 'temp_humidity' ? { times: [], tempReadings: [], humidityReadings: [] } : { times: [], readings: [] });

	if(!type){
		if(thing.charts[chartHour].readings[thing.charts[chartHour].readings.length - 1] === thing.state) return;

		thing.charts[chartHour].readings.push(thing.state);

		thing.charts[chartHour].times.push(chartTime);
	}

	else if(!(thing.charts[chartHour].tempReadings[thing.charts[chartHour].tempReadings.length - 1] === thing.averageTemp && thing.charts[chartHour].humidityReadings[thing.charts[chartHour].humidityReadings.length - 1] === thing.averageHumidity)){
		thing.charts[chartHour].tempReadings.push(thing.averageTemp);
		thing.charts[chartHour].humidityReadings.push(thing.averageHumidity);

		thing.charts[chartHour].times.push(chartTime);
	}
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