/* global __dirname, module */

module.exports = {
  name: "Core",
  entry: {
    Core: __dirname + '/src/index.js',
  },
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: 'loki.core.js',
    library: ['Loki', 'Core'],
    libraryTarget: 'umd',
    umdNamedDefine: true
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
