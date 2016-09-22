var gulp = require("gulp");
var ts = require("gulp-typescript");
var concat = require("gulp-concat");
var sourcemaps = require("gulp-sourcemaps");
var tslint = require("gulp-tslint");
var ignore = require("gulp-ignore");
var rimraf = require("gulp-rimraf");
var scss = require("gulp-sass");
var seq = require("gulp-sequence");
var uglify = require("gulp-uglify");
var browserSync = require("browser-sync").create();
var inject = require("gulp-inject");
var jspm_build = require("gulp-jspm");
var es = require("event-stream");
var gzip = require("gulp-gzip");
var tar = require("gulp-tar");
var proxy = require("proxy-middleware");
var url = require("url");
var embedTemplates = require("gulp-angular-embed-templates");
var merge = require('merge-stream');
var args = require('yargs').argv;
var filter = require('gulp-filter');
var connect = require('gulp-connect');
var proxy = require('http-proxy-middleware');

gulp.task("copy:font", function () {
    return gulp.src(["fonts/{**,./}/*.{eot,svg,ttf,woff,woff2}"], { base: "./" })
        .pipe(gulp.dest("dist/")); // move the fonts into dist folder
});

gulp.task("copy:data", function () {
    return gulp.src(["data/{**,./}/*.json"], { base: "./" })
        .pipe(gulp.dest("dist"));
});

gulp.task("publish:tarball", ["dist"], function () {
    return gulp.src("dist/{**,./}/*")
        .pipe(tar("frontend-dist.tar", { mode: null }))
        .pipe(gzip())
        .pipe(gulp.dest("./"));
});

gulp.task("copy:i18n", function () {
    return gulp.src(["i18n/{**,./}/*.json"], { base: "./" })
        .pipe(gulp.dest("dist"));
});

gulp.task("copy:images", function () {
    return gulp.src(["images/{**,./}/*.{jpeg,jpg,png,svg,gif,ico}"], { base: "./" })
        .pipe(gulp.dest("dist"));
});

gulp.task("copy:dev", function () {
    return gulp.src(["dev/*"], { base: "./" })
        .pipe(gulp.dest("dist")); // move the javascript/lib into dist folder
});

gulp.task("copy:jslib", function () {
    return gulp.src(["javascript/lib/*"])
        .pipe(gulp.dest("dist/js/lib")); // move the javascript/lib into dist folder
});

gulp.task("copy:systemJsConf", function () {
    return gulp.src(["system.config.js"])
        .pipe(gulp.dest("dist/"));
});

/*
 * Convert all the 1000+ files downloaded by JSPM into a single 5Mb js
 * for quick loading. Called by dist and serve.
 */
gulp.task('copy:jspm-resources', function() {
  gulp.src('jspm_packages/**/*', { base: './' })
         .pipe(filter(["**/*.{css,eot,png,ttf,woff,woff2}"]))
         .pipe(gulp.dest('dist'));
});
gulp.task("build:jspm", ["copy:systemJsConf", "copy:jspm-resources", "ts:compile"], function () {
    return gulp.src('dist/js/frontend/typescript/Boot.js')
    .pipe(jspm_build({
        fileName:   'ram-lib',
        arithmetic: "+ css + primeui - [dist/js/**/*]",
        inject: true
    }))
    .pipe(gulp.dest("dist"))
});
/*
 * Convert the smaller number of files in RAM into a single 256k js
 * for quick loading. Called by dist and serve. Used as long as
 * URL search doesn't start with _?debug_
 */
gulp.task("build:app", ["ts:compile", "copy:dev"], function () {
    return gulp.src('dist/js/frontend/typescript/Boot.js')
    .pipe(jspm_build({
        fileName:   'ram-app',
        arithmetic: "- dist/ram-lib.js"
    }))
    .pipe(gulp.dest("dist/"));
});

