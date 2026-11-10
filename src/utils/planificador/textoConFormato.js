// Los textos de las guías vienen en texto plano con marcas sencillas (líneas ━━━, viñetas •, emojis). Aquí se interpretan para mostrarlos
// con formato, sin cambiar el texto guardado. Devuelve bloques: { tipo: 'titulo'|'lista'|'aviso'|'paso'|'parrafo', … } con sus trozos en línea.

const SEPARADOR = /^[\s━─═—\-_=*~]{3,}$/
const VINETA = /^\s*([•▪◦·\-*→□☐✓✔])\s+(.*)$/u
const AVISO = /^\s*(🔴|🟢|🟡|🟠|⚠️|⚠|📌|📢|⏱️|🚦|📋|🔗|✅|📤|📝|🚀)\s*(.*)$/u
const PASO = /^\s*(\d+)[.)]\s+(.*)$/
const ETIQUETA = /^([^:.]{2,44}):\s+(.*)$/
const EN_LINEA = /(_{3,})|(\[[^\]\n]{1,60}\])|(https?:\/\/[^\s)]+)/g

const TONOS = { '🔴': 'danger', '🟢': 'ok', '🟡': 'warn', '🟠': 'warn', '⚠️': 'warn', '⚠': 'warn' }

// Los cuadritos (□ ☐) se muestran como punto: dentro de una descripción no son casillas que se puedan marcar (lo marcable son las subtareas)
export const GLIFOS = { '→': '→', '□': '•', '☐': '•', '✓': '✓', '✔': '✓' }

/** Huecos para rellenar (___), marcadores [así] y enlaces. */
export function enLinea(texto) {
  const trozos = []
  let ultimo = 0
  for (const m of texto.matchAll(EN_LINEA)) {
    const en = m.index ?? 0
    if (en > ultimo) trozos.push({ tipo: 'texto', texto: texto.slice(ultimo, en) })
    if (m[1]) trozos.push({ tipo: 'hueco' })
    else if (m[2]) trozos.push({ tipo: 'marca', texto: m[2].slice(1, -1) })
    else trozos.push({ tipo: 'enlace', texto: m[3] })
    ultimo = en + m[0].length
  }
  if (ultimo < texto.length) trozos.push({ tipo: 'texto', texto: texto.slice(ultimo) })
  return trozos
}

/** «Etiqueta: valor» con la etiqueta en negrita. */
export function conEtiqueta(texto) {
  const m = ETIQUETA.exec(texto)
  if (!m || /^https?$/i.test(m[1])) return { etiqueta: null, trozos: enLinea(texto) }
  return { etiqueta: m[1], trozos: enLinea(m[2]) }
}

export function bloquesDeTexto(texto) {
  const lineas = texto.replace(/\r/g, '').split('\n')
  const esSeparador = lineas.map((l) => l.trim().length >= 3 && SEPARADOR.test(l.trim()))
  const salida = []
  let lista = []
  const cerrarLista = () => {
    if (lista.length === 0) return
    salida.push({ tipo: 'lista', elementos: lista.map((it) => ({ marcador: GLIFOS[it.marcador] ?? '•', ...conEtiqueta(it.texto) })) })
    lista = []
  }
  lineas.forEach((cruda, i) => {
    const linea = cruda.trimEnd()
    if (esSeparador[i]) return cerrarLista()
    if (!linea.trim()) return cerrarLista()
    // Una línea entre dos separadores es un título de sección
    if (i > 0 && i < lineas.length - 1 && esSeparador[i - 1] && esSeparador[i + 1]) {
      cerrarLista()
      salida.push({ tipo: 'titulo', trozos: enLinea(linea.trim()) })
      return
    }
    const vineta = VINETA.exec(linea)
    if (vineta) {
      lista.push({ marcador: vineta[1], texto: vineta[2] })
      return
    }
    cerrarLista()
    const aviso = AVISO.exec(linea)
    if (aviso) {
      salida.push({ tipo: 'aviso', tono: TONOS[aviso[1]] ?? 'info', icono: aviso[1], ...conEtiqueta(aviso[2]) })
      return
    }
    const paso = PASO.exec(linea)
    if (paso) {
      salida.push({ tipo: 'paso', numero: paso[1], ...conEtiqueta(paso[2]) })
      return
    }
    salida.push({ tipo: 'parrafo', nota: /^\s{4,}/.test(cruda), ...conEtiqueta(linea.trim()) })
  })
  cerrarLista()
  return salida
}
