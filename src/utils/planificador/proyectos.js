// Cliente y proyecto de un presupuesto, a partir de su nombre («Cliente · Proyecto»). Dos presupuestos son del mismo proyecto si
// tienen el mismo cliente y el mismo nombre de proyecto, sin mirar mayúsculas, tildes, espacios de más ni un «v2» o «(copia)» al
// final (las copias antiguas lo llevaban). El servidor usa el mismo criterio al asignar la oferta (PresupuestoService.claveProyecto).

const SEPARADOR = ' · '
const VERSION_FINAL = /\s*(\(copia\)|v\d+)$/

const normalizar = (texto) => texto.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()

/** El nombre sin el «v2» / «(copia)» del final, tal como se enseña. */
const sinVersion = (texto) => texto.trim().replace(VERSION_FINAL, '').trim()

/** Parte un nombre en cliente y proyecto; sin proyecto, el proyecto es ''. */
export function partesDeNombre(nombre) {
  const i = (nombre || '').indexOf(SEPARADOR)
  if (i < 0) return { cliente: (nombre || '').trim(), proyecto: '' }
  return { cliente: nombre.slice(0, i).trim(), proyecto: sinVersion(nombre.slice(i + SEPARADOR.length)) }
}

/** La clave del proyecto (mismo cliente y mismo proyecto → misma clave) o '' si el nombre no tiene proyecto. */
export function claveGrupo(nombre, tipoCliente = '') {
  const { cliente, proyecto } = partesDeNombre(nombre)
  return proyecto ? [tipoCliente || '', normalizar(cliente), normalizar(proyecto)].join('|') : ''
}

export const claveCliente = (nombre, tipoCliente = '') => [tipoCliente || '', normalizar(partesDeNombre(nombre).cliente)].join('|')

/** Los proyectos que ya tiene un cliente (por el nombre de sus presupuestos), sin repetir, para sugerirlos al escribir. */
export function proyectosDeCliente(nombreCliente, nombres) {
  const cliente = normalizar(nombreCliente || '')
  if (!cliente) return []
  const vistos = new Map()
  for (const nombre of nombres) {
    const p = partesDeNombre(nombre)
    if (p.proyecto && normalizar(p.cliente) === cliente && !vistos.has(normalizar(p.proyecto))) vistos.set(normalizar(p.proyecto), p.proyecto)
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'))
}
