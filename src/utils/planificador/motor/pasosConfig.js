export const STEPS = [
    {
        key: 'paneles',
        short: 'Paneles',
        title: 'Paneles',
        help: [
            'Número de paneles = potencia objetivo ÷ potencia de cada panel.',
            'Anota los datos técnicos (Voc, Isc, Vmp, Imp y dimensiones): hacen falta para elegir la estructura y el inversor.',
        ],
        sections: [{ id: 'modulos', category: 'modulos' }],
    },
    {
        key: 'estructura',
        short: 'Estructura',
        title: 'Estructura de soporte',
        requires: 'paneles',
        help: [
            'Perfiles o raíles, ganchos o anclajes específicos para el tipo de cubierta, grapas intermedias y grapas finales.',
            'En cubierta plana o suelo: estructura inclinada (triángulos) y lastre o anclaje.',
        ],
        sections: [{ id: 'estructura', category: 'estructura' }],
    },
    {
        key: 'inversor',
        short: 'Inversor',
        title: 'Inversor',
        requires: 'paneles',
        help: [
            'Su potencia tiene que ir acorde a la de los paneles (habitualmente algo por debajo o similar).',
            'El voltaje y la corriente de los strings (paneles en serie) tienen que caber en su rango MPPT y en su tensión máxima de entrada, también en invierno, cuando sube el voltaje.',
            'Si en el futuro se quieren baterías, elegir directamente un inversor híbrido.',
            'En instalaciones pequeñas o con muchas sombras, los microinversores u optimizadores son una alternativa.',
            'Vatímetro o medidor de consumo: sirve para la monitorización y la inyección cero. La monitorización del inversor también se elige aquí.',
        ],
        doneBy: ['inversores'],
        sections: [
            { id: 'inversores', category: 'inversores', title: 'Inversor' },
            { id: 'contadores', category: 'contadores', title: 'Medidor de consumo' },
            { id: 'monitorizacion', category: 'monitorizacion', title: 'Monitorización' },
        ],
    },
    {
        key: 'baterias',
        short: 'Baterías',
        title: 'Baterías',
        requires: 'inversor',
        help: [
            'Deben ser compatibles con el inversor (marca o protocolo de comunicación y voltaje).',
        ],
        sections: [{ id: 'baterias', category: 'baterias' }],
    },
    {
        key: 'cableado_cc',
        short: 'Cableado DC',
        title: 'Cableado y protecciones en continua (DC)',
        help: [
            'Cable solar (normalmente 4 o 6 mm²), en rojo y negro. Calcula los metros y añade un margen del 10-15 %.',
            'Conectores MC4 (compatibles con los de los paneles) y la herramienta crimpadora.',
            'Cuadro de protecciones DC con fusibles por string, seccionador o interruptor DC y protector contra sobretensiones (DPS).',
            'Muchos inversores ya llevan algunas de estas protecciones integradas: revisa la ficha antes de duplicar.',
        ],
        sections: [
            { id: 'cable-cc', category: 'cableado', title: 'Cable solar', fixed: { tipo: ['CC'] } },
            { id: 'conectores', category: 'cableado', title: 'Conectores y herramienta', fixed: { tipo: ['Conectores', 'Herramienta'] } },
            { id: 'prot-cc', category: 'protecciones', title: 'Protecciones de continua', fixed: { tipo: ['CC'] } },
        ],
    },
    {
        key: 'alterna',
        short: 'Alterna (AC)',
        title: 'Lado de alterna (AC)',
        help: [
            'Cable desde el inversor hasta el cuadro general, magnetotérmico y diferencial dedicados, y DPS de alterna si procede.',
        ],
        sections: [
            { id: 'cable-ac', category: 'cableado', title: 'Cable de alterna', fixed: { tipo: ['AC'] } },
            { id: 'prot-ac', category: 'protecciones', title: 'Protecciones de alterna', fixed: { tipo: ['AC', 'Cuadro', 'Transformador'] } },
        ],
    },
    {
        key: 'tierra',
        short: 'Tierra',
        title: 'Puesta a tierra',
        help: ['Cable de tierra para la estructura y los marcos de los paneles, terminales y, si no existe, pica de tierra.'],
        sections: [{ id: 'tierra', category: 'tierra' }],
    },
    {
        key: 'auxiliar',
        short: 'Auxiliar',
        title: 'Material auxiliar',
        help: [
            'Tubo corrugado o canaleta, bridas resistentes a UV, prensaestopas, terminales, etiquetas de señalización y sellador para pasos de tejado.',
        ],
        sections: [{ id: 'auxiliar', category: 'auxiliar' }],
    },
    {
        key: 'tramites',
        short: 'Trámites',
        title: 'Trámites',
        libre: true, // no depende de los pasos anteriores y no los desbloquea: lleva partidas por defecto desde que se crea el presupuesto
        help: [
            'También son parte del presupuesto. En España la instalación la tiene que legalizar un instalador autorizado, que emite el certificado (boletín), y se registra como autoconsumo en la comunidad autónoma.',
            'Para cobrar excedentes también se tramita con la distribuidora y la comercializadora.',
            'Hay que informarse en el ayuntamiento sobre licencia o comunicación previa y posibles bonificaciones en IBI o ICIO.',
        ],
        sections: [
            { id: 'proyecto', category: 'proyecto', title: 'Proyecto y trámites' },
            { id: 'administrativos', category: 'administrativos', title: 'Costes administrativos' },
        ],
    },
    {
        key: 'obra',
        short: 'Obra',
        title: 'Mano de obra y logística',
        help: ['Montaje, instalación eléctrica, puesta en marcha, portes y medios auxiliares: lo que cuesta ejecutar la obra.'],
        sections: [
            { id: 'mano_obra', category: 'mano_obra', title: 'Mano de obra' },
            { id: 'logistica', category: 'logistica', title: 'Logística' },
        ],
    },
];
// ---- Orden fijo de las filas del presupuesto ------------------------------------------------------------------------
/** Lugar de un producto en el orden fijo: el de los pasos y, dentro de cada paso, el de sus secciones. */
export function stepRank(item) {
    if (!item)
        return STEPS.length * 100; // las filas libres, al final
    for (let i = 0; i < STEPS.length; i++) {
        const j = STEPS[i].sections.findIndex((sec) => sec.category === item.category &&
            Object.entries(sec.fixed ?? {}).every(([k, v]) => v.includes(String(item.attrs[k] ?? ''))));
        if (j >= 0)
            return i * 100 + j;
    }
    return STEPS.length * 100;
}
/**
 * Las filas en el orden fijo: por pasos (paneles, estructura, inversor…), y dentro de cada sección por nombre. Es el mismo
 * orden para la pantalla y para el PDF, así que dos presupuestos iguales salen siempre igual aunque se hayan montado
 * en distinto orden.
 */
