const path = require('path');

const log = require('log');
const ConfigManager = require('config-manager');

var config = new ConfigManager(path.resolve('./config.json'), {
	port: 8080
});

const { app, sendPage, pageCompiler, staticServer } = require('http-server').init(process.env.PORT || config.current.port);
const SocketServer = require('websocket-server');
const socketServer = new SocketServer({ server: app.server });

const Slave = require('./slave');

const stdin = process.openStdin();

// lara's temp and humidity requirements
// 87-90 temp high side
// 74-80 temp low side
// 70-75 temp night
// 30-40% humidity

function convertNumberScale(input, inputLow, inputHigh, outputLow, outputHigh, clamp){
	if(clamp) input = Math.min(inputHigh, Math.max(inputLow, input));

	return (((input - inputLow) / (inputHigh - inputLow)) * (outputHigh - outputLow)) + outputLow;
}

function gradientUnit(unit, unitScale, refMin, refMax, outMin, outMax){//only need to gradient the duration not the actual times
	var unitsPerOutput = (outMax - outMin) / unitScale;

	if(unit >= refMax) return outMax - ((unit - refMax) * unitsPerOutput);
	else return outMin + ((unit - refMin) * unitsPerOutput);
}

function schedule(task, hour, min = 0, daysAway = 0){//todo make this support absolute or relative
	var now = new Date();
	var execution = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAway, hour, min);

	// year, month, day, hour, min, sec, msec
	var ms = execution.getTime() - now.getTime();

	if(ms < 0){
		daysAway = 1;
		ms += 864e5; // same bat time tomorrow
	}

	var hours = Math.abs(execution.getHours() - now.getHours());
	var minutes = Math.abs(execution.getMinutes() - now.getMinutes());

	log(`Task scheduled for ${hour}:${min >= 10 ? '' :'0'}${min} (${daysAway ? daysAway +' days ' : ''}${hours ? hours +' and hours ' : ''}${minutes ? minutes +' and minutes' : ''} in the future)`);

	return setTimeout(() => { task(task); }, ms);
}

function scheduleReoccurring(task, minutes, hours = 0){//todo make this support absolute or relative
	log(`Task scheduled for every ${hours ? hours +' hours and ' : ''}${minutes} minutes in the future`);

	return setInterval(task, (hours * 6e6) + (minutes * 6e4));
}

function fahrenheit(celsius){ return parseFloat(((parseFloat(celsius) * 1.8) + 32).toFixed(1)); }

const settings = {
	lara: {
		maxTempCoolSide: 80,
		minTempCoolSide: 74,
		maxTempHotSide: 90,
		minTempHotSide: 87,
		lightOnTime: [9, 0],
		lightOffTime: [21, 0]
	},
	office: {
		maxTemp: 74,
		minTemp: 72,
		lightDelayMinutes: 10
	},
	temp_office: {
		average: 6,
		calibration: -2,
		formatter: fahrenheit
	},
	humidity_office: {
		average: 6
	},
	temp_lara_cool_side: {
		average: 6,
		calibration: -3,
		formatter: fahrenheit
	},
	humidity_lara_cool_side: {
		average: 6,
		calibration: 1
	},
	temp_lara_hot_side: {
		average: 6,
		calibration: -8,
		formatter: fahrenheit
	},
	humidity_lara_hot_side: {
		average: 6
	},
	light: {
		average: 10
	}
};

app.get('/testj', function(req, res){
	log('Testing JSON...');

	res.json({ test: 1 });
});

app.get('/test', function(req, res){
	log('Testing...');

	res.send('test');
});

app.use('/resources', staticServer(path.join(__dirname, '../client/resources')));

app.use('/fonts', staticServer(path.join(__dirname, '../client/fonts')));

app.get('/home', sendPage('home'));

socketServer.createEndpoint('test', function(){
	return 'testing 1-2-3';
});

// this.temperatureSchedule = schedule(() => {
// 	this.temperatureSchedule = scheduleReoccurring(() => {
// 		var temp = Math.round(gradientUnit(new Date().getHours(), 23, 9, 15, 72, 90));

// 		this.settings.tempMin = temp - this.settings.tempTolerance;
// 		this.settings.tempMax = temp + this.settings.tempTolerance;
// 	}, 0, 1);
// }, this.connectedTime.getHours() + 1);

var slave = new Slave('slave1', settings);

// scheduleReoccurring(() => {
// 	var hubPaths = Object.keys(slave.hubs);

// 	hubPaths.forEach(function(hubPath){
// 		slave.hubs[hubPath].send('getStates');
// 	});
// }, 5);

