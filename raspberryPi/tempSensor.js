const log = require('log');
const util = require('js-util');
const ds18b20 = require('ds18b20-raspi');

const sensor = require('./sensor');

class TempSensor extends sensor {
	constructor(id, average, fake){
		super(average);

		this.id = id;

		if(fake){
			this.fake = fake;
			this.fakeMin = 69;
			this.fakeMax = 110;
		}
	}

	read(){
		if(this.fake) return this.registerReading((typeof this.fakeVal !== 'undefined' ? this.fakeVal : util.rand(this.fakeMin, this.fakeMax)));

		var reading = ds18b20.readF(this.id);

		if(reading === null) return this.value;

		return this.registerReading(reading);
	}
}

module.exports = TempSensor;