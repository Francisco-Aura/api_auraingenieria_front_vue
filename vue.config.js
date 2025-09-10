const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  configureWebpack: {
    plugins: [
      new (require('webpack')).DefinePlugin({
        '__VUE_OPTIONS_API__': JSON.stringify(true),
        '__VUE_PROD_DEVTOOLS__': JSON.stringify(false),
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(false)
      })
    ],
    resolve: {
      alias: {
        // Usar versión más pequeña de moment.js si se detecta
        'moment': 'moment/min/moment.min.js'
      }
    },
    externals: process.env.NODE_ENV === 'production' ? {
      // Excluir librerías pesadas que se pueden cargar desde CDN
      // 'chart.js': 'Chart'
    } : {},
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Separar vendors grandes en chunks específicos
          primevue: {
            name: 'primevue',
            test: /[\\/]node_modules[\\/]primevue[\\/]/,
            priority: 20,
            chunks: 'all'
          },
          fontawesome: {
            name: 'fontawesome',
            test: /[\\/]node_modules[\\/]@fortawesome[\\/]/,
            priority: 20,
            chunks: 'all'
          },
          chartjs: {
            name: 'chartjs',
            test: /[\\/]node_modules[\\/](chart\.js|vue-chartjs)[\\/]/,
            priority: 20,
            chunks: 'all'
          },
          sweetalert: {
            name: 'sweetalert',
            test: /[\\/]node_modules[\\/]sweetalert2[\\/]/,
            priority: 20,
            chunks: 'all'
          },
          // Vendor común para el resto de dependencias
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'all'
          }
        }
      }
    }
  },
  
  chainWebpack: config => {
    // Configurar prefetch solo para chunks importantes
    if (config.plugins.has('prefetch')) {
      config.plugin('prefetch').tap(options => {
        options[0].fileBlacklist = options[0].fileBlacklist || []
        options[0].fileBlacklist.push(/fontawesome.*\.js$/, /primevue.*\.js$/)
        return options
      })
    }
  }
})

//prueba pipeline