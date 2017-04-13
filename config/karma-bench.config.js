var path = require('path');

module.exports = function (config) {
	config.set({
		browsers: ['Chrome'],
		files: [
			{pattern: '../bench/**/*.bench.js', watched: false}
		],

		// coverage reporter generates the coverage
		reporters: ['benchmark', 'junit'],

		frameworks: ['benchmark'],

		preprocessors: {
			'../bench/**/*.bench.js': ['webpack']
		},

		junitReporter: {
			outputDir: '../reports/bench/',
			outputFile: 'benchmark.xml'
		},

		browserNoActivityTimeout: 60000,

		webpack: {
			externals: {
				"fs": "fs"
			},
			watch: true
		},
		webpackServer: {
			noInfo: true
		},
		plugins: [
			'karma-benchmark',
			'karma-benchmarkjs-reporter',
			'karma-chrome-launcher',
			'karma-junit-reporter',
			'karma-webpack'
		],
	});
};
