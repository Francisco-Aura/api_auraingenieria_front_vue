const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({

  // ─── CACHE BUSTING ────────────────────────────────────────────────────────
  // Garantiza que cada build genera hashes únicos en los nombres de archivo.
  // Si el contenido cambia → el hash cambia → el navegador descarga el nuevo.
  filenameHashing: true,

  // ─── DEV SERVER ───────────────────────────────────────────────────────────
  devServer: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },

  // ─── WEBPACK ──────────────────────────────────────────────────────────────
  configureWebpack: {
    plugins: [
      new (require('webpack')).DefinePlugin({
        '__VUE_OPTIONS_API__': JSON.stringify(true),
        '__VUE_PROD_DEVTOOLS__': JSON.stringify(false),
        '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': JSON.stringify(false),
      })
    ],
    performance: {
      hints: false,
      maxAssetSize: 1024 * 1024,
      maxEntrypointSize: 1024 * 1024
    }
  },

  // ─── CHAIN WEBPACK ────────────────────────────────────────────────────────
  chainWebpack: (config) => {

    // ── Meta-tags anti-caché en el index.html generado ──────────────────────
    // Aunque la solución real es el servidor, estas meta-tags son una red de
    // seguridad adicional para navegadores y proxies que las respetan.
    config.plugin('html').tap(args => {
      args[0].meta = {
        ...(args[0].meta || {}),
        'cache-control': {
          'http-equiv': 'Cache-Control',
          content: 'no-cache, no-store, must-revalidate'
        },
        'pragma': {
          'http-equiv': 'Pragma',
          content: 'no-cache'
        },
        'expires': {
          'http-equiv': 'Expires',
          content: '0'
        }
      }
      return args
    })

    // ── Producción ───────────────────────────────────────────────────────────
    if (process.env.NODE_ENV === 'production') {

      // Elimina console.log y debugger del bundle final
      config.optimization.minimizer('terser').tap((args) => {
        args[0].terserOptions = args[0].terserOptions || {}
        args[0].terserOptions.compress = args[0].terserOptions.compress || {}
        args[0].terserOptions.compress.drop_console = true
        args[0].terserOptions.compress.drop_debugger = true
        return args
      })

      // ── Code splitting inteligente ─────────────────────────────────────────
      // Divide node_modules en chunks separados según el vendor.
      // Resultado: si actualizas solo tu código, el chunk de vendors no cambia
      // → el navegador lo mantiene en caché y solo descarga lo que cambió.
      config.optimization.splitChunks({
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          // Vue core y router en su propio chunk
          vue: {
            name: 'chunk-vue',
            test: /[\\/]node_modules[\\/](vue|vue-router)[\\/]/,
            priority: 30,
            reuseExistingChunk: true
          },
          // PrimeVue separado (es grande, cambia poco)
          primevue: {
            name: 'chunk-primevue',
            test: /[\\/]node_modules[\\/]primevue[\\/]/,
            priority: 25,
            reuseExistingChunk: true
          },
          // Chart.js separado (es grande, cambia poco)
          charts: {
            name: 'chunk-charts',
            test: /[\\/]node_modules[\\/](chart\.js|vue-chartjs)[\\/]/,
            priority: 20,
            reuseExistingChunk: true
          },
          // Resto de node_modules en un chunk común
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            reuseExistingChunk: true
          }
        }
      })
    }
  },

  // ─── CSS ──────────────────────────────────────────────────────────────────
  css: {
    extract: {
      ignoreOrder: true
    }
  }
})