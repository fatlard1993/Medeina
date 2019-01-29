const gulp = require('gulp');
const browserSync = require('browser-sync').create();

const compile = {
	scss: require('./gulpfiles/compileSCSS'),
	js: require('./gulpfiles/compileJS'),
	html: require('./gulpfiles/compileHTML')
};
const watcher = require('./gulpfiles/watcher');

const browserSyncOptions = {
	server: {
		baseDir: 'client/public'
	}
};

gulp.task('compile-js', function(done){
	compile.js('client/public/js', done, browserSync);
});

gulp.task('compile-css', function(done){
	compile.scss('client/public/css', done, browserSync);
});

gulp.task('compile-html', function(done){
	compile.html('client/public', done);
});

gulp.task('watcher', function(){
	browserSync.init(browserSyncOptions);

	watcher(gulp);
});

gulp.task('compile', gulp.series('compile-js', 'compile-css', 'compile-html'));

gulp.task('dev', gulp.series('compile', 'watcher'));

gulp.task('default', gulp.series('compile'));