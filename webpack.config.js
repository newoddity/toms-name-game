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
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader!sass-loader",
        })
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