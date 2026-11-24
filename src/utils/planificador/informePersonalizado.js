// Qué módulos lleva el informe y en qué orden. La elección se guarda en este navegador para la próxima descarga.
//
// Un «módulo» es una gráfica con su explicación (o una tabla) y siempre pertenece a una categoría; las categorías van juntas en el
// informe, así que se ordenan como bloques y, dentro de cada una, se ordenan sus módulos.
import { createApp, h, markRaw } from 'vue'
import GraficaSvg from '@/components/CRM_Module/Planificador/Estudios/GraficaSvg.vue'
import { ANCHO_PAREJA, ANCHO_SUELTA } from '@/utils/planificador/graficasEstudio'

const CLAVE = 'planificador.informe.modulos.v1'

/** Lo guardado la última vez: { categorias: [ids en orden], modulos: { categoria: [ids en orden] }, quitados: [ids] }. */
export function leerPreferencias() {
  try {
    const p = JSON.parse(window.localStorage.getItem(CLAVE) || 'null')
    return p && typeof p === 'object' ? p : {}
  } catch (e) {
    return {}
  }
}

export function guardarPreferencias(orden) {
  try {
    const p = { categorias: orden.map((c) => c.id), modulos: {}, quitados: [] }
    for (const c of orden) {
      p.modulos[c.id] = c.modulos.map((m) => m.id)
      for (const m of c.modulos) {
        // Las recomendaciones se sugieren por estudio: lo que se marcó en uno no se arrastra al siguiente
        if (m.tipo !== 'texto' && !m.activo) p.quitados.push(m.id)
      }
    }
    window.localStorage.setItem(CLAVE, JSON.stringify(p))
  } catch (e) { /* sin almacenamiento: no se recuerda, pero se descarga igual */ }
}

const ordenar = (lista, ids) => {
  const pos = (id) => { const i = (ids || []).indexOf(id); return i < 0 ? Infinity : i }
  // Los que no estaban guardados (módulos nuevos) van al final de su grupo, en su orden por defecto
  return lista.map((x, i) => ({ x, i })).sort((a, b) => (pos(a.x.id) - pos(b.x.id)) || (a.i - b.i)).map((e) => e.x)
}

/** Las categorías y módulos disponibles en el orden de la última vez, cada módulo con su casilla (por defecto, gráficas y tablas puestas y recomendaciones solo las sugeridas para el estudio). */
export function ordenInicial(categorias, preferencias = leerPreferencias()) {
  const quitados = new Set(preferencias.quitados || [])
  return ordenar(categorias, preferencias.categorias).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    modulos: ordenar(c.modulos, (preferencias.modulos || {})[c.id]).map((m) => ({ id: m.id, nombre: m.nombre, tipo: m.tipo, specs: markRaw(m.specs), titulo: m.titulo, texto: m.texto, sugerida: !!m.sugerida, activo: m.tipo === 'texto' ? !!m.sugerida : !quitados.has(m.id) }))
  }))
}

/** Dibuja una gráfica como SVG para el papel (colores claros y leyenda dentro) y lo devuelve como texto. */
function svgDe(spec, ancho, alto) {
  const caja = document.createElement('div')
  const app = createApp({ render: () => h(GraficaSvg, { spec, ancho, alto, imprimir: true }) })
  try {
    app.mount(caja)
    const svg = caja.querySelector('svg')
    return new XMLSerializer().serializeToString(svg)
  } finally {
    app.unmount()
  }
}

/** Lo que se manda al servidor: las categorías en su orden y los módulos elegidos, las gráficas con su SVG. */
export function cuerpoInforme(orden) {
  const categorias = []
  for (const c of orden) {
    const modulos = []
    for (const m of c.modulos) {
      if (!m.activo) continue
      if (m.tipo === 'tabla') { modulos.push({ id: m.id, svgs: [] }); continue }
      if (m.tipo === 'texto') { modulos.push({ id: m.id, svgs: [], titulo: m.titulo, texto: m.texto }); continue }
      const pareja = m.specs.length > 1
      modulos.push({ id: m.id, svgs: m.specs.map((s) => svgDe(s, pareja ? ANCHO_PAREJA : ANCHO_SUELTA, pareja ? 290 : 300)) })
    }
    if (modulos.length) categorias.push({ id: c.id, modulos })
  }
  return { categorias }
}