export function sortFixed(lines, itemOf) {
    const name = (l) => l.model || l.equipment;
    return lines
        .map((line, index) => ({ line, index, rank: stepRank(line.itemId ? itemOf(line.itemId) : undefined) }))
        .sort((a, b) => a.rank - b.rank || name(a.line).localeCompare(name(b.line), 'es') || a.index - b.index)
        .map((x) => x.line);
}
// ---- Cálculos de apoyo -----------------------------------------------------------------------------------------
export const panelCount = (targetKwp, panelWp) => targetKwp > 0 && panelWp > 0 ? Math.max(1, Math.ceil((targetKwp * 1000) / panelWp)) : 0;
/** Margen que se añade a los metros de cable. */
export const CABLE_MARGIN = 0.12;
export const withMargin = (meters) => Math.ceil(meters * (1 + CABLE_MARGIN));
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
/** Aumento de la tensión en vacío del panel con frío (invierno) y caída de la tensión de trabajo con calor. */
export const COLD_VOC = 1.12;
export const HOT_VMP = 0.88;
/** Un string no puede llevar más de estos paneles, lo permita o no el inversor. */
export const MAX_STRING_PANELS = 20;
/** Y tampoco menos de estos, aunque al inversor le bastaran menos. */
export const MIN_STRING_PANELS = 4;
/**
 * Cuántos paneles en serie admite un string con este panel y este inversor: el mínimo para llegar al rango MPPT con calor y el
 * máximo para no pasar de la tensión máxima de entrada con frío (ni del límite del rango MPPT). Null si faltan datos.
 */
