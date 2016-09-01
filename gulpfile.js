'use strict';

var gulp = require('gulp');

var del = require('del');

var htmlmin = require('gulp-htmlmin');
var sass = require('gulp-sass');

var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var browserify = require('browserify');

var browserSync = require('browser-sync').create();

const BUILD_DEST = "./build";


//CLEAN
gulp.task('clean', ['clean:html', 'clean:js', 'clean:css']);

gulp.task('clean:html', function () {
    return del([BUILD_DEST + "/*.html"]);
});

gulp.task('clean:js', function () {
    return del([BUILD_DEST + "/js"]);
});

gulp.task('clean:css', function () {
    return del([BUILD_DEST + "/css"]);
});


//BUILD
gulp.task('build:html', function () {
    return gulp.src('./src/main/client/html/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(BUILD_DEST));
});

gulp.task('build:js', function () {
    // set up the browserify instance on a task basis
    var b = browserify({
        entries: './src/main/client/js/main.js'
    });

    return b.bundle()
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        // .pipe(uglify())       //minify
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(BUILD_DEST+'/js/'));
});

gulp.task('build:css', function () {
    return gulp.src('./src/main/client/sass/*')
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(gulp.dest(BUILD_DEST + '/css'));
});

gulp.task('copy:data', function () {
    return gulp.src('./src/main/client/data/*')
        .pipe(gulp.dest(BUILD_DEST + '/data'));
});

gulp.task('build', ['build:html', 'build:css', 'build:js']);


//SERVE
gulp.task('serve', ['clean', 'build', 'watch'], function() {
    browserSync.init({
        server: {
            baseDir: BUILD_DEST
        },
        reloadDelay: 1000
    });
});


//WATCH
gulp.task('watch:css', function() {
    gulp.watch('./src/main/client/sass/**/*', ['clean:css', 'build:css']).on('change', browserSync.reload);
});
gulp.task('watch:js', function() {
    gulp.watch('./src/main/client/js/**/*', ['clean:js', 'build:js']).on('change', browserSync.reload);
});
gulp.task('watch:html', function() {
    gulp.watch('./src/main/client/html/**/*', ['clean:html', 'build:html']).on('change', browserSync.reload);
});
gulp.task('watch', ['watch:html', 'watch:css', 'watch:js']);



//DEFAULT
gulp.task('default', function () {
    console.log('Useage is as follows with one or more of the configured tasks:\n' +
        '$ gulp <task> [<task2> ...] \n' +
        'available options:\n' +
        '\t* clean - cleans the built project\n' +
        '\t\t-clean:html - cleans just the client html\n' +
        '\t\t-clean:css - cleans just the client css\n' +
        '\t\t-clean:js - cleans just the client js\n' +
        '\t* build - build the entire client\n' +
        '\t\t-build:html - builds just the client html\n' +
        '\t\t-build:css - builds just the client css\n' +
        '\t\t-build:js - builds just the client js\n' +
        '\t* serve - cleans, builds and serves the client watching for any changes\n');
});
