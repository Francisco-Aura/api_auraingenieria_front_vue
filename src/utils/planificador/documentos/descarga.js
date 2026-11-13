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
// `nombre` es el nombre con el que se propone guardar el PDF (sin «.pdf»): el navegador lo toma del título de la página principal, no del
// del marco, así que se pone ese título mientras dura la impresión y después se devuelve el que tenía.
export function imprimirHtml(html, nombre = '') {
  return new Promise((resolve, reject) => {
    const marco = document.createElement('iframe')
    marco.setAttribute('aria-hidden', 'true')
    marco.tabIndex = -1
    marco.style.cssText = 'position:fixed;left:-10000px;top:0;width:1123px;height:794px;border:0;visibility:hidden'
    const tituloAnterior = document.title
    let restaurado = false
    const restaurarTitulo = () => {
      if (restaurado) return
      restaurado = true
      document.title = tituloAnterior
      window.removeEventListener('afterprint', restaurarTitulo)
    }
    const quitar = () => window.setTimeout(() => { marco.remove(); restaurarTitulo() }, 60000)
    marco.onload = () => {
      window.setTimeout(() => {
        try {
          if (nombre) {
            document.title = nombre
            window.addEventListener('afterprint', restaurarTitulo)
            if (marco.contentDocument) marco.contentDocument.title = nombre
          }
          marco.contentWindow.focus()
          marco.contentWindow.print()
          quitar()
          resolve()
        } catch (e) {
          marco.remove()
          restaurarTitulo()
          reject(e)
        }
      }, 800)
    }
    document.body.appendChild(marco)
    marco.srcdoc = html
  })
}
