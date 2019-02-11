const fs = require('fs');
const path = require('path');

const polka = require('polka');
const staticServer = require('serve-static');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const log = require('../commonJs/log');

const compilePage = require('./compilePage');

const fontsPath = path.join(__dirname, '../client/fonts');
const homeSlug = '/home';

const app = polka({
	onError: function(err, req, res, next){
		if(!err || !err.code){
			if(err instanceof Object) err.code = 500;

			else err = { err: err, code: 500 };
		}

		var detail = err.detail;
		var titles = {
			'401': '401 - Unauthorized',
			'403': '403 - Forbidden',
			'404': '404 - Not Found',
			'500': '500 - Internal Server Error'
		};

		if(!err.detail){
			try{ detail = JSON.stringify(err, null, '  '); }

			catch(e){
				log.error('Unknown error: ', e);

				detail = 'Unknown error';
			}
		}

		log.error()(`${req.originalUrl} | ${titles[err.code]}`);
		log.error(1)(err);

		if(err.redirectPath){
			log()(`Redirecting to: ${err.redirectPath}`);

			return res.redirect(307, err.redirectPath);
		}

		res.status(err.code).end(compilePage.compile('error', detail));
	}
});

app.use(function(req, res, next){
	log()(`\nReq Url - ${req.originalUrl}`);

	res.sendFile = function(path){
		log()(`Send file - ${path}`);

		fs.readFile(path, function(err, file){
			res.end(file);
		});
	};

	res.json = function(json){
		log()('Send JSON - ', json);

		res.writeHead(200, { 'Content-Type': 'application/json' });

		res.end(JSON.stringify(json));
	};

	res.redirect = function(code, path){
		log()(`${code} redirect - ${path}`);

		res.writeHead(code, { 'Location': path });

		res.end();
	};

	res.send = function(string){
		log()(`Send string - "${string}"`);

		res.end(string);
	};

	res.status = function(code){
		res.statusCode = code;

		return res;
	};

	next();
});

app.use(function redirectTrailingWak(req, res, next){
	var splitReqUrl = req.originalUrl.split('?');
	var reqSlug = splitReqUrl[0];

	if(reqSlug.slice(-1) !== '/') return next();
	reqSlug = reqSlug.slice(0, -1);

	var query = splitReqUrl[1];

	res.redirect(301, reqSlug ? (reqSlug + (query ? ('?'+ query) : '')) : homeSlug);
});

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser());

app.get('/testj', function(req, res){
	log()('Testing JSON...');

	res.json({ test: 1 });
});

app.get('/test', function(req, res){
	log()('Testing...');

	res.send('{ test: 1 }');
});

app.use('/fonts', staticServer(fontsPath));

app.get('/home', function(req, res){
	res.end(compilePage.compile('home'));
});

module.exports = {
	init: function(port){
		app.listen(port);

		return app.server;
	}
};