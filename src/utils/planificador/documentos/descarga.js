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
