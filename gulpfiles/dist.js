const gulp = require('gulp');
const del = require('del');

const dist = module.exports = function dist(globs, distSubFolder, done){
	var distFolder = 'dist'+ (typeof distSubFolder === 'string' ? ('/'+ distSubFolder) : '');

	for(var x = 0, count = globs.length; x < count; ++x){
		gulp.src(globs[x].src).pipe(gulp.dest(distFolder + (globs[x].dest ? ('/'+ globs[x].dest) : '')));
	}

	done();
};

dist.clean = function distClean(done){
	del.sync(['dist']);

	done();
};