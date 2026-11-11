// Llamadas al backend del Registro horario (/api/registro-horario). axios ya trae la base /api y la cabecera del usuario.
import axios from 'axios'
import { cuerpoGenerar, mensajeDeError, nombreDeDescarga } from '@/utils/registroHorario/peticion'

const BASE = '/registro-horario'

/** Error con un mensaje que se puede enseñar tal cual a la persona. */
export class ErrorRegistroHorario extends Error {}

/** El mensaje de un error de axios; si la respuesta venía como archivo (blob), se lee su JSON. */
async function convertirError(e) {
  if (axios.isCancel(e)) return e
  if (!e.response) return new ErrorRegistroHorario('No se pudo conectar con el servidor. Comprueba tu conexión.')
  let datos = e.response.data
  try {
    if (typeof Blob !== 'undefined' && datos instanceof Blob) datos = JSON.parse(await datos.text())
  } catch (err) { /* la respuesta no era JSON */ }
  return new ErrorRegistroHorario(mensajeDeError(datos && datos.detail, e.response.status))
}

async function pedir(config) {
  try {
    return await axios(config)
  } catch (e) {
    throw await convertirError(e)
  }
}

/** { localidad, empresas: [{ texto, empresa, cif, ccc, centro_trabajo, localidad }] } */
export async function obtenerEmpresas() {
  return (await pedir({ method: 'get', url: `${BASE}/empresas` })).data
}

/** Festivos del año (nacionales y los locales de la configuración): lista de AAAA-MM-DD. */
export async function obtenerFestivos(anio) {
  return (await pedir({ method: 'get', url: `${BASE}/festivos/${anio}` })).data.festivos
}

/** Imagen de la firma sin fondo, a partir de una foto o un escaneo (PNG). `vista`: versión ligera para la vista previa. */
export async function extraerFirma(imagen, sensibilidad, vista, senal) {
  const f = new FormData()
  f.append('imagen', imagen, 'firma')
  f.append('sensibilidad', String(sensibilidad))
  f.append('vista', String(vista))
  return (await pedir({ method: 'post', url: `${BASE}/firma/extraer`, data: f, responseType: 'blob', signal: senal })).data
}

/** Genera el documento del mes. Devuelve { blob, nombre, dias, horas }. */
export async function generarDocumento(peticion) {
  const r = await pedir({ method: 'post', url: `${BASE}/generar`, data: cuerpoGenerar(peticion), responseType: 'blob' })
  const reserva = `Registro_horas_${peticion.anio}-${String(peticion.mes).padStart(2, '0')}.${peticion.formato}`
  return {
    blob: r.data,
    nombre: nombreDeDescarga(r.headers['content-disposition'], reserva),
    dias: Number(r.headers['x-dias-trabajados'] ?? 0),
    horas: r.headers['x-horas'] ?? ''
  }
}

/** Descarga un archivo generado en el navegador. */
export function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
