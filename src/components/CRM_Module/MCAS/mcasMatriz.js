// Editor en rejilla de las tablas de importes MCAS (reglas RANGE_LOOKUP,
// MATRIX_LOOKUP y MULTI_DIMENSION_LOOKUP). Traduce entre las filas planas de
// mcas_valores_rango (una fila por dimensión y celda, agrupadas por «orden») y
// una rejilla filas × columnas con pestañas. Sin dependencias de Vue para poder
// probarlo con node --test.
//
// Estructura de una rejilla:
//   { ok, idRegla, unidad, dimensiones,            // dimensiones: orden de las filas dentro de cada celda
//     filas:    { dimension, tipo, valores },       // tipo 'numerica' (valores = intervalos) o 'categoria'
//     columnas: { dimension, tipo, valores } | null // null = una sola columna (tabla por tramos)
//     pestanas: { dimensiones, valores },           // valores = [{ dimension: valor }] (al menos [{}])
//     flagsCategoria,                               // minInclusivo/maxInclusivo de las filas de texto
//     celdas }                                      // celdas[pestaña][fila][columna] = { valor, unidad, orden }
// Una celda vacía (valor null) no se guarda: los contratos que caen en ella quedan en revisión manual.

export const DIMENSIONES_CATEGORIA = ['tarifa_acceso', 'codigo_producto', 'segmento', 'tipo_suministro', 'zona_comision'];
export const DIMENSIONES_NUMERICAS = ['consumo_kwh', 'consumo_mwh', 'potencia_kw'];

export const NOMBRES_DIMENSION = {
  consumo_kwh: 'Consumo anual (kWh)',
  consumo_mwh: 'Consumo anual (MWh)',
  potencia_kw: 'Potencia (kW)',
  tarifa_acceso: 'Tarifa de acceso',
  codigo_producto: 'Producto',
  segmento: 'Segmento',
  tipo_suministro: 'Suministro',
  zona_comision: 'Zona de comisión',
};

const UNIDAD_POR_DEFECTO = 'EUR';
const FLAGS_CATEGORIA = { minInclusivo: true, maxInclusivo: false };
const TEXTOS_VACIOS = ['n. aplica', 'n.aplica', 'n aplica', 'no aplica', 'consultar', '-', '—', '–'];

export function nombreDimension(dimension) {
  return NOMBRES_DIMENSION[dimension] || dimension || '';
}

export function esDimensionCategoria(dimension) {
  return DIMENSIONES_CATEGORIA.includes(dimension);
}

// ---------------------------------------------------------------------------
// Números en formato español
// ---------------------------------------------------------------------------

