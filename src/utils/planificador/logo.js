const LADO_MAXIMO = 256

/** Reduce el logo a un máximo de 256 px y lo devuelve como data URI (PNG; el SVG se deja tal cual). */
export function prepararLogo(archivo, ladoMaximo = LADO_MAXIMO) {
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(archivo.type)) {
    return Promise.reject(new Error('El logo tiene que ser PNG, JPG, WebP o SVG'))
  }
  const leer = new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result))
    lector.onerror = () => reject(new Error('No se pudo leer la imagen'))
    lector.readAsDataURL(archivo)
  })
  if (archivo.type === 'image/svg+xml') return leer
  return leer.then(
    (origen) =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height))
          const lienzo = document.createElement('canvas')
          lienzo.width = Math.max(1, Math.round(img.width * escala))
          lienzo.height = Math.max(1, Math.round(img.height * escala))
          lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height)
          resolve(lienzo.toDataURL('image/png'))
        }
        img.onerror = () => reject(new Error('La imagen no es válida'))
        img.src = origen
      })
  )
}
