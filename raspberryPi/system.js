const fs = require('fs');
const path = require('path');

const log = require('log');
const util = require('js-util');
const ds18b20 = require('ds18b20-raspi');

const tempSensor = require('./tempSensor');

const system = {
	rootPath: function(){ return path.join(system.opts.rootFolder, ...arguments); },
	init: function(opts){
		this.opts = opts;

		if(opts.sensorDump) return this.sensorDump();

		const fontAwesomePath = 'node_modules/font-awesome/src/fonts';
		const { app, staticServer } = require('http-server').init(opts.port, opts.rootFolder);

		this.socketServer = new (require('websocket-server'))({ server: app.server });

		app.use('/resources', staticServer(this.rootPath('client/resources')));

		app.use('/fonts', staticServer(this.rootPath('client/fonts')));

		if(fs.existsSync(this.rootPath(fontAwesomePath))) app.use('/fonts', staticServer(this.rootPath(fontAwesomePath)));
		else if(fs.existsSync(this.rootPath(`../${fontAwesomePath}`))) app.use('/fonts', staticServer(this.rootPath(`../${fontAwesomePath}`)));

		app.get('/home', function(req, res, next){ res.sendPage('index'); });

		this.socketServer.registerEndpoints(this.socketEndpoints);

		this.tempSensor = new tempSensor('28-011432901971', 3, opts.dev);

		ds18b20.list((err, ids) => {
			if(err) return log.error('error listing ds18b20 devices', err);

			log()(`Found ${ids.length} DS18B20 devices: ${ids}`);

			// ids.forEach((id) => { this.sensors.push(new tempSensor(id, 3, opts.dev)); });
		});

		this.mainLoop = setInterval(this.mainLoopFunc.bind(this), opts.frequency);
	},
	mainLoopFunc: function(){
		this.updateState();

		log(1)(this.state);
	},
	updateState: function(){
		system.state = {};

		system.tempSensor.read();

		system.state = {
			temp: system.tempSensor.value
		};

		// system.sensors.forEach((sensor) => {
		// 	sensor.read();

		// 	system.state[sensor.id] = sensor.value;
		// });

		this.socketServer.broadcast('state', this.state);

		return system.state;
	},
	socketEndpoints: {
		client_connect: function(){
			log('client_connect');

			this.reply('state', system.updateState());
		},
		client_disconnect: function(){
			log('client_disconnect');
		},
		updateOptions: function(change){
			log('Updating options', change);

			Object.keys(change).forEach((opt) => { system.opts[opt] = change[opt]; });
		}
	},
	exit: function(msg){
		if(msg){
			log.error('EXIT', msg);

			return process.exit(130);
		}

		clearInterval(system.mainLoop);
	}
};

module.exports = system;