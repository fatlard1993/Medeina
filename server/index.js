const Slave = require('./slave');

const stdin = process.openStdin();

// lara's temp and humidity requirements
// 87-90 temp high side
// 74-80 temp low side
// 70-75 temp night
// 30-40% humidity

function schedule(task, hour, min = 0, daysAway = 0){
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

	console.log(`Task scheduled for ${hour}:${min >= 10 ? '' :'0'}${min} (${daysAway ? daysAway +' days ' : ''}${hours ? hours +' and hours ' : ''}${minutes ? minutes +' and minutes' : ''} in the future)`);

	return setTimeout(() => { task(task); }, ms);
}

function scheduleReoccurring(task, minutes, hours = 0){
	console.log(`Task scheduled for every ${hours ? hours +' hours and ' : ''}${minutes} minutes in the future`);

	return setInterval(task, (hours * 6e6) + (minutes * 6e4));
}

function fahrenheit(celsius){ return parseFloat(((parseFloat(celsius) * 1.8) + 32).toFixed(1)); }

const settings = {
	lara: {
		maxTempCoolSide: 80,
		minTempCoolSide: 74,
		maxTempHotSide: 90,
		minTempHotSide: 87
	},
	office: {
		maxTemp: 73,
		minTemp: 71
	},
	temp_office: {
		average: 6,
		formatter: fahrenheit
	},
	humidity_office: {
		average: 6
	},
	temp_lara_cool_side: {
		average: 6,
		calibration: 1,
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

var slave = new Slave('slave1', settings);

scheduleReoccurring(() => {
	var hubPaths = Object.keys(slave.hubs);

	hubPaths.forEach(function(hubPath){
		slave.hubs[hubPath].send('getStates');
	});
}, 5);

slave.on('state', (hub, thing) => {
	if(thing.name === 'temp_office'){
		if(thing.state > settings.office.maxTemp && hub.things.green.state){
			hub.send('green 0');

			console.log('office heat off | temp: ', thing.state);
		}

		else if(thing.state < settings.office.minTemp && !hub.things.green.state){
			hub.send('green 1');

			console.log('office heat on | temp: ', thing.state);
		}
	}

	else if(thing.name === 'temp_lara_cool_side'){
		if(thing.state > settings.lara.maxTempCoolSide && !hub.things.fan.state){
			hub.send('fan 1');

			console.log('lara fan on | temp: ', thing.state);
		}

		else if(thing.state < settings.lara.minTempCoolSide && hub.things.fan.state){
			hub.send('fan 0');

			console.log('lara fan off | temp: ', thing.state);
		}
	}

	else if(thing.name === 'temp_lara_hot_side'){
		if(thing.state > settings.lara.maxTempHotSide && hub.things.brown.state){
			hub.send('brown 0');

			console.log('lara heat off | temp: ', thing.state);
		}

		else if(thing.state < settings.lara.minTempHotSide && !hub.things.brown.state){
			hub.send('brown 1');

			console.log('lara heat on | temp: ', thing.state);
		}
	}
});

stdin.addListener('data', function(data){
	var cmd = data.toString().trim();

	console.log(`CMD: ${cmd}`);

	if(cmd.startsWith('send')){
		cmd = cmd.replace('send ', '');

		console.log(cmd);

		slave.hubs[Object.keys(slave.hubs)[0]].send(cmd);
	}

	else if(cmd === 't'){
		var hubPaths = Object.keys(slave.hubs);

		hubPaths.forEach(function(hubPath){
			var thingNames = Object.keys(slave.hubs[hubPath].things);

			thingNames.forEach(function(thingName){
				var thing = slave.hubs[hubPath].things[thingName];

				console.log(thing.name, thing.state);
			});
		});
	}

	else if(cmd === 'things'){
		console.log(slave.hubs[Object.keys(slave.hubs)[0]].things);
	}

	else if(cmd === 's'){
		console.log(settings);
	}
});