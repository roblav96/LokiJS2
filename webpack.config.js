var webpack = require('webpack');
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var path = require('path');
var env = require('yargs').argv.mode;

var libraryName = 'lokijs';

var outputFile;
var plugins = [];

if (env === 'build') {
	plugins.push(new UglifyJsPlugin({minimize: true}));
	outputFile = libraryName + '.[name].min.js';
} else {
	outputFile = libraryName + '.[name].js';
}

var config = {
	entry: {
		core: __dirname + '/src/core/index.js',
		memory: __dirname + '/src/memory.js',
		loki: __dirname + '/src/lokijs.js',
		inv: __dirname + '/src/inverted_index/full_text_search.js',
	},
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, '/lib'),
		filename: outputFile,
		library: [libraryName, '[name]'],
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

module.exports = config;
