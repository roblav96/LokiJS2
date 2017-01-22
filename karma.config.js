var path = require('path');

module.exports = function (config) {
	config.set({
		browsers: ['Chrome'],
		files: [
			{pattern: 'spec/**/*.spec.js', watched: false}
		],

		// coverage reporter generates the coverage
		reporters: ['progress', 'coverage'],

		frameworks: ['jasmine'],

		preprocessors: {
			'spec/**/*.spec.js': ['webpack']
		},

		// optionally, configure the reporter
		coverageReporter: {
			type: 'html',
			dir: 'coverage/'
		},
		webpack: {
			module: {
				loaders: [
					{
						test: /(\.js)$/,
						loader: 'babel',
						exclude: /(node_modules|bower_components)/
					}
				],
				postLoaders: [
					{
						test: /\.js$/,
						loader: 'istanbul-instrumenter',
						exclude: /(node_modules|resources\/js\/vendor)/
					}
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
			'karma-webpack'
		],
	});
};
