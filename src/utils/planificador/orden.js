/** Ciclo al pulsar una cabecera: ascendente → descendente → sin ordenar (otra columna empieza en ascendente). */
export function nextSort(current, key) {
    if (current?.key !== key)
        return { key, dir: 'asc' };
    return current.dir === 'asc' ? { key, dir: 'desc' } : null;
}
const isEmpty = (v) => v === null || v === undefined || v === '';
/**
 * Ordena filas por la columna activa. Los números se comparan como números y los textos sin distinguir
 * mayúsculas ni acentos («2» antes que «10»). Las celdas vacías van siempre al final, en cualquier sentido.
 */
export function sortRows(rows, sort, read) {
    if (!sort)
        return rows;
    const sign = sort.dir === 'asc' ? 1 : -1;
    return rows
        .map((row, index) => ({ row, index, value: read(row, sort.key) }))
        .sort((a, b) => {
        const ae = isEmpty(a.value);
        const be = isEmpty(b.value);
        if (ae || be)
            return ae && be ? a.index - b.index : ae ? 1 : -1;
        const diff = typeof a.value === 'number' && typeof b.value === 'number'
            ? a.value - b.value
            : String(a.value).localeCompare(String(b.value), 'es', { numeric: true, sensitivity: 'base' });
        return diff * sign || a.index - b.index;
    })
        .map((x) => x.row);
}
