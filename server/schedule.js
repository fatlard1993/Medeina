const EventEmitter = require('events');

const log = require('log');

function gradientUnit(unit, unitScale, refMin, refMax, outMin, outMax){//only need to gradient the duration not the actual times
	var unitsPerOutput = (outMax - outMin) / unitScale;

	if(unit >= refMax) return outMax - ((unit - refMax) * unitsPerOutput);
	else return outMin + ((unit - refMin) * unitsPerOutput);
}

function convertNumberScale(input, inputLow, inputHigh, outputLow, outputHigh, clamp){
	if(clamp) input = Math.min(inputHigh, Math.max(inputLow, input));

	return (((input - inputLow) / (inputHigh - inputLow)) * (outputHigh - outputLow)) + outputLow;
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

class Schedule extends EventEmitter {
  constructor(settings){
		super();

		this.settings = settings;
	}

	cancel(){
		if(this.settings.reoccurring) clearInterval(this.timer);

		else clearTimeout(this.timer);
	}
}

module.exports = Schedule;