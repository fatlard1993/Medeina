// includes dom log
// babel
/* global dom log */

dom.onLoad(function onLoad(){
	const ws = new WebSocket(`ws://${location.host}/api`);

	ws.reply = function(type, payload){
		ws.send(JSON.stringify({ type, payload }));
	};

	ws.addEventListener('open', function(evt){
		// log('Websocket connection open: ', evt);

		ws.reply('test');
	});

	ws.addEventListener('message', function(evt){
		log('Message from server: ', evt.data);

		// var data = JSON.parse(evt.data);
	});

	dom.interact.on('pointerUp', function(evt){
		log(arguments);
	});
});