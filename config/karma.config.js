var path = require('path');

module.exports = function (config) {
	config.set({
		browsers: ['Chrome'],
		files: [
			{pattern: '../spec/**/*.spec.js', watched: false}
		],

		// coverage reporter generates the coverage
		reporters: ['progress'],

		frameworks: ['jasmine'],

		preprocessors: {
			'../spec/**/*.spec.js': ['webpack']
		},

		webpack: {
			module: {
				loaders: [
					{
						test: /(\.js)$/,
						loader: 'babel',
						exclude: /(node_modules|bower_components)/
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
			'karma-jasmine',
			'karma-webpack'
		],
	});
};
