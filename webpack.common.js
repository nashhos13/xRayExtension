const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    popup: path.resolve('src/popup/popup.tsx'),
    background: path.resolve('src/background/background.ts'),
    contentScript: path.resolve('src/contentScript/contentScript.tsx'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/static'),
          to: path.resolve('dist'),
        },
        {
          from: path.resolve('src/contentScript/contentScript.css'),
          to: path.resolve('dist')
        }
      ]
    }),
    ...getHtmlPlugins([
      'popup'
    ]),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve('dist'),
    publicPath: '/',
    chunkFilename: '[name].js',
  },
  optimization: {
    splitChunks: {
      chunks(chunk) {
        // Don't split background or contentScript so they stay self-contained in MV3
        return chunk.name !== 'contentScript' && chunk.name !== 'background';
      }
    },
  }
}

function getHtmlPlugins(chunks) {
  return chunks.map(chunk => new HtmlPlugin({
    title: 'xRay Extension',
    filename: `${chunk}.html`,
    chunks: [chunk],
  }))
}
