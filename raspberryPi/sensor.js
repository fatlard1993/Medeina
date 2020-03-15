const util = require('js-util');

class sensor {
	constructor(average){
		this.average = average;
	}

	registerReading(reading){
		reading = parseFloat(reading.toFixed(this.precision || 1));

		if(this.average){
			this.values = this.values || [];

			this.values.push(reading);

			if(this.values.length === this.average){
				this.value = parseFloat(util.averageArr(this.values).toFixed(this.precision || 1));

				delete this.values;
			}
		}

		if(!this.average || typeof this.value === 'undefined') this.value = reading;

		return this.value;
	}
}

module.exports = sensor;