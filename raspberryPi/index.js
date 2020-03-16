#!/usr/bin/env node

const yargs = require('yargs');
const rootFolder = require('find-root')(__dirname);

yargs.version(false);

yargs.alias({
	h: 'help',
	v: 'verbosity',
	p: 'port',
	f: 'frequency'
});

yargs.boolean(['h']);

yargs.default({
	v: 1,
	p: 80,
	f: 500,
	min: 76,
	max: 86,
	web: true
});

yargs.describe({
	h: 'This',
	v: '<level>',
	p: '<port>',
	f: '<frequency> - Update frequency in ms - def :: 500'
});

var opts = yargs.argv;

delete opts._;
delete opts.$0;
delete opts.v;
delete opts.p;
delete opts.f;

opts.verbosity = Number(opts.verbosity);
opts.rootFolder = rootFolder;

//log args polyfill
process.env.DBG = opts.verbosity;
process.env.COLOR = true;

const log = require('log');

log(1)(opts);

const system = require('./system');

system.init(opts);

process.openStdin().addListener('data', function(data){
	data = data.toString().replace(/\n+$/, '');

	log.info(`STDIN: ${data}`);

	if(data === 'stop') process.exit(130);

	else if(data === 'heat on') system.heatPanel.on();
	else if(data === 'heat off') system.heatPanel.off();

	else if(data === 'lights on') system.lights.on();
	else if(data === 'lights off') system.lights.off();
});

process.on('exit', system.exit);

process.on('SIGINT', () => {
	log.warn('Exiting via Ctrl + C');

	process.exit(130);
});

process.on('uncaughtException', (err) => {
	log.error('Uncaught Exception', err.stack);

	process.exit(99);
});