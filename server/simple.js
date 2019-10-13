#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const yargs = require('yargs');

yargs.version(false);

yargs.alias({
	h: 'help',
	c: 'color',
	ver: 'version',
	v: 'verbosity',
	p: 'port',
	dbg: 'debug',
	i: 'interval'
});

yargs.boolean(['h', 'c', 'ver']);

yargs.default({
	v: 1,
	i: 10
});

yargs.describe({
	h: 'This',
	c: 'Enables colored logs',
	ver: 'Wraps --color ... Prints the version then exits',
	v: '<level>',
	p: '<port>',
	dbg: 'Wraps --color --verbosity ... Sets up various stuff sends the dbg mode to the client pages',
	i: '<interval> This is the interval of minutes at which logs are quantized to'
});

var args = yargs.argv;

if(args.n) args.dbg = args.n;

if(args.dbg){
	args.c = true;
	args.v = Number(args.dbg);
}

else if(args.v) args.v = Number(args.v);

//log args polyfill
process.env.DBG = args.v;
process.env.COLOR = args.ver || args.c;

const rootFolder = process.env.ROOT_FOLDER = require('find-root')(__dirname);

var log = require('log');
const fsExtended = require('fs-extended');
const util = require('js-util');

const { app, staticServer } = require('http-server').init(args.port || 80, rootFolder);
const socketServer = new (require('websocket-server'))({ server: app.server });

const Serialport = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');

const device = new Serialport(args.device || '/dev/ttyUSB0', { baudRate: 9600 });
const parser = new Delimiter({ delimiter: '\n' });

device.pipe(parser);

const dataLogger = {
	prettyInterval: args.interval || 5,
	data: { labels: [], datasets: [] },
	readings: {},
	add: function(id, value){
		dataLogger.readings[id] = dataLogger.readings[id] || [];

		dataLogger.readings[id].push(value);

		if(value < dataLogger.readings[id][dataLogger.readings[id].length - 1] - 10) log.warn('Suspicious reading: ', value, new Date());

		dataLogger.pretty();
	},
	averageReading(arr){
		for(var x = 0, count = arr.length, sum = 0; x < count; ++x) sum += parseFloat(arr[x]);

		return sum / count;
	},
	update: function(){
		var now = new Date();
		var label = util.parseDateString('%H:%M', now);
		var readings = {};

		dataLogger.data.labels.push(label);

		for(var x = 0, arr = Object.keys(dataLogger.readings), count = arr.length, id, reading; x < count; ++x){
			id = arr[x];
			readings[id] = reading = dataLogger.averageReading(dataLogger.readings[id]).toFixed(1);
			dataLogger.data.datasets[x] = dataLogger.data.datasets[x] || { id, data: [] };

			dataLogger.data.datasets[x].data.push(reading);
		}

		socketServer.broadcast('logUpdate', { label, readings });

		dataLogger.readings = {};

		if(now.getHours() === 0 && now.getMinutes() === 0) dataLogger.saveDayLog();
	},
	pretty: function(){
		if(dataLogger.timeout) return;

		var now = new Date();
		var nextLogTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + (dataLogger.prettyInterval - (now.getMinutes() % dataLogger.prettyInterval)));

		dataLogger.timeout = setTimeout(() => {
			dataLogger.update();

			delete dataLogger.timeout;

			dataLogger.pretty();

		}, nextLogTime.getTime() - now.getTime());
	},
	saveDayLog: function(){
		var now = new Date();
		var file = path.join(rootFolder, `logs/${util.parseDateString('%m-%d-%y', new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getHours() === 0 && now.getMinutes() === 0 ? 1 : 0)))}.json`);

		fsExtended.mkdir(path.join(rootFolder, 'logs'));

		log('saving day log', dataLogger.data.labels.length, file);

		fs.writeFileSync(file, JSON.stringify(dataLogger.data));

		dataLogger.data = { labels: [], datasets: [] };
	},
	loadDayLog: function(){
		var file = path.join(rootFolder, `logs/${util.parseDateString('%m-%d-%y')}.json`);

		if(!fs.existsSync(file)) return log('no day log to load', file);

		try{
			dataLogger.data = JSON.parse(fsExtended.catSync(file));

			log('Loaded day log', dataLogger.data.labels.length, file);
		}
		catch(err){
			log.error(err);
		}
	}
};

dataLogger.loadDayLog();

parser.on('data', (data) => {
	data = data.toString();

	if(/^([0-9A-F]{16})\sC\s(\d+\.\d+)\sF\s(\d+\.\d+)/.test(data)){
		data = /^([0-9A-F]{16})\sC\s(\d+\.\d+)\sF\s(\d+\.\d+)/.exec(data);

		data = {
			id: data[1],
			timeStamp: new Date(),
			tempC: data[2],
			tempF: data[3]
		};

		log(1)(data);

		socketServer.broadcast('currentReading', { id: data.id, reading: `${data.tempF}F @ ${util.parseDateString('%H:%M:%S', new Date(data.timeStamp))}` });

		dataLogger.add(data.id, parseFloat(data.tempF).toFixed(1));
	}

	else log(data);
});

const stdin = process.openStdin();

app.use('/resources', staticServer(path.join(rootFolder, 'client/resources')));

app.use('/fonts', staticServer(path.join(rootFolder, 'client/fonts')));

app.get('/home', function(req, res, next){
	res.sendPage('simple');
});

socketServer.registerEndpoints({
	client_connect: function(){
		log('client_connect', dataLogger.data, dataLogger.readings);

		socketServer.broadcast('logData', dataLogger.data);

		Object.keys(dataLogger.readings).forEach((id) => { socketServer.broadcast('currentReading', { id, reading: dataLogger.readings[id][dataLogger.readings[id].length - 1] +'F' }); });
	}
});

stdin.addListener('data', function(data){
	var cmd = data.toString().trim();

	log(`CMD: ${cmd}`);

	if(cmd.startsWith('v ')){
		process.env.DBG = parseInt(cmd.replace('v ', ''));

		delete require.cache[require.resolve('log')];

		log = require('log');
	}
});

process.on('exit', function(){
	log.warn('Exiting!');

	dataLogger.saveDayLog();
});

process.on('SIGINT', function(){
	log.warn('Exiting via Ctrl + C');

	process.exit(130);
});

process.on('uncaughtException', function(err){
	log.error('Uncaught Exception', err.stack);

	process.exit(99);
});