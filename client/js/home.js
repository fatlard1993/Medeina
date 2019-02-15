// includes dom ../../../node_modules/log/src/index.js
// babel
/* global dom log */

if(typeof dom === 'undefined') throw new Error('dom is undefined');
if(typeof log === 'undefined') throw new Error('log is undefined');

dom.onLoad(function onLoad(){
	const ws = new WebSocket('ws://'+ location.host +'/api');

	ws.reply = function(type, payload){
		ws.send(JSON.stringify({ type, payload }));
	};

	ws.addEventListener('open', function(evt){
		// console.log('Websocket connection open: ', evt);

		ws.reply('test');
	});

	ws.addEventListener('message', function(evt){
		console.log('Message from server: ', evt.data);

		// var data = JSON.parse(evt.data);
	});

	function onPointerUp(evt){
		// console.log('onPointerUp', evt);

		if(evt.target.id === 'content'){
			ws.reply('test');
		}
	}

	document.addEventListener('click', onPointerUp);
	document.addEventListener('touchend', onPointerUp);
});