'use strict';

/**
 * El Planificador (proyectos, presupuestos, inventario) es un módulo aparte: se publica como
 * página propia (/planificador/), la intranet lo enseña en un marco y lleva sus propios estilos
 * y utilidades. Las auditorías de aspecto y de convenciones de la intranet no lo recorren.
 */
const CARPETAS_PLANIFICADOR = [
  'src/planificador',
  'src/components/CRM_Module/Planificador',
  'src/styles/planificador',
  'src/utils/planificador',
];

/** Acepta rutas relativas a la raíz o absolutas, con la barra de Windows o la normal. */
function esDelPlanificador(ruta) {
  const normal = `/${String(ruta).split('\\').join('/')}/`;
  return CARPETAS_PLANIFICADOR.some((carpeta) => normal.includes(`/${carpeta}/`));
}

module.exports = { esDelPlanificador };
