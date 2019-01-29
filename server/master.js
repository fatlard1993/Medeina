const uuid = require('uuid/v4');

const EventEmitter = require('events');

const Sensor = require('./sensor');

class Master extends EventEmitter {
  constructor(name, settings){
		super();

		this.id = uuid();
		this.name = name;
		this.settings = settings;
		this.slaves = {};
	}
}

module.exports = Master;