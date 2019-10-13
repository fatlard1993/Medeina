// includes dom log socket-client menu dialog chartjs js-util
// babel
/* global dom log socketClient menu dialog Chart util */

dom.onLoad(function onLoad(){
	menu.init({
		main: ['test', 'test2:~:red']
	}, { discardDirection: 'static' });

	socketClient.init();

	socketClient.on('error', function(evt){
		log()('socketClient error', evt);
	});

	socketClient.on('close', function(evt){
		log()('socketClient close', evt);

		socketClient.reconnect();
	});

	var statusElements = {};
	// var chartOptions = {
	// 	plugins: [
	// 		Chartist.plugins.legend({
	// 			legendNames: [],
	// 		})
	// 	]
	// };
	// var chart = new Chartist.Line('#chart', {}, chartOptions);

	var chartContext = document.getElementById('chart').getContext('2d');
	var chart = new Chart(chartContext, {
			type: 'line',
			options: {
				fill: false
			}
	});

	function addStatusElem(thing){
		var status = dom.getElemById('status');

		if(!statusElements[thing.id]) statusElements[thing.id] = dom.createElem('div', { appendTo: status });

		statusElements[thing.id].textContent = `${thing.id} : ${thing.state}`;
	}

	socketClient.on('logData', function(data){
		log()('socketClient logData', data);

		chart.data.labels = data.labels;
    chart.data.datasets = data.datasets;
    chart.update();

		// dom.getElemById('chart').style.width = 60 + (data.labels.length * 60) +'px';

		// chart.update(data, {
		// 	fullWidth: true,
		// 	chartPadding: {
		// 		right: 40
		// 	},
		// 	plugins: [
		// 		Chartist.plugins.legend({
		// 			legendNames: ['1', '2'],
		// 		})
		// 	]
		// });
	});

	socketClient.on('currentReading', function(reading){
		log(1)('socketClient currentReading', reading);

		addStatusElem({ id: reading.id, state: reading.reading });
	});

	dom.interact.on('pointerUp', function(evt){
		log()('interact pointerUp', evt);

		if(evt.pointerType === 'mouse' && evt.which === 3){
			menu.open('main');

			menu.elem.style.top = (evt.clientY >= document.body.clientHeight - menu.elem.clientHeight ? evt.clientY - menu.elem.clientHeight : evt.clientY) +'px';
			menu.elem.style.left = (evt.clientX >= document.body.clientWidth - menu.elem.clientWidth ? evt.clientX - menu.elem.clientWidth : evt.clientX) +'px';
		}

		else if(menu.isOpen) menu.close();
	});

	menu.on('selection', function(evt){
		log(this.isOpen, evt);

		dialog.err('test err');
	});
});

document.oncontextmenu = function(evt){
	evt.preventDefault();
};