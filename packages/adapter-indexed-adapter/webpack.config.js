/* global __dirname, module */

module.exports = {
  name: "FileSystem",
  entry: {
    FileSystem: __dirname + '/src/index.js',
  },
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: 'loki.adapter.file-system.js',
    library: ['Loki', 'Adapter', 'FileSystem'],
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  externals: {
    "Loki": "Loki",
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
