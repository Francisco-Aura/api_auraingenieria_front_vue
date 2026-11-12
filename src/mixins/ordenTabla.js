/*
 * Orden de las columnas de una tabla: mismo comportamiento en todas las pantallas.
 *
 * Cada listado tenía su propia copia de `sortBy` y `getSortIcon`. Cuatro hacían el
 * ciclo completo (ascendente → descendente → sin ordenar) y dos —Administración y
 * Gestión de Tareas— solo alternaban entre ascendente y descendente, así que una vez
 * ordenada la tabla no había forma de volver al orden original.
 *
 * El componente solo tiene que declarar `sortKey` y `sortOrder` en su `data()`.
 */
export const ordenTabla = {
  methods: {
    /** Ciclo de la columna: ascendente → descendente → sin ordenar. */
    sortBy(key) {
      if (this.sortKey !== key) {
        this.sortKey = key;
        this.sortOrder = 'asc';
      } else if (this.sortOrder === 'asc') {
        this.sortOrder = 'desc';
      } else {
        this.sortKey = null;
        this.sortOrder = null;
      }
    },

    /** Flecha de la cabecera según el estado de esa columna. */
    getSortIcon(key) {
      if (this.sortKey !== key || !this.sortOrder) return 'fas fa-sort';
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    },
  },
};

export default ordenTabla;