//todo a top level generic way to talk to sensors and devices (hub agnostic)

// setTimeout(() => {
// 	var hubName = Object.keys(slave.hubs)[0];

// 	var now = new Date();

// 	if(now.getHours() >= settings.lara.lightOffTime[0] || now.getHours() <= settings.lara.lightOnTime[0]) slave.hubs[hubName].send('yellow 0');

// 	settings.lara.lightOnSchedule = schedule((task) => {
// 		slave.hubs[hubName].send('yellow 1');

// 		log(`lara light on | time: ${new Date().getHours()}:${new Date().getMinutes()}`);

// 		// settings.lara.lightOnTime = gradientUnit(new Date().getMonth(), 11, 6, 12, 8, 10).toFixed(1).split('.');
// 		// settings.lara.lightOnTime[0] = parseInt(settings.lara.lightOnTime[0]);
// 		// settings.lara.lightOnTime[1] = parseInt(settings.lara.lightOnTime[1] * 6.66);

// 		settings.lara.lightOnSchedule = schedule(task, settings.lara.lightOnTime[0], settings.lara.lightOnTime[1]);
// 	}, settings.lara.lightOnTime[0], settings.lara.lightOnTime[1]);

// 	settings.lara.lightOffSchedule = schedule((task) => {
// 		slave.hubs[hubName].send('yellow 0');

// 		log(`lara light off | time: ${new Date().getHours()}:${new Date().getMinutes()}`);

// 		settings.lara.lightOffSchedule = schedule(task, settings.lara.lightOffTime[0], settings.lara.lightOffTime[1]);
// 	}, settings.lara.lightOffTime[0], settings.lara.lightOffTime[1]);
// }, 6000);

slave.on('state', (hub, thing) => {
	if(thing.name === 'temp_office'){
		if(thing.state > settings.office.maxTemp && hub.things.green.state){
			hub.send('green 0');

			log(`office heat off | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}

		else if(thing.state < settings.office.minTemp && !hub.things.green.state){
			hub.send('green 1');

			log(`office heat on | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}
	}

	else if(thing.name === 'temp_lara_cool_side'){
		if(thing.state > settings.lara.maxTempCoolSide && !hub.things.fan.state){
			hub.send('fan 1');

			log(`lara fan on | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}

		else if(thing.state < settings.lara.minTempCoolSide && hub.things.fan.state){
			hub.send('fan 0');

			log(`lara fan off | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}
	}

	else if(thing.name === 'temp_lara_hot_side'){
		if(thing.state > settings.lara.maxTempHotSide && hub.things.brown.state){
			hub.send('brown 0');

			log(`lara heat off | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}

		else if(thing.state < settings.lara.minTempHotSide && !hub.things.brown.state){
			hub.send('brown 1');

			log(`lara heat on | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}
	}

	else if(thing.name === 'motion'){
		clearTimeout(settings.office.deskLightTimeout);

		if(thing.state){// && !hub.things.motion.state
			hub.send('blue 1');

			log(`office light on | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}

		else if(!thing.state){// && hub.things.motion.state
			settings.office.deskLightTimeout = setTimeout(() => {
				hub.send('blue 0');

				log(`office light on | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
			}, settings.office.lightDelayMinutes * 6e4);
		}
	}

	else if(thing.name === 'button' && thing.state){
		this.send(`blue ${hub.things.blue.state ? '0' : '1'}`);

		log(`office light ${hub.things.blue.state ? 'off' : 'on'} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
	}

	else if(thing.name === 'light'){
		//log('LIGHT', thing.state);// 1023 lights off | 950-960 desk | 380-420 lizard | 300-320 lizard & desk
	}
});

stdin.addListener('data', function(data){
	var cmd = data.toString().trim();

	log(`CMD: ${cmd}`);

	if(cmd.startsWith('send')){
		cmd = cmd.replace('send ', '');

		log(cmd);

		slave.hubs[Object.keys(slave.hubs)[0]].send(cmd);
	}

	else if(cmd === 't'){
		var hubPaths = Object.keys(slave.hubs);

		log(`\ntime: ${new Date().getHours()}:${new Date().getMinutes()}`);

		hubPaths.forEach(function(hubPath){
			var thingNames = Object.keys(slave.hubs[hubPath].things);

			thingNames.forEach(function(thingName){
				var thing = slave.hubs[hubPath].things[thingName];

				log(thing.name, thing.state);
			});
		});
	}

	else if(cmd === 'things'){
		log(slave.hubs[Object.keys(slave.hubs)[0]].things);
	}

	else if(cmd === 's'){
		log(settings);
	}
});