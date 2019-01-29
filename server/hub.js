const uuid = require('uuid/v4');
const EventEmitter = require('events');

const Serialport = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');

const Sensor = require('./sensor');
const Device = require('./device');

const DBG = process.env.DBG || 0;

function schedule(task, hour, min = 0, daysAway = 0){
	var now = new Date();
	var execution = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAway, hour, min);

	// year, month, day, hour, min, sec, msec
	var ms = execution.getTime() - now.getTime();

	if(ms < 0){
		daysAway = 1;
		ms += 864e5; // same bat time tomorrow
	}

	var hours = Math.abs(execution.getHours() - now.getHours());
	var minutes = Math.abs(execution.getMinutes() - now.getMinutes());

	console.log(`Task scheduled for ${hour}:${min >= 10 ? '' :'0'}${min} (${daysAway ? daysAway +' days ' : ''}${hours ? hours +' and hours ' : ''}${minutes ? minutes +' and minutes' : ''} in the future)`);

	return setTimeout(() => { task(task); }, ms);
}

function withinTimeWindow(minHours, maxHours){
	var now = new Date().getHours();

	return now < minHours && now > maxHours;
}

function convertNumberScale(input, inputLow, inputHigh, outputLow, outputHigh, clamp){
	if(clamp) input = Math.min(inputHigh, Math.max(inputLow, input));

	return (((input - inputLow) / (inputHigh - inputLow)) * (outputHigh - outputLow)) + outputLow;
}

function gradientUnit(unit, unitScale, refMin, refMax, outMin, outMax){
	var unitsPerOutput = (outMax - outMin) / unitScale;

	if(unit >= refMax) return outMax - ((unit - refMax) * unitsPerOutput);
	else return outMin + ((unit - refMin) * unitsPerOutput);
}

function scheduleReoccurring(task, minutes, hours = 0){
	console.log(`Task scheduled for every ${hours ? hours +' hours and ' : ''}${minutes} minutes in the future`);

	return setInterval(task, (hours * 6e6) + (minutes * 6e4));
}

function sumArr(arr){
	return arr.reduce((total, num) => { return total + num; });
}

function avgArr(arr){
	return sumArr(arr) / arr.length;
}

