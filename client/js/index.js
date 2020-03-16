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

		var wrapper = dom.getElemById('wrapper');

		this.hotTemp = dom.createElem('div', { appendTo: wrapper });
		this.coolTemp = dom.createElem('div', { appendTo: wrapper });
		this.lights = dom.createElem('div', { appendTo: wrapper });
		this.heat = dom.createElem('div', { appendTo: wrapper });
		this.lightsOverride = dom.createElem('button', { textContent: 'Lights Override', appendTo: wrapper });
		this.heatOverride = dom.createElem('button', { textContent: 'Heat Override', appendTo: wrapper });

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

		if(evt.target === this.lightsOverride){
			evt.stop();

			this.state.lights = !this.state.lights;

			socketClient.reply('lights', this.state.lights ? 'on' : 'off');
		}

		else if(evt.target === this.heatOverride){
			evt.stop();

			this.state.heat = !this.state.heat;

			socketClient.reply('heat', this.state.heat ? 'on' : 'off');
		}
	},
	onKeyUp: function(evt){
		log()(evt);
	},
	updateUI: function(){
		log()('updateUI');

		this.hotTemp.textContent = `Hot: ${this.state.hot}C`;
		this.coolTemp.textContent = `Cool: ${this.state.cool}C`;
		this.heat.textContent = `Heat: ${this.state.heatPanel.toUpperCase()}`;
		this.lights.textContent = `Lights: ${this.state.lights.toUpperCase()}`;

		this.lightsOverride.classList[this.state.lights === 'on' ? 'add' : 'remove']('pressed');
		this.heatOverride.classList[this.state.heatPanel === 'on' ? 'add' : 'remove']('pressed');
	}
};

dom.onLoad(controller.load.bind(controller));

document.oncontextmenu = (evt) => { evt.preventDefault();	};