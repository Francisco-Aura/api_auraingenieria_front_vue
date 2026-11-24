import { descargarBlob } from '@/utils/descargas';

// Exportación a Excel compartida por las pantallas.

/**
 * Carga ExcelJS solo cuando el usuario exporta: es una librería de casi 1 MB y así
 * no retrasa la apertura de Clientes, Puntos de Suministro, Informes, Tareas ni
 * Administración (se descarga una vez, la primera vez que se exporta).
 */
export async function cargarExcelJS() {
  const modulo = await import(/* webpackChunkName: "exceljs" */ 'exceljs');
  return modulo.default || modulo;
}

/** Genera el .xlsx del libro y lo descarga en el navegador con el nombre indicado. */
export async function descargarLibroExcel(libro, nombreArchivo) {
  const buffer = await libro.xlsx.writeBuffer();
  descargarBlob(new Blob([buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombreArchivo);
}