gulp.task("copy:index.html", function () {
    return gulp.src(["index.html"]).pipe(gulp.dest("dist"));
});

gulp.task("dist", seq(["clean"], ["ts:compile", "copy:i18n", "copy:images", "scss:compile", "copy:data", "copy:index.html"], ["copy:font", "copy:jslib", "copy:dev", "build:jspm"], ["build:app"]));

gulp.task("clean", function () {
    return gulp.src(["dist"], { read: false }).pipe(rimraf());
});

gulp.task("ts:compile", ["ts:lint"], function () {
    var folders = [
        { path: 'typescript/{**,./}/*.ts', base: './typescript' ,dest:'js/frontend'},
        { path: '../commons/{**,./}/*.ts', base: '../', dest:'js/commons'}
    ];
    var tasks = folders.map(function (folder) {
        var tsProject = ts.createProject("typescript/tsconfig.json", {
            typescript: require("typescript"),
            outDir: folder.dest
        });
        return gulp.src(folder.path, { base: folder.base })
            .pipe(embedTemplates())
            .pipe(sourcemaps.init())
            .pipe(ts(tsProject, { sortOutput: true }))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest("dist/js"));
        // .pipe(uglify({mangle:false}))
    });
    return merge(tasks);
});

gulp.task("html:watch", ["copy:index.html", "copy:dev"], function () {
    return gulp.watch(["typescript/{**,./}/*.html", "index.html", "dev/**/*.html"], ["copy:index.html", "copy:dev"]);
});

gulp.task("data:watch", function () {
    return gulp.watch(["data/{**,./}/*.json"], ["copy:data"]);
});

gulp.task("i18n:watch", function () {
    return gulp.watch(["i18n/{**,./}/*.json"], ["copy:i18n"]);
});

gulp.task("ts:watch", ["ts:compile"], function () {
    return gulp.watch(["typescript/{**,./}/*.ts", "../commons/{**,./}/*.ts", "typescript/{**,./}/*.html"], ["build:app"]);
});

gulp.task("scss:compile", function () {
    return gulp.src("./scss/app.scss")
        .pipe(sourcemaps.init())
        .pipe(scss().on("error", scss.logError))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("./dist/css"));
});

gulp.task("scss:watch", ["scss:compile"], function () {
    return gulp.watch("scss/{**,./}/*.scss", ["scss:compile"]);
});

gulp.task("ts:lint", function () {
    if (args['lint'] === false) {
        console.log('           Skipping \'ts:lint\' via --no-lint');
    } else {
        return gulp.src(["typescript/{**,./}/*.ts", "test/{**,./}/*.ts"])
            .pipe(tslint())
            .pipe(tslint.report({
                emitError: false
            }));
    }
});
gulp.task("watch", ["scss:watch", "ts:watch", "html:watch", "data:watch", "i18n:watch"]);

gulp.task("serve", ["copy:i18n", "copy:images", "scss:watch", "ts:watch", "html:watch", "data:watch", "i18n:watch", "copy:jslib", "build:app"], function () {
    var proxyOptions = url.parse("http://localhost:3000/api");
    proxyOptions.route = "/api";

    browserSync.init({
        server: {
            baseDir: "./dist/",
            middleware: [proxy(proxyOptions)]
        },
        online: false
    });

    return gulp.watch([
        "./typescript/**/*.js",
        "./index.html",
        "./dev/*",
        "./typescript/{**,./}/*.html",
        "./scss/*.*",
        "./i18n/*.json",
        "./images/*.*",
        "./ram-app.js"
    ], [browserSync.reload]);
});

gulp.task("serve:no-browser-sync", ["copy:i18n", "copy:images", "copy:jslib", "build:app"], function () {
    return connect.server({
        root: ['./dist/'],
        port: 3001,
        middleware: function (connect, opt) {
            return [
                proxy('/api', {
                    target: 'http://localhost:3000',
                    changeOrigin: true
                })
            ]
        }
    });
});
