var gulp = require("gulp");
var plumber = require("gulp-plumber");
var notify = require("gulp-notify");
var browserSync = require("browser-sync");

var sass = require("gulp-sass");
var autoprefixer = require("gulp-autoprefixer");
var minifycss = require('gulp-clean-css');

var pug = require("gulp-pug");

var imagemin = require('gulp-imagemin');
var changed = require('gulp-changed');
var pngquant = require('imagemin-pngquant');
var mozjpeg = require('imagemin-mozjpeg');


gulp.task('default', [ 'browser-sync', 'watch', 'pug', 'sass', 'jsCopy', 'images']);

// sass
gulp.task('sass', () => {
  gulp.src("./src/sass/*scss")
      .pipe(plumber({
          errorHandler: notify.onError("Error: <%= error.message %>")
      }))
      .pipe(sass())
      .pipe(autoprefixer({
        browsers: ['last 2 version', 'iOS >= 10', 'Android >= 5', 'ie >= 11'],
        cascade: false
      }))
      .pipe(minifycss())
      .pipe(gulp.dest("./www/assets/css/"))
});

// pug
gulp.task('pug', () => {
  var option = {
      pretty: true
  }
  gulp.src("./src/*.pug")
      .pipe(plumber({
          errorHandler: notify.onError("Error: <%= error.message %>")
      }))
      .pipe(pug(option))
      .pipe(gulp.dest("./www/"))
});

// js-copy
gulp.task('jsCopy', () => {
  gulp.src("./src/js/*.js")
    .pipe(plumber({
        errorHandler: notify.onError("Error: <%= error.message %>")
    }))
    .pipe(gulp.dest("./www/assets/js/"));
});

// images
gulp.task('images', () => {
  return gulp.src('./src/images/**/*.{png,jpg,gif,svg}')
    .pipe(changed('./www/assets/images/'))
    .pipe(imagemin([
      pngquant({
        quality: '65-80',
        speed: 1,
        floyd: 0,
      }),
      mozjpeg({
        quality: 85,
        progressive: true
      }),
      imagemin.svgo(),
      imagemin.optipng(),
      imagemin.gifsicle()
    ]))
    .pipe(gulp.dest('./www/assets/images/'))
    .pipe(notify('images task finished'));
});

gulp.task('watch', () => {
  gulp.watch(['./src/*.pug'], ['pug']);
  gulp.watch(['./src/sass/**'], ['sass']);
  gulp.watch(['./src/js/**'], ['jsCopy']);
});

gulp.task('browser-sync', () => {
  browserSync({
    server: {
      baseDir: "./www/"
    }
  });
  gulp.watch("./www/*.html", ['reload']);
  gulp.watch("./www/assets/css/*.css", ['reload']);
  gulp.watch("./www/assets/js/*.js", ['reload']);
});

gulp.task('reload', () => {
  browserSync.reload();
});