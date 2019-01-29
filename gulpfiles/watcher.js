const watcher = module.exports = function watcher(gulp){
	gulp.watch('client/js/*.js', gulp.series('compile-js'));
	gulp.watch('client/js/**/*.js*', gulp.series('compile-js'));

	gulp.watch('client/scss/*.scss', gulp.series('compile-css'));
	gulp.watch('client/scss/depends.json', gulp.series('compile-css'));

	gulp.watch('client/html/*.html', gulp.series('compile-html'));
	gulp.watch('client/html/**/*.html', gulp.series('compile-html'));
	gulp.watch('client/html/**/*.json', gulp.series('compile-html'));
};