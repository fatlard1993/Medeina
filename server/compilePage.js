const path = require('path');

const sass = require('node-sass');

const fsExtended = require('./fsExtended');

const log = require('../commonJs/log');

//todo support babel
//todo cache rendered scss, invalidate on source and any includes
//todo support css autoprefixer
//todo try out uglifying before caching
//todo try modified stamp for determining if something has changed. Maybe its quicker?

const compilePage = {
	headPath: path.join(__dirname, '../client/html/head.html'),
	includesText: '// includes ',
	cache: {},
	pages: {},
	compile: function(name, dynamicContent){
		var start = new Date().getTime();

		this.readCacheFile(this.headPath);

		var htmlPath = path.join(__dirname, `../client/html/${name}.html`);

		this.readCacheFile(htmlPath);

		if(!this.pages[name]){
			this.pages[name] = {
				html: htmlPath,
				files: []
			};
		}

		this.generateIncludesHTML(name);
		this.generateFullHTML(name);

		log(`Time to compile "${name}": ${new Date().getTime() - start}ms`);

		return dynamicContent ? this.pages[name].fullHTML.replace('YYY', dynamicContent) : this.pages[name].fullHTML;
	},
	readCacheFile: function(path){
		if(!process.env.DEV && this.cache[path]) return this.cache[path].text;

		var fileText = fsExtended.catSync(path);
		var fileHash = fsExtended.checksum(fileText);

		if(!this.cache[path] || this.cache[path].hash !== fileHash){
			this.cache[path] = this.cache[path] || {};

			this.cache[path].hash = fileHash;
			this.cache[path].text = fileText;

			log(`Cached ${path}`);
		}

		return this.cache[path].text;
	},
	readIncludes: function(text){
		var includes = /(.*)\n/.exec(text)[1];

		return includes.startsWith(this.includesText) ? includes.substring(12).split(' ') : null;
	},
	generateFullHTML: function(name){
		this.pages[name].fullHTML = this.readCacheFile(this.headPath).replace('XXX', name) + (this.pages[name].includes ? this.pages[name].includes : '') +'\n</head><body>'+ this.readCacheFile(this.pages[name].html).replace(this.pages[name].includes ? /.*\n/ : '', '') +'\n</body></html>';
	},
	generateIncludesHTML: function(name){
		var includes = this.readIncludes(this.readCacheFile(this.pages[name].html));

		if(!includes) return;

		var _selfIndex = includes.indexOf('_self');

		if(_selfIndex >= 0){
			includes.splice(_selfIndex, 1);
			includes.push(`${name}.js`, `${name}.css`);
		}

		var includesHTML = '', fileName, fileExtension, subIncludes, file;

		for(var x = 0, count = includes.length; x < count; ++x){
			fileName = includes[x];

			if(!fileName) continue;

			fileExtension = /^.*\.([^\\]+)$/.exec(fileName)[1];

			if(fileExtension === 'js'){
				file = this.readCacheFile(path.join(__dirname, '../client/js', fileName));
				subIncludes = this.readIncludes(file);

				includesHTML += '\n\t\t<script>';
			}

			else{
				try{
					file = sass.renderSync({
						file: path.join(__dirname, '../client/scss', fileName.replace('css', 'scss'))
					});

					file = file.css;
				}

				catch(err){
					log.error('Error rendering SCSS: ', err);
				}

				includesHTML += '\n\t\t<style>';
			}

			if(subIncludes){
				for(var y = 0, yCount = subIncludes.length; y < yCount; ++y){
					includesHTML += '\n'+ this.readCacheFile(path.join(__dirname, `../client/${fileExtension}`, ({ '.': 1, '/': 1 }[subIncludes[y][0]] ? '' : '_') + subIncludes[y] +`.${fileExtension}`));
				}

				subIncludes = null;
			}

			includesHTML += file +'</'+ (fileExtension === 'js' ? 'script>' : 'style>');
		}

		this.pages[name].includes = includesHTML;
	}
};

module.exports = compilePage;