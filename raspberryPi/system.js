const fs = require('fs');
const path = require('path');

const log = require('log');
const util = require('js-util');
const ds18b20 = require('ds18b20-raspi');

const TempSensor = require('./tempSensor');
const Outlet = require('./outlet');

const system = {
	rootPath: function(){ return path.join(system.opts.rootFolder, ...arguments); },
	init: function(opts){
		this.opts = opts;

		if(opts.listSensors){
			return ds18b20.list((err, ids) => {
				if(err) return log.error('error listing ds18b20 devices', err);

				log()(`Found ${ids.length} DS18B20 devices: ${ids}`);

				// ids.forEach((id) => { this.sensors.push(new TempSensor(id, 3, opts.dev)); });
			});
		}

		if(opts.web){
			const fontAwesomePath = 'node_modules/font-awesome/src/fonts';
			const { app, staticServer } = require('http-server').init(opts.port, opts.rootFolder);

			this.socketServer = new (require('websocket-server'))({ server: app.server });

			app.use('/resources', staticServer(this.rootPath('client/resources')));

			app.use('/fonts', staticServer(this.rootPath('client/fonts')));

			if(fs.existsSync(this.rootPath(fontAwesomePath))) app.use('/fonts', staticServer(this.rootPath(fontAwesomePath)));
			else if(fs.existsSync(this.rootPath(`../${fontAwesomePath}`))) app.use('/fonts', staticServer(this.rootPath(`../${fontAwesomePath}`)));

			app.get('/home', function(req, res, next){ res.sendPage('index'); });

			this.socketServer.registerEndpoints(this.socketEndpoints);
		}

		this.hotSensor = new TempSensor('28-011432901971', 3, opts.dev);
		this.coolSensor = new TempSensor('28-0114339cb8c3', 3, opts.dev);

		this.lights = new Outlet(11, 'lights');
		this.heatPanel = new Outlet(12, 'heatPanel');

		this.mainLoop = setInterval(this.mainLoopFunc.bind(this), opts.frequency);
	},
	mainLoopFunc: function(){
		this.updateState();

		log(1)(this.state);

		this.lights[this.time === 'day' ? 'on' : 'off']();

		if(this.state.hot > this.opts.max) this.heatPanel.off();

		else if(this.state.cool < this.opts.min) this.heatPanel.on();
	},
	updateState: function(){
		system.state = {};

		var now = new Date();

		system.hotSensor.read();
		system.coolSensor.read();

		if(now.getHours() <= 21 && system.time !== 'day') system.time = 'day';
		else if(now.getHours() >= 22 && system.time !== 'night') system.time = 'night';

		system.state = {
			hot: system.hotSensor.value,
			cool: system.coolSensor.value,
			lights: system.lights.value ? 'on' : 'off',
			heatPanel: system.heatPanel.value ? 'on' : 'off'
		};

		// system.sensors.forEach((sensor) => {
		// 	sensor.read();

		// 	system.state[sensor.id] = sensor.value;
		// });

		if(system.opts.web) system.socketServer.broadcast('state', system.state);

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
	exit: function(){
		log.error('EXIT', arguments);

		clearInterval(system.mainLoop);
	}
};

module.exports = system;