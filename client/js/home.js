// includes dom log socketClient
// babel
/* global dom log socketClient */

dom.onLoad(function onLoad(){
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
	});
});