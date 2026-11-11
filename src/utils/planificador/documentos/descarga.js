// Descarga un archivo con su nombre. Se hace con un enlace temporal: abrir una pestaña tras una petición asíncrona lo bloquea el navegador.
export function descargarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// Abre el cuadro de impresión de un documento HTML (para guardarlo como PDF) sin salir de la página: se carga en un marco oculto del
// tamaño de un A4 apaisado, con una pausa para que se pinten sus imágenes y diapositivas. Rechaza si el navegador no deja imprimirlo.
export function imprimirHtml(html) {
  return new Promise((resolve, reject) => {
    const marco = document.createElement('iframe')
    marco.setAttribute('aria-hidden', 'true')
    marco.tabIndex = -1
    marco.style.cssText = 'position:fixed;left:-10000px;top:0;width:1123px;height:794px;border:0;visibility:hidden'
    const quitar = () => window.setTimeout(() => marco.remove(), 60000)
    marco.onload = () => {
      window.setTimeout(() => {
        try {
          marco.contentWindow.focus()
          marco.contentWindow.print()
          quitar()
          resolve()
        } catch (e) {
          marco.remove()
          reject(e)
        }
      }, 800)
    }
    document.body.appendChild(marco)
    marco.srcdoc = html
  })
}
