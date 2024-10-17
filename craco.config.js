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
        target: "http://139.224.200.224:30080/pdb",
        changeOrigin: true,
        // onProxyReq(proxyReq) {
        //   // 设置Cookie
        //   proxyReq.setHeader('Cookie', 'os.sid=s%3AulMkyM8OURwh3O1HDKz3OIRzM4hevtmG.z7OEj7FlH%2BqXougGOYU%2FgiARC998UjjPHfAM4lXqFUI; Path=/; Expires=Tue, 26 Mar 2024 11:51:16 GMT; HttpOnly');
        // },
      },  
      '/indicator': {
        target: "http://139.224.200.224:30080/pdb/indicator",
        changeOrigin: true,
        pathRewrite: { '^/indicator' : '' },
      }
    },
  }
}