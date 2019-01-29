const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

const fsExtended = require('../server/fsExtended');

function concatJS(name, files, applyBabel, dest, done, browserSync){
	var proc = gulp.src(files).pipe(concat(`${name}.js`));

	if(applyBabel) proc.pipe(babel({
		presets: ['@babel/env']
	}));

	proc.pipe(gulp.dest(dest));

	if(browserSync && browserSync.stream) proc.pipe(browserSync.stream());

	done();
}

const compileJS = module.exports = function compileJS(dest, done, browserSync){
	fsExtended.browse('client/js', function(srcData){
		srcData.folders.forEach(function(folder){
			fsExtended.browse(folder, function(folderData){
				//drop the extra file and just read the first line of the file for an object in a comment
				var outputSettings, outputSettingsPath = path.join(folder, 'output.json');

				if(folderData.files.includes(outputSettingsPath)) folderData.files.splice(folderData.files.indexOf(outputSettingsPath), 1);

				fs.readFile(outputSettingsPath, function(err, data){
					try{
						outputSettings = JSON.parse(data);
					}

					catch(e){
						outputSettings = {};
					}

					if(outputSettings.includes) folderData.files = outputSettings.includes.concat(folderData.files);

					var name = folder.replace(/\.?\.?\/?(\w+\/)+/, '');

					concatJS(name, folderData.files, outputSettings.babel, dest, done, browserSync);
				});
			});
		});
	});
};