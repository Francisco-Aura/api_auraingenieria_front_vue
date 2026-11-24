// Configuración MCAS: estado de cada comercializadora (qué tabla de comisiones
// calcula hoy, qué falta por activar) y marcas «Pendiente» con el enlace a la
// pantalla donde se completa cada una. Sin dependencias de Vue para poder
// probarlo con node --test.

export const ESTADOS_COMERCIALIZADORA = {
  ACTIVA: { etiqueta: 'Activa', tono: 'success' },
  PROGRAMADA: { etiqueta: 'Activa más adelante', tono: 'info' },
  BORRADOR: { etiqueta: 'Borrador pendiente de activar', tono: 'warning' },
  VALIDADA: { etiqueta: 'Validada sin publicar', tono: 'info' },
  SIN_TABLA: { etiqueta: 'Sin tabla', tono: 'neutral' },
};

const ETIQUETAS_ENLACE = {
  tabla: 'Revisar la tabla',
  regla: 'Abrir la regla',
  politica: 'Abrir la política',
  'nueva-tabla': 'Crear su tabla',
};

const dosCifras = (n) => String(n).padStart(2, '0');

/** Suma días a una fecha AAAA-MM-DD sin pasar por UTC. */
export function sumarDias(iso, dias) {
  const [anio, mes, dia] = String(iso || '').slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return '';
  const fecha = new Date(anio, mes - 1, dia + Number(dias || 0));
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
}

function fechaCorta(iso) {
  const [anio, mes, dia] = String(iso || '').slice(0, 10).split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : '';
}

export function nombreConjunto(c) {
  return c?.nombre || c?.codigo || (c?.id != null ? `Tabla #${c.id}` : '—');
}

export function nombreRegla(r) {
  return r?.nombre || r?.codigo || (r?.id != null ? `Regla #${r.id}` : '—');
}

export function nombrePolitica(p) {
  return p?.nombre || p?.codigo || (p?.id != null ? `Política #${p.id}` : '—');
}

const vigenteEn = (c, dia) => (!c.vigenciaDesde || c.vigenciaDesde <= dia) && (!c.vigenciaHasta || c.vigenciaHasta >= dia);
const mismaId = (a, b) => a != null && b != null && String(a) === String(b);
const citar = (lista) => lista.map((c) => `«${nombreConjunto(c)}»`).join(' y ');

// Tramos sin tipo de valor elegido (SIN_CONFIRMAR, de datos antiguos): la política no se puede publicar.
const tieneSinConfirmar = (p) => (p?.tramos || []).some((t) => t.tipoValor === 'SIN_CONFIRMAR');

function marca(tipo, texto, enlace) {
  return { tipo, texto, enlace, etiquetaEnlace: ETIQUETAS_ENLACE[enlace.tipo] };
}

/**
 * Una fila por comercializadora (catálogo y las que aparezcan en tablas o políticas):
 * ACTIVA (tabla publicada y vigente hoy), PROGRAMADA (publicada, empieza más adelante),
 * BORRADOR, VALIDADA o SIN_TABLA (sus contratos se completan a mano). `pendienteActivar`
 * marca las que tienen un borrador o una tabla validada sin ninguna versión vigente.
 */
