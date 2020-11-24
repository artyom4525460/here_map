const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './js/mapbox.js',
  output: {
    filename: 'mapbox.js',
    path: path.resolve(__dirname, 'dist'),
  },
};