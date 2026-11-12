import axios from 'axios'

// Capa única que conoce las rutas del backend del Planificador (baseURL «/api» en main.js).
const BASE = '/planificador'

/** El mensaje de un error de la API: el «detail» del servidor o, si no hay, el del propio error. */
export function mensajeError(e) {
  const detalle = e && e.response && e.response.data && e.response.data.detail
  if (typeof detalle === 'string' && detalle) return detalle
  return e instanceof Error ? e.message : String(e)
}

const datos = (promesa) => promesa.then((r) => r.data)

let estadoDropbox = null

/** Pide un PDF y lo devuelve con su nombre. Con respuesta de tipo blob, el «detail» de un error llega dentro del blob: se saca para mostrarlo. */
async function pdf(url, cuerpo, params, nombreDefecto) {
  try {
    const r = await axios.post(url, cuerpo, { responseType: 'blob', params })
    const m = /filename\*=UTF-8''([^;]+)/i.exec(r.headers['content-disposition'] || '')
    return { blob: r.data, nombre: m ? decodeURIComponent(m[1]) : nombreDefecto }
  } catch (e) {
    if (e && e.response && e.response.data instanceof Blob) {
      try { e.response.data = JSON.parse(await e.response.data.text()) } catch (_) { /* se queda el mensaje del propio error */ }
    }
    throw e
  }
}

async function descargaBlob(url, nombreDefecto) {
  try {
    const r = await axios.get(url, { responseType: 'blob' })
    const m = /filename\*=UTF-8''([^;]+)/i.exec(r.headers['content-disposition'] || '')
    return { blob: r.data, nombre: m ? decodeURIComponent(m[1]) : nombreDefecto }
  } catch (e) {
    if (e && e.response && e.response.data instanceof Blob) {
      try { e.response.data = JSON.parse(await e.response.data.text()) } catch (_) { /* se queda el mensaje del propio error */ }
    }
    throw e
  }
}

