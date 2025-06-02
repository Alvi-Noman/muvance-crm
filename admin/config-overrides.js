const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    process: require.resolve('process/browser.js'), // Explicitly specify .js extension
    buffer: require.resolve('buffer/'),
    util: require.resolve('util/'),
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js', // Updated to include .js
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process': '{}', // Provide a minimal process object to avoid undefined errors
    }),
  ];

  // Disable HMR if it causes issues (optional)
  if (process.env.NODE_ENV === 'development') {
    config.devServer = {
      ...config.devServer,
      hot: false, // Disable HMR temporarily to test
    };
  }

  return config;
};