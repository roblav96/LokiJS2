var webpack = require('webpack');
const prod = process.argv.indexOf('-p') !== -1;

var libraryName = 'Loki';

var outputFile;

if (prod) {
	outputFile = 'loki.min.js';
} else {
	outputFile = 'loki.js';
}

let core = {
	name: "core",
	entry: {
		core: __dirname + '/src/core/loki.js',
	},
	devtool: 'source-map',
	output: {
		path: __dirname + '/lib',
		filename: outputFile,
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	externals: {
		"fs": "fs"
	},
	module: {
		loaders: [
			{
				test: /(\.js)$/,
				loader: "eslint-loader",
				exclude: /(node_modules|bower_components)/
			}
		]
	}
};

if (prod) {
	outputFile = 'loki.[name].min.js';
} else {
	outputFile = 'loki.[name].js';
}

let extensions = {
	name: "extensions",
	entry: {
		FullTextSearch: __dirname + '/src/inverted_index/index.js',
	},
	devtool: 'source-map',
	output: {
		path: __dirname + '/lib',
		filename: outputFile,
		library: [libraryName, '[name]'],
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	externals: {
		"Loki": "Loki"
	},
	module: {
		loaders: [
			{
				test: /(\.js)$/,
				loader: "eslint-loader",
				exclude: /(node_modules|bower_components)/
			}
		]
	}
};

module.exports = [core, extensions];