export const planificadorApi = {
  salud: () => datos(axios.get(`${BASE}/health`)),
  // Funciones encendidas del servidor (presupuestador, inventario, archivos locales)
  funciones: () => datos(axios.get(`${BASE}/features`)),

  // Marcas y proveedores
  marcas: () => datos(axios.get(`${BASE}/brands`)),
  crearMarca: (name) => datos(axios.post(`${BASE}/brands`, { name })),
  borrarMarca: (name) => axios.delete(`${BASE}/brands/${encodeURIComponent(name)}`),
  guardarLogoMarca: (name, logo) => datos(axios.put(`${BASE}/brands/${encodeURIComponent(name)}/logo`, { logo })),
  urlLogoMarca: (name, version) => `/api${BASE}/brands/${encodeURIComponent(name)}/logo?v=${version}`,
  proveedores: () => datos(axios.get(`${BASE}/suppliers`)),
  crearProveedor: (name) => datos(axios.post(`${BASE}/suppliers`, { name })),
  borrarProveedor: (name) => axios.delete(`${BASE}/suppliers/${encodeURIComponent(name)}`),

  // Equipos
  catalogo: () => datos(axios.get(`${BASE}/equipment`)),
  crearEquipo: (cuerpo) => datos(axios.post(`${BASE}/equipment`, cuerpo)),
  actualizarEquipo: (id, cambios) => datos(axios.patch(`${BASE}/equipment/${id}`, cambios)),
  borrarEquipo: (id) => axios.delete(`${BASE}/equipment/${id}`),
  historialPrecios: (id) => datos(axios.get(`${BASE}/equipment/${id}/price-history`)),
  estadoRevision: () => datos(axios.get(`${BASE}/equipment/price-review-status`)),
  marcarRevisados: (ids) => datos(axios.post(`${BASE}/equipment/price-review`, { ids })),

  // Proyectos, plantillas, borradores y tareas
  plantillas: () => datos(axios.get(`${BASE}/templates`)),
  proyectos: () => datos(axios.get(`${BASE}/projects`)),
  crearProyecto: (cuerpo) => datos(axios.post(`${BASE}/projects`, cuerpo)),
  proyecto: (id) => datos(axios.get(`${BASE}/projects/${id}`)),
  actualizarProyecto: (id, cambios) => datos(axios.patch(`${BASE}/projects/${id}`, cambios)),
  camposContrato: () => datos(axios.get(`${BASE}/contract/fields`)),
  contrato: (id) => datos(axios.get(`${BASE}/projects/${id}/contract`)),
  presupuestoProyecto: (id) => datos(axios.get(`${BASE}/projects/${id}/budget`)),
  material: (id) => datos(axios.get(`${BASE}/projects/${id}/material`)),
  devolverMaterial: (id, cuerpo) => datos(axios.post(`${BASE}/projects/${id}/material/returns`, cuerpo)),
  deshacerDevolucion: (id, devolucionId) => datos(axios.delete(`${BASE}/projects/${id}/material/returns/${devolucionId}`)),
  aplicarPlantilla: (id, cuerpo) => datos(axios.post(`${BASE}/projects/${id}/apply-template`, cuerpo)),
  actividad: (id, limite = 500) => datos(axios.get(`${BASE}/projects/${id}/activity`, { params: { limit: limite } })),
  eliminarProyecto: (id, confirmar) => datos(axios.delete(`${BASE}/projects/${id}`, { params: { confirm: confirmar } })),
  borradores: () => datos(axios.get(`${BASE}/drafts`)),
  borrador: (id) => datos(axios.get(`${BASE}/drafts/${id}`)),
  crearBorrador: (cuerpo) => datos(axios.post(`${BASE}/drafts`, cuerpo)),
  guardarBorrador: (id, cuerpo) => datos(axios.put(`${BASE}/drafts/${id}`, cuerpo)),
  borrarBorrador: (id) => axios.delete(`${BASE}/drafts/${id}`),
  tareas: (proyectoId) => datos(axios.get(`${BASE}/projects/${proyectoId}/tasks`)),
  crearTarea: (proyectoId, cuerpo) => datos(axios.post(`${BASE}/projects/${proyectoId}/tasks`, cuerpo)),
  actualizarTarea: (id, cambios) => datos(axios.patch(`${BASE}/tasks/${id}`, cambios)),
  borrarTarea: (id) => axios.delete(`${BASE}/tasks/${id}`),
  aportarEnlace: (id, url, name, requirement) => datos(axios.post(`${BASE}/tasks/${id}/attachments`, { kind: 'link', url, name, requirement })),
  aportarNota: (id, text, requirement) => datos(axios.post(`${BASE}/tasks/${id}/attachments`, { kind: 'note', text, requirement })),
  quitarAdjunto: (id, adjuntoId) => datos(axios.delete(`${BASE}/tasks/${id}/attachments/${adjuntoId}`)),

  // Presupuestos y propuestas
  presupuestos: () => datos(axios.get(`${BASE}/budgets`)),
  presupuesto: (id) => datos(axios.get(`${BASE}/budgets/${id}`)),
  crearPresupuesto: (cuerpo) => datos(axios.post(`${BASE}/budgets`, cuerpo)),
  guardarPresupuesto: (id, cuerpo) => datos(axios.put(`${BASE}/budgets/${id}`, cuerpo)),
  enviarPresupuesto: (id) => datos(axios.post(`${BASE}/budgets/${id}/send`)),
  variantePresupuesto: (id, name = '') => datos(axios.post(`${BASE}/budgets/${id}/variant`, { name })),
  renombrarVariante: (id, name) => datos(axios.post(`${BASE}/budgets/${id}/variant-name`, { name })),
  validarPresupuesto: (id, cif = '') => datos(axios.post(`${BASE}/budgets/${id}/validate`, { cif })),
  desvalidarPresupuesto: (id) => datos(axios.post(`${BASE}/budgets/${id}/unvalidate`)),
  borrarPresupuesto: (id) => axios.delete(`${BASE}/budgets/${id}`),
  pendientesDeValidar: () => datos(axios.get(`${BASE}/budgets/pending-validation`)),
  buscarClientes: (q, size = 20) => datos(axios.get(`${BASE}/clients`, { params: { q, size } })),
  propuestas: (presupuestoId) => datos(axios.get(`${BASE}/budgets/${presupuestoId}/proposals`)),
  crearPropuesta: (presupuestoId) => datos(axios.post(`${BASE}/budgets/${presupuestoId}/proposals`)),
  enviarPropuesta: (id) => datos(axios.post(`${BASE}/proposals/${id}/send`)),
  aprobarPropuesta: (id, note = '') => datos(axios.post(`${BASE}/proposals/${id}/approve`, { note })),
  rechazarPropuesta: (id, note = '') => datos(axios.post(`${BASE}/proposals/${id}/reject`, { note })),
  guardarLogoPropuesta: (id, logo) => datos(axios.put(`${BASE}/proposals/${id}/logo`, { logo })),
  borrarLogoPropuesta: (id) => datos(axios.delete(`${BASE}/proposals/${id}/logo`)),
  borrarPropuesta: (id) => axios.delete(`${BASE}/proposals/${id}`),
  /** La presentación HTML de la propuesta como archivo descargable: { blob, filename }. */
  async propuestaHtml(id) {
    try {
      const r = await axios.get(`${BASE}/proposals/${id}/html`, { responseType: 'blob' })
      const m = /filename\*=UTF-8''([^;]+)/.exec(r.headers['content-disposition'] || '')
      return { blob: r.data, filename: m ? decodeURIComponent(m[1]) : 'propuesta.html' }
    } catch (e) {
      // Con responseType «blob» el cuerpo del error también llega como blob: se lee para sacar el «detail»
      if (e.response && e.response.data instanceof Blob) {
        try { e.response.data = JSON.parse(await e.response.data.text()) } catch (otro) { /* se deja el error tal cual */ }
      }
      throw e
    }
  },

  // Fichas técnicas: se guardan en Dropbox, en la carpeta de la marca del producto
  subirFicha: (id, archivo) => datos(axios.put(`${BASE}/equipment/${id}/datasheet`, archivo, { params: { name: archivo.name }, headers: { 'Content-Type': 'application/pdf' } })),
  opcionesFicha: (id) => datos(axios.get(`${BASE}/equipment/${id}/datasheet-options`)),
  quitarFicha: (id) => datos(axios.delete(`${BASE}/equipment/${id}/datasheet`)),
  urlFicha: (id) => `/api${BASE}/equipment/${id}/datasheet`,

  // Dropbox: carpetas de los proyectos y archivos de las tareas. Una vez por sesión se pregunta si está configurado.
  dropboxEstado() {
    // Un fallo no se recuerda: si el servidor estaba arrancando, la próxima vez se vuelve a preguntar
    if (!estadoDropbox) estadoDropbox = datos(axios.get(`${BASE}/dropbox`)).catch((e) => { estadoDropbox = null; throw e })
    return estadoDropbox
  },
  dropboxCarpetas: (ruta) => datos(axios.get(`${BASE}/dropbox/folders`, { params: ruta ? { path: ruta } : {} })),
  dropboxVistaPrevia: (name, inicio) => datos(axios.get(`${BASE}/dropbox/preview`, { params: { name, start_date: inicio } })),
  crearCarpetaDropbox: (id, cuerpo) => datos(axios.post(`${BASE}/projects/${id}/dropbox-folder`, cuerpo)),
  completarSubcarpetasDropbox: (id) => datos(axios.post(`${BASE}/projects/${id}/dropbox-folder/subfolders`)),
  subirArchivo: (tareaId, archivo, requisito = '') => datos(axios.put(`${BASE}/tasks/${tareaId}/attachments/file`, archivo, {
    params: { name: archivo.name, requirement: requisito }, headers: { 'Content-Type': archivo.type || 'application/octet-stream' }
  })),
  urlArchivo: (tareaId, adjuntoId) => `/api${BASE}/tasks/${tareaId}/attachments/${adjuntoId}/file`,

  // Contrato en PDF (solo PDF)
  generarContratoProyecto: (id, partes) => datos(axios.post(`${BASE}/projects/${id}/contract-document`, { party: partes })),
  urlContratoProyecto: (id) => `/api${BASE}/projects/${id}/contract-document`,
  /** Lee el presupuesto de la oferta (PDF) y devuelve los datos que se pueden leer: campos, proyecto, avisos, cliente y garantías. No guarda nada. */
  leerOferta: (archivo) => datos(axios.post(`${BASE}/budget/extract`, archivo, { params: { name: archivo.name }, headers: { 'Content-Type': 'application/pdf' } })),
  /** El contrato con los datos indicados, sin guardar nada: devuelve { blob, nombre }. */
  generarContrato: (datosContrato) => pdf(`${BASE}/contract/generate`, datosContrato, { format: 'pdf' }, 'Contrato.pdf'),
  /** PDF del presupuesto en curso: «interno» (costes y beneficio) o «cliente» (solo el precio de venta). Devuelve { blob, nombre }. */
  pdfPresupuesto: (datosPresupuesto, modo) => pdf(`${BASE}/budget/pdf`, datosPresupuesto, { mode: modo }, 'Presupuesto.pdf'),
  /** La presentación para el cliente (la propuesta) del presupuesto en curso, con el mismo cuerpo que al guardarlo; no guarda nada. Devuelve { blob, nombre }. */
  propuestaDelBorrador: (cuerpo) => pdf(`${BASE}/budget/proposal-html`, cuerpo, undefined, 'Propuesta.html'),
  /** Todo el inventario en un Excel (hoja con todo, una por categoría y los precios por proveedor). Devuelve { blob, nombre }. */
  exportarInventario: () => descargaBlob(`${BASE}/equipment/export`, 'Inventario.xlsx'),
  /** La misma propuesta en PDF, hecha en el servidor con Chrome; si el servidor no lo tiene responde 501. Devuelve { blob, nombre }. */
  propuestaPdfDelBorrador: (cuerpo) => pdf(`${BASE}/budget/proposal-pdf`, cuerpo, undefined, 'Propuesta.pdf')
}