export function stringLimits(panel, inverter) {
    const voc = num(panel.attrs.voc_v);
    const vmp = num(panel.attrs.vmp_v);
    const mpptMin = num(inverter.attrs.mppt_min_v);
    const mpptMax = num(inverter.attrs.mppt_max_v);
    const vmax = num(inverter.attrs.vmax_v);
    if (voc === null || vmp === null || mpptMin === null || mpptMax === null || vmax === null)
        return null;
    return {
        min: Math.max(MIN_STRING_PANELS, Math.ceil(mpptMin / (vmp * HOT_VMP))),
        max: Math.floor(Math.min(vmax / (voc * COLD_VOC), mpptMax / vmp, MAX_STRING_PANELS)),
    };
}
/**
 * Corriente máxima que admite una entrada MPPT según cuántos strings lleve: con uno solo vale `imax_mppt_1string_a` (si el inversor
 * lo distingue; p. ej. 20 A) y con varios `imax_mppt_a` (p. ej. 30 A). Null si el inversor no trae el dato.
 */
export function imaxEntrada(attrs, strings) {
    const varios = num(attrs.imax_mppt_a);
    const uno = num(attrs.imax_mppt_1string_a);
    return strings <= 1 && uno !== null ? uno : varios;
}
/** Cuántos strings iguales (de corriente imp) caben en paralelo en una entrada; sin datos, uno. Cero si ni uno solo admite ese panel. */
export function stringsPorEntrada(attrs, imp) {
    const varios = num(attrs.imax_mppt_a);
    const uno = num(attrs.imax_mppt_1string_a);
    if (imp === null || imp <= 0)
        return 1;
    if (uno !== null && imp > uno)
        return 0;
    return varios !== null ? Math.max(1, Math.floor(varios / imp)) : 1;
}
/** units: cuántos inversores de este modelo hay (cada uno con sus entradas MPPT). */
export function stringPlan(panel, inverter, panels, units = 1) {
    const isc = num(panel.attrs.isc_a);
    const imp = num(panel.attrs.imp_a);
    const nMppt = (num(inverter.attrs.n_mppt) ?? 1) * Math.max(1, units);
    const limits = stringLimits(panel, inverter);
    if (limits === null)
        return null;
    const { min, max } = limits;
    const problems = [];
    const notes = [];
    if (max < min) {
        problems.push(`Con este panel y este inversor no sale ningún string válido: hacen falta al menos ${min} paneles en serie para llegar al rango MPPT y, con el frío, no pueden pasar de ${Math.max(max, 0)} sin superar la tensión máxima de entrada.`);
        return { min, max, length: null, strings: null, problems, notes };
    }
    // Se prefiere un largo que reparta los paneles por igual; si no hay, el más largo posible.
    let length = null;
    if (panels > 0) {
        for (let l = max; l >= min; l--) {
            if (panels % l === 0) {
                length = l;
                break;
            }
        }
        if (length === null) {
            length = max;
            notes.push(`${panels} paneles no se reparten por igual en strings de ${min} a ${max}: queda algún string más corto. Conviene cambiar el número de paneles o repartirlos entre varias entradas MPPT.`);
        }
    }
    const strings = length && panels > 0 ? Math.ceil(panels / length) : null;
    if (strings !== null && nMppt > 0) {
        const perMppt = stringsPorEntrada(inverter.attrs, imp);
        if (perMppt === 0) {
            problems.push(`Cada string da ${imp} A y una entrada de este inversor con un solo string admite ${num(inverter.attrs.imax_mppt_1string_a)} A.`);
        }
        else if (strings > nMppt * perMppt) {
            problems.push(`Hacen falta ${strings} strings y este inversor admite ${nMppt * perMppt} (${nMppt} entradas MPPT).`);
        }
        // La corriente de cortocircuito de los strings que comparten una entrada no puede pasar de la que aguanta esa entrada
        const shortCircuit = num(inverter.attrs['x:Corriente de cortocircuito máx. (A)']);
        const perInput = Math.ceil(strings / Math.max(1, nMppt));
        if (isc !== null && shortCircuit !== null && isc * perInput > shortCircuit) {
            problems.push(`${perInput} string${perInput === 1 ? '' : 's'} por entrada dan ${(isc * perInput).toLocaleString('es-ES', { maximumFractionDigits: 1 })} A de cortocircuito (Isc ${isc} A) y cada entrada de este inversor aguanta ${shortCircuit} A.`);
        }
    }
    return { min, max, length, strings, problems, notes };
}
/** «SUN2000 L1, LB0 y M1» → ['L1', 'LB0', 'M1']: las series de inversor que nombra el texto de compatibilidad de una batería. */
export function seriesAdmitidas(compatible) {
    const i = compatible.search(/SUN2000/i);
    if (i < 0)
        return [];
    const tokens = compatible.slice(i + 7).match(/\b[A-Z]{1,3}\d[A-Z0-9]{0,2}\b/g) ?? [];
    return [...new Set(tokens)];
}
/** El inversor y la batería hablan el mismo idioma: misma marca o protocolo, y una tensión que el inversor admite. */
export function batteryCompat(battery, inverter) {
    const compatible = String(battery.attrs.compatible ?? '').toLowerCase();
    const brand = inverter.brand.toLowerCase();
    const brandOk = brand !== '' && (battery.brand.toLowerCase() === brand || compatible.includes(brand));
    const accepted = String(inverter.attrs.bateria_tension ?? '');
    const tension = String(battery.attrs.tension ?? '');
    const tensionOk = !tension || accepted === '' || accepted === 'Ambas' || accepted === tension;
    if (accepted === '—')
        return { ok: false, reason: 'Este inversor no admite baterías.' };
    if (!brandOk)
        return { ok: false, reason: `Comprueba la comunicación con el inversor (${inverter.brand}): ${battery.attrs.compatible ?? 'sin dato de compatibilidad'}.` };
    // Si la ficha de la batería lista las series de inversor que admite («SUN2000 L1, M1 y MAP0»), el modelo del inversor
    // tiene que ser de una de ellas
    const series = seriesAdmitidas(String(battery.attrs.compatible ?? ''));
    if (series.length > 0 && !series.some((t) => new RegExp(`(^|[^A-Z0-9])${t}($|[^A-Z0-9])`).test(inverter.model.toUpperCase()))) {
        return { ok: false, reason: `Esta batería solo se admite con las series ${series.join(', ')} y el inversor es un ${inverter.model}.` };
    }
    if (!tensionOk)
        return { ok: false, reason: `El inversor admite baterías de tensión ${accepted.toLowerCase()} y esta es ${tension.toLowerCase()}.` };
    return { ok: true, reason: 'Compatible con el inversor elegido.' };
}
/** Qué cubiertas valen para cada tipo de cubierta elegido en el paso 1. */
export const ROOF_ITEM_VALUES = {
    teja: ['Teja', 'Todas'],
    chapa_minionda: ['Chapa minionda', 'Chapa', 'Todas'],
    chapa_grecada: ['Chapa grecada', 'Chapa', 'Todas'],
    plana: ['Plana', 'Todas'],
    suelo: ['Suelo', 'Todas'],
    // En un parking valen también las estructuras de suelo (hincada, bloques de hormigón…)
    parking: ['Parking', 'Suelo', 'Todas'],
    flotante: ['Flotante', 'Todas'],
    pergola: ['Pérgola', 'Todas'],
    sandwich: ['Panel sándwich', 'Todas'],
    // «Chapa» a secas es de los presupuestos anteriores a separar la minionda de la grecada: vale cualquiera de las dos
    chapa: ['Chapa', 'Chapa minionda', 'Chapa grecada', 'Todas'],
};
export const ROOF_LABEL = {
    teja: 'Teja',
    chapa_minionda: 'Chapa minionda',
    chapa_grecada: 'Chapa grecada (trapezoidal)',
    plana: 'Plana',
    suelo: 'Suelo',
    parking: 'Parking',
    flotante: 'Flotante',
    pergola: 'Pérgola',
    sandwich: 'Panel sándwich',
    chapa: 'Chapa',
};
/** Los tipos de cubierta que se ofrecen al crear un presupuesto, en este orden («chapa» solo lo conservan los presupuestos antiguos). */
export const ROOF_OPTIONS = ['teja', 'chapa_minionda', 'chapa_grecada', 'plana', 'suelo', 'parking', 'flotante', 'pergola', 'sandwich'];
/**
 * Los tipos de cubierta del presupuesto: una instalación puede tener varios (nave con teja y plana). `roofs` es la lista completa;
 * `roof` se conserva como la primera (lo usan la propuesta del servidor y los presupuestos anteriores, que solo tenían una).
 */
