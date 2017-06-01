const execSync = require('child_process').execSync;
const nodeRoot = execSync('npm root -g').toString().trim();

const path = require('path');
const dpatNodeModulesPath = path.join(nodeRoot, '@deskproapps', 'dpat', 'node_modules');

const webpack = require('@deskproapps/dpat/node_modules/webpack');
const ExtractTextPlugin = require('@deskproapps/dpat/node_modules/extract-text-webpack-plugin');
const WriteFilePlugin = require('@deskproapps/dpat/node_modules/write-file-webpack-plugin');

module.exports = function (env) {

  const PROJECT_ROOT_PATH = env && env.DP_PROJECT_ROOT ? env.DP_PROJECT_ROOT : path.resolve(__dirname, '../../');
  const ASSET_PATH = 'assets';

  const copyWebpackPlugin = require('./CopyAssets').copyWebpackPlugin(PROJECT_ROOT_PATH)('target');
  const extractCssPlugin = new ExtractTextPlugin({
    filename: '[name].css',
    publicPath: `/${ASSET_PATH}/`,
    allChunks: true
  });

  const configParts = [{}];
  configParts.push({
    devServer: {
      contentBase: path.resolve(PROJECT_ROOT_PATH, 'target'),
      clientLogLevel: 'warning',
      hot: true,
      historyApiFallback: true,
      port: 31080,
      publicPath: ['/', ASSET_PATH, '/'].join(''),
      watchContentBase: true,
      headers : {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, CONNECT, OPTIONS, TRACE',
        'Access-Control-Allow-Headers': 'Origin, X-Agent-Request'
      }
    },
    externals: {
      'react': 'React',
      'react-dom': 'ReactDOM',
      '@deskproapps/deskproapps-sdk-core': 'DeskproAppsSDKCore'
    },
    devtool: 'inline-source-map',
    entry: {
      main: [
        `webpack-dev-server/client?http://localhost:31080`,
        path.resolve(PROJECT_ROOT_PATH, 'src/webpack/entrypoint.js')
      ],
      vendor: ['react', 'react-dom', '@deskproapps/deskproapps-sdk-core']
    },
    module: {
      loaders: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          include: [path.resolve(PROJECT_ROOT_PATH, 'src/main/javascript'),]
        },
        {
          test: /\.css$/,
          use: extractCssPlugin.extract({use: ['style-loader', 'css-loader']})
        },
        {
          include: [path.resolve(PROJECT_ROOT_PATH, 'src/main/sass')],
          loader: extractCssPlugin.extract({use: ['css-loader', 'sass-loader']}),
          test: /\.scss$/
        }
      ],
    },
    output: {
      chunkFilename: `${ASSET_PATH}/'[name].js'`,
      filename: '[name].js',
      path: path.resolve(PROJECT_ROOT_PATH, 'target'),
      publicPath: ['/', ASSET_PATH, '/'].join('')
    },
    plugins: [
      extractCssPlugin,

      new webpack.optimize.CommonsChunkPlugin({name: ['vendor'], minChunks: Infinity}),
      new webpack.NamedModulesPlugin(),
      copyWebpackPlugin,
      new WriteFilePlugin({
        test: /\html\/|assets\/|dists\/|manifest\.json/,
        useHashIndex: false
      }),

      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
    ],
    resolve: {
      extensions: ['*', '.js', '.jsx', '.scss', '.css'],
      modules: [ "node_modules", dpatNodeModulesPath ],
    },
    resolveLoader: {
      modules: [ "node_modules", dpatNodeModulesPath ],
    },
    node: {fs: 'empty'},
    bail: true
  });

  return Object.assign.apply(Object, configParts);
};