/** 5000 → «5.000», 10.5 → «10,5» (agrupa siempre los miles, como el Excel del cliente). */
export function formatearNumero(n) {
  if (n === null || n === undefined || n === '' || !Number.isFinite(Number(n))) return '';
  const valor = Number(n);
  const [entera, decimales] = Math.abs(valor).toFixed(6).replace(/0+$/, '').replace(/\.$/, '').split('.');
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}${conMiles}${decimales ? `,${decimales}` : ''}`;
}

// El punto solo separa miles si le siguen grupos de exactamente tres cifras y la
// parte entera no empieza por 0 (1.234, 12.345.678); si no, es el decimal (0.125, 4.05).
const MILES_CON_PUNTO = /^-?[1-9]\d{0,2}(\.\d{3})+$/;

function leerNumero(texto) {
  let t = String(texto ?? '').replace(/[\s\u00a0€]/g, '');
  if (!t) return null;
  if (t.includes(',')) {
    const [entera, ...resto] = t.split(',');
    if (resto.length !== 1 || (entera.includes('.') && !MILES_CON_PUNTO.test(entera))) return null;
    t = `${entera.replace(/\./g, '')}.${resto[0]}`;
  } else if (MILES_CON_PUNTO.test(t)) {
    t = t.replace(/\./g, '');
  }
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Texto de una celda: { vacia: true } | { valor } | { error }. «N. Aplica» y «Consultar» cuentan como vacías. */
export function leerImporte(texto) {
  const limpio = String(texto ?? '').trim();
  if (!limpio || TEXTOS_VACIOS.includes(limpio.toLowerCase())) return { vacia: true };
  const n = leerNumero(limpio);
  return n === null ? { error: `«${limpio}» no es un importe` } : { valor: n };
}

// ---------------------------------------------------------------------------
// Intervalos
// ---------------------------------------------------------------------------

const vacio = (v) => v === null || v === undefined || v === '';
const aNumero = (v) => (vacio(v) ? null : Number(v));

function normalizarIntervalo(i) {
  return {
    valorMin: aNumero(i?.valorMin),
    valorMax: aNumero(i?.valorMax),
    minInclusivo: i?.minInclusivo !== false,
    maxInclusivo: i?.maxInclusivo === true,
  };
}

function mismoIntervalo(a, b) {
  const x = normalizarIntervalo(a);
  const y = normalizarIntervalo(b);
  return x.valorMin === y.valorMin && x.valorMax === y.valorMax
    && (x.valorMin === null || x.minInclusivo === y.minInclusivo)
    && (x.valorMax === null || x.maxInclusivo === y.maxInclusivo);
}

/** En el Excel «5.001-10.000» sigue a «0-5.000»: el 1 final marca el comienzo del tramo siguiente. */
const sigueAlAnterior = (n) => n > 1 && (n - 1) % 1000 === 0;

/**
 * Lee un tramo escrito como en el Excel del cliente: «0-5.000» = [0, 5000];
 * «5.001-10.000» = (5000, 10000]; «10-15» = (10, 15]; «>800.001» = (800000, ∞);
 * «≥5.000», «≤10», «<10»; o con corchetes «[5; 10)», «(10,5; ∞)». Admite la unidad al final.
 * Devuelve null si no se entiende.
 */
export function leerIntervalo(texto) {
  const t = String(texto ?? '').trim().replace(/\s*(kwh|mwh|kw|€)\s*$/i, '').trim();
  if (!t) return null;
  if (/^(cualquiera|todos?)$/i.test(t)) return { valorMin: null, valorMax: null, minInclusivo: true, maxInclusivo: false };
  const NUM = '(-?[\\d.,]+)';
  let r = t.match(new RegExp(`^${NUM}\\s*[-–]\\s*${NUM}$`));
  if (r) {
    const a = leerNumero(r[1]);
    const b = leerNumero(r[2]);
    if (a === null || b === null) return null;
    if (a === 0) return { valorMin: 0, valorMax: b, minInclusivo: true, maxInclusivo: true };
    return { valorMin: sigueAlAnterior(a) ? a - 1 : a, valorMax: b, minInclusivo: false, maxInclusivo: true };
  }
  r = t.match(new RegExp(`^(>=|≥|>|<=|≤|<)\\s*${NUM}$`));
  if (r) {
    const n = leerNumero(r[2]);
    if (n === null) return null;
    switch (r[1]) {
      case '>': return { valorMin: sigueAlAnterior(n) ? n - 1 : n, valorMax: null, minInclusivo: false, maxInclusivo: false };
      case '>=': case '≥': return { valorMin: n, valorMax: null, minInclusivo: true, maxInclusivo: false };
      case '<=': case '≤': return { valorMin: null, valorMax: n, minInclusivo: true, maxInclusivo: true };
      default: return { valorMin: null, valorMax: n, minInclusivo: true, maxInclusivo: false };
    }
  }
  r = t.match(/^([[(])\s*(-?∞|[\d.,-]*)\s*;\s*(∞|[\d.,-]*)\s*([\])])$/);
  if (r) {
    const min = r[2] === '' || r[2] === '-∞' ? null : leerNumero(r[2]);
    const max = r[3] === '' || r[3] === '∞' ? null : leerNumero(r[3]);
    if ((min === null && r[2] !== '' && r[2] !== '-∞') || (max === null && r[3] !== '' && r[3] !== '∞')) return null;
    return { valorMin: min, valorMax: max, minInclusivo: r[1] === '[', maxInclusivo: r[4] === ']' };
  }
  return null;
}

function etiquetaCorchetes(i) {
  const min = i.valorMin === null ? '-∞' : formatearNumero(i.valorMin);
  const max = i.valorMax === null ? '∞' : formatearNumero(i.valorMax);
  return `${i.valorMin !== null && i.minInclusivo ? '[' : '('}${min}; ${max}${i.valorMax !== null && i.maxInclusivo ? ']' : ')'}`;
}

/** Rótulo de un tramo con la notación del Excel; si no la admite, con corchetes (siempre se vuelve a leer igual). */
export function etiquetaIntervalo(intervalo) {
  const i = normalizarIntervalo(intervalo);
  const { valorMin: a, valorMax: b } = i;
  let candidato = null;
  if (a === null && b === null) candidato = 'Cualquiera';
  else if (a !== null && b !== null && i.maxInclusivo) {
    if (i.minInclusivo && a === 0) candidato = `0-${formatearNumero(b)}`;
    else if (!i.minInclusivo) candidato = `${formatearNumero(a > 0 && a % 1000 === 0 ? a + 1 : a)}-${formatearNumero(b)}`;
  } else if (a !== null && b === null) {
    candidato = i.minInclusivo ? `≥${formatearNumero(a)}` : `>${formatearNumero(a > 0 && a % 1000 === 0 ? a + 1 : a)}`;
  } else if (a === null && b !== null) {
    candidato = `${i.maxInclusivo ? '≤' : '<'}${formatearNumero(b)}`;
  }
  if (candidato && mismoIntervalo(leerIntervalo(candidato), i)) return candidato;
  return etiquetaCorchetes(i);
}

function compararIntervalos(x, y) {
  const a = normalizarIntervalo(x);
  const b = normalizarIntervalo(y);
  const minA = a.valorMin ?? -Infinity;
  const minB = b.valorMin ?? -Infinity;
  if (minA !== minB) return minA - minB;
  if (a.minInclusivo !== b.minInclusivo) return a.minInclusivo ? -1 : 1;
  return (a.valorMax ?? Infinity) - (b.valorMax ?? Infinity);
}

/** ¿Se solapan dos tramos consecutivos (ordenados)? */
function solapan(a, b) {
  if (a.valorMax === null) return true;
  if (b.valorMin === null) return true;
  if (a.valorMax > b.valorMin) return true;
  return a.valorMax === b.valorMin && a.maxInclusivo && b.minInclusivo;
}

function hayHueco(a, b) {
  if (a.valorMax === null || b.valorMin === null) return false;
  if (a.valorMax < b.valorMin) return true;
  return a.valorMax === b.valorMin && !a.maxInclusivo && !b.minInclusivo;
}

// ---------------------------------------------------------------------------
// Rejilla
// ---------------------------------------------------------------------------

const celdaVacia = () => ({ valor: null, unidad: null, orden: null });

function claveValor(tipo, valor) {
  if (tipo === 'categoria') return String(valor ?? '').trim().toUpperCase();
  const i = normalizarIntervalo(valor);
  return [i.valorMin ?? '', i.valorMax ?? '', i.valorMin === null ? '' : i.minInclusivo, i.valorMax === null ? '' : i.maxInclusivo].join('|');
}

function intervaloDe(fila) {
  return {
    valorMin: aNumero(fila.valorMin),
    valorMax: aNumero(fila.valorMax),
    minInclusivo: fila.minInclusivo !== false,
    maxInclusivo: fila.maxInclusivo === true,
  };
}

function eje(dimension, tipo, valores = []) {
  return { dimension, tipo, valores };
}

function productoPestanas(dimensiones, ejes) {
  let combinaciones = [{}];
  for (const d of dimensiones) {
    const siguiente = [];
    for (const c of combinaciones) for (const v of ejes[d].valores) siguiente.push({ ...c, [d]: v });
    combinaciones = siguiente;
  }
  return combinaciones;
}

function matrizVacia(nPestanas, nFilas, nColumnas) {
  return Array.from({ length: nPestanas }, () =>
    Array.from({ length: nFilas }, () => Array.from({ length: nColumnas }, celdaVacia)));
}

function numeroColumnas(rejilla) {
  return rejilla.columnas ? rejilla.columnas.valores.length : 1;
}

function tipoDe(dimension) {
  return esDimensionCategoria(dimension) ? 'categoria' : 'numerica';
}

/** Rejilla sin celdas para una tabla nueva: se eligen las dimensiones de filas, columnas y pestañas. */
export function rejillaVacia({ filas, columnas = null, pestanas = [], idRegla = null, unidad = UNIDAD_POR_DEFECTO } = {}) {
  const dimensiones = [filas, columnas, ...pestanas].filter(Boolean);
  const flagsCategoria = Object.fromEntries(dimensiones.filter(esDimensionCategoria).map((d) => [d, { ...FLAGS_CATEGORIA }]));
  const ejesPestana = Object.fromEntries(pestanas.map((d) => [d, eje(d, tipoDe(d))]));
  const rejilla = {
    ok: true,
    idRegla,
    unidad,
    dimensiones,
    filas: filas ? eje(filas, tipoDe(filas)) : null,
    columnas: columnas ? eje(columnas, tipoDe(columnas)) : null,
    pestanas: { dimensiones: [...pestanas], ejes: ejesPestana, valores: pestanas.length ? [] : [{}] },
    flagsCategoria,
    celdas: [],
  };
  rejilla.celdas = matrizVacia(rejilla.pestanas.valores.length, 0, numeroColumnas(rejilla));
  return rejilla;
}

/**
 * Filas de mcas_valores_rango → rejilla. Filas = la dimensión numérica con más
 * tramos; columnas = la otra numérica o, si solo hay una, la categoría con más
 * valores; el resto de dimensiones, en pestañas. { ok: false, motivo } si la
 * tabla no es cartesiana (celdas con dimensiones distintas, repetidas o en la
 * misma posición, o importes distintos dentro de una celda).
 */
export function aRejilla(valores) {
  const lista = Array.isArray(valores) ? valores : [];
  if (!lista.length) return { ...rejillaVacia({}), vacia: true };

  const idRegla = lista.find((v) => v.idRegla != null)?.idRegla ?? null;
  const unidades = new Map();
  lista.forEach((v) => unidades.set(v.unidadResultado, (unidades.get(v.unidadResultado) || 0) + 1));
  const unidad = [...unidades.entries()].sort((a, b) => b[1] - a[1])[0][0] || UNIDAD_POR_DEFECTO;

  // Una tabla por tramos (una sola dimensión) tiene una fila por tramo aunque repita «orden».
  const unaDimension = new Set(lista.map((v) => v.dimension)).size === 1;
  const grupos = new Map();
  lista.forEach((v, i) => {
    const clave = unaDimension ? `fila-${i}` : `orden-${v.orden}`;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(v);
  });
  const celdas = [...grupos.values()];
  const nombreCelda = (celda) => celda[0].orden ?? '?';

  const dimensiones = celdas[0].map((v) => v.dimension);
  const firma = [...dimensiones].sort().join(',');
  for (const celda of celdas) {
    const dims = celda.map((v) => v.dimension);
    if (new Set(dims).size !== dims.length) return { ok: false, motivo: `La celda ${nombreCelda(celda)} repite una dimensión` };
    if ([...dims].sort().join(',') !== firma) {
      return { ok: false, motivo: `La celda ${nombreCelda(celda)} no usa las mismas dimensiones que las demás` };
    }
    const importes = new Set(celda.map((v) => (vacio(v.valorResultado) ? null : Number(v.valorResultado))));
    const unidadesCelda = new Set(celda.map((v) => v.unidadResultado ?? null));
    if (importes.size !== 1 || unidadesCelda.size !== 1) {
      return { ok: false, motivo: `La celda ${nombreCelda(celda)} tiene importes distintos en sus filas` };
    }
  }

  // Tipo de cada dimensión y sus valores distintos (en orden de aparición).
  const ejes = {};
  const flagsCategoria = {};
  for (const d of dimensiones) {
    const filasD = lista.filter((v) => v.dimension === d);
    const conCategoria = filasD.filter((v) => !vacio(v.valorCategoria));
    const conLimites = filasD.filter((v) => !vacio(v.valorMin) || !vacio(v.valorMax));
    let tipo = esDimensionCategoria(d) ? 'categoria' : 'numerica';
    if (!DIMENSIONES_CATEGORIA.includes(d) && !DIMENSIONES_NUMERICAS.includes(d) && conCategoria.length) tipo = 'categoria';
    if ((tipo === 'categoria' && (conLimites.length || conCategoria.length !== filasD.length))
      || (tipo === 'numerica' && conCategoria.length)) {
      return { ok: false, motivo: `La dimensión ${nombreDimension(d)} mezcla tramos numéricos y categorías` };
    }
    const vistos = new Map();
    for (const v of filasD) {
      const valor = tipo === 'categoria' ? String(v.valorCategoria) : intervaloDe(v);
      const clave = claveValor(tipo, valor);
      if (!vistos.has(clave)) vistos.set(clave, valor);
    }
    const valoresD = [...vistos.values()];
    if (tipo === 'numerica') valoresD.sort(compararIntervalos);
    ejes[d] = eje(d, tipo, valoresD);
    if (tipo === 'categoria') {
      flagsCategoria[d] = { minInclusivo: filasD[0].minInclusivo !== false, maxInclusivo: filasD[0].maxInclusivo === true };
    }
  }

  // Ejes: numéricas por número de tramos; categorías por número de valores.
  const porTamano = (tipo) => dimensiones.filter((d) => ejes[d].tipo === tipo)
    .sort((a, b) => ejes[b].valores.length - ejes[a].valores.length || dimensiones.indexOf(a) - dimensiones.indexOf(b));
  const orden = [...porTamano('numerica'), ...porTamano('categoria')];
  const [dFilas, dColumnas, ...dPestanas] = orden;
  const rejilla = {
    ok: true,
    idRegla,
    unidad,
    dimensiones,
    filas: ejes[dFilas],
    columnas: dColumnas ? ejes[dColumnas] : null,
    pestanas: { dimensiones: dPestanas, ejes: Object.fromEntries(dPestanas.map((d) => [d, ejes[d]])), valores: productoPestanas(dPestanas, ejes) },
    flagsCategoria,
    celdas: [],
  };
  rejilla.celdas = matrizVacia(rejilla.pestanas.valores.length, rejilla.filas.valores.length, numeroColumnas(rejilla));

  const indice = (d, fila) => {
    const tipo = ejes[d].tipo;
    const clave = claveValor(tipo, tipo === 'categoria' ? fila.valorCategoria : intervaloDe(fila));
    return ejes[d].valores.findIndex((v) => claveValor(tipo, v) === clave);
  };
  const clavePestana = (combinacion) => dPestanas.map((d) => claveValor(ejes[d].tipo, combinacion[d])).join('#');
  const pestanaPorClave = new Map(rejilla.pestanas.valores.map((c, p) => [clavePestana(c), p]));
  const ocupadas = new Map();
  for (const celda of celdas) {
    const porDim = Object.fromEntries(celda.map((v) => [v.dimension, v]));
    const f = indice(dFilas, porDim[dFilas]);
    const c = dColumnas ? indice(dColumnas, porDim[dColumnas]) : 0;
    const combinacion = Object.fromEntries(dPestanas.map((d) => [d, ejes[d].valores[indice(d, porDim[d])]]));
    const p = pestanaPorClave.get(clavePestana(combinacion));
    const posicion = `${p}|${f}|${c}`;
    if (ocupadas.has(posicion)) {
      return { ok: false, motivo: `Las celdas ${ocupadas.get(posicion)} y ${nombreCelda(celda)} ocupan la misma posición de la tabla` };
    }
    ocupadas.set(posicion, nombreCelda(celda));
    const primera = celda[0];
    rejilla.celdas[p][f][c] = {
      valor: vacio(primera.valorResultado) ? null : Number(primera.valorResultado),
      unidad: primera.unidadResultado ?? null,
      orden: primera.orden ?? null,
    };
  }
  return rejilla;
}

/** Celdas con importe en el orden en que se guardan: primero las cargadas (por su orden), luego las nuevas. */
export function numerarCeldas(rejilla) {
  const lista = [];
  (rejilla?.celdas || []).forEach((filas, p) => filas.forEach((columnas, f) => columnas.forEach((celda, c) => {
    if (celda && celda.valor !== null && celda.valor !== undefined && !celda.invalido) {
      lista.push({ celda, pestana: p, fila: f, columna: c });
    }
  })));
  lista.sort((x, y) => (x.celda.orden ?? Infinity) - (y.celda.orden ?? Infinity)
    || x.pestana - y.pestana || x.fila - y.fila || x.columna - y.columna);
  return lista.map(({ pestana, fila, columna }, i) => ({ orden: i + 1, pestana, fila, columna }));
}

/** Posición de la celda que se cargó con ese «orden» (para las incidencias de la comprobación). */
export function posicionDeOrden(rejilla, orden) {
  if (orden === null || orden === undefined) return null;
  for (let p = 0; p < (rejilla?.celdas || []).length; p++) {
    for (let f = 0; f < rejilla.celdas[p].length; f++) {
      for (let c = 0; c < rejilla.celdas[p][f].length; c++) {
        if (rejilla.celdas[p][f][c]?.orden === Number(orden)) return { pestana: p, fila: f, columna: c };
      }
    }
  }
  return null;
}

function valorEnEje(rejilla, dimension, posicion) {
  if (rejilla.filas?.dimension === dimension) return rejilla.filas.valores[posicion.fila];
  if (rejilla.columnas?.dimension === dimension) return rejilla.columnas.valores[posicion.columna];
  return rejilla.pestanas.valores[posicion.pestana]?.[dimension];
}

function tipoEnRejilla(rejilla, dimension) {
  if (rejilla.filas?.dimension === dimension) return rejilla.filas.tipo;
  if (rejilla.columnas?.dimension === dimension) return rejilla.columnas.tipo;
  return rejilla.pestanas.ejes?.[dimension]?.tipo || tipoDe(dimension);
}

/** Rejilla → filas de mcas_valores_rango (sin id: el servidor reemplaza la tabla entera y renumera). */
export function aFilas(rejilla) {
  const filas = [];
  for (const posicion of numerarCeldas(rejilla)) {
    const celda = rejilla.celdas[posicion.pestana][posicion.fila][posicion.columna];
    for (const dimension of rejilla.dimensiones) {
      const valor = valorEnEje(rejilla, dimension, posicion);
      const base = { idRegla: rejilla.idRegla ?? null, dimension };
      if (tipoEnRejilla(rejilla, dimension) === 'categoria') {
        const flags = rejilla.flagsCategoria?.[dimension] || FLAGS_CATEGORIA;
        Object.assign(base, { valorMin: null, valorMax: null, minInclusivo: flags.minInclusivo, maxInclusivo: flags.maxInclusivo,
          valorCategoria: String(valor ?? '').trim() });
      } else {
        const i = intervaloDe(valor || {});
        Object.assign(base, { valorMin: i.valorMin, valorMax: i.valorMax, minInclusivo: i.minInclusivo, maxInclusivo: i.maxInclusivo,
          valorCategoria: null });
      }
      filas.push({ ...base, valorResultado: celda.valor, unidadResultado: celda.unidad ?? rejilla.unidad ?? UNIDAD_POR_DEFECTO,
        orden: posicion.orden });
    }
  }
  return filas;
}

// ---------------------------------------------------------------------------
// Estructura: filas, columnas y pestañas
// ---------------------------------------------------------------------------

/** Texto de una cabecera → valor del eje (tramo o categoría); null si no se entiende. */
export function leerCabecera(tipo, texto) {
  if (tipo === 'categoria') {
    const t = String(texto ?? '').trim();
    return t || null;
  }
  return leerIntervalo(texto);
}

export function etiquetaCabecera(tipo, valor) {
  return tipo === 'categoria' ? String(valor ?? '') : etiquetaIntervalo(valor);
}

function posicionOrdenada(eje, valor) {
  if (eje.tipo !== 'numerica') return eje.valores.length;
  const i = eje.valores.findIndex((v) => compararIntervalos(valor, v) < 0);
  return i === -1 ? eje.valores.length : i;
}

/** Añade una fila (tramo o categoría) en su sitio; devuelve su índice. */
export function anadirFila(rejilla, valor) {
  const i = posicionOrdenada(rejilla.filas, valor);
  rejilla.filas.valores.splice(i, 0, valor);
  rejilla.celdas.forEach((filas) => filas.splice(i, 0, Array.from({ length: numeroColumnas(rejilla) }, celdaVacia)));
  return i;
}

export function quitarFila(rejilla, i) {
  rejilla.filas.valores.splice(i, 1);
  rejilla.celdas.forEach((filas) => filas.splice(i, 1));
}

export function anadirColumna(rejilla, valor) {
  const j = posicionOrdenada(rejilla.columnas, valor);
  rejilla.columnas.valores.splice(j, 0, valor);
  rejilla.celdas.forEach((filas) => filas.forEach((columnas) => columnas.splice(j, 0, celdaVacia())));
  return j;
}

export function quitarColumna(rejilla, j) {
  rejilla.columnas.valores.splice(j, 1);
  rejilla.celdas.forEach((filas) => filas.forEach((columnas) => columnas.splice(j, 1)));
}

/** Nueva pestaña (solo con una dimensión de pestaña). */
export function anadirPestana(rejilla, valor) {
  const [dimension] = rejilla.pestanas.dimensiones;
  rejilla.pestanas.valores.push({ [dimension]: valor });
  rejilla.pestanas.ejes?.[dimension]?.valores.push(valor);
  rejilla.celdas.push(Array.from({ length: rejilla.filas.valores.length },
    () => Array.from({ length: numeroColumnas(rejilla) }, celdaVacia)));
  return rejilla.pestanas.valores.length - 1;
}

export function quitarPestana(rejilla, p) {
  rejilla.pestanas.valores.splice(p, 1);
  rejilla.celdas.splice(p, 1);
}

export function etiquetaPestana(rejilla, p) {
  const combinacion = rejilla.pestanas.valores[p] || {};
  return rejilla.pestanas.dimensiones
    .map((d) => etiquetaCabecera(tipoEnRejilla(rejilla, d), combinacion[d]))
    .join(' · ') || 'Tabla';
}

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

function validarEje(rejilla, nombreEje, ejeRejilla, errores, avisos, unaDimension) {
  if (!ejeRejilla) return;
  const titulo = nombreEje === 'filas' ? 'fila' : 'columna';
  const claves = new Map();
  ejeRejilla.valores.forEach((v, i) => {
    if (ejeRejilla.tipo === 'categoria') {
      if (!String(v ?? '').trim()) errores.push({ eje: nombreEje, indice: i, mensaje: `La ${titulo} ${i + 1} no tiene nombre` });
    } else {
      const t = normalizarIntervalo(v);
      if (t.valorMin !== null && t.valorMax !== null
        && (t.valorMin > t.valorMax || (t.valorMin === t.valorMax && !(t.minInclusivo && t.maxInclusivo)))) {
        errores.push({ eje: nombreEje, indice: i, mensaje: `El tramo «${etiquetaIntervalo(t)}» está vacío: el mínimo supera al máximo` });
      }
    }
    const clave = claveValor(ejeRejilla.tipo, v);
    if (claves.has(clave)) {
      errores.push({ eje: nombreEje, indice: i, mensaje: `«${etiquetaCabecera(ejeRejilla.tipo, v)}» está repetido` });
    }
    claves.set(clave, i);
  });
  if (ejeRejilla.tipo !== 'numerica') return;
  const ordenados = ejeRejilla.valores.map((v, i) => ({ t: normalizarIntervalo(v), i })).sort((a, b) => compararIntervalos(a.t, b.t));
  for (let k = 0; k + 1 < ordenados.length; k++) {
    const a = ordenados[k];
    const b = ordenados[k + 1];
    if (claveValor('numerica', a.t) === claveValor('numerica', b.t)) continue;
    if (solapan(a.t, b.t)) {
      errores.push({ eje: nombreEje, indice: b.i, mensaje: `Los tramos «${etiquetaIntervalo(a.t)}» y «${etiquetaIntervalo(b.t)}» se solapan` });
    } else if (hayHueco(a.t, b.t)) {
      const mensaje = `Hay un hueco entre «${etiquetaIntervalo(a.t)}» y «${etiquetaIntervalo(b.t)}»`;
      if (unaDimension) errores.push({ eje: nombreEje, indice: b.i, mensaje: `${mensaje}: una tabla por tramos no puede tener huecos` });
      else avisos.push({ eje: nombreEje, indice: b.i, mensaje: `${mensaje}: los contratos de ese hueco quedarán en revisión manual` });
    }
  }
}

/** { ok, errores, avisos }: cada incidencia lleva su mensaje y, si procede, pestaña/fila/columna o eje/índice. */
export function validarRejilla(rejilla) {
  const errores = [];
  const avisos = [];
  if (!rejilla?.filas) {
    errores.push({ mensaje: 'Elija qué dato va en las filas de la tabla' });
    return { ok: false, errores, avisos };
  }
  const unaDimension = rejilla.dimensiones.length === 1;
  validarEje(rejilla, 'filas', rejilla.filas, errores, avisos, unaDimension);
  validarEje(rejilla, 'columnas', rejilla.columnas, errores, avisos, unaDimension);

  let conImporte = 0;
  let vacias = 0;
  rejilla.celdas.forEach((filas, p) => filas.forEach((columnas, f) => columnas.forEach((celda, c) => {
    const donde = `fila «${etiquetaCabecera(rejilla.filas.tipo, rejilla.filas.valores[f])}»`
      + (rejilla.columnas ? `, columna «${etiquetaCabecera(rejilla.columnas.tipo, rejilla.columnas.valores[c])}»` : '');
    if (celda?.invalido) {
      errores.push({ pestana: p, fila: f, columna: c, mensaje: `En la ${donde}: «${celda.invalido}» no es un importe` });
    } else if (celda?.valor === null || celda?.valor === undefined) {
      vacias += 1;
    } else if (!Number.isFinite(Number(celda.valor))) {
      errores.push({ pestana: p, fila: f, columna: c, mensaje: `En la ${donde}: el importe no es un número` });
    } else {
      conImporte += 1;
      if (Number(celda.valor) < 0) errores.push({ pestana: p, fila: f, columna: c, mensaje: `En la ${donde}: el importe no puede ser negativo` });
    }
  })));
  if (!conImporte) errores.push({ mensaje: 'La tabla no tiene ningún importe: rellene al menos una celda' });
  else if (vacias) {
    avisos.push({ mensaje: vacias === 1
      ? 'Hay 1 celda vacía: los contratos que caigan en ella quedarán en revisión manual'
      : `Hay ${vacias} celdas vacías: los contratos que caigan en ellas quedarán en revisión manual` });
  }
  return { ok: errores.length === 0, errores, avisos };
}

// ---------------------------------------------------------------------------
// Pegar desde Excel
// ---------------------------------------------------------------------------

/**
 * Texto copiado de Excel (columnas separadas por tabuladores) → importes.
 * Números en formato español; «N. Aplica», «Consultar» y vacío = celda vacía.
 * Si el bloque trae la primera fila y la primera columna con los tramos, se
 * devuelven aparte (cabeceraColumnas / cabeceraFilas) para crear una tabla nueva.
 */
export function pegarDesdeExcel(texto) {
  const lineas = String(texto ?? '').replace(/\r/g, '').split('\n');
  while (lineas.length && !lineas[lineas.length - 1].trim()) lineas.pop();
  let matriz = lineas.map((l) => l.split('\t'));

  const esNumero = (t) => leerImporte(t).valor !== undefined;
  const esVacia = (t) => leerImporte(t).vacia === true;
  let cabeceraColumnas = null;
  let cabeceraFilas = null;
  const primera = matriz[0] || [];
  const conEsquina = matriz.length > 1 && matriz.slice(1).every((fila) => leerIntervalo(fila[0]) && !esNumero(fila[0]));
  const candidatas = primera.slice(conEsquina ? 1 : 0);
  if (matriz.length > 1 && candidatas.length && candidatas.every((t) => String(t).trim() && !esNumero(t) && !esVacia(t))) {
    cabeceraColumnas = candidatas.map((t) => String(t).trim());
    matriz = matriz.slice(1);
  }
  if (matriz.length && matriz.every((fila) => fila.length > 1 && leerIntervalo(fila[0]) && !esNumero(fila[0]))) {
    cabeceraFilas = matriz.map((fila) => String(fila[0]).trim());
    matriz = matriz.map((fila) => fila.slice(1));
  }

  const errores = [];
  const filas = matriz.map((fila, f) => fila.map((t, c) => {
    const leido = leerImporte(t);
    if (leido.error) {
      errores.push({ fila: f, columna: c, texto: String(t).trim() });
      return null;
    }
    return leido.vacia ? null : leido.valor;
  }));
  return { filas, errores, cabeceraFilas, cabeceraColumnas };
}

/** Escribe lo pegado desde la celda indicada; lo que no cabe en la rejilla se cuenta en «fuera». */
export function aplicarPegado(rejilla, pegado, { pestana = 0, fila = 0, columna = 0 } = {}) {
  let escritas = 0;
  let fuera = 0;
  const destino = rejilla.celdas[pestana] || [];
  (pegado?.filas || []).forEach((valoresFila, i) => valoresFila.forEach((valor, j) => {
    const celda = destino[fila + i]?.[columna + j];
    if (!celda) {
      fuera += 1;
      return;
    }
    celda.valor = valor;
    delete celda.invalido;
    if (valor !== null && !celda.unidad) celda.unidad = rejilla.unidad || UNIDAD_POR_DEFECTO;
    escritas += 1;
  }));
  return { escritas, fuera };
}

/** Tabla nueva a partir de un bloque pegado con cabeceras (primera fila y primera columna con los tramos). */
export function rejillaDesdePegado(pegado, { filas, columnas = null, idRegla = null, unidad = UNIDAD_POR_DEFECTO } = {}) {
  if (!pegado?.cabeceraFilas) {
    return { ok: false, motivo: 'Copie también la primera columna del Excel, con los tramos de cada fila' };
  }
  if (columnas && !pegado.cabeceraColumnas) {
    return { ok: false, motivo: 'Copie también la primera fila del Excel, con los tramos de cada columna' };
  }
  const rejilla = rejillaVacia({ filas, columnas, idRegla, unidad });
  for (const texto of pegado.cabeceraFilas) {
    const valor = leerCabecera(rejilla.filas.tipo, texto);
    if (!valor) return { ok: false, motivo: `No se entiende el tramo «${texto}» de la primera columna` };
    rejilla.filas.valores.push(valor);
  }
  for (const texto of columnas ? pegado.cabeceraColumnas : []) {
    const valor = leerCabecera(rejilla.columnas.tipo, texto);
    if (!valor) return { ok: false, motivo: `No se entiende el tramo «${texto}» de la primera fila` };
    rejilla.columnas.valores.push(valor);
  }
  rejilla.celdas = matrizVacia(1, rejilla.filas.valores.length, numeroColumnas(rejilla));
  aplicarPegado(rejilla, pegado, { pestana: 0, fila: 0, columna: 0 });
  return { ok: true, rejilla };
}
