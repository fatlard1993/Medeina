const uuid = require('uuid/v4');
const EventEmitter = require('events');

class Sensor extends EventEmitter {
  constructor(){
		super();

		this.id = uuid();
	}
}

module.exports = Sensor;