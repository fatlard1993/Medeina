const uuid = require('uuid/v4');

const EventEmitter = require('events');

const Slave = require('./slave');

class Master extends EventEmitter {
  constructor(name, settings = {}){
		super();

		this.id = uuid();
		this.name = name;
		this.settings = settings;
		this.slaves = {};
		this.hubs = {};
		this.things = {};
	}

	addSlave(name){
		this.slaves[name] = new Slave(name, this.settings);

		this.slaves[name].on('state', (thing) => {
			this.emit('state', thing);

			this.things[thing.name] = thing.state;
		});
	}

	useDevice(name, state){
		if(this.hubs[name]) this.hubs[name].send(name +' '+ state);

		for(var x = 0, slaveNames = Object.keys(this.slaves), slaveCount = slaveNames.length; x < slaveCount; ++x){
			for(var y = 0, hubNames = Object.keys(this.slaves[slaveNames[x]].hubs), hubCount = hubNames.length; y < hubCount; ++y){
				var hub = this.slaves[slaveNames[x]].hubs[hubNames[y]];

				if(hub.things[name]){
					this.hubs[name] = hub;

					hub.send(name +' '+ state);
				}
			}
		}
	}
}

module.exports = Master;