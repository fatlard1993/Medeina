// includes dom log socket-client menu dialog chart.js js-util
// babel
/* global dom log socketClient menu dialog Chart util */

const dashboard = {
	statusElements: {},
	devicePreferences: {
		'282C999632140161': {
			label: 'Cool Side',
			color: 'hsl(29, 55%, 45%)'
		},
		'2815B025331401A3': {
			label: 'Hot Side',
			color: 'hsl(359, 55%, 45%)'
		}
	},
	init: function(){
		dashboard.chart = new Chart(dom.getElemById('chart').getContext('2d'), {
			type: 'line',
			options: {
				fill: false,
				responsive: true,
				maintainAspectRatio: false,
				tooltips: {
					intersect: false,
					mode: 'index'
				}
			}
		});

		socketClient.init();

		socketClient.on('open', function(evt){
			log()('socketClient open', evt);
		});

		socketClient.on('error', function(evt){
			log.error()('socketClient error', evt);
		});

		socketClient.on('close', function(evt){
			log()('socketClient close', evt);

			socketClient.reconnect();
		});

		socketClient.on('logData', function(data){
			log()('socketClient logData', data);

			data.datasets.forEach((dataset) => {
				var prefs = dashboard.devicePreferences[dataset.id];

				if(!prefs) prefs = dashboard.devicePreferences[dataset.id] = {};

				dataset.fill = false;
				dataset.label = prefs.label || dataset.id;
				dataset.borderColor = dataset.backgroundColor = prefs.color || util.stringToColor(dataset.label);
			});

			dashboard.chart.data.labels = data.labels;
			dashboard.chart.data.datasets = data.datasets;

			dashboard.fitChart();

			dashboard.chart.update();
		});

		socketClient.on('logUpdate', function(data){
			log()('socketClient logUpdate', data);

			dashboard.chart.data.labels.push(data.label);
			dashboard.chart.data.datasets.forEach((dataset) => {
				dataset.data.push(data.readings[dataset.id]);
			});

			dashboard.fitChart();

			dashboard.chart.update();
		});

		socketClient.on('currentReading', function(reading){
			log(1)('socketClient currentReading', reading);

			dashboard.updateStatus({ id: reading.id, state: reading.reading });
		});

		// menu.init({
		// 	main: ['test', 'test2:~:red']
		// }, { discardDirection: 'static' });

		// dom.interact.on('pointerUp', function(evt){
		// 	log()('interact pointerUp', evt);

		// 	if(evt.pointerType === 'mouse' && evt.which === 3){
		// 		menu.open('main');

		// 		menu.elem.style.top = (evt.clientY >= document.body.clientHeight - menu.elem.clientHeight ? evt.clientY - menu.elem.clientHeight : evt.clientY) +'px';
		// 		menu.elem.style.left = (evt.clientX >= document.body.clientWidth - menu.elem.clientWidth ? evt.clientX - menu.elem.clientWidth : evt.clientX) +'px';
		// 	}

		// 	else if(menu.isOpen) menu.close();
		// });

		// menu.on('selection', function(evt){
		// 	log(this.isOpen, evt);

		// 	dialog.err('test err');
		// });
	},
	updateStatus: function(device){
		var status = dom.getElemById('status');

		if(!dashboard.statusElements[device.id]) dashboard.statusElements[device.id] = dom.createElem('div', { appendTo: status });

		dashboard.statusElements[device.id].textContent = `${dashboard.devicePreferences[device.id].label || device.id} : ${device.state}`;
	},
	fitChart: function(){
		var minWidth = dashboard.chart.data.labels.length * 15;

		if(minWidth > document.body.clientWidth){
			dom.getElemById('chartContainer').style.width = minWidth +'px';
			dashboard.chart.chart.canvas.width = minWidth;
		}
	}
};

dom.onLoad(dashboard.init);

document.oncontextmenu = function(evt){
	evt.preventDefault();
};