/* global module */

module.exports = [
  require('./packages/core/webpack.config'),
  require('./packages/full-text-search/webpack.config'),
  require('./packages/adapter-fs-adapter/webpack.config'),
  require('./packages/adapter-local-storage/webpack.config'),
];
