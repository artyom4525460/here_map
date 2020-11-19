const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './js/script.js',
  output: {
    filename: 'script.js',
    path: path.resolve(__dirname, 'dist'),
  },
};