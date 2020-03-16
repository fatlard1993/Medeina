#!/usr/bin/env node

const gpio = require('rpio');
const log = require('log');

const args = process.argv.slice(2);
const pin = args[0] ? Number(args[0]) : 12;// Physical pin number (not BCM)
const state = args[1] ? Number(args[1]) : 1;

log('Opening...', pin);

gpio.open(pin, gpio.OUTPUT, gpio.LOW);

log('Writing...', state);

gpio.write(pin, state ? gpio.HIGH : gpio.LOW);