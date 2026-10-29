const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  devServer: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    // Mover el WebSocket de HMR de webpack a /webpack-dev-server
    // para que /ws quede libre para el proxy de la app (SockJS STOMP)
    webSocketServer: {
      options: {
        path: '/webpack-dev-server'
      }
    },
    client: {
      webSocketURL: {
        pathname: '/webpack-dev-server'
      }
    },
    proxy: {
      // Registro horario (módulo aparte, puerto 8124): en el servidor lo publica nginx quitando el prefijo.
      // Vue CLI usa la clave como expresión regular SIN anclar, de ahí el «^»: así no atrapa la ruta de la intranet
      // /dashboard/registro-horario. Va la primera para que '/api' no se quede con /registro-horario/api/...
      '^/registro-horario/': {
        target: 'http://127.0.0.1:8124',
        changeOrigin: true,
        pathRewrite: { '^/registro-horario': '' }
      },
      '/api': {
        target: 'http://localhost:8986',
        changeOrigin: true
      },
      '/ws': {
        target: 'http://localhost:8986',
        changeOrigin: true,
        ws: true
      }
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
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimizer('terser').tap((args) => {
        args[0].terserOptions = args[0].terserOptions || {}
        args[0].terserOptions.compress = args[0].terserOptions.compress || {}
        args[0].terserOptions.compress.drop_console = true
        args[0].terserOptions.compress.drop_debugger = true
        return args
      })
    }
  },
  css: {
    extract: {
      ignoreOrder: true  
    }
  }
})