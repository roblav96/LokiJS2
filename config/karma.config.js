var path = require('path');

module.exports = function (config) {
	config.set({
		browsers: ['Chrome'],
		files: [
			{pattern: '../spec/**/*.spec.js', watched: false},
			{pattern: '../spec/**/*.helpers.js', watched: false}
		],

		// coverage reporter generates the coverage
		reporters: ['dots', 'coverage'],

		frameworks: ['jasmine', 'jasmine-matchers'],

		preprocessors: {
			'../spec/**/*.spec.js': ['webpack'],
			'../spec/**/*.helpers.js': ['webpack']
		},

		// optionally, configure the reporter
		coverageReporter: {
			type: 'html',
			dir: '../reports/coverage/'
		},

		webpack: {
			externals: {
				"fs": "fs"
			},
			module: {
				loaders: [
					/*{
						test: /(\.js)$/,
						loader: 'babel-loader',
						exclude: /(node_modules|bower_components)/
					}*/
				]
			},
			watch: true
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
	});
};
