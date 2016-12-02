/// <binding ProjectOpened='Space-Manager' />
"use strict";
var gulp = require("gulp"),
    concat = require("gulp-concat"),
    cssmin = require("gulp-cssmin"),
    htmlmin = require("gulp-htmlmin"),
    uglify = require("gulp-uglify"),
    merge = require("merge-stream"),
    addStream = require('add-stream'),
    debug = require('gulp-debug'),
    del = require("del"),
    templateCache = require('gulp-angular-templatecache'),
    gutil = require('gulp-util'),
    minifyHTML = require('gulp-minify-html');


function prapareTemplater() {
    return gulp.src([
        'src/components/**/*.html'
    ])

      .pipe(templateCache({
          module: 'mb.angular.templates',
          standalone: true
      }))
}

gulp.task('mb-modules', function () {

    return gulp.src([
        "src/mb.lib.js",
        "src/mb.angular.js",
        "src/mb.angular.filters.js",
        "src/services/*.js",
         "src/components/**/*.js"
    ])
        .pipe(concat('mb.all.js'))
        .pipe(addStream.obj(prapareTemplater()))
        .pipe(concat('mb.all.js'))
        .pipe(gulp.dest(''))
})

gulp.task('watch', function () {
    return gulp.watch('src/components/**/*.js', ['Space-Manager']);
});


function getBundles(regexPattern) {
    return bundleconfig.filter(function (bundle) {
        return regexPattern.test(bundle.outputFileName);
    });
} 