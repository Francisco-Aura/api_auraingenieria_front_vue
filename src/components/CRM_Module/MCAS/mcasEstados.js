// Estados de las propuestas MCAS: etiqueta visible y tono del badge.
// Compartido por Comisiones MCAS y por el formulario de contrato.
export const ESTADOS_PROPUESTA = [
  { value: 'PENDIENTE_CALCULO',          label: 'Pendiente de cálculo',    tono: 'neutral' },
  { value: 'REQUIERE_DATOS',             label: 'Faltan datos',            tono: 'warning' },
  { value: 'REQUIERE_REVISION_MANUAL',   label: 'Revisión manual',         tono: 'warning' },
  { value: 'ERROR_CALCULO',              label: 'Error de cálculo',        tono: 'danger' },
  { value: 'PENDIENTE_VALIDACION',       label: 'Pendiente de validación', tono: 'primary' },
  { value: 'RECHAZADO',                  label: 'Rechazada',               tono: 'danger' },
  { value: 'EN_EDICION',                 label: 'En edición',              tono: 'info' },
  { value: 'FINALIZADO_APROBADO',        label: 'Aprobada',                tono: 'success' },
  { value: 'FINALIZADO_EDITADO',         label: 'Aprobada con edición',    tono: 'success' },
  { value: 'FINALIZADO_NO_COMISIONABLE', label: 'No comisionable',         tono: 'neutral' },
  { value: 'DESACTUALIZADO',             label: 'Desactualizada',          tono: 'neutral' },
  { value: 'CANCELADO',                  label: 'Cancelada',               tono: 'neutral' },
  { value: 'SUPERADO',                   label: 'Superada',                tono: 'neutral' },
]

export function etiquetaEstadoMcas(estado) {
  return ESTADOS_PROPUESTA.find(e => e.value === estado)?.label || estado || '—'
}

/**
 * Grupos de estado que ve el usuario (contrato de API del 30/09/2026). SUPERADO no
 * está en ningún grupo: solo se enseña con «Ver histórico».
 */
export const GRUPOS_ESTADO = [
  { id: 'aprobar', label: 'Por aprobar', estados: ['PENDIENTE_VALIDACION'] },
  { id: 'atencion', label: 'Necesita atención', estados: ['REQUIERE_DATOS', 'REQUIERE_REVISION_MANUAL', 'ERROR_CALCULO', 'DESACTUALIZADO', 'PENDIENTE_CALCULO'] },
  { id: 'correccion', label: 'En corrección', estados: ['RECHAZADO', 'EN_EDICION'] },
  { id: 'aprobada', label: 'Aprobada', estados: ['FINALIZADO_APROBADO', 'FINALIZADO_EDITADO'] },
  { id: 'cerrada', label: 'Cerrada sin comisión', estados: ['FINALIZADO_NO_COMISIONABLE', 'CANCELADO'] },
]

/** Grupo ({ id, label, estados }) al que pertenece un estado, o null (SUPERADO o desconocido). */
export function grupoEstadoMcas(estado) {
  return GRUPOS_ESTADO.find(g => g.estados.includes(estado)) || null
}

const vigenteEn = (conjunto, dia) =>
  (!conjunto.vigenciaDesde || conjunto.vigenciaDesde <= dia) && (!conjunto.vigenciaHasta || conjunto.vigenciaHasta >= dia)

/**
 * Comprobaciones de Configuración MCAS: qué hace falta para que, al guardar un
 * contrato, se calcule su propuesta y al aprobarla se cree el servicio completo.
 */
export function comprobacionesModulo({ flags = [], conjuntos = [], productosServicio = [], pagosPlazos = [], hoy, nombreComercializadora = String }) {
  const activo = (codigo) => flags.find(f => f.codigo === codigo)?.activo === true
  const publicados = conjuntos.filter(c => c.estado === 'PUBLICADO' && vigenteEn(c, hoy))
  const borradores = conjuntos.filter(c => c.estado === 'BORRADOR').length
  const nombres = [...new Set(publicados.map(c => nombreComercializadora(c.idComercializadora)))].join(', ')
  const cuotas = [...new Set(pagosPlazos.map(p => Number(p.numeroCuotas)).filter(n => n >= 1 && n <= 12))].sort((a, b) => a - b)
  const hayServicio = productosServicio.some(p => String(p.nombre || '').toUpperCase().includes('SWITCHING'))

  return [
    { id: 'modulo', ok: activo('MCAS_ENABLED'), titulo: 'Módulo activado',
      detalle: activo('MCAS_ENABLED') ? 'Al guardar contratos con datos MCAS se calcula su propuesta.'
        : 'Desactivado: guardar contratos no genera propuestas. Active el interruptor «Módulo».' },
    { id: 'fijo', ok: activo('MCAS_FIXED_ENABLED'), titulo: 'Precio fijo activado',
      detalle: activo('MCAS_FIXED_ENABLED') ? 'Se calculan los contratos de precio FIJO.'
        : 'Desactivado: los contratos FIJO quedan en «Revisión manual». Active el interruptor «Precio fijo».' },
    { id: 'conjuntos', ok: publicados.length > 0, titulo: 'Tablas de comisiones activas hoy',
      detalle: publicados.length ? nombres
        : `Ninguna${borradores ? ` (${borradores} en borrador)` : ''}: active la tabla de comisiones de cada comercializadora o sus contratos quedarán en «Revisión manual».` },
    { id: 'switching', ok: hayServicio, titulo: 'Producto «SWITCHING»',
      detalle: hayServicio ? 'Existe en Administración › Productos.'
        : 'Falta en Administración › Productos: el servicio de comisión se crearía sin producto.' },
    { id: 'plazos', ok: cuotas.length > 0, titulo: 'Modalidades de pago',
      detalle: cuotas.length ? `Pago Plazos con ${cuotas.join(', ')} cuota${cuotas.length === 1 && cuotas[0] === 1 ? '' : 's'}.`
        : 'Faltan en Administración › Pago Plazos: el servicio se crearía sin modalidad de pago.' },
  ]
}
