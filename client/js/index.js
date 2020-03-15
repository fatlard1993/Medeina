// includes dom log socket-client js-util
// babel
/* global dom log socketClient util */

socketClient.stayConnected = function(){
	if(socketClient.status === 'open') return;

	var reload = 'soft';

	if(reload === 'soft' && dom.triedSoftReload) reload = 'hard';

	log()(`Reload: ${reload}`);

	if(reload === 'hard') return window.location.reload(false);

	socketClient.reconnect();

	dom.triedSoftReload = true;

	dom.resetSoftReset_TO = setTimeout(function(){ dom.triedSoftReload = false; }, 4000);
};

const controller = {
	load: function(){
		socketClient.init();

		dom.mobile.detect();

		socketClient.on('state', (state) => {
			log()('state', state);

			this.state = Object.create(state);

			this.updateUI.bind(this)();
		});

		socketClient.on('close', function(evt){
			log()('socketClient close', { 1005: 'force', 1006: 'lost server' }[evt.code]);
			log(1)(evt);

			if(evt.code !== 1005) socketClient.reconnect();
		});

		socketClient.on('error', (err) => {
			log.error()('socketClient error', err);

			// socketClient.reconnect();
		});

		dom.interact.on('pointerDown', socketClient.stayConnected);

		dom.interact.on('pointerUp', this.onPointerUp.bind(this));

		dom.interact.on('keyUp', this.onKeyUp.bind(this));

		document.addEventListener('visibilitychange', () => {
			if(document.visibilityState) socketClient.stayConnected();
		});
	},
	onPointerUp: function(evt){
		log()(evt);

		if(evt.target === this.solenoidOverride){
			evt.stop();

			this.state.solenoid = !this.state.solenoid;

			socketClient.reply('solenoid', this.state.solenoid ? 'open' : 'close');
		}
	},
	onKeyUp: function(evt){
		log()(evt);
	},
	updateUI: function(){
		log()('updateUI');
	}
};

dom.onLoad(controller.load.bind(controller));

document.oncontextmenu = (evt) => { evt.preventDefault();	};