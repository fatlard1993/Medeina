const uuid = require('uuid/v4');
const EventEmitter = require('events');

class Device extends EventEmitter {
  constructor(name, settings = {}){
		super();

		this.id = uuid();
		this.name = name;
		this.formatter = settings.average ? this.averageFormatter : (settings.formatter || this.defaultFormatter);
		this.settings = settings;
	}

	defaultFormatter(val){
		return val;
	}

	setState(state){
		this.state = this.formatter(state);

		this.emit('state', this);
	}
}

module.exports = Device;