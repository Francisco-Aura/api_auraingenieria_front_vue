// Zonas de comisión de cada comercializadora (pestaña «Zonas» de Configuración MCAS): qué
// provincias forman cada zona. La zona de un contrato sale de la provincia de su punto de
// suministro (reunión del 04/11/2026 y respuesta del cliente a la duda 5).
//
// Funciones puras: las provincias llegan como { codigo, nombre } (src/utils/provincias.js).

export const LARGO_ZONA = 20

/** Zonas que se usan si la comercializadora no tiene ninguna: las del CUPS de la hoja de Iberdrola. */
export const ZONAS_POR_CUPS = ['ZAR', 'ZBR']

export function zonaVacia() {
  return { id: null, idComercializadora: '', zona: '', esResto: false, provincias: [] }
}

const mismoId = (a, b) => a !== null && a !== undefined && a !== '' && String(a) === String(b)

/** Las demás zonas de la misma comercializadora que la del formulario. */
function otrasZonas(form, zonas = []) {
  return zonas.filter((z) => mismoId(z.idComercializadora, form.idComercializadora) && !mismoId(z.id, form.id))
}

/** «Todas las demás provincias» o sus nombres: «Alicante, Murcia y Valencia», «Álava, Albacete… y 12 más». */
export function textoProvinciasZona(zona, nombreProvincia, maximo = 6) {
  if (zona?.esResto) return 'Todas las demás provincias'
  const nombres = (zona?.provincias || []).map((codigo) => nombreProvincia(codigo))
    .sort((a, b) => a.localeCompare(b, 'es'))
  if (!nombres.length) return 'Sin provincias'
  if (nombres.length === 1) return nombres[0]
  if (nombres.length <= maximo) return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
  return `${nombres.slice(0, maximo - 1).join(', ')} y ${nombres.length - (maximo - 1)} más`
}

/** Código de provincia → nombre de la otra zona de esa comercializadora que ya la tiene. */
export function provinciasOcupadas(form, zonas = []) {
  const ocupadas = {}
  for (const otra of otrasZonas(form, zonas)) {
    for (const codigo of otra.provincias || []) ocupadas[codigo] = otra.zona
  }
  return ocupadas
}

/** La zona del resto que ya tiene esa comercializadora (sin contar la del formulario), o null. */
export function zonaRestoExistente(form, zonas = []) {
  return otrasZonas(form, zonas).find((z) => z.esResto) || null
}

/** Errores del formulario, por campo, con las palabras de la pantalla. */
export function validarZona(form, zonas = []) {
  const errores = {}
  if (form.idComercializadora === null || form.idComercializadora === undefined || form.idComercializadora === '') {
    errores.idComercializadora = 'Elija la comercializadora.'
  }
  const nombre = String(form.zona ?? '').trim().toUpperCase()
  if (!nombre) errores.zona = 'Escriba el nombre de la zona (por ejemplo, ZAR).'
  else if (nombre.length > LARGO_ZONA) errores.zona = `Como mucho ${LARGO_ZONA} caracteres.`
  else if (otrasZonas(form, zonas).some((z) => String(z.zona).toUpperCase() === nombre)) {
    errores.zona = `Esa comercializadora ya tiene la zona ${nombre}: edítela en vez de crear otra.`
  }
  if (form.esResto) {
    const resto = zonaRestoExistente(form, zonas)
    if (resto) errores.provincias = `Las demás provincias ya son la zona ${resto.zona}: solo una zona puede tenerlas.`
  } else if (!(form.provincias || []).length) {
    errores.provincias = 'Marque las provincias de la zona, o «Son todas las demás provincias».'
  }
  return errores
}

/** Lo que se envía al servidor. */
export function zonaAPayload(form) {
  return {
    idComercializadora: Number(form.idComercializadora),
    zona: String(form.zona ?? '').trim().toUpperCase(),
    esResto: !!form.esResto,
    provincias: form.esResto ? [] : [...new Set(form.provincias || [])].sort(),
  }
}

/** Nombres de las zonas de una comercializadora (para las reglas); sin zonas, las del CUPS. */
export function zonasDeComercializadora(zonas = [], idComercializadora) {
  const nombres = zonas.filter((z) => mismoId(z.idComercializadora, idComercializadora)).map((z) => z.zona)
  return nombres.length ? [...new Set(nombres)].sort() : [...ZONAS_POR_CUPS]
}

/**
 * Comercializadoras con zonas pero sin zona del resto: un punto de una provincia que no esté
 * en ninguna de sus zonas se quedaría sin zona (y su contrato, sin poder calcular).
 */
export function comercializadorasSinResto(zonas = []) {
  const porComercializadora = new Map()
  for (const z of zonas) {
    const clave = String(z.idComercializadora)
    porComercializadora.set(clave, (porComercializadora.get(clave) || false) || !!z.esResto)
  }
  return [...porComercializadora.entries()].filter(([, tieneResto]) => !tieneResto).map(([id]) => Number(id))
}
