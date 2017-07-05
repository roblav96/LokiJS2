/* global __dirname, module */

module.exports = {
  name: "FullTextSearch",
  entry: {
    FullTextSearch: __dirname + '/src/index.js',
  },
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: 'loki.full-text-search.js',
    library: ['Loki', 'FullTextSearch'],
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
