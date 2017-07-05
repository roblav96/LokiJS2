/* global __dirname, module */

module.exports = {
  name: "IndexedAdapter",
  entry: {
    FileSystem: __dirname + '/src/index.js',
  },
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: 'loki.adapter.indexed-adapter.js',
    library: ['Loki', 'Adapter', 'IndexedAdapter'],
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
