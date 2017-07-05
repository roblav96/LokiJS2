/* global __dirname, module */

module.exports = {
  name: "LocalStorage",
  entry: {
    LocalStorage: __dirname + '/src/index.js',
  },
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: 'loki.adapter.local-storage.js',
    library: ['Loki', 'Adapter', 'LocalStorage'],
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