export function estadoPorComercializadora({
  conjuntos = [], comercializadoras = [], politicas = [], hoy, indexadoActivo = false,
} = {}) {
  const ids = new Map();
  for (const c of comercializadoras) if (c?.id != null) ids.set(String(c.id), c.nombre || `#${c.id}`);
  for (const x of [...conjuntos, ...politicas]) {
    if (x?.idComercializadora != null && !ids.has(String(x.idComercializadora))) {
      ids.set(String(x.idComercializadora), x.nombreComercializadora || `#${x.idComercializadora}`);
    }
  }

  const filas = [];
  for (const [id, nombre] of ids) {
    const propios = conjuntos.filter((c) => mismaId(c.idComercializadora, id));
    const publicados = propios.filter((c) => c.estado === 'PUBLICADO');
    const vigentes = publicados.filter((c) => vigenteEn(c, hoy))
      .sort((a, b) => String(b.vigenciaDesde || '').localeCompare(String(a.vigenciaDesde || '')));
    const futuros = publicados.filter((c) => c.vigenciaDesde && c.vigenciaDesde > hoy)
      .sort((a, b) => String(a.vigenciaDesde).localeCompare(String(b.vigenciaDesde)));
    const borradores = propios.filter((c) => c.estado === 'BORRADOR');
    const validadas = propios.filter((c) => c.estado === 'VALIDADO');

    let estado;
    let texto;
    if (vigentes.length) {
      estado = 'ACTIVA';
      texto = `Activa desde ${fechaCorta(vigentes[vigentes.length - 1].vigenciaDesde) || 'siempre'} (${citar(vigentes)})`;
    } else if (futuros.length) {
      estado = 'PROGRAMADA';
      texto = `Activa a partir del ${fechaCorta(futuros[0].vigenciaDesde)} (${citar(futuros.slice(0, 1))})`;
    } else if (borradores.length) {
      estado = 'BORRADOR';
      texto = `Borrador pendiente de activar (${citar(borradores)})`;
    } else if (validadas.length) {
      estado = 'VALIDADA';
      texto = `Validada sin publicar (${citar(validadas)})`;
    } else {
      estado = 'SIN_TABLA';
      texto = 'Sin tabla: las comisiones se completan a mano';
    }

    const pendientes = [];
    for (const c of borradores) {
      const bloqueada = c.fasePrecio && c.fasePrecio !== 'FIJO' && !indexadoActivo;
      pendientes.push(marca('tabla', bloqueada
        ? `Tabla «${nombreConjunto(c)}» en borrador: no se podrá activar mientras el interruptor Indexado esté apagado`
        : `Tabla «${nombreConjunto(c)}» en borrador: revísela y actívela`, { tipo: 'tabla', id: c.id }));
    }
    for (const c of validadas) {
      pendientes.push(marca('tabla', `Tabla «${nombreConjunto(c)}» validada sin publicar: actívela o vuélvala a borrador`,
        { tipo: 'tabla', id: c.id }));
    }
    for (const p of politicas.filter((x) => mismaId(x.idComercializadora, id) && x.estado !== 'ARCHIVADO' && tieneSinConfirmar(x))) {
      pendientes.push(marca('politica',
        `Retrocesión «${nombrePolitica(p)}»: hay tramos sin tipo de valor; elija «Porcentaje» o «Importe (€)» para poder publicarla`,
        { tipo: 'politica', id: p.id }));
    }
    if (estado === 'SIN_TABLA') {
      pendientes.push(marca('sin-tabla', 'Sin tabla de comisiones: las comisiones de sus contratos se completan a mano hasta que la cree',
        { tipo: 'nueva-tabla', idComercializadora: Number.isNaN(Number(id)) ? id : Number(id) }));
    }

    filas.push({
      idComercializadora: Number.isNaN(Number(id)) ? id : Number(id),
      nombre,
      estado,
      etiqueta: ESTADOS_COMERCIALIZADORA[estado].etiqueta,
      tono: ESTADOS_COMERCIALIZADORA[estado].tono,
      texto,
      vigentes,
      pendienteActivar: !vigentes.length && (borradores.length > 0 || validadas.length > 0),
      pendientes,
    });
  }
  return filas.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
}

/**
 * Comprobación para el panel «Estado del módulo»: lista solo con alguna tabla activa hoy y sin
 * borradores ni validadas pendientes de activar (las comercializadoras sin tabla se completan a mano).
 */
export function comprobacionActivacion(filas = []) {
  const faltan = filas.filter((f) => f.pendienteActivar);
  const hayActiva = filas.some((f) => f.estado === 'ACTIVA');
  let detalle = 'Todas las comercializadoras con tabla tienen una versión vigente.';
  if (faltan.length) {
    detalle = `Falta activar la tabla de: ${faltan.map((f) => f.nombre).join(', ')}. Mientras tanto, sus contratos quedan en revisión manual.`;
  } else if (!hayActiva) {
    detalle = 'Todavía no hay ninguna tabla de comisiones activa: hasta que active una, las comisiones se completan a mano.';
  }
  return {
    id: 'activacion',
    ok: faltan.length === 0 && hayActiva,
    titulo: 'Tablas de comisiones activadas',
    detalle,
    faltan: faltan.map((f) => f.nombre),
  };
}

/** Fecha (mañana) y nombre propuestos para la nueva versión de una tabla: «Iris 2026-10». */
export function propuestaNuevaVersion(conjunto, { hoy, nombreComercializadora = '' } = {}) {
  const vigenciaDesde = sumarDias(hoy, 1);
  const base = String(conjunto?.nombre || nombreComercializadora || conjunto?.codigo || 'Tabla')
    .replace(/\s*\d{4}([-./]\d{1,2}){0,2}\s*$/, '').trim();
  return { vigenciaDesde, nombre: `${base} ${vigenciaDesde.slice(0, 7)}`.trim() };
}

/** Incidencias de la comprobación agrupadas por regla (las que no son de una regla, al final). */
export function agruparIncidencias(incidencias = []) {
  const grupos = new Map();
  for (const inc of incidencias || []) {
    const clave = inc?.idRegla != null ? `r${inc.idRegla}` : 'tabla';
    if (!grupos.has(clave)) {
      grupos.set(clave, { idRegla: inc?.idRegla ?? null, regla: inc?.idRegla != null ? (inc.regla || `Regla #${inc.idRegla}`) : 'Tabla de comisiones', incidencias: [] });
    }
    grupos.get(clave).incidencias.push(inc);
  }
  const lista = [...grupos.values()];
  return [...lista.filter((g) => g.idRegla != null), ...lista.filter((g) => g.idRegla == null)];
}
