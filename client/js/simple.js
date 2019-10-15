// includes js-util dom log socket-client chart.js
// babel
/* global util dom log socketClient Chart */

// todo add preference editor dialog, preferences should be stored on the server

// todo get a list of available log files and set the second chart window to view it via: socketClient.reply('getLog', '10-13-19');

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
			data: {},
			options: {
				fill: false,
				responsive: true,
				maintainAspectRatio: false,
				title: {
					display: true,
					text: 'Todays Temps'
				},
				tooltips: {
					intersect: false,
					mode: 'index'
				},
				animation: {
					easing: 'easeOutCirc'
				}
			}
		});

		dashboard.oldChart = new Chart(dom.getElemById('chart2').getContext('2d'), {
			type: 'line',
			data: {},
			options: {
				fill: false,
				responsive: true,
				maintainAspectRatio: false,
				title: {
					display: true,
					text: 'Yesterdays Temps'
				},
				tooltips: {
					intersect: false,
					mode: 'index'
				},
				animation: {
					easing: 'easeOutCirc'
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

			data = dashboard.applyDatasetPreferences(data);

			dashboard.chart.data.labels = data.labels;
			dashboard.chart.data.datasets = data.datasets;

			dashboard.fitCharts();

			dashboard.chart.update();
		});

		socketClient.on('oldLogData', function(data){
			log()('socketClient oldLogData', data);

			data = dashboard.applyDatasetPreferences(data);

			dashboard.oldChart.data.labels = data.labels;
			dashboard.oldChart.data.datasets = data.datasets;

			dashboard.fitCharts();

			dashboard.oldChart.update();
		});

		socketClient.on('logUpdate', function(data){
			log()('socketClient logUpdate', data);

			dashboard.chart.data.labels.push(data.label);
			dashboard.chart.data.datasets.forEach((dataset) => {
				dataset.data.push(data.readings[dataset.id]);
			});

			dashboard.fitCharts();

			dashboard.chart.update();
		});

		socketClient.on('currentReading', function(reading){
			log(1)('socketClient currentReading', reading);

			dashboard.updateStatus({ id: reading.id, state: reading.reading });
		});

		dom.maintenance.init([dashboard.fitCharts]);
	},
	updateStatus: function(device){
		var status = dom.getElemById('status');

		if(!dashboard.statusElements[device.id]) dashboard.statusElements[device.id] = dom.createElem('div', { appendTo: status });

		dashboard.statusElements[device.id].textContent = `${dashboard.devicePreferences[device.id].label || device.id} : ${device.state}`;
	},
	fitCharts: function(){
		var chartCanvas = dom.getElemById('chart');
		var oldChartCanvas = dom.getElemById('chart2');
		var minWidth = dashboard.chart.data.labels.length * 15;
		var oldChartMinWidth = dashboard.oldChart.data.labels.length * 15;

		if(minWidth > document.body.clientWidth){
			chartCanvas.parentElement.style.width = minWidth +'px';
			chartCanvas.height = '300';
			chartCanvas.width = minWidth;
		}

		if(oldChartMinWidth > document.body.clientWidth){
			oldChartCanvas.parentElement.style.width = oldChartMinWidth +'px';
			oldChartCanvas.height = '300';
			oldChartCanvas.width = oldChartMinWidth;
		}
	},
	applyDatasetPreferences: function(data){
		data.datasets.forEach((dataset) => {
			var prefs = dashboard.devicePreferences[dataset.id];

			if(!prefs) prefs = dashboard.devicePreferences[dataset.id] = {};

			dataset.fill = false;
			dataset.label = prefs.label || dataset.id;
			dataset.borderColor = dataset.backgroundColor = prefs.color || util.stringToColor(dataset.label);
		});

		return data;
	}
};

dom.onLoad(dashboard.init);

document.oncontextmenu = function(evt){
	evt.preventDefault();
};