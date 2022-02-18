/**
* Load plugins
*/
const gulp = require('gulp')
const del = require('del')
const plugins = require('gulp-load-plugins')()
const babelify = require('babelify')
const browserify = require('browserify')
const sourceStream = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const browserSync = require('browser-sync')

/**
* Helpers
*/
const generateUID = _ => (Date.now().toString(36) + Math.random().toString(36).substring(2))

/** 
* Config
*/
const source = {
    base: 'src/',
    assets: `src/assets/`,
    js: `src/assets/scripts/`,
    css: `src/assets/stylus/`,
    images: `src/assets/images/`,
    static: `src/assets/static/`
}
const destination = {
    base: 'dist/',
    assets: `dist/assets/`,
    js: `dist/assets/scripts/`,
    css: `dist/assets/styles/`,
    images: `dist/assets/images/`
}

const prod = process.argv.includes('--prod')
const uid = generateUID()

/** 
* JS managment
*/
gulp.task('jsBundler', () => {
    const bundle = browserify({
        entries: `${source.js}/app.js`,
        debug: true,
    })
    .transform(babelify.configure({
        presets: ['@babel/env']
    }))
    .bundle()
    if (prod) {
        return bundle
        .pipe(sourceStream(`app-${uid}.js`))
        .pipe(buffer()) // You need this if you want to continue using the stream with other plugins
        .pipe(plugins.sourcemaps.init({loadMaps: true}))
        .pipe(plugins.minify({
            ext: { min: '.min.js' }
        }))
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest(destination.js))
        .pipe(browserSync.stream())
    } else {
        return bundle
        .pipe(sourceStream(`app-${uid}.js`))
        .pipe(gulp.dest(destination.js))
        .pipe(browserSync.stream())
    }
})

/** 
* CSS Management
*/
gulp.task('stylus', function() {
    return gulp.src(`${source.css}app.styl`)
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.stylus())
    .pipe(plugins.autoprefixer())
    .pipe(plugins.rename({
        'suffix': `-${uid}`
    }))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(destination.css))
    .pipe(browserSync.stream())
})

gulp.task('cssMinifier', function() {
    return gulp.src(`${destination.css}app-${uid}.css`)
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.csso())
    .pipe(plugins.rename({
        'suffix': `.min`
    }))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(destination.css))
    .pipe(browserSync.stream())
})

/**
* Images managment
*/
gulp.task('copySVGandGifs', function() {
    return gulp.src(`${source.images}**/*.+(svg|gif)`)
    .pipe(plugins.cached('svg_and_gifs'))
    .pipe(gulp.dest(destination.images))
    .pipe(browserSync.stream())
})
gulp.task('minifyImages', function() {
    return gulp.src(`${source.images}**/*.+(png|jpg|jpeg)`)
    .pipe(plugins.cached('images'))
    .pipe(plugins.imagemin())
    .pipe(gulp.dest(destination.images))
    .pipe(browserSync.stream())
})
gulp.task('convertToWebP', function() {
    return gulp.src(`${source.images}**/*.+(png|jpg|jpeg)`)
    .pipe(plugins.cached('webp'))
    .pipe(plugins.webp())
    .pipe(plugins.extReplace('.webp'))
    .pipe(gulp.dest(destination.images))
    .pipe(browserSync.stream())
})

/**
* Manage static files
*/
gulp.task('copyStaticFiles', function() {
    return gulp.src(`${source.static}**/*`)
    .pipe(plugins.cached('static_files'))
    .pipe(gulp.dest(destination.assets))
})

/**
* Manage php files
*/
gulp.task('copyPhpFiles', function() {
    const suffix = prod ? 'min.' : ''
    return gulp.src(`${source.base}**/*.php`)
    .pipe(plugins.stringReplace('{{style_url}}', `/assets/styles/app-${uid}.${suffix}css`))
    .pipe(plugins.stringReplace('{{script_url}}', `/assets/scripts/app-${uid}.${suffix}js`))
    .pipe(plugins.stringReplace('/static/', `/`))
    .pipe(plugins.cached('php_files'))
    .pipe(gulp.dest(destination.base))
})
gulp.task('copyConfig', function() {
    return gulp.src(`${source.base}**/.+(htaccess|htpasswd)`, { allowEmpty: true })
    .pipe(gulp.dest(destination.base))
})
gulp.task('copyComposer', function() {
    return gulp.src(`${source.base}vendor/**/*`, { allowEmpty: true })
    .pipe(gulp.dest(`${destination.base}vendor/`))
})

/**
* Cache
*/
gulp.task('clearGulpCache', function() {
    plugins.cached.caches = {}
    return del(destination.base)
})

/** 
* Server
*/
gulp.task('connect-sync', function(){
    plugins.connectPhp.server({
        port: 8000,
        base: 'dist/',
        keepalive: true
    }, function(){
        browserSync({
            browser: 'firefox',
            proxy: '127.0.0.1:8000'
        })
    })
    gulp.watch(`./${source. static}**/*`, gulp.series('copyStaticFiles'))
    gulp.watch(`./${source.images}**/*.(gif|svg)`, gulp.series('copySVGandGifs'))
    gulp.watch(`./${source.images}**/*.(png|jpg|jpeg)`, gulp.series('minifyImages', 'convertToWebP'))
    gulp.watch(`./${source.js}**/*.js`, gulp.series('js'))
    gulp.watch(`./${source.css}**/*.styl`, gulp.series('css'))
    gulp.watch(`./${source.base}**/.+(htaccess|htpasswd)`, gulp.series('copyConfig'))
    gulp.watch('./src/**/*.php', gulp.series('copyPhpFiles'))
    gulp.watch('./src/**/*.php').on('change', function () {
        browserSync.reload()
    })
})

gulp.task('start-db', plugins.shell.task('brew services start mysql'))

gulp.task('stop-db', plugins.shell.task('brew services stop mysql'))

gulp.task('disconnect', function(done) {
    plugins.connectPhp.closeServer()
    done()
})

/** 
* Task definitions
*/
gulp.task('js', gulp.series('jsBundler'))
gulp.task('css', gulp.series('stylus', 'cssMinifier'))
gulp.task('images', gulp.series('copySVGandGifs', 'minifyImages', 'convertToWebP'))
gulp.task('assets', gulp.series( 'js', 'css', 'images', 'copyStaticFiles'))

gulp.task('stop', gulp.series('stop-db','disconnect'))
gulp.task('build', gulp.series('stop', 'clearGulpCache', 'copyPhpFiles', 'copyConfig', 'copyComposer', 'assets'))
gulp.task('dev', gulp.series('build', 'start-db', 'connect-sync'))

gulp.task('default', gulp.series('dev'))