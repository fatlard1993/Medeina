/* global Dom */

var log, logHelp = {
	DBG: 0,
	colorMap: {
		reset: '\x1b[0m',
		info: '\x1b[34m',
		warn: '\x1b[33m',
		error: '\x1b[31m'
	}
};

logHelp._noop = function _noop(){};

logHelp._consoleWrap = function _consoleWrap(method){
	return function _log(verbosity){
		if((verbosity || 0) < logHelp.DBG && console && console[method]){
			if(logHelp.isNode){
				return function _colorLog(){
					if(logHelp.mapColors && logHelp.colorMap[method]){
						Array.prototype.unshift.call(arguments, logHelp.colorMap[method]);
						Array.prototype.push.call(arguments, logHelp.colorMap.reset);
					}
					else if(method === 'error') Array.prototype.unshift.call(arguments, method);

					console[method].apply(null, arguments);
				};
			}
			return console[method].bind(console);
		}

		else return logHelp._noop;
	};
};

if(typeof Proxy === 'function') log = new Proxy(logHelp._consoleWrap('log'), { get(target, method){ return logHelp._consoleWrap(method); } });

else{
	log = logHelp._consoleWrap('log');
	log.warn = logHelp._consoleWrap('warn');
	log.error = logHelp._consoleWrap('error');

	log.warn('Enabled limited non ES6 support, only log(v)(args), log.warn(v)(args) and log.error(v)(args) are available');
}

if(typeof window !== 'undefined'){
	if(typeof Dom !== 'undefined'){
		logHelp.DBG = (parseInt(Dom.location.query.get('DBG')) || 0);

		if(Dom.storage.get('DBG') && !logHelp.DBG) logHelp.DBG = parseInt(Dom.storage.get('DBG'));

		Dom.storage.set('DBG', logHelp.DBG);
	}
}

else{
	module.exports = log;

	logHelp.isNode = true;
	logHelp.mapColors = process.env.COLOR;
	if(process.env.DBG) logHelp.DBG = process.env.DBG;
}

log()('log verbosity set to: '+ logHelp.DBG);