// Datos que se mandan al servidor al pulsar «Generar», y lo que se saca de su respuesta. Funciones puras.

const aTramo = (t) => ({ ini: t[0], fin: t[1] })

/** Cuerpo de POST /api/registro-horario/generar (los nombres de campo son los del servicio). */
export function cuerpoGenerar(p) {
  const horas_dia = Object.fromEntries(Object.entries(p.horas_dia).map(([k, v]) => [k, {
    ...(v.manana ? { manana: aTramo(v.manana) } : {}),
    ...(v.tarde ? { tarde: aTramo(v.tarde) } : {})
  }]))
  return {
    anio: p.anio,
    mes: p.mes,
    trabajador: p.trabajador,
    nif: p.nif,
    num_afiliacion: p.num_afiliacion,
    empresa: p.empresa,
    horario_base: { manana: aTramo(p.horario.manana), tarde: aTramo(p.horario.tarde) },
    estado_dias: p.estado_dias,
    horas_dia,
    firma_png_base64: p.firma_png_base64,
    fecha_firma: p.fecha_firma,
    formato: p.formato
  }
}

/** Nombre de archivo de la cabecera Content-Disposition (el de «filename*=UTF-8''…»), o el de reserva. */
export function nombreDeDescarga(contentDisposition, reserva) {
  const m = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition || '')
  if (!m) return reserva
  try {
    return decodeURIComponent(m[1])
  } catch (e) {
    return reserva
  }
}

/** Mensaje comprensible a partir del cuerpo de error del servidor ({"detail": "..."}). */
export function mensajeDeError(detail, estado) {
  if (typeof detail === 'string' && detail) return detail
  return estado >= 500
    ? 'El servidor no pudo completar la operación. Inténtalo de nuevo en unos minutos.'
    : 'No se pudo completar la operación.'
}
