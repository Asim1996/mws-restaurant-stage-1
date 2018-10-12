var gulp=require('gulp');
var cleanCSS = require('gulp-clean-css');
var autoprefixer=require('gulp-autoprefixer');
var rename = require("gulp-rename");
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var es2015 = require('babel-preset-es2015');
var concat = require('gulp-concat');
// var uglify = require('gulp-uglify');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);

var gzip = require('gulp-gzip');

gulp.task('minify-css', () => {
  return gulp.src('css/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(rename({
     suffix: ".min",
     extname: ".css"
     }))
     .pipe(gzip())
    .pipe(gulp.dest('css'));
});

gulp.task('minify-js', function () {
    return gulp.src('js/*.js')
    .pipe(uglify())
     .pipe(rename({
     suffix: ".min",
     extname: ".js"
     }))
    .pipe(gulp.dest('js'))
});