class Hub extends EventEmitter {
  constructor(path, settings){
		super();

		this.id = uuid();
		this.things = {};
		this.settings = settings;

		console.log('\nConnecting to: ', path);

		this.port = new Serialport(path, {
			baudRate: 115200
		});

		this.parser = new Delimiter({ delimiter: '\n' });
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

			const type = Object.keys(data)[0];
			const payload = data[type];

			if(type === 'connected'){
				this.name = payload;
				this.connectedTime = new Date();
				// this.settings = {
				// 	deskMotionTimeout: 15,
				// 	tempMin: 72,
				// 	tempMax: 90,
				// 	tempTolerance: 1,
				// 	lightOnTime: [9, 0],
				// 	lightOffTime: 21
				// };

				console.log(`Connected to ${payload} @ ${this.connectedTime.getHours()}:${this.connectedTime.getMinutes()}`);

				this.emit('connected');

				// this.chartTask = schedule(() => {
				// 	this.chartTask = scheduleReoccurring(() => {
				// 		this.chart('light');
				// 		this.chart('temp_humidity');
				// 	}, 10);
				// }, this.connectedTime.getHours(), Math.ceil(this.connectedTime.getMinutes() / 10) * 10);

				// this.temperatureSchedule = schedule(() => {
				// 	this.temperatureSchedule = scheduleReoccurring(() => {
				// 		var temp = Math.round(gradientUnit(new Date().getHours(), 23, 9, 15, 72, 90));

				// 		this.settings.tempMin = temp - this.settings.tempTolerance;
				// 		this.settings.tempMax = temp + this.settings.tempTolerance;
				// 	}, 0, 1);
				// }, this.connectedTime.getHours() + 1);

				// if(this.things.yellow.state === 'on' && (this.connectedTime.getHours() <= this.settings.lightOnTime[0] || this.connectedTime.getHours() >= this.settings.lightOffTime)) this.send('yellow=off');

				// this.lightOnSchedule = schedule((task) => {
				// 	if(this.things.yellow.state === 'off') this.send('yellow=on');

				// 	this.settings.lightOnTime = gradientUnit(new Date().getMonth(), 11, 6, 12, 8, 10).toFixed(1).split('.');
				// 	this.settings.lightOnTime[0] = parseInt(this.settings.lightOnTime[0]);
				// 	this.settings.lightOnTime[1] = parseInt((this.settings.lightOnTime[1] || 0) * 6.66);

				// 	this.lightOnSchedule = schedule(task, this.settings.lightOnTime[0], this.settings.lightOnTime[1]);
				// }, this.settings.lightOnTime[0], this.settings.lightOnTime[1]);

				// this.lightOffSchedule = schedule((task) => {
				// 	if(this.things.yellow.state === 'on') this.send('yellow=off');

				// 	this.lightOffSchedule = schedule(task, this.settings.lightOffTime);
				// }, this.settings.lightOffTime);
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
				console.error(`Error:`, payload);
			}

			else if(this.things[type]){
				this.things[type].setState(payload);
			}

			// 	// if(payload.thing === 'motion'){
			// 	// 	clearTimeout(this.deskLightTimeout);

			// 	// 	if(this.things.motion.state === '1'){
			// 	// 		if(this.things.blue.state === 'off') this.send('blue=on');
			// 	// 		if(this.things.grey.state === 'off') this.send('grey=on');
			// 	// 	}

			// 	// 	else{
			// 	// 		this.deskLightTimeout = setTimeout(() => {
			// 	// 			if(this.things.blue.state === 'on') this.send('blue=off');
			// 	// 			if(this.things.grey.state === 'on') this.send('grey=off');
			// 	// 		}, this.settings.deskMotionTimeout * 6e4);
			// 	// 	}
			// 	// }

			// 	// else if(payload.thing === 'button'){
			// 	// 	console.log('BUTTON', payload.state);

			// 	// 	if(payload.state === '1') this.send('yellow=on');

			// 	// 	else this.send('yellow=off');
			// 	// }

			// 	// else if(payload.thing === 'light'){
			// 	// 	if(DBG) console.log('LIGHT', payload.state);// 1023 lights off | 950-960 desk | 380-420 lizard | 300-320 lizard & desk

			// 	// 	this.things.light.readings = this.things.light.readings || [];

			// 	// 	this.things.light.readings.push(parseInt(payload.state));

			// 	// 	if(this.things.light.readings.length === this.things.light.averageReadingCount){
			// 	// 		this.things.light.averageLight = parseInt(avgArr(this.things.light.readings));

			// 	// 		this.things.light.readings = [];

			// 	// 		if(DBG) console.log('Light: ', this.things.light.averageLight);

			// 	// 		if(this.things.light.averageLight <= 400){
			// 	// 			this.settings.deskMotionTimeout = 60;
			// 	// 		}

			// 	// 		else if(this.things.light.averageLight >= 900){
			// 	// 			this.settings.deskMotionTimeout = 10;
			// 	// 		}
			// 	// 	}
			// 	// }
		});

		this.port.on('error', (err) => {
			console.error('\nError: ', err.message);
		});

		this.port.on('open', () => {
			console.log('Open: ', path);

			this.port.drain(() => { this.send('connection_request'); });
		});

		this.port.on('close', (err) => {
			console.log('\nClose: ', path,  err);

			this.emit('disconnect');
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

// Hub.prototype.chart = function(thingName){
// 	var readingTime = new Date();
// 	var chartHour = readingTime.getHours();
// 	var chartMin = readingTime.getMinutes();
// 	var thing = this.things[thingName];
// 	var type = thing.state.temp ? 't&h' : null;

// 	thing.charts = thing.charts || {};
// 	thing.charts[thingName] = thing.charts[thingName] || (type === 't&h' ? { times: [], tempReadings: [], humidityReadings: [] } : { times: [], readings: [] });

// 	if(!type){
// 		if(thing.charts[thingName].readings[thing.charts[thingName].readings.length - 1] === thing.state) return;

// 		thing.charts[thingName].readings.push(thing.state);

// 		thing.charts[thingName].times.push(chartHour +':'+ chartMin);
// 	}

// 	else if(!(thing.charts[thingName].tempReadings[thing.charts[thingName].tempReadings.length - 1] === thing.averageTemp && thing.charts[thingName].humidityReadings[thing.charts[thingName].humidityReadings.length - 1] === thing.averageHumidity)){
// 		thing.charts[thingName].tempReadings.push(thing.averageTemp);
// 		thing.charts[thingName].humidityReadings.push(thing.averageHumidity);

// 		thing.charts[thingName].times.push(chartHour +':'+ chartMin);
// 	}
// };

module.exports = Hub;