// webpack.node.config.js

const webpack = require('webpack')
const path = require('path')
const libraryName = 'Gateway'
const nodeExternals = require('webpack-node-externals')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const plugins = []
const outputFile = 'index.js'

module.exports = {
  externals: [
    nodeExternals({ whitelist: ['@idn/js-idn'] })
  ],
  mode: 'production',
  optimization: {
    minimizer: [
      // we specify a custom UglifyJsPlugin here to get source maps in production
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        uglifyOptions: {
          compress: false,
          ecma: 6,
          mangle: {
            safari10: true,
            keep_fnames: true,
            keep_classnames: true
          }
        },
        sourceMap: true
      })
    ],
    portableRecords: true,
    removeAvailableModules: true,
    mergeDuplicateChunks: true,
    occurrenceOrder: true,
    // runtimeChunk: 'single',
    minimize: false,
    namedModules: true
    // splitChunks: {
    //   chunks: 'all'
    // }
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  module: {
    rules: [
      {
        loader: 'ts-loader',
        test: /\.tsx?$/,
        type: 'javascript/auto'
      },
      {
        loader: 'babel-loader',

        // Skip any files outside of your project's `src` directory
        include: [path.resolve(__dirname, 'src')],

        // Only run `.js` and `.jsx` files through Babel
        test: /\.jsx?$/,

        // Options to configure babel with
        query: {
          plugins: ['transform-runtime'],
          presets: ['es2015', 'stage-0']
        }
      },
      // {
      //   test: /webcrypto-shim\.js$/,
      //   loader: 'string-replace-loader',
      //   query: {
      //     search: '_crypto.subtle = _subtle;',
      //     replace: 'try{_crypto.subtle = _subtle;}catch(e){}'
      //   }
      // },
      {
        test: /\.proto$/,
        use: ['json-loader', 'proto-loader6']
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  entry: [
    // Set up an ES6-ish environment
    // 'babel-polyfill',

    // Add your application's scripts below
    path.resolve(__dirname, './src/index.ts')
  ],
  target: 'node',
  devtool: 'source-map',
  plugins: plugins,
  resolve: {
    extensions: ['.ts', '.js', '.json']
  }
}
