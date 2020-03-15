const util = require('js-util');
const ds18b20 = require('ds18b20-raspi');

const sensor = require('./sensor');

class tempSensor extends sensor {
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

		return this.registerReading(ds18b20.readF(this.id));
	}
}

module.exports = tempSensor;