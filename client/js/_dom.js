// babel

var dom = {
	// onLoad: function(func){
	// 	console.log('test', func);

	// 	this.onLoader = func;

	// 	document.addEventListener('DOMContentLoaded', this.onLoaded);
	// },
	// onLoaded: function(){
	// 	if(this.loaded) return;

	// 	this.loaded = true;

	// 	this.onLoader();
	// },
	changeLocation: function(newLocation){
		window.location = window.location.protocol +'//'+ window.location.hostname +':'+ (window.location.port || 80) + newLocation;
	},
	localStorage: (function initLocalStorage(){
		var uid = new Date(), storage, result;

		try{
			(storage = window.localStorage).setItem(uid, uid);

			result = storage.getItem(uid) === uid;

			storage.removeItem(uid);

			return result && storage;
		}

		catch(e){
			console.error(e);
		}
	}()),
	storage: {
		get: function(prop){
			return dom.localStorage ? dom.localStorage.getItem(prop) : dom.cookie.get(prop);
		},
		set: function(prop, val){
			return dom.localStorage ? dom.localStorage.setItem(prop, val) : dom.cookie.set(prop, val);
		},
		delete: function(prop){
			return dom.localStorage ? dom.localStorage.removeItem(prop) : dom.cookie.delete(prop);
		}
	},
	createElem: function(node, settingsObj){
		var elem = document.createElement(node);

		if(settingsObj){
			var settingsNames = Object.keys(settingsObj), settingsCount = settingsNames.length;
      var settingName;
			var settingValue;

			for(var x = 0; x < settingsCount; ++x){
        settingName = settingsNames[x];
				settingValue = settingsObj[settingName];

        if(typeof this[settingName] === 'function'){
          if(Array.isArray(settingValue)) this[settingName].apply(this, [elem].concat(settingValue));

					else this[settingName](elem, settingValue);
				}

				else if(typeof elem[settingName] === 'function') elem[settingName](settingValue);

				else elem[settingName] = settingValue;
			}
		}

		return elem;
	},
	basicTextElem: function(options){
		return Object.assign({ type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off' }, options);
	},
	appendChildren: function(){
		var elem = Array.prototype.shift.apply(arguments);

		for(var x = 0; x < arguments.length; ++x){
			elem.appendChild(arguments[x]);
		}
	},
	appendTo: function(elem, parentElem){
		parentElem.appendChild(elem);
	},
	prependChild: function(elem, child){
		if(elem.firstChild) elem.insertBefore(child, elem.firstChild);

		else elem.appendChild(child);
	},
	isNodeList: function(nodes){
		var nodeCount = nodes.length;

		return typeof nodes === 'object' && (typeof nodeCount === 'number') &&
			/^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(nodes)) &&
			(nodeCount === 0 || (typeof nodes[0] === 'object' && nodes[0].nodeType > 0));
	},
	findAncestor: function(el, class_id){
		while((el = el.parentElement) && (class_id[0] === '#' ? '#'+ el.id !== class_id : !el.className.includes(class_id)));

		return el;
	},
	empty: function(elem){
		if(!elem || !elem.lastChild) return;

		while(elem.lastChild) elem.removeChild(elem.lastChild);

		return elem;
	},
	remove: function(elem_s){
		if(dom.isNodeList(elem_s)) elem_s = [].slice.call(elem_s);

		var elemCount = elem_s.length;

		if(elem_s && elemCount){
			elem_s = elem_s.slice(0);

			for(var x = 0, elem; x < elemCount; ++x){
				elem = elem_s[x];

				if(elem) elem.parentElement.removeChild(elem);
			}
		}

		else if(elem_s && elem_s.parentElement) elem_s.parentElement.removeChild(elem_s);
	},
	hide: function(elem, cb){
		dom.animation.add('write', function hide_write(){
			if(!elem.className.includes('disappear')) elem.className += ' disappear';

			if(cb) cb();
		});
	},
	discard: function(elem, className, cb){
		dom.animation.add('write', function discard_write(){
			elem.className += (elem.className.includes('discard') ? ' ' : ' discard ') + (className || '');

			setTimeout(function discard_TO(){
				dom.hide(elem, cb);
			}, 200);
		});
	},
	show: function(elem, className, cb){
		dom.animation.add('write', function show_write(){
			elem.className = className || elem.className.replace(/\s?(disappear|discard)/g, '');

			if(cb) cb();
		});
	},
	setTransform: function(elem, value){
		dom.animation.add('write', function setTransform_write(){
			elem.style.transform = elem.style.webkitTransform = elem.style.MozTransform = elem.style.msTransform = elem.style.OTransform = value;
		});
	},
	setTitle: function(title){
		dom.animation.add('read', function setTitle_read(){
			dom.Title_p1 = dom.Title_p1 || document.getElementsByName('apple-mobile-web-app-title')[0];
			dom.Title_p2 = dom.Title_p2 || document.getElementsByName('application-name')[0];
			dom.Title_p3 = dom.Title_p3 || document.getElementsByName('msapplication-tooltip')[0];

			dom.animation.add('write', function setTitle_write(){
				document.title = dom.Title_p1.content = dom.Title_p2.content = dom.Title_p3.content = title;
			});
		});
	},
	getScrollbarSize: function(){
		if(dom.scrollbarSize) return dom.scrollbarSize;

		var scrollbarDiv = dom.createElem('div', { id: 'scrollbarDiv' });

		// scrollbarDiv.setAttribute('style',
		//	 'position: absolute;' +
		//	 'top: -999;' +
		//	 'width: 100px;' +
		//	 'height: 100px;' +
		//	 'overflow: scroll;'
		// );

		document.body.appendChild(scrollbarDiv);

		dom.scrollbarSize = scrollbarDiv.offsetWidth - scrollbarDiv.clientWidth;

		dom.remove(scrollbarDiv);

		return dom.scrollbarSize;
	},
	validate: function(elem, force){
		if(!elem) return;

		if(force || elem.validation) elem.className = elem.className.replace(/\s?validated|\s?invalid/g, '');

		var valid, validationWarning = '';

		if(force) valid = 'validated';

		else if(elem.validation){
			if(elem.validation instanceof Array){
				for(var x = 0; x < elem.validation.length; ++x){
					if(valid !== 'invalid') valid = dom.checkValid(elem.value, elem.validation[x]);

					if(elem.validationWarning[x] && valid === 'invalid') validationWarning += (validationWarning.length ? '\n' : '') + elem.validationWarning[x];
				}
			}

			else{
				valid = dom.checkValid(elem.value, elem.validation);

				if(elem.validationWarning && valid === 'invalid') validationWarning = elem.validationWarning;
			}
		}

		elem.className += ' '+ valid;

		return validationWarning;
	},
	checkValid: function(string, regex){
		if(new RegExp(regex).test(string)) return 'validated';

		else return 'invalid';
	},
	showValidationWarnings: function(parentElement){
		var invalidElements = parentElement.getElementsByClassName('invalid');

		if(!invalidElements.length) return;

		var showingWarnings = false;

		dom.remove(parentElement.getElementsByClassName('validationWarning'));

		for(var x = 0; x < invalidElements.length; ++x){
			var validationWarning = dom.validate(invalidElements[x]);

			if(validationWarning){
				showingWarnings = true;

				invalidElements[x].parentElement.insertBefore(dom.createElem('p', { className: 'validationWarning', textContent: validationWarning }), invalidElements[x]);
			}
		}

		if(!showingWarnings){
			var defaultWarning = dom.createElem('p', { className: 'validationWarning', textContent: 'There are fields which require your attention!' });

			dom.prependChild(parentElement, defaultWarning);
		}

		return showingWarnings;
	},
	getScreenOrientation: function(){
		var orientation = 'primary';

		if(window.screen && window.screen.orientation && window.screen.orientation.type) orientation = window.screen.orientation.type;
		else if(typeof window.orientation !== 'undefined') orientation = Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';

		return orientation;
	},
	location: {
		hash: {
			get: function(){
				return location.hash.slice(1);
			},
			set: function(hash){
				if(history.pushState) return history.pushState(null, '', '#'+ hash);

				location.hash = '#'+ hash;
			},
		},
		query: {
			parse: function(){
				var queryObj = {};

				if(!location.search.length) return queryObj;

				var queryString = location.search.slice(1), urlVariables = queryString.split('&');

				for(var x = 0; x < urlVariables.length; ++x){
					var splitVar = urlVariables[x].split('='), key = splitVar[0], value = splitVar[1];

					queryObj[decodeURIComponent(key)] = decodeURIComponent(value);
				}

				return queryObj;
			},
			get: function(param){
				return dom.location.query.parse()[param];
			},
			set: function(){
				var obj = {};

				if(typeof arguments[0] === 'object') obj = arguments[0];

				else obj[arguments[0]] = arguments[1];

				obj = Object.assign(dom.location.query.parse(), obj);

				var query = '?'+ Object.keys(obj).reduce(function(a, k){ a.push(k +'='+ encodeURIComponent(obj[k])); return a; }, []).join('&');

				history.replaceState(null, query, query);
			}
		}
	},
	cookie: {
		get: function(cookieName){
			var cookieArr = document.cookie.split(/;\s?/g), cookieCount = cookieArr.length, cookie, x;

			for(x = 0; x < cookieCount; ++x){
				cookie = cookieArr[x];

				if(cookie.startsWith(cookieName +'=')) return cookie.replace(cookieName +'=', '');
			}

			return undefined;
		},
		set: function(cookieName, cookieValue, expHours){
			var cookie = cookieName +'='+ cookieValue;

			if(expHours){
				var date = new Date();

				date.setTime(date.getTime() + ((expHours || 1) * 60 * 60 * 1000));

				cookie += '; expires='+ date.toUTCString();
			}

			document.cookie = cookie +';';
		},
		delete: function(name){
			document.cookie = name +'=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		}
	},
	animation: {
		scheduled: false,
		read_tasks: [],
		write_tasks: [],
		add: function(read_write, task, context/*, arguments*/){
			if(context){
				if(arguments.length > 3){
					var args = Array.prototype.slice.call(arguments, 3);

					args.unshift(context);

					//Log()('animation', 'applying args', args);

					task = task.bind.apply(task, args);
				}
				else task = task.bind(context);
			}

			dom.animation[read_write +'_tasks'].push(task);

			//Log()('animation', 'add animation', read_write, dom.animation.read_tasks.length, dom.animation.write_tasks.length);

			dom.animation.schedule();

			return task;
		},
		replace: function(read_write, task, context/*, arguments*/){
			if(dom.animation[read_write +'_tasks'].includes(task)){
				if(context) task = task.bind(context);

				//Log()('animation', 'replace animation');

				dom.animation[read_write +'_tasks'][dom.animation[read_write +'_tasks'].indexOf(task)] = task;
			}
			else dom.animation.add(read_write, task, context);
		},
		runner: function(){
			try{
				if(dom.animation.read_tasks.length){
					//Log()('animation', 'running reads', dom.animation.read_tasks.length);
					dom.funcRunner(dom.animation.read_tasks, 1);
				}
				if(dom.animation.write_tasks.length){
					//Log()('animation', 'running writes', dom.animation.write_tasks.length);
					dom.funcRunner(dom.animation.write_tasks, 1);
				}
			}

			catch(err){
				console.error()('dom.animation.runner encountered an error!', err);
			}

			dom.animation.scheduled = false;

			if(dom.animation.read_tasks.length || dom.animation.write_tasks.length) dom.animation.schedule();
		},
		schedule: function(){
			if(dom.animation.scheduled) return;
			dom.animation.scheduled = true;

			(window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(cb) { return setTimeout(cb, 16); })(dom.animation.runner);
		}
	},
	maintenance: {
		functions: [],
		init: function(initialMaintenance){
			if(initialMaintenance) dom.maintenance.functions = dom.maintenance.functions.concat(initialMaintenance);

			dom.maintenance.runner = dom.funcRunner.bind(null, dom.maintenance.functions);

			window.addEventListener('resize', function windowResize(){
				if(dom.maintenance.resizeTO){
					clearTimeout(dom.maintenance.resizeTO);
					dom.maintenance.resizeTO = null;
				}

				dom.maintenance.resizeTO = setTimeout(dom.maintenance.run, 300);
			});

			dom.maintenance.run();
		},
		run: function(){
			dom.animation.add('read', function runMaintenance(){
				dom.availableHeight = document.body.clientHeight;
				dom.availableWidth = document.body.clientWidth;

				dom.animation.add('write', dom.maintenance.runner);
			});
		}
	},
	funcRunner: function(arr, destructive){
		if(!destructive) arr = arr.slice(0);

		var task;

		while((task = arr.shift())) task();
	}
};