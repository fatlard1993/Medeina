const EventEmitter = require('events');

const log = require('log');

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