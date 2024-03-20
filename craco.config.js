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
        console.log(webpackConfig.output.assetModuleFilename)
        webpackConfig.output.assetModuleFilename = pathData => {
          if ((/\.(woff2?|woff|ttf|svg)(\?.*)?$/.test(pathData.filename)) && pathData.filename.includes("iconfont")) {
            return '[name].[hash][ext]';
          }
          return 'static/media/[name].[hash][ext]';
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
      '/pdb': {
        target: "http://10.88.40.73/proxr/1000001/55525/e95da870e5d811ee82431bb9a133ffae/7000",
        changeOrigin: true,
        onProxyReq(proxyReq) {
          // 设置Cookie
          proxyReq.setHeader('Cookie', 'os.sid=s%3ApnSmXsKWeeMZDD3JoKjRhUzg1OjFRcu9.sOXJ2NiyOlw%2Fgx19izgvYGcghBzhoThAIovst4tc8dU; Path=/; Expires=Wed, 20 Mar 2024 11:11:22 GMT; HttpOnly');
        },
      },
    },
  }
}