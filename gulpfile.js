var $        = require('gulp-load-plugins')();
var argv     = require('yargs').argv;
var browser  = require('browser-sync');
var gulp     = require('gulp');
var panini   = require('panini');
var rimraf   = require('rimraf');
var sequence = require('run-sequence');
var sherpa   = require('style-sherpa');

var gulp = require('gulp');
var markdown = require('gulp-markdown');

// Check for --production flag
var isProduction = !!(argv.production);

// Port to use for the development server.
var PORT = 8000;

// Browsers to target when prefixing CSS.
var COMPATIBILITY = ['last 2 versions', 'ie >= 9'];

// File paths to various assets are defined here.
var PATHS = {
  assets: [
    'src/assets/**/*',
    '!src/assets/{!img,js,scss}/**/*'
  ],
  sass: [
    'node_modules/foundation-sites/scss',
    'node_modules/motion-ui/src/'
  ],
  javascript: [
    'node_modules/jquery/dist/jquery.js',
    'node_modules/what-input/what-input.js',
    'node_modules/foundation-sites/js/foundation.core.js',
    'node_modules/foundation-sites/js/foundation.util.*.js',
    // Paths to individual JS components defined below
    'node_modules/foundation-sites/js/foundation.abide.js',
    'node_modules/foundation-sites/js/foundation.accordion.js',
    'node_modules/foundation-sites/js/foundation.accordionMenu.js',
    'node_modules/foundation-sites/js/foundation.drilldown.js',
    'node_modules/foundation-sites/js/foundation.dropdown.js',
    'node_modules/foundation-sites/js/foundation.dropdownMenu.js',
    'node_modules/foundation-sites/js/foundation.equalizer.js',
    'node_modules/foundation-sites/js/foundation.interchange.js',
    'node_modules/foundation-sites/js/foundation.magellan.js',
    'node_modules/foundation-sites/js/foundation.offcanvas.js',
    'node_modules/foundation-sites/js/foundation.orbit.js',
    'node_modules/foundation-sites/js/foundation.responsiveMenu.js',
    'node_modules/foundation-sites/js/foundation.responsiveToggle.js',
    'node_modules/foundation-sites/js/foundation.reveal.js',
    'node_modules/foundation-sites/js/foundation.slider.js',
    'node_modules/foundation-sites/js/foundation.sticky.js',
    'node_modules/foundation-sites/js/foundation.tabs.js',
    'node_modules/foundation-sites/js/foundation.toggler.js',
    'node_modules/foundation-sites/js/foundation.tooltip.js',
    'src/assets/js/**/*.js',
    'src/assets/js/app.js'
  ]
};

// Delete the "dist" folder
// This happens every time a build starts
gulp.task('clean', function(done) {
  rimraf('dist', done);
});

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
gulp.task('copy', function() {
  gulp.src(PATHS.assets)
    .pipe(gulp.dest('dist/assets'));
});

// Copy page templates into finished HTML files
gulp.task('pages', function() {
  gulp.src('src/pages/**/*.{md,html,hbs,handlebars}')
    .pipe(markdown())
    .pipe(panini({
      root: 'src/pages/',
      layouts: 'src/layouts/',
      partials: 'src/partials/',
      data: 'src/data/',
      helpers: 'src/helpers/'
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('pages:reset', function(cb) {
  panini.refresh();
  gulp.run('pages');
  cb();
});

// Compile Sass into CSS
// In production, the CSS is compressed
gulp.task('sass', function() {
  var uncss = $.if(isProduction, $.uncss({
    html: ['src/**/*.html'],
    ignore: [
      new RegExp('^meta\..*'),
      new RegExp('^\.is-.*')
    ]
  }));

  var minifycss = $.if(isProduction, $.minifyCss());

  return gulp.src('src/assets/scss/app.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: PATHS.sass
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: COMPATIBILITY
    }))
    .pipe(uncss)
    .pipe(minifycss)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/css'));
});

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(PATHS.javascript)
    .pipe($.sourcemaps.init())
    .pipe($.concat('app.js'))
    .pipe(uglify)
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/assets/js'));
});

// Copy images to the "dist" folder
// In production, the images are compressed
gulp.task('images', function() {
  var imagemin = $.if(isProduction, $.imagemin({
    progressive: true
  }));

  return gulp.src('src/assets/img/**/*')
    .pipe(imagemin)
    .pipe(gulp.dest('dist/assets/img'));
});

// Build the "dist" folder by running all of the above tasks
gulp.task('build', function(done) {
  sequence('clean', ['pages', 'sass', 'javascript', 'images', 'copy'], done);
});

// Start a server with LiveReload to preview the site in
gulp.task('server', ['build'], function() {
  browser.init({
    server: 'dist', port: PORT
  });
});

// Build the site, run the server, and watch for file changes
gulp.task('default', ['build', 'server'], function() {
  gulp.watch(PATHS.assets, ['copy', browser.reload]);
  gulp.watch(['src/pages/**/*.{hbs,md,html}'], ['pages', browser.reload]);
  gulp.watch(['src/{layouts,partials}/**/*.{hbs,md,html}'], ['pages:reset', browser.reload]);
  gulp.watch(['src/assets/scss/**/*.scss'], ['sass', browser.reload]);
  gulp.watch(['src/assets/js/**/*.js'], ['javascript', browser.reload]);
  gulp.watch(['src/assets/img/**/*'], ['images', browser.reload]);
});
