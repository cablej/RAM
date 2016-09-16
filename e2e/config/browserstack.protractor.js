var browserstack = require('browserstack-local');

exports.config = {
	'seleniumAddress': 'http://hub-cloud.browserstack.com/wd/hub',
	useAllAngular2AppRoots: true,
	specs: ['dist/*.spec.js'],
    framework: 'jasmine2',
    maxSessions: 1,
    jasmineNodeOpts: {
        defaultTimeoutInterval: 360000
    },


	'capabilities': {
		'browserstack.user': process.env.BROWSERSTACK_USER,
		'browserstack.key': process.env.BROWSERSTACK_KEY,
		'browserstack.local': false,
		'browserName': 'chrome'
	},
	onPrepare: function () {
        var driver = browser.driver;
        browser.manage().timeouts().pageLoadTimeout(400000);
        browser.manage().timeouts().implicitlyWait(15000);
        browser.ignoreSynchronization = true;
    },

	beforeLaunch: function () {
		console.log("Connecting local");
		return new Promise(function (resolve, reject) {
			exports.bs_local = new browserstack.Local();
			exports.bs_local.start({ 'key': exports.config.capabilities['browserstack.key'] }, function (error) {
				if (error) return reject(error);
				console.log('Connected. Now testing...');

				resolve();
			});
		});
	},

	// Code to stop browserstack local after end of test
	afterLaunch: function () {
		return new Promise(function (resolve, reject) {
			exports.bs_local.stop(resolve);
		});
	}
};

