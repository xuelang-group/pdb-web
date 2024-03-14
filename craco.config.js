const path = require('path');
const resolve = dir => path.resolve(__dirname, dir);
// const webpack = require('webpack');

module.exports = {
  plugins: [{
    plugin: require('craco-less'),
    options: {
      lessLoaderOptions: {
        lessOptions: {
          modifyVars: { '@ant-prefix': 'pdb-ant' },
          javascriptEnabled: true,
        },
      },
    }
  }],
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === 'production') {
        webpackConfig.output.filename = 'static/js/[name].js'; // 修改为你想要的文件名
        webpackConfig.output.chunkFilename = 'static/js/[name].chunk.js';
        webpackConfig.output.library = 'PDB';
        webpackConfig.output.libraryTarget = 'umd';

        // 移除 MiniCssExtractPlugin 插件中 CSS 文件的 hash
        const miniCssExtractPlugin = webpackConfig.plugins.find(
          (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
        );
        if (miniCssExtractPlugin) {
          miniCssExtractPlugin.options.filename = 'static/css/[name].css'; // 修改为你想要的 CSS 文件名
          miniCssExtractPlugin.options.chunkFilename = 'static/css/[name].chunk.css';
        }
        webpackConfig.output.publicPath = "./";
      }

      webpackConfig.ignoreWarnings = [/Failed to parse source map/];

      return webpackConfig;
    },
    alias: {
      '@': resolve('./src')
    }
  },
  devServer: {
    proxy: {
      '/pdb/api/v1': {
        target: "http://10.88.40.73/proxr/1000001/55525/08b403e0e1a611eeb5077d099eb5e29a/7000",
        changeOrigin: true,
        onProxyReq(proxyReq) {
          // 设置Cookie
          proxyReq.setHeader('Cookie', 'os.sid=s%3A6jkOH4kSg2i08ddAjLnoSXOUvsr3hRUI.IMy5LENeOQUJIRS5FSXfyOuDcUh8cuRdlJF0tTl6NgE; Path=/; Expires=Thu, 14 Mar 2024 11:43:34 GMT; HttpOnly');
        },
      },
    },
  }
}