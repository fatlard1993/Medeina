#!/usr/bin/env node

const path = require('path');

const args = require('yargs').argv;
const findRoot = require('find-root');
const rootFolder = findRoot(__dirname);

process.chdir(rootFolder);

//log args polyfill
if(args.d) process.env.DBG = args.d;
if(args.dev || args.dbg) process.env.COLOR = 1;

const log = require('log');
const Config = require('config-manager');

var config = new Config(path.resolve(rootFolder, 'config.json'), {
	port: 8080
});

const { app, sendPage, pageCompiler, staticServer } = require('http-server').init(args.port || config.current.port, rootFolder);
const SocketServer = require('websocket-server');
const socketServer = new SocketServer({ server: app.server });

const Master = require('./master');

const stdin = process.openStdin();

pageCompiler.buildFile('home');

function fahrenheit(celsius){ return parseFloat(((parseFloat(celsius) * 1.8) + 32).toFixed(1)); }

// lara's temp and humidity requirements
// 87-90 temp high side
// 74-80 temp low side
// 70-75 temp night
// 30-40% humidity

var master = new Master('master1', {
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
});

const currentStatus = {};

app.use('/resources', staticServer(path.join(rootFolder, 'client/resources')));

app.use('/fonts', staticServer(path.join(rootFolder, 'client/fonts')));

app.get('/home', sendPage('home'));

socketServer.registerEndpoints({
	client_connect: function(){
		this.reply('currentStatus', currentStatus);
	}
});

master.addSlave('slave1');

master.on('state', (thing) => {
	socketServer.broadcast('update', { name: thing.name, state: thing.state });

	currentStatus[thing.name] = thing.state;

	log(1)(thing.name, thing.state);

	if(thing.name === 'temp_lara_hot_side'){
		if(thing.state > master.settings.lara.maxTempHotSide && master.things.lara_heat){
			master.useDevice('lara_heat', 0);

			log(`lara heat off | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}

		else if(thing.state < master.settings.lara.minTempHotSide && !master.things.lara_heat){
			master.useDevice('lara_heat', 1);

			log(`lara heat on | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}
	}

	else if(thing.name === 'temp_lara_cool_side'){
		if(thing.state < master.settings.lara.minTempCoolSide && master.things.lara_fan){
			master.useDevice('lara_fan', 0);

			log(`lara fan off | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}

		else if(thing.state > master.settings.lara.maxTempCoolSide && !master.things.lara_fan){
			master.useDevice('lara_fan', 1);

			log(`lara fan on | temp: ${thing.state} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
		}
	}

	else if(thing.name === 'button' && thing.state){
		master.useDevice('red', master.things.red ? '0' : '1');

		log(`office light ${master.things.red ? 'off' : 'on'} | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
	}

	// else if(thing.name === 'motion'){
	// 	clearTimeout(master.settings.office.deskLightTimeout);

	// 	if(thing.state){// && !hub.things.motion.state
	// 		master.useDevice('red', 1);

	// 		log(`office light on | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
	// 	}

	// 	else if(!thing.state){// && hub.things.motion.state
	// 		master.settings.office.deskLightTimeout = setTimeout(() => {
	// 		master.useDevice('red', 0);

	// 			log(`office light off | time: ${new Date().getHours()}:${new Date().getMinutes()}`);
	// 		}, master.settings.office.lightDelayMinutes * 6e4);
	// 	}
	// }

	// else if(thing.name === 'light'){
	// 	log('LIGHT', thing.state);// 1023 lights off | 950-960 desk | 380-420 lizard | 300-320 lizard & desk
	// }
});


stdin.addListener('data', function(data){
	var cmd = data.toString().trim();

	log(`CMD: ${cmd}`);

	if(cmd.startsWith('use')){
		cmd = cmd.replace('use ', '');

		log(cmd);

		master.useDevice.apply(master, cmd.split(' '));
	}

	else if(cmd === 't') log(master.things);
});