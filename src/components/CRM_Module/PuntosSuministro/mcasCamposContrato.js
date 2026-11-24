// Campos de la pestaña «Otros datos» (comisión MCAS) del formulario de contrato.
//
// La vista previa del servidor (POST /mcas/vista-previa) dice qué datos usan las
// tablas de comisiones de la comercializadora: `campos`, con las claves del enum
// McasCampo. Este módulo traduce cada clave a su campo del formulario y decide qué
// se enseña: lo básico siempre, además lo que pide la vista previa, y el resto
// plegado en «Más datos». Nunca borra valores: solo decide dónde se ven.

/**
 * La zona de comisión no es un campo del formulario: el servidor la saca de la provincia del
 * punto de suministro (Configuración MCAS, pestaña Zonas) y aquí solo se enseña.
 */
export const CAMPO_ZONA = 'zonaComision';

/** McasCampo → campo del formulario. La tarifa de acceso depende del suministro (ver campoDeClave). */
const CAMPO_POR_CLAVE = {
  TIPO_PRECIO: 'mcasTipoPrecio',
  TIPO_SUMINISTRO: 'mcasTipoSuministro',
  SEGMENTO: 'mcasSegmento',
  ES_RENOVACION: 'mcasEsRenovacion',
  TIPO_RENOVACION: 'mcasTipoRenovacion',
  ALTA_NUEVA: 'mcasAltaNueva',
  ZONA_COMISION: CAMPO_ZONA,
  TARIFA_ACCESO: 'idTarifaLuz',
  PRODUCTO: 'mcasIdProductoComercial',
  CONSUMO: 'consumoAnual',
  // Siempre la mayor de las potencias contratadas (P1 a P6), que se escriben en la pestaña Contrato
  POTENCIA: 'potenciaContratada',
  FEE: 'mcasFeeEurMwh',
  GESTORA: 'mcasIdGestora',
};

/** Rótulo de cada campo, por si la vista previa no trae el suyo. */
const ETIQUETA_CAMPO = {
  mcasTipoPrecio: 'Tipo de precio',
  mcasTipoSuministro: 'Tipo de suministro',
  mcasEsRenovacion: '¿Es renovación?',
  mcasTipoRenovacion: 'Tipo de renovación',
  mcasSegmento: 'Segmento',
  mcasAltaNueva: 'Alta nueva',
  [CAMPO_ZONA]: 'Zona de comisión',
  mcasIdGestora: 'Gestora',
  mcasIdProductoComercial: 'Tarifa de precios (producto)',
  mcasFeeEurMwh: 'FEE del contrato',
  potenciaContratada: 'Potencia contratada (la mayor)',
  consumoAnual: 'Consumo anual',
  idTarifaLuz: 'Tarifa de acceso',
  idTarifaGas: 'Tarifa de acceso',
};

/**
 * Campos editables de la pestaña, en el orden en que se dibujan. Desde la reunión del
 * 04/11/2026 el tipo de precio y el producto van en la pestaña Contrato, y la potencia
 * de cálculo, la primera aplicación, la última relación, el ámbito y la zona de comisión
 * ya no se escriben a mano.
 */
const CAMPOS_PESTANA_MCAS = [
  'mcasTipoSuministro', 'mcasEsRenovacion', 'mcasTipoRenovacion',
  'mcasSegmento', 'mcasAltaNueva', 'mcasIdGestora', 'mcasFeeEurMwh',
];

/** A la vista pida lo que pida la vista previa (el tipo de renovación, solo en renovaciones). */
const CAMPOS_SIEMPRE_VISIBLES = ['mcasTipoSuministro', 'mcasEsRenovacion', 'mcasTipoRenovacion'];

/** Se rellenan en la pestaña Contrato: en esta solo se enseñan. */
const CAMPOS_DE_PESTANA_CONTRATO = ['consumoAnual', 'idTarifaLuz', 'idTarifaGas', 'mcasTipoPrecio', 'mcasIdProductoComercial', 'potenciaContratada'];

/** No se escriben en el contrato: salen de otros datos y solo se enseñan. */
const CAMPOS_CALCULADOS = [CAMPO_ZONA];

/** ¿Es un dato que no se rellena en el formulario del contrato (la zona de comisión)? */
export const esCampoCalculado = (campo) => CAMPOS_CALCULADOS.includes(campo);

export const TEXTO_ZONA_SIN_SABER =
  'La zona de comisión sale de la provincia del punto de suministro. Sin ella no se puede guardar el contrato.';

export const TEXTO_SIN_REGLAS =
  'Esta comercializadora todavía no tiene tabla de comisiones: la comisión se completará a mano en Comisiones.';

const EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

const ICONO = { ok: 'fas fa-check-circle', aviso: 'fas fa-exclamation-triangle', neutro: 'fas fa-info-circle' };

/** Valor rellenado: null, undefined y texto en blanco cuentan como vacío (false y 0 son valores). */
export function tieneValorMcas(valor) {
  return valor !== null && valor !== undefined && String(valor).trim() !== '';
}

