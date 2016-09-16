var gulp = require('gulp');
var browserStack = require('gulp-browserstack');
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var argv = require('yargs').argv;
var tslint = require("gulp-tslint");
var ignore = require("gulp-ignore");
var rimraf = require("gulp-rimraf");
var seq = require("gulp-sequence");
var protractor = require('gulp-protractor');

var tsProject = ts.createProject("tsconfig.json", {
	typescript: require("typescript")
});
gulp.task("dist", seq(["clean"], ["ts:compile"]));

gulp.task("test:browserstack", function () {
	gulp.src(["./dist/**/*.js"])
		.pipe(protractor.protractor({
			configFile: "config/browserstack.protractor.js"
		}))
		.on('error', function (e) {
			throw e;
		});
});

gulp.task("test:local", ["dist"], function () {
	gulp.src(["./dist/**/*.js"])
		.pipe(protractor.protractor({
			configFile: "config/local.protractor.js"
		}))
		.on('error', function (e) {
			throw e;
		});
});

gulp.task("clean", function () {
	return gulp.src(["dist"], { read: false }).pipe(rimraf());
});

gulp.task("ts:compile", function () {
	var tsResult = gulp.src([
		"typescript/**/*.ts"
	]).pipe(sourcemaps.init())
		.pipe(ts(tsProject));

	return tsResult.js
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("dist/"));
});

gulp.task("ts:watch", ["ts:compile"], function () {
	return gulp.watch(["typescript/{**,./}/*.ts"], ["ts:compile"]);
});