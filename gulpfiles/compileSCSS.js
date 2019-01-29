const fs = require('fs');
const path = require('path');

const del = require('del');
const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');

const compileSCSS = module.exports = function compileSCSS(dest, done, browserSync){
	fs.readFile('client/scss/depends.json', function(err, data){
		var dependsArr;

		try{
			dependsArr = JSON.parse(data);
		}

		catch(e){
			dependsArr = [];
		}

		dependsArr.push('client/scss/*.scss', 'client/scss/**/*.scss');

		var scssDest = path.join(dest, '*.scss');

		gulp.src(dependsArr).pipe(gulp.dest(dest)).on('finish', function(){
			var proc = gulp.src(scssDest).pipe(sass().on('error', sass.logError));

			proc.pipe(autoprefixer({
				flexBox: 'no-2009',
				browsers: ['last 10 versions'],
				cascade: false
			})).pipe(gulp.dest(dest));

			if(browserSync && browserSync.stream) proc.pipe(browserSync.stream());

			proc.on('finish', function(){
				del([scssDest]);

				done();
			});
		});
	});
};