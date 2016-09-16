var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var tslint = require("gulp-tslint");
var rimraf = require("gulp-rimraf");
var gzip = require('gulp-gzip');
var tar = require('gulp-tar');
var jasmine = require('gulp-jasmine');
var exec = require('child_process').exec;
var args = require('yargs').argv;

var tsProject = ts.createProject("tsconfig.json", {
    typescript: require("typescript")
});

gulp.task("clean", function () {
    return gulp.src(["dist"], {read: false}).pipe(rimraf());
});

gulp.task("ts:lint", function () {
    if (args['lint'] === false) {
        console.log('           Skipping \'ts:lint\' via --no-lint');
    } else {
        return gulp.src(["typescript/**/*.ts", "test/**/*.ts"])
            .pipe(tslint())
            .pipe(tslint.report("verbose", {
                emitError: false
            }));
    }
});

gulp.task("ts:compile", ["ts:lint"], function () {
    var tsResult = gulp.src([
        "typescript/**/*.ts",
        "slec.**/*.ts",
        "../commons/**/*.ts"
    ])
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

    return tsResult.js
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest("dist/"));
});

gulp.task("copy:i18n", function () {
    return gulp.src(["i18n/{**,./}/*.json"], { base: "./" })
            .pipe(gulp.dest("dist/backend"));
});

gulp.task("copy:views", function () {
    return gulp.src(["views/{**,./}/*.html"], { base: "./" })
            .pipe(gulp.dest("dist/backend"));
});

gulp.task("ts:watch", ["ts:compile"], function () {
    gulp.watch(["typescript/**/*.ts", "../commons/**/*.ts", "typings/**/*.d.ts"], ["ts:compile"]);
    gulp.watch(["i18n/*.*"], ["copy:i18n"]);
    gulp.watch(["views/*.*"], ["copy:views"]);
});

gulp.task('serve', ["copy:i18n", "copy:views", "ts:watch"], function () {
    nodemon({
        script: 'dist/backend/typescript/server.js',
        "verbose": false,
        "delay": 1000,
        "ignore": ["**/*.js.map", "**/*.spec.js", "**/*.log"],
        "execMap": {
            "js": "node --harmony"
        }
    })
        .on('restart', function () {
            console.log('              [gulp] RAM Backend Server: restarted [OK]');
            console.log('              [gulp] ..................................');
        });
});

gulp.task('servedebug', ["copy:i18n", "copy:views", "ts:watch"], function () {
    nodemon({
        script: 'dist/backend/typescript/server.js',
        "verbose": false,
        "delay": 1000,
        "ignore": ["**/*.js.map", "**/*.spec.js", "**/*.log"],
        "execMap": {
            "js": "node --harmony --debug"
        }
    })
        .on('restart', function () {
            console.log('              [gulp] RAM Backend Server: restarted [OK]');
            console.log('              [gulp] ..................................');
        });
});

gulp.task('seed', ["ts:compile", "copy:i18n"], function (cb) {
    exec('node dist/backend/typescript/seeding/seeder.js --color', function (err, stdout, stderr) {
        if (stdout) {
            console.log(stdout);
            cb();
        }
        if (err) {
            console.log(err);
            cb(err);
        }
    });
});

gulp.task('export', ["ts:compile"], function (cb) {
    exec('node dist/backend/typescript/seeding/example-data-export.js --color', function (err, stdout, stderr) {
        if (stdout) {
            console.log(stdout);
            cb();
        }
        if (err) {
            console.log(err);
            cb(err);
        }
    });
});

gulp.task("copy:resources", function (params) {
    return gulp.src(["package.json", "pm2.json"])
        .pipe(gulp.dest("dist/"));
});

gulp.task("publish:tarball",
    ["ts:compile", "copy:resources"], function () {
        return gulp.src("dist/**/*")
            .pipe(tar('backend-dist.tar', {mode: null}))
            .pipe(gzip())
            .pipe(gulp.dest('./'));
    });

gulp.task('test', ['ts:compile'], function () {
    var pattern = ['dist/{**,./}/*.spec.js'];
    if (args.test) {
        pattern = ['dist/{**,./}/' + args.test + '.spec.js'];
    }
    console.log('\nRunning tests with pattern ' + args.test);
    return gulp.src(pattern).pipe(
        jasmine({
            verbose: true,
            includeStackTrace: true,
            config: {
                stopSpecOnExpectationFailure: false,
                random: false
            }
        })
    );
});

gulp.task('default', ['ts:watch']);