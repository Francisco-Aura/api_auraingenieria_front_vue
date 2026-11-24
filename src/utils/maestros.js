// Nombres de las tablas maestras (comercializadoras, etc.) a partir de su id.

/**
 * Nombre de la comercializadora `id`, buscada en la primera de las listas que tenga
 * elementos (la que llega del padre y, si está vacía, la que cargó la ventana).
 */
export function nombreComercializadora(id, ...listas) {
  if (!id || id === '') return 'Sin Comercializadora';
  const lista = listas.find((l) => l && l.length);
  if (!lista) return 'Comercializadora Desconocida';
  const comercializadora = lista.find((c) => c.id == id);
  return comercializadora ? comercializadora.nombre : 'Comercializadora Desconocida';
}
