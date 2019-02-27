// includes dom log socket-client notify menu prompt
// babel
/* global dom log socketClient notify menu prompt */

dom.onLoad(function onLoad(){
	notify.init();

	menu.init();

	prompt.init();

	socketClient.init();

	socketClient.on('open', function(evt){
		log('socketClient open', evt);

		socketClient.reply('type', 'payload');
	});

	socketClient.on('error', function(evt){
		log('socketClient error', evt);
	});

	socketClient.on('message', function(evt){
		log('socketClient message', evt);
	});

	socketClient.on('close', function(evt){
		log('socketClient close', evt);

		socketClient.reconnect();
	});

	dom.interact.on('pointerUp', function(evt){
		log('interact pointerUp', evt);

		socketClient.reply('pointerUp', { test: 1, get thing(){ return 2; }});

		notify('test', 'test');
	});

	menu.list.main = ['test', 'test2:~:red'];

	menu.handleSelection = function(){
		log(arguments);

		prompt.err('test err');
	};
});