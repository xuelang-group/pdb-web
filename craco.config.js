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
        target: "http://pdb-dev.xuelangyun.com:30080/proxr/1000184/55209/f6f16c60cd8b11ef85bdf748afbe794a/7000",
        changeOrigin: true,
        // onProxyReq(proxyReq) {
        //   // 设置Cookie
        //   proxyReq.setHeader('Cookie', 'dev.sid=s%3ARSsJnauHWD1S2Xu1-2gUusLAYeAcW0wr.%2FbKVdHNGmhU4EK2aLVHxxy35MQ6UVaHtBcTqVDVjPnc; Path=/; Expires=Fri, 10 Jan 2025 02:34:53 GMT; HttpOnl');
        // },
      },  
      '/indicator': {
        target: "http://sp10.xuelangyun.com:30080/proxr/80210299/56648/5db701007e0711ef95b3e5448473221c/7789",
        changeOrigin: true,
        pathRewrite: {
          '^/indicator': ''
        }
      },
      '/adapter': {
        target: "http://120.195.198.50:21881",
        changeOrigin: true,
      }
    },
  }
}