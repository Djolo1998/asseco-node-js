'use strict';

const { resolve } = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const NodemonPlugin = require('nodemon-webpack-plugin');
const packageJson = require('./package.json');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env = {}) => {
  const config = {
    name: 'personal-finance-management-api',
    target: 'node',
    entry: ['./index.js'],
    mode: env.development ? 'development' : 'production',
    node: {
      __dirname: false, // Fix for native node __dirname
      __filename: false, // Fix for native node __filename
    },
    output: {
      filename: `${packageJson.name}.js`,
      path: resolve(__dirname, 'out'),
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'api', to: resolve(__dirname, 'out/api') },
        ],
      }),
    ],  
    resolve: {
      extensions: ['.js', '.ts']
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: /node_modules/,
        },
      ]
    },
    optimization: {
      minimize: false
    }
  };

  if (env.nodemon) {
    config.watch = true;
    config.plugins.push(new NodemonPlugin());
  }

  if (env.analyse) {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static', // Generates file instead of starting a web server
      })
    );
  }

  return config;
};