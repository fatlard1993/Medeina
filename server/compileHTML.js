const fs = require('fs');
const path = require('path');

const del = require('del');

const util = require('../commonJs/util');
const fsExtended = require('../server/fsExtended');

function generateIncludes(name, includes){
	if(includes.includes('_self')){
		includes.splice(includes.indexOf('_self'), 1);
		includes.push(`${name}.js`, `${name}.css`);
	}

	var includesHTML = '', includeHTML_part;

	for(var x = 0, count = includes.length; x < count; ++x){
		includeHTML_part = includes[x].endsWith('.js') ? `<script src="/js/${includes[x]}"></script>` : `<link rel="stylesheet" href="/css/${includes[x]}">`;
		includesHTML += `\n\t\t${includeHTML_part}`;
	}

	return includesHTML;
}

const compileHTML = function(name){
	this.head = this.head || fsExtended.catSync('../client/html/head.html');

	this.pages = this.pages || {};

	var includesText = '// includes ';

	if(!this.pages[name]){
		this.pages[name] = {
			html: fsExtended.catSync(`../client/html/${name}.html`)
		};

		this.pages[name].includes = this.pages[name].html.match(/^(.*)$/m)[0];

		if(this.pages[name].includes.startsWith(includesText)){
			this.pages[name].html = this.pages[name].html.replace(this.pages[name].includes, '');
			this.pages[name].includes = this.pages[name].includes.replace(includesText, '').split(' ');

			this.pages[name].includes = generateIncludes(name, this.pages[name].includes);
		}

		else delete this.pages[name].includes;
	}




	return this.head.replace('XXX', name) + (this.pages[name].includes ? this.pages[name].includes : '') +'</head><body>'+ this.pages[name].html +'</body></html>';
};

module.exports = compileHTML;