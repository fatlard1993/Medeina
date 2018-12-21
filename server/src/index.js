const j5 = require('johnny-five');
const nanoTimer = require('nanotimer');
const temporal = require('temporal');
const simpleDHT11 = require('./simpleDHT11');

const board = new j5.Board();

const DBG = 0;

// setTimeout(function(){
// 	var actual = now() - temporaldAt - nowCalibration;

// 	console.log(`Time: ${actual}`);
// }, 1);

// timer.setTimeout(function(){
// 	var actual = now() - temporaldAt - nowCalibration;

// 	console.log(`Time: ${actual}`);
// }, '', '1n');

// temporal.delay(1, function(){
// 	var actual = now() - temporaldAt - nowCalibration;

// 	console.log(`Time: ${actual}`);
// });


board.on('ready', function(){
	const button = new j5.Button(13);
	const fountainPin = new j5.Pin(9);
	const temp_humidity = new simpleDHT11(8);
	const speaker = new j5.Piezo(3);
	const motion = new j5.Motion(2);
	const outlets = {
		red: new j5.Relay(10),
		grey: new j5.Relay(7),
		brown: new j5.Relay(6),
		blue: new j5.Relay(5),
		orange: new j5.Relay(4),
	};
	const photoResistor = new j5.Sensor({
    pin: 'A0',
    freq: 250
	});
	const fountain = {
		running: false,
		runTime: 30,
		timer: new nanoTimer(),
		run: function(){
			this.timer.clearTimeout();

			this.timer.setTimeout(this.stop, '', (this.runTime * 1000) +'m');

			if(this.running) return;

			console.log('fountain ON');

			speaker.play('C4 D4 E4');

			this.running = true;

			fountainPin.high();
		},
		stop: function(){
			console.log('fountain OFF');

			speaker.play('E4 D4 C4');

			this.running = false;

			fountainPin.low();
		}
	};

	board.repl.inject({
		button,
		outlets,
		fountain,
		speaker
	});

  photoResistor.on('data', function(){
    if(DBG) console.log(`Light:  ${this.value}`);
  });

	motion.on('calibrated', function(){
    console.log('motion calibrated');
  });

  motion.on('motionstart', function(){
		if(DBG) console.log('motion start');

		fountain.run();
  });

  motion.on('motionend', function(){
    if(DBG) console.log('motion end');
  });

  button.on('down', function(){
		console.log('button down');

		this.pressed = 1;
  });

  button.on('hold', function(){
		if(this.pressed === 2) return;

		console.log('button held');

		speaker.play('B4 B4');

		this.pressed = 2;

		outlets.orange.toggle();
		fountain.run();
  });

  button.on('up', function(){
		console.log('button up');

		if(this.pressed === 1){
			console.log('button pressed');

			speaker.play('F4');

			temp_humidity.read((status, temperature, humidity) => {
				console.log('read dht11: ', status, temperature, humidity);
			});

			// outlets.blue.toggle();
			// outlets.grey.toggle();
		}

		this.pressed = 0;
	});
});