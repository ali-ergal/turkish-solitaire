const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

// Source files: all JS in js/, but exclude *.min.js
const jsFiles = [
  'js/**/*.js',
];

// Task: concatenate and minify
function scripts() {
  return gulp.src(jsFiles)
    .pipe(concat('app.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist/js'));
}

gulp.task('default', scripts); 