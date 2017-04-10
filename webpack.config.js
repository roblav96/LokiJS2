var webpack = require('webpack');
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var path = require('path');
var env = require('yargs').argv.mode;

var libraryName = 'Loki';

var outputFile;
var plugins = [];

if (env === 'build') {
	plugins.push(new UglifyJsPlugin({minimize: true}));
	outputFile = libraryName + '.min.js';
} else {
	outputFile = libraryName + '.js';
}

var core = {
	name: "core",
	entry: {
		core: __dirname + '/src/core/index.js',
	},
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, '/lib'),
		filename: outputFile,
		library: libraryName,
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	externals: {
		"fs": "fs"
	},
	eslint: {
    configFile: 'config/eslintrc.js'
  },
	module: {
		loaders: [
			{
				test: /(\.js)$/,
				loader: 'babel',
				exclude: /(node_modules|bower_components)/
			},
			{
				test: /(\.js)$/,
				loader: "eslint-loader",
				exclude: /(node_modules|bower_components)/
			}
		]
	},
	resolve: {
		root: path.resolve('./src'),
		extensions: ['', '.js']
	},
	plugins: plugins
};

if (env === 'build') {
	plugins.push(new UglifyJsPlugin({minimize: true}));
	outputFile = libraryName + '.[name].min.js';
} else {
	outputFile = libraryName + '.[name].js';
}

var modules = {
	name: "modules",
	entry: {
		fts: __dirname + '/src/inverted_index/index.js',
	},
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, '/lib'),
		filename: outputFile,
		library: [libraryName + 'Modules', "[name]"],
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	externals: {
		"fs": "fs"
	},
	eslint: {
		configFile: 'config/eslintrc.js'
	},
	module: {
		loaders: [
			{
				test: /(\.js)$/,
				loader: 'babel',
				exclude: /(node_modules|bower_components)/
			},
			{
				test: /(\.js)$/,
				loader: "eslint-loader",
				exclude: /(node_modules|bower_components)/
			}
		]
	},
	resolve: {
		root: path.resolve('./src'),
		extensions: ['', '.js']
	},
	plugins: plugins
};

module.exports = [core, modules];
