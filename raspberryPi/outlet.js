const log = require('log');
const gpio = require('rpio');

class Outlet {
	constructor(pin, name){
		this.pin = pin;
		this.name = name;

		this.value = false;

		gpio.open(pin, gpio.OUTPUT, gpio.LOW);

		log.info(`Setup new Outlet "${name}" with pin #${pin}`);
	}

	on(){
		if(this.value) return;

		this.value = true;

		gpio.write(this.pin, gpio.HIGH);

		log.info(`Outlet #${this.name} is ON`);
	}

	off(){
		if(!this.value) return;

		this.value = false;

		gpio.write(this.pin, gpio.LOW);

		log.info(`Outlet "${this.name}" is OFF`);
	}
}

module.exports = Outlet;