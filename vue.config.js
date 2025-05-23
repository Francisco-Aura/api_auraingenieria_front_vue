// vue.config.js

const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  // Desactiva la inyección automática para controlar manualmente (opcional, si es necesario)
  // cadena de Webpack para asegurar que los scripts se inyectan como módulos ES
  chainWebpack: config => {
    // Asegurarse de que el atributo type="module" se añada a los scripts.
    // Vue CLI 5 debería hacerlo por defecto, pero si no, esto puede forzarlo.
    config.plugin('html')
      .tap(args => {
        args[0].scriptLoading = 'module';
        return args;
      });
  }
});