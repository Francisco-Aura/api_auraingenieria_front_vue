const LADO_MAXIMO = 256

// El presupuesto entero (con el logo, los strings y las filas) no puede pasar de 1,5 millones de caracteres al guardarlo en el servidor
// (si no, responde «demasiado grande» y no se guarda nada), así que el encaje se queda en 600.000 y deja sitio de sobra al resto
const ENCAJE_MAX_CARACTERES = 600000

/**
 * El «encaje» (disposición de los paneles en el proyecto): una imagen más grande que un logo. Se reduce en el navegador a un máximo de
 * 1600 px y se guarda como JPG sobre fondo blanco, bajando tamaño y calidad hasta que cabe; el SVG se deja tal cual si no es enorme.
 */
export function prepararEncaje(archivo) {
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(archivo.type)) {
    return Promise.reject(new Error('El encaje tiene que ser una imagen PNG, JPG, WebP o SVG'))
  }
  const demasiado = () => new Error('La imagen es demasiado grande: reduce su tamaño o súbela en menor resolución')
  const leer = new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result))
    lector.onerror = () => reject(new Error('No se pudo leer la imagen'))
    lector.readAsDataURL(archivo)
  })
  if (archivo.type === 'image/svg+xml') return leer.then((uri) => { if (uri.length > ENCAJE_MAX_CARACTERES) throw demasiado(); return uri })
  return leer.then(
    (origen) =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          for (const [lado, calidad] of [[1600, 0.85], [1400, 0.78], [1200, 0.7], [1000, 0.65], [800, 0.6]]) {
            const escala = Math.min(1, lado / Math.max(img.width, img.height))
            const lienzo = document.createElement('canvas')
            lienzo.width = Math.max(1, Math.round(img.width * escala))
            lienzo.height = Math.max(1, Math.round(img.height * escala))
            const ctx = lienzo.getContext('2d')
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, lienzo.width, lienzo.height)
            ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height)
            const uri = lienzo.toDataURL('image/jpeg', calidad)
            if (uri.length <= ENCAJE_MAX_CARACTERES) return resolve(uri)
          }
          reject(demasiado())
        }
        img.onerror = () => reject(new Error('La imagen no es válida'))
        img.src = origen
      })
  )
}

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
