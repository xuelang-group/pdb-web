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
        target: "http://pdb-dev.xuelangyun.com:30080",
        changeOrigin: true,
        onProxyReq(proxyReq) {
          // 设置Cookie
          proxyReq.setHeader('Cookie', 'pdb-dev.sid=s%3AJYtVZK_73rQiiyDKfkVTwD2kh0nunhri.IYMyewag%2BBXcSDsKW5VUIfyxuwGNeb7RycJjFEqCDcg; SL_G_WPT_TO=en; NG_TRANSLATE_LANG_KEY=zh_CN; SL_GWPT_Show_Hide_tmp=1; SL_wptGlobTipTmp=1');
        },
      },
    },
  }
}