export function roofsOf(survey) {
    const validos = (Array.isArray(survey?.roofs) ? survey.roofs : []).filter((r, i, todos) => typeof r === 'string' && r in ROOF_LABEL && todos.indexOf(r) === i);
    if (validos.length > 0)
        return validos;
    return survey && survey.roof in ROOF_LABEL ? [survey.roof] : ['teja'];
}
/** Los valores de «cubierta» de un producto que valen para alguna de las cubiertas del presupuesto. */
export function roofItemValues(survey) {
    return [...new Set(roofsOf(survey).flatMap((r) => ROOF_ITEM_VALUES[r]))];
}
/** «Teja, Plana»: los tipos de cubierta como etiqueta de un dato. */
export const roofLabels = (survey) => roofsOf(survey).map((r) => ROOF_LABEL[r]).join(', ');
/** «teja», «teja y plana», «teja, plana y suelo»: los tipos de cubierta para un texto, en minúsculas. */
export function roofText(survey) {
    const nombres = roofsOf(survey).map((r) => ROOF_LABEL[r].toLowerCase());
    return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : nombres[0];
}
/**
 * Tipos de estructura que admite cada tipo de cubierta (hoja de reglas de Ingeniería del 13/11/2026). Una cubierta que no sale aquí
 * (flotante, pérgola) no tiene regla todavía. «hormigón» agrupa el bloque de hormigón y la estructura de hormigón. En cubierta plana
 * se admite también la inclinada (kits vela y triángulos con lastre), que es lo que se monta hoy.
 */
export const ROOF_STRUCTURE_TYPES = {
    teja: ['coplanar'],
    chapa_minionda: ['inclinada', 'micro rail', 'perfil corrido'],
    chapa_grecada: ['micro rail', 'perfil corrido'],
    plana: ['hormigón', 'inclinada'],
    suelo: ['hormigón', 'hincada'],
    parking: ['hincada', 'hormigón', 'metálica'],
    sandwich: ['perfil corrido'],
};
/** Cómo se nombra cada tipo de estructura en los avisos. */
export const STRUCTURE_TYPE_LABEL = {
    coplanar: 'coplanar',
    'perfil corrido': 'de perfil corrido',
    'micro rail': 'de micro rail',
    inclinada: 'inclinada',
    hormigón: 'de hormigón (bloque o estructura)',
    hincada: 'hincada',
    metálica: 'metálica',
};
