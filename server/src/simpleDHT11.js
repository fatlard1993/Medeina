const eventEmitter = require('events');

const j5 = require('johnny-five');
const temporal = require('temporal');
const now = require('performance-now');

const DBG = 0;

const nowCalibration = now() - now();
console.log('Now calibration: ', nowCalibration);// ~ 0.002 on my system

temporal.resolution(0.01);

class simpleDHT11 extends eventEmitter {
  constructor(pin){
		super();

		this.pin = new j5.Pin(pin);

		this.pin.read((error, value) => {
			if(error) return console.error('Error reading signal: ', error);

			if(DBG) console.log('Signal read: ', value);

			if(value === this.signalSettings.seeking){
				if(!this.signalSettings.onRead) return console.error('No signal function!', this.signalSettings.onRead);

				temporal.clear();

				this.signalSettings.onRead(this.signalSettings.timer);
				this.signalSettings.onRead = null;
				this.signalSettings.seeking = null;


				console.log('Signal Time: ', this.signalSettings.timer);
			}
		});
	}

	compileError(time, err){
		const number = ((time << 8) & 0xff00) | (err.code & 0x00ff);

		return err.message +' : '+ number;
	}

	bits2byte(data){
		for(var x = 0, byte = 0; x < 8; ++x) byte += data[x] << (7 - x);

		return byte;
	}

	microToMilliseconds(microseconds){
		return microseconds / 1e3;
	}

	getMicroTime(){
		const hrTime = process.hrtime();

		return hrTime[0] * 1e9 + hrTime[1];
	}

	sleep(reqTime){
		var time = 0, timerStart = now();

		while(time < reqTime) time = (now() + nowCalibration) - timerStart;

		if(DBG) console.log(`Requested: ${reqTime} | Actual: ${time}`);
	}

	read(cb){
		if(!this.pin) return cb(this.errors.noPin.code);

		this.sample((status, data) => {
			if(status !== this.errors.success.code) return cb(status);

			this.parse(data, (status, temperature, humidity, data) => {
				if(status !== this.errors.success.code) return cb(status);

				if(temperature) temperature >>= 8;
				if(humidity) humidity >>= 8;

				if(temperature === 0 && humidity === 0) return cb(this.errors.zeroSamples.code);

				cb(this.errors.success.code, temperature, humidity, data);
			});
		});
	}

	sample(cb){
		// According to protocol: [1] https://akizukidenshi.com/download/ds/aosong/DHT11.pdf
		// notify DHT11 to start:
		//    1. PULL LOW 20ms.
		//    2. PULL HIGH 20-40us.
		//    3. SET TO INPUT.
		// Changes in timing done according to:
		//  [2] https://www.mouser.com/ds/2/758/DHT11-Technical-Data-Sheet-Translated-Version-1143054.pdf
		// - original values specified in code
		// - since they were not working (MCU-dependent timing?), replace in code with
		//   _working_ values based on measurements done with signalTimePrecise()

		// const sampleTimer = new nanoTimer();

		this.pin.mode = 1;// output

		this.pin.write(0);// 1.

		// this.sleep(0.02);

		this.pin.write(1);// 2.

		this.pin.mode = 0;// input

		// var thing = 1;

		// while(thing){
		// 	this.pin.mode = 1;//output
		// 	this.pin.write(0);// 1.

			// this.sleep(100);

			// this.pin.write(1);// 2.
			// this.pin.mode = 0;// input

		// 	this.sleep(100);
		// 	++thing;
		// 	console.log(thing);
		// }



		// Pull high and set to input, before wait 40us.
		// @see https://github.com/winlinvip/SimpleDHT/issues/4
		// @see https://github.com/winlinvip/SimpleDHT/pull/5
		// DHT11 starting:
		//    1. PULL LOW 80us
		//    2. PULL HIGH 80us

		// this.signalTime(0, (time) => {// 1.
		// 	if(time < 30) return cb(this.compileError(time, this.errors.startLow));// specs: 80us

		// 	this.signalTime(1, (time) => {// 2.
		// 		if(time < 50) return cb(this.compileError(time, this.errors.startHigh));// specs: 80us

		// 		this.poll((data) => {
		// 			// DHT11 EOF:
		// 			// PULL LOW 50us.

		// 			this.signalTime(0, () => {
		// 				if(time < 24) return cb(this.compileError(time, this.errors.dataEOF));// specs: 50us

		// 				cb(this.errors.success.code, data);
		// 			});
		// 		});
		// 	});
		// });

		// temporal.delay(delay, () => {// specs: 18us

		// });
	}

	parse(data, cb){
		let humidity = 0, temperature = 0;
		const humidity1 = this.bits2byte(data), humidity2 = this.bits2byte(data + 8);
		const temperature1 = this.bits2byte(data + 16), temperature2 = this.bits2byte(data + 24);

		if(this.bits2byte(data + 32) !== (humidity1 + humidity2 + temperature1 + temperature2)) return cb(this.errors.dataChecksum.code);

		temperature = temperature1 << 8 | temperature2;
		humidity = humidity1 << 8 | humidity2;

		cb(this.errors.success.code, temperature, humidity, data);
	}

	poll(cb, data = [], count = 0){
		console.log('Poll: ', count);

		if(count === 40) return cb(data);

		// DHT11 data transmit:
		//    1. 1bit start, PULL LOW 50us
		//    2. PULL HIGH:
		//         - 26-28us, bit(0)
		//         - 70us, bit(1)

		this.signalTime(0, (time) => {// 1.
			if(time < 24) return cb(this.compileError(time, this.errors.dataLow));// specs: 50us

			// read a bit
			this.signalTime(1, (time) => {// 2.
				if(time < 11) return cb(this.compileError(time, this.errors.dataRead));// specs: 20us

				data[count] = (time > 40 ? 1 : 0);// specs: 26-28us -> 0, 70us -> 1

				this.poll(cb, data, ++count);
			});
		});
	}

	signalTime(signal, cb){
		this.signalSettings.timerStart = now();
		this.signalSettings.timer = 0;
		this.signalSettings.seeking = signal;
		this.signalSettings.onRead = cb;

		temporal.delay(this.signalTimeout, () => {
			if(!this.signalSettings.onRead) return console.error('No signal function!', this.signalSettings.onRead);

			this.signalSettings.onRead(this.signalSettings.timer);
			this.signalSettings.onRead = null;
			this.signalSettings.seeking = null;

			console.log('Signal Timeout: ', this.signalSettings.timer);
		});
	}
}

simpleDHT11.prototype.signalSettings = {
	timeout: 500
};

simpleDHT11.prototype.errors = {
	success: {
		code: 0,
		message: 'Success'
	},
	startLow: {
		code: 0x10,
		message: ' Error to wait for start low signal.'
	},
	startHigh: {
		code: 0x11,
		message: ' Error to wait for start high signal.'
	},
	dataLow: {
		code: 0x12,
		message: ' Error to wait for data start low signal.'
	},
	dataRead: {
		code: 0x13,
		message: ' Error to wait for data read signal.'
	},
	dataEOF: {
		code: 0x14,
		message: ' Error to wait for data EOF signal.'
	},
	dataChecksum: {
		code: 0x15,
		message: ' Error to validate the checksum.'
	},
	zeroSamples: {
		code: 0x16,
		message: ' Error when temperature and humidity are zero, it shouldn\'t happen.'
	},
	noPin: {
		code: 0x17,
		message: ' Error when pin is not initialized.'
	},
};

module.exports = simpleDHT11;