exports.config = {
	framework: 'jasmine2',
	seleniumAddress: 'http://localhost:4444/wd/hub',
	specs: ['dist/*.spec.js'],
	multiCapabilities: [{
		browserName: 'chrome'
	}],
	useAllAngular2AppRoots: true
};
 