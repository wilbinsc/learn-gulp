var gulp = require('gulp');
//var util = require('gulp-util');
//var seq = require('run-sequence');
//var del = require('del');
//var sass = require('gulp-sass');
//var browserify = require('browserify');
//var source = require('vinyl-source-stream');
//var express = require('express');
//var minimist = require('minimist');
//var cssmin = require('gulp-minify-css');
//var buffer = require('gulp-buffer');
//var uglify = require('gulp-uglify');
//var imagemin = require('gulp-imagemin');
//var sourcemaps = require('gulp-sourcemaps');

var plugins = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'gulp.*', 'del', 'minimist', 'run-sequence', 'browserify', 'express', 'vinyl-source-stream'],
    rename: {'gulp-minify-css': 'cssmin', 'run-sequence': 'seq', 'vinyl-source-stream': 'source'}
});

var cachebuster = new plugins.cachebust();

var errorHandler = function (err) {
    console.log('Error Encountered:', err.toString());
    this.emit('end');
}

//var options = plugins.minimist(process.argv);
var config = require('./src/config/' + (plugins.util.env.environment || 'dev') + '.json');
console.log(config);

gulp.task('clean', function (cb) {
    return plugins.del('dist/**', cb);
});

gulp.task('html', function () {
    return gulp.src('src/html/**/*.html')
        .pipe(cachebuster.references())
        .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
    return gulp.src('src/images/**/*.png')
        .pipe(config.minify ? plugins.imagemin() : plugins.util.noop())
        .pipe(cachebuster.resources())
        .pipe(gulp.dest('dist/images'));
});

gulp.task('css', function () {
    return gulp.src('src/styles/**/*.scss')
        .pipe(config.sourceMaps ? plugins.sourcemaps.init() : plugins.util.noop())
        .pipe(plugins.sass())
        .pipe(config.sourceMaps ? plugins.sourcemaps.write() : plugins.util.noop())
        .on('error', errorHandler)
        .pipe(config.minify ? plugins.cssmin() : plugins.util.noop())
        .pipe(cachebuster.resources())
        .pipe(gulp.dest('dist/styles'));
});

gulp.task('scripts', function () {
    return plugins.browserify('./src/scripts/main.js', {debug: config.sourceMaps}).bundle()
        .on('error', errorHandler).pipe(plugins.source('bundle.js'))
        .pipe(cachebuster.resources())
        .pipe(config.minify ? plugins.buffer() : plugins.util.noop())
        .pipe(config.minify ? plugins.uglify() : plugins.util.noop())
        .pipe(gulp.dest('dist/scripts'));
});

gulp.task('server', function () {
    plugins.express().use(plugins.express.static('dist')).listen(8000);
});

gulp.task('build', function (cb) {
    return plugins.seq('clean', ['images', 'css', 'scripts'], 'html', cb);
});

gulp.task('watch', function () {
    gulp.watch('src/html/**/*.html', ['html']);
    gulp.watch('src/images/**/*.png', ['images']);
    gulp.watch('src/styles/**/*.scss', ['css']);
    gulp.watch('src/scripts/**/*.js', ['scripts']);
});

gulp.task('default', function (cb) {
    return plugins.seq('build', ['watch', 'server'], cb);
});