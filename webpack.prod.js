const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          // Keep console logs during debugging so we can see content script traces
          drop_console: false,
        },
      },
    })],
    // Ensure contentScript and background are not split into additional chunks in MV3
    splitChunks: {
      chunks(chunk) {
        return chunk.name !== 'contentScript' && chunk.name !== 'background';
      }
    }
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 1024 * 1024, // 1 MiB
    maxAssetSize: 1024 * 1024
  }
});
