// includes dom log socket-client notify menu dialog
// babel
/* global dom log socketClient notify menu dialog */

dom.onLoad(function onLoad(){
	menu.init({
		main: ['test', 'test2:~:red']
	});

	notify.init();

	socketClient.init();

	socketClient.on('error', function(evt){
		log('socketClient error', evt);
	});

	socketClient.on('close', function(evt){
		log('socketClient close', evt);

		socketClient.reconnect();
	});

	var statusElements = {};

	function addStatusElem(thing){
		var status = dom.getElemById('status');

		if(!statusElements[thing.name]) statusElements[thing.name] = dom.createElem('div', { appendTo: status });

		statusElements[thing.name].textContent = `${thing.name} : ${thing.state}`;
	}

	socketClient.on('currentStatus', function(things){
		log('socketClient currentStatus', things);

		for(var x = 0, arr = Object.keys(things), count = arr.length; x < count; ++x) addStatusElem({ name: arr[x], state: things[arr[x]] });
	});

	socketClient.on('update', function(thing){
		log('socketClient update', thing);

		addStatusElem(thing);
	});


	dom.interact.on('pointerUp', function(evt){
		log('interact pointerUp', evt);
	});

	dom.interact.on('contextMenu', function(evt){
		log('contextMenu', evt.target);

		menu.open('main');

		menu.elem.style.top = (evt.clientY >= document.body.clientHeight - menu.elem.clientHeight ? evt.clientY - menu.elem.clientHeight : evt.clientY) +'px';
		menu.elem.style.left = (evt.clientX >= document.body.clientWidth - menu.elem.clientWidth ? evt.clientX - menu.elem.clientWidth : evt.clientX) +'px';
	});

	menu.on('selection', function(evt){
		log(this.isOpen, evt);

		dialog.err('test err');
	});
});