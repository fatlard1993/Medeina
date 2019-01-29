const Fs = require('fs');
const Path = require('path');

const Log = require(Path.join(__dirname, '..', process.env.DIST ? '' : '../../swiss-army-knife/js', '_log'));

const Config = module.exports = {
	load: function(settings, error, done){
		Config.default = settings.default || {};

		Config.path = Path.join(settings.path || __dirname, 'config.json');

		Fs.readFile(Config.path, function(err, data){
			if(err && err.code === 'ENOENT') Log()(`No config file available at ${Config.path}`);

			else if(err) Log.warn()('Error reading config file', err);

			try{ Config.loaded = JSON.parse(data); }

			catch(e){
				Log()('Failed to parse config .. Replacing with default');
				Log.error(2)(e);

				Config.loaded = Config.default;
			}

			Log(1)(`Loaded config ${settings.path}`);
			Log(2)(Config.loaded);

			if(done) done(Config.loaded);
		});
	},
	save: function(config, error, done){
		if(!config) return error({ detail: 'Missing config' });
		if(!Config.path) return error({ detail: 'Missing config path' });

		config = JSON.stringify(config, null, '  ', 2);

		Fs.writeFile(Config.path, config, function(err){
			if(err) return error({ err: err, detail: 'Error writing to config' });

			Log(1)(`Saved config ${Config.path}`);
			Log(2)(config);

			if(done) done(config);
		});
	}
};