/** Campo del formulario que corresponde a una clave McasCampo (null si no se conoce). */
export function campoDeClave(clave, contrato = {}) {
  if (clave === 'TARIFA_ACCESO') return contrato?.mcasTipoSuministro === 'GAS' ? 'idTarifaGas' : 'idTarifaLuz';
  return CAMPO_POR_CLAVE[clave] || null;
}

/** Campos conocidos de la vista previa, o null si la respuesta no sirve para decidir qué enseñar. */
function camposDeVistaPrevia(vistaPrevia) {
  if (!vistaPrevia || !Array.isArray(vistaPrevia.campos)) return null;
  return vistaPrevia.campos.filter((c) => c && CAMPO_POR_CLAVE[c.clave]);
}

/** ¿La tabla de comisiones de la comercializadora usa este dato? */
export function campoRelevante(vistaPrevia, clave) {
  return (camposDeVistaPrevia(vistaPrevia) || []).some((c) => c.clave === clave);
}

function etiquetaDe(campoVista, campo) {
  return String(campoVista.etiqueta || '').trim() || ETIQUETA_CAMPO[campo] || campoVista.clave;
}

/** Estados en los que no se ha evaluado ninguna tabla de comisiones del contrato. */
const ESTADOS_SIN_REGLAS = ['SIN_REGLAS', 'DESACTIVADO', 'SIN_TIPO_PRECIO'];

/** ¿La vista previa cita alguna regla (la aplicada o las que usan cada dato)? */
function citaReglas(vistaPrevia, campos) {
  if (ESTADOS_SIN_REGLAS.includes(vistaPrevia?.estado)) return false;
  return tieneValorMcas(vistaPrevia?.regla)
    || campos.some((c) => Array.isArray(c.usadoPor) && c.usadoPor.some(tieneValorMcas));
}

/**
 * Qué campos se enseñan y dónde.
 * - Sin vista previa válida (sin red, error o aún sin respuesta): todos, como siempre (`respaldo`).
 * - Con ella y alguna regla citada: lo básico y lo que usan esas reglas a la vista; los datos
 *   de la pestaña Contrato (consumo, tarifa) en solo lectura; el resto plegado en «Más datos».
 * - Si la vista previa no cita ninguna regla (sin tabla que encaje, módulo apagado...) o aún
 *   no hay comercializadora, no se sabe qué sobra: todos a la vista, como en el respaldo.
 * Un campo con error nunca se queda plegado.
 */
export function organizarCamposMcas({ vistaPrevia, contrato = {}, esRenovacion = false, errores = {} } = {}) {
  const editables = CAMPOS_PESTANA_MCAS.filter((c) => c !== 'mcasTipoRenovacion' || esRenovacion);
  const campos = camposDeVistaPrevia(vistaPrevia);
  if (!campos) return { respaldo: true, principales: editables, otros: [], otrosConValor: 0, soloLectura: [] };

  const plegar = citaReglas(vistaPrevia, campos) && tieneValorMcas(contrato?.idComercializadoraActual);
  const relevantes = new Set(campos.map((c) => campoDeClave(c.clave, contrato)));
  const principales = editables.filter((c) => !plegar || CAMPOS_SIEMPRE_VISIBLES.includes(c) || relevantes.has(c) || errores?.[c]);
  const otros = editables.filter((c) => !principales.includes(c));

  const soloLectura = [];
  for (const c of campos) {
    const campo = campoDeClave(c.clave, contrato);
    const calculado = esCampoCalculado(campo);
    if ((!CAMPOS_DE_PESTANA_CONTRATO.includes(campo) && !calculado) || soloLectura.some((f) => f.campo === campo)) continue;
    soloLectura.push({
      clave: c.clave, campo, etiqueta: calculado ? ETIQUETA_CAMPO[campo] : etiquetaDe(c, campo), falta: c.falta === true,
      ...(calculado ? { calculado: true } : {}),
    });
  }

  return {
    respaldo: false,
    principales,
    otros,
    otrosConValor: otros.filter((c) => tieneValorMcas(contrato?.[c])).length,
    soloLectura,
  };
}

/** Datos que la vista previa echa en falta, con el campo del formulario al que llevar el foco. */
export function faltantesVistaPrevia(vistaPrevia, contrato = {}) {
  const faltan = [];
  for (const c of camposDeVistaPrevia(vistaPrevia) || []) {
    const campo = campoDeClave(c.clave, contrato);
    if (c.falta !== true || faltan.some((f) => f.campo === campo)) continue;
    faltan.push({ clave: c.clave, campo, etiqueta: etiquetaDe(c, campo), ...(esCampoCalculado(campo) ? { calculado: true } : {}) });
  }
  return faltan;
}

/**
 * Opciones de un desplegable: las que trae la vista previa para esa clave o, si no
 * trae ninguna, las de siempre. Un valor ya guardado que no está en la lista se
 * conserva como opción para no perderlo.
 */
