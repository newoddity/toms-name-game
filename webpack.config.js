const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

const config = {
  context: path.resolve(__dirname, 'source'),
  entry: {
    //polyfill: 'babel-polyfill',
    app: './app.js',
  },
  output: {
    path: path.resolve(__dirname, 'distribution'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: [{
          loader: 'style-loader', // inject CSS to page
        }, {
          loader: 'css-loader', // translates CSS into CommonJS modules
        }, {
          loader: 'postcss-loader', // Run post css actions
          options: {
            plugins: function () { // post css plugins, can be exported to postcss.config.js
              return [
                require('precss'),
                require('autoprefixer')
              ];
            }
          }
        }, {
          loader: 'sass-loader' // compiles Sass to CSS
        }]
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env']
            ]
          }
        }
      }
    ]
  },
  devtool: 'inline-source-map',
  devServer: {
    port: 3000,   //Tell dev-server which port to run
    open: true,   // to open the local server in browser
    contentBase: path.resolve(__dirname, 'dist') //serve from 'dist' folder
  },
  plugins: [
    new CleanWebpackPlugin(['dist']), //cleans the dist folder
    new ExtractTextPlugin("css/styles.css"), //etracts css to dist/css/styles.css
    new HtmlWebpackPlugin({
      title: "Tom's Name Game", //Remove or change to change title in index.html
      template: 'index.ejs'
    })
  ]
};

module.exports = config;