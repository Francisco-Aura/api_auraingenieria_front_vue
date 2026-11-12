// Datos de la persona en SU navegador (localStorage): el servidor no guarda nada. Las claves y el formato son los del
// Registro horario anterior, que se publicaba en el mismo origen que la intranet: así cada persona conserva su perfil,
// su calendario y su firma al pasar al módulo nuevo. Todo se lee y escribe con try/catch (ventana privada o
// almacenamiento bloqueado: la pantalla funciona igual, solo que sin recordar).
import { fechaValida } from './fechas.js'
import { normalizarHora, errorTramo } from './horas.js'
import { ESTADOS, HORARIO_BASE, MARCAS_VACIAS } from './jornada.js'

export const CLAVE_PERFIL = 'registro-horario:perfil'
export const CLAVE_MARCAS = 'registro-horario:dias'
export const CLAVE_FIRMA = 'registro-horario:firma'

export const PERFIL_BASE = Object.freeze({
  trabajador: '', nif: '', num_afiliacion: '',
  empresa: '', // el texto elegido en el desplegable
  fecha_alta: '', // AAAA-MM-DD del primer día de trabajo, solo si empezó a mitad de mes
  horario: HORARIO_BASE
})

function almacenamiento(almacen) {
  if (almacen) return almacen
  try {
    return (typeof window !== 'undefined' && window.localStorage) || null
  } catch (e) {
    return null
  }
}

function leer(clave, almacen) {
  try {
    const txt = almacenamiento(almacen)?.getItem(clave)
    return txt ? JSON.parse(txt) : null
  } catch (e) {
    return null
  }
}

function escribir(clave, valor, almacen) {
  try {
    const a = almacenamiento(almacen)
    if (!a) return
    if (valor === null) a.removeItem(clave)
    else a.setItem(clave, typeof valor === 'string' ? valor : JSON.stringify(valor))
  } catch (e) {
    /* sin almacenamiento: no se recuerda, pero no falla */
  }
}

const esObjeto = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
const texto = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '')

function tramo(v, nombre) {
  if (!Array.isArray(v) || v.length !== 2 || typeof v[0] !== 'string' || typeof v[1] !== 'string') return null
  const t = [normalizarHora(v[0]) ?? '', normalizarHora(v[1]) ?? '']
  return errorTramo(t, nombre) ? null : t
}

/** Lo guardado puede venir de otra versión o estar corrupto: se aprovecha lo válido y el resto vuelve a lo habitual. */
export function cargarPerfil(almacen) {
  const g = leer(CLAVE_PERFIL, almacen)
  if (!esObjeto(g)) return PERFIL_BASE
  const h = esObjeto(g.horario) ? g.horario : {}
  return {
    trabajador: texto(g.trabajador, 120),
    nif: texto(g.nif, 30),
    num_afiliacion: texto(g.num_afiliacion, 30),
    empresa: texto(g.empresa),
    fecha_alta: fechaValida(g.fecha_alta) ? g.fecha_alta : '',
    horario: { manana: tramo(h.manana, 'Mañana') ?? HORARIO_BASE.manana, tarde: tramo(h.tarde, 'Tarde') ?? HORARIO_BASE.tarde }
  }
}

export const guardarPerfil = (p, almacen) => escribir(CLAVE_PERFIL, p, almacen)

export function cargarMarcas(almacen) {
  const g = leer(CLAVE_MARCAS, almacen)
  if (!esObjeto(g)) return MARCAS_VACIAS
  const cambios = {}
  if (esObjeto(g.cambios)) {
    for (const [k, v] of Object.entries(g.cambios)) {
      if (fechaValida(k) && ESTADOS.includes(v)) cambios[k] = v
    }
  }
  const horas = {}
  if (esObjeto(g.horas)) {
    for (const [k, v] of Object.entries(g.horas)) {
      if (!fechaValida(k) || !esObjeto(v)) continue
      const limpio = {}
      const m = tramo(v.manana, 'Mañana')
      const t = tramo(v.tarde, 'Tarde')
      if (m) limpio.manana = m
      if (t) limpio.tarde = t
      if (limpio.manana || limpio.tarde) horas[k] = limpio
    }
  }
  return { cambios, horas }
}

export const guardarMarcas = (m, almacen) => escribir(CLAVE_MARCAS, m, almacen)

/** La firma, como PNG en data URL. */
export function cargarFirma(almacen) {
  try {
    const f = almacenamiento(almacen)?.getItem(CLAVE_FIRMA)
    return f && f.startsWith('data:image/png;base64,') ? f : null
  } catch (e) {
    return null
  }
}

export const guardarFirma = (dataUrl, almacen) => escribir(CLAVE_FIRMA, dataUrl, almacen)
