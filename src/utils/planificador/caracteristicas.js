// Las características adicionales de un producto (las que no son de su categoría) se agrupan para no enseñarlas como una
// lista larga. Cada una se guarda como «x:Nombre» (las de antes) o «x:Grupo::Nombre» (las que se añaden eligiendo grupo).
// Equivale a characteristicGroups.ts del Planificador actual.

/** «—», «-» o vacío: el producto no tiene esa característica (no aplica). */
export const esValorVacio = (v) => v === undefined || v === null || /^[-—–]?$/.test(String(v).trim())

export const PREFIJO_EXTRA = 'x:'
const SEPARADOR = '::'

export const GRUPOS = [
  'Potencia y rendimiento',
  'Entrada y salida eléctrica',
  'Comunicación y conexiones',
  'Protecciones y seguridad',
  'Entorno y refrigeración',
  'Dimensiones, peso e instalación',
  'Compatibilidad',
  'Documentos',
  'Otras'
]

const plano = (texto) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// El primer grupo que coincide con el nombre; el orden importa.
const REGLAS = [
  ['Documentos', /\b(ficha|guia|manual|certific|garantia)/],
  ['Compatibilidad', /compatib|respaldo|backup|escalab/],
  ['Dimensiones, peso e instalación', /dimension|\bpeso\b|instalacion|montaje/],
  ['Entorno y refrigeración', /grado de proteccion|\bip\d*\b|temperatura|humedad|altitud|refriger|ruido/],
  ['Protecciones y seguridad', /protecc|seccionador|fusible|\bdps\b|arco|aislamiento/],
  ['Comunicación y conexiones', /comunic|puerto|protocolo|conexion|interfaz|dispositivos|inversores max|wlan|ethernet|rs485/],
  ['Entrada y salida eléctrica', /tension|corriente|intensidad|voltaje|entradas|\bred\b|mppt|frecuencia|alimentacion|precision|cortocircuito|potencia fv/],
  ['Potencia y rendimiento', /eficien|potencia|consumo|capacidad|energia|rendim|tecnologia/]
]

export function grupoDeNombre(nombre) {
  const texto = plano(nombre)
  const regla = REGLAS.find(([, r]) => r.test(texto))
  return regla ? regla[0] : 'Otras'
}

/** Grupo y nombre de una característica adicional a partir de su clave guardada. */
export function leerClaveExtra(clave) {
  const cuerpo = clave.startsWith(PREFIJO_EXTRA) ? clave.slice(PREFIJO_EXTRA.length) : clave
  const en = cuerpo.indexOf(SEPARADOR)
  if (en > 0) {
    const grupo = cuerpo.slice(0, en)
    if (GRUPOS.includes(grupo)) return { grupo, nombre: cuerpo.slice(en + SEPARADOR.length) }
  }
  return { grupo: grupoDeNombre(cuerpo), nombre: cuerpo }
}

/** La clave con la que se guarda una característica nueva: lleva su grupo. */
export const claveExtra = (grupo, nombre) => `${PREFIJO_EXTRA}${grupo}${SEPARADOR}${nombre.trim()}`

/** Las características agrupadas, en el orden de los grupos y solo los que tienen alguna. */
export function agruparFilas(filas) {
  return GRUPOS.map((grupo) => ({ grupo, filas: filas.filter((f) => f.grupo === grupo) })).filter((g) => g.filas.length > 0)
}
