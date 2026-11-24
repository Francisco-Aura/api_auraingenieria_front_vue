// Usuario que inició sesión en la intranet: su login lo guarda en localStorage['usuario']
// ({ id, nombre, email, nivelAcceso }). Se manda en cabeceras; el backend no las verifica (como la intranet).

export function leerUsuario(almacen = window.localStorage) {
  try {
    return JSON.parse(almacen.getItem('usuario') || '{}') || {}
  } catch (e) {
    return {}
  }
}

export function cabecerasUsuario(almacen = window.localStorage) {
  const u = leerUsuario(almacen)
  const cabeceras = {}
  if (u.nombre) cabeceras['X-Aura-Usuario-Nombre'] = u.nombre
  if (u.id) cabeceras['X-Usuario-Id'] = String(u.id)
  if (u.nivelAcceso !== undefined && u.nivelAcceso !== null) cabeceras['X-Usuario-Nivel'] = String(u.nivelAcceso)
  return cabeceras
}

// Quién usa el planificador (para decidir qué botones se enseñan; el servidor lo comprueba por su cuenta).
// Equivale a getIntranetUser/getIntranetUserId/getIntranetAccessLevel/isValidator del Planificador actual.

export function nombreUsuario(almacen = window.localStorage) {
  const nombre = leerUsuario(almacen).nombre
  return typeof nombre === 'string' ? nombre.trim() : ''
}

export function idUsuario(almacen = window.localStorage) {
  const id = leerUsuario(almacen).id
  return typeof id === 'number' || typeof id === 'string' ? String(id).trim() : ''
}

export function nivelUsuario(almacen = window.localStorage) {
  const nivel = Number(leerUsuario(almacen).nivelAcceso ?? NaN)
  return Number.isInteger(nivel) && nivel >= 0 ? nivel : null
}

/** El que valida los presupuestos es el id 1 de la intranet. */
export const esValidador = (almacen = window.localStorage) => idUsuario(almacen) === '1'

/** { id, nombre, nivel } de quien mira la pantalla. */
export const usuarioActual = (almacen = window.localStorage) => ({ id: idUsuario(almacen), nombre: nombreUsuario(almacen), nivel: nivelUsuario(almacen) })
