const uuid = require('uuid/v4');
const EventEmitter = require('events');

function sumArr(arr){ return arr.reduce((total, num) => { return total + num; }); }

function avgArr(arr){ return sumArr(arr) / arr.length; }

class Sensor extends EventEmitter {
  constructor(name, settings = {}){
		super();

		this.id = uuid();
		this.name = name;
		this.formatter = settings.average ? this.averageFormatter : (settings.formatter || this.defaultFormatter);
		this.settings = settings;
	}

	defaultFormatter(val){
		this.emit('state', val);

		return val;
	}

	averageFormatter(val){
		val = this.settings.formatter ? this.settings.formatter(val) : parseFloat(val);

		if(!this.readings || this.readings.length === this.settings.average) this.readings = [];

		this.readings.push(val);

		if(this.readings.length === this.settings.average){
			val = avgArr(this.readings) + (this.settings.calibration || 0);

			this.emit('state', this);
		}

		return val;
	}

	setState(state){
		this.state = this.formatter(state);
	}
}

module.exports = Sensor;