var path = require('path');

module.exports = function (config) {
	var configuration = {
		files: [
			{pattern: '../spec/generic/**/*.spec.js', watched: false},
			{pattern: '../spec/web/**/*.spec.js', watched: false},
			{pattern: '../spec/**/*.helpers.js', watched: false},
		],

		// coverage reporter generates the coverage
		reporters: ['dots', 'coverage'],

		frameworks: ['jasmine', 'jasmine-matchers'],

		preprocessors: {
			'../spec/generic/**/*.spec.js': ['webpack'],
			'../spec/web/**/*.spec.js': ['webpack'],
			'../spec/**/*.helpers.js': ['webpack']
		},

		// optionally, configure the reporter
		coverageReporter: {
			type: 'html',
			dir: '../reports/coverage/'
		},

		browsers: ['Chrome'],
		// Launcher for travis.
		customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

		webpack: {
			externals: {
				"fs": "fs"
			},
			watch: true,
      devtool: 'inline-source-map',
		},
		webpackServer: {
			noInfo: true
		},
		plugins: [
			'karma-chrome-launcher',
			'karma-coverage',
			'karma-jasmine',
			'karma-jasmine-matchers',
			'karma-webpack'
		],
	};

	if(process.env.TRAVIS){
    configuration.browsers = ['Chrome_travis_ci'];
  }
  config.set(configuration);
};
