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
// `nombre` es el nombre con el que se propone guardar el PDF (sin «.pdf»): Chrome lo toma del título de la página principal del navegador, no
// del marco que se imprime. El Planificador va dentro de un marco de la intranet, así que se cambia el título de las dos páginas (la del
// Planificador y la de la intranet, que es del mismo origen) mientras dura la impresión y después se devuelven los que tenían.
function paginasConTitulo() {
  const paginas = [document]
  try {
    if (window.top && window.top.document && window.top.document !== document) paginas.push(window.top.document)
  } catch (e) { /* la página principal es de otro origen: no se puede tocar su título */ }
  return paginas
}

export function imprimirHtml(html, nombre = '') {
  return new Promise((resolve, reject) => {
    const marco = document.createElement('iframe')
    marco.setAttribute('aria-hidden', 'true')
    marco.tabIndex = -1
    marco.style.cssText = 'position:fixed;left:-10000px;top:0;width:1123px;height:794px;border:0;visibility:hidden'
    const paginas = paginasConTitulo()
    const titulosAnteriores = paginas.map((p) => p.title)
    let restaurado = false
    const restaurarTitulo = () => {
      if (restaurado) return
      restaurado = true
      paginas.forEach((p, i) => { p.title = titulosAnteriores[i] })
      window.removeEventListener('afterprint', restaurarTitulo)
    }
    const quitar = () => window.setTimeout(() => { marco.remove(); restaurarTitulo() }, 60000)
    marco.onload = () => {
      window.setTimeout(() => {
        try {
          if (nombre) {
            paginas.forEach((p) => { p.title = nombre })
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
