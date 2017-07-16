/* global __dirname, module */

module.exports = {
  devtool: 'source-map',
  output: {
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