export function opcionesCampoMcas(vistaPrevia, clave, porDefecto = [], valorActual = null) {
  const campo = (camposDeVistaPrevia(vistaPrevia) || []).find((c) => c.clave === clave);
  const valores = Array.isArray(campo?.valores) ? campo.valores.map(String).filter((v) => v.trim() !== '') : [];
  const lista = valores.length ? [...new Set(valores)] : [...porDefecto];
  if (tieneValorMcas(valorActual) && !lista.includes(String(valorActual))) lista.push(String(valorActual));
  return lista;
}

function tituloEstimacion(vistaPrevia) {
  const importe = Number(vistaPrevia.importe);
  if (vistaPrevia.importe === null || vistaPrevia.importe === undefined || !Number.isFinite(importe)) {
    return vistaPrevia.mensaje || 'Comisión estimada';
  }
  const pagos = Number(vistaPrevia.numeroPagos) >= 1 ? Number(vistaPrevia.numeroPagos) : 1;
  const regla = String(vistaPrevia.regla || '').trim();
  return `Comisión estimada: ${EUROS.format(importe)} en ${pagos} ${pagos === 1 ? 'pago' : 'pagos'}`
    + (regla ? ` · regla ${regla}` : '');
}

/**
 * Cabecera de la pestaña a partir de la vista previa: tono (ok, aviso, neutro), título,
 * lo que falta (con su campo), explicación y avisos del cálculo. Sin `verImporte` (quien
 * no es administrador) solo dice si los datos están completos: ni importe ni avisos.
 */
export function cabeceraVistaPrevia(vistaPrevia, contrato = {}, { verImporte = true } = {}) {
  const avisos = verImporte
    ? (Array.isArray(vistaPrevia?.avisos) ? vistaPrevia.avisos : []).map(String).filter((a) => a.trim() !== '')
    : [];
  const mensaje = String(vistaPrevia?.mensaje || '').trim();
  // Lo que el servidor echa en falta se enlaza en cualquier estado (p. ej. la gestora en «Sin reglas»).
  const faltan = vistaPrevia?.estado === 'CALCULADO' ? [] : faltantesVistaPrevia(vistaPrevia, contrato);
  const cabecera = (tono, titulo, extra = {}) => ({
    tono, icono: ICONO[tono], titulo, detalle: '', faltan, avisos, estimacion: false, ...extra,
  });

  switch (vistaPrevia?.estado) {
    case 'CALCULADO':
      if (!verImporte) {
        return cabecera('ok', 'Datos de la comisión completos', {
          detalle: 'Al guardar el contrato se calculará la comisión y la revisará un administrador en Comisiones MCAS.',
        });
      }
      return cabecera('ok', tituloEstimacion(vistaPrevia), {
        estimacion: true,
        detalle: 'Es una estimación: el importe definitivo se calcula al guardar el contrato y lo aprueba un administrador en Comisiones MCAS.',
      });
    case 'REQUIERE_DATOS':
      // Sin estos datos el contrato no se guarda (reunión del 04/11/2026)
      if (!faltan.length) return cabecera('aviso', mensaje || 'Faltan datos para calcular la comisión.');
      // Lo único que falta no se escribe aquí (la zona sale de la provincia del punto): el
      // servidor dice por qué no la sabe y dónde se corrige
      if (faltan.every((f) => f.calculado))
        return cabecera('aviso', mensaje || 'No se puede saber la zona de comisión de este contrato.', {
          faltan: [],
          detalle: TEXTO_ZONA_SIN_SABER,
        });
      return verImporte
        ? cabecera('aviso', 'Para estimar la comisión falta:', {
          detalle: 'Sin estos datos no se puede guardar el contrato. Al completarlos, la estimación se actualizará sola.',
        })
        : cabecera('aviso', 'Para calcular la comisión falta:', { detalle: 'Sin estos datos no se puede guardar el contrato.' });
    case 'SIN_REGLAS':
      // Ninguna tabla encaja: puede no haberla, o faltar la gestora, o no estar vigente en
      // esa fecha... El motivo lo da el servidor; el texto fijo queda para cuando no lo da.
      return cabecera(faltan.length ? 'aviso' : 'neutro', mensaje || TEXTO_SIN_REGLAS);
    case 'REQUIERE_REVISION_MANUAL':
    case 'ERROR_CALCULO':
      return cabecera('aviso', mensaje || 'La comisión de este contrato se revisará a mano en Comisiones MCAS.');
    default:
      return cabecera(faltan.length ? 'aviso' : 'neutro', mensaje || 'Este contrato no tiene comisión automática.');
  }
}

/** Lo que el servidor dice de la comisión de un contrato guardado, en una frase (null si no hay nada). */
export function textoResumenMcas(resumen) {
  if (!resumen || typeof resumen !== 'object') return null;
  const mensaje = String(resumen.mensaje || '').trim();
  const faltan = (Array.isArray(resumen.queFalta) ? resumen.queFalta : [])
    .map((f) => String(f).trim())
    .filter((f) => f && !mensaje.includes(f));
  const partes = [mensaje, faltan.length ? `Falta: ${faltan.join(', ')}.` : ''].filter(Boolean);
  return partes.length ? partes.join(' ') : null;
}
