const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  devServer: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  configureWebpack: {
    plugins: [
      new (require('webpack')).DefinePlugin({
        '__VUE_OPTIONS_API__': JSON.stringify(true),
        '__VUE_PROD_DEVTOOLS__': JSON.stringify(false),
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(false)
      })
    ],
    performance: {
      hints: false,  // Disable size warnings
      maxAssetSize: 1024 * 1024,  // 1 MiB
      maxEntrypointSize: 1024 * 1024  // 1 MiB
    }
  },
  css: {
    extract: {
      ignoreOrder: true  
    }
  }
})