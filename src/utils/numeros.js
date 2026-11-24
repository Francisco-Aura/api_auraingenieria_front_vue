// Lectura de números que se escriben a mano en los formularios.

/**
 * Número escrito con coma o con punto decimal, con o sin separador de miles
 * («1.234,56», «1,234.56», «7,25», « 12 »). Si no es un número, null.
 */
export function leerDecimal(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;
  let texto = String(valor).trim().replace(/\s/g, '');
  const ultimaComa = texto.lastIndexOf(',');
  const ultimoPunto = texto.lastIndexOf('.');
  if (ultimaComa >= 0 && ultimoPunto >= 0) {
    texto = ultimaComa > ultimoPunto
      ? texto.replace(/\./g, '').replace(',', '.')
      : texto.replace(/,/g, '');
  } else {
    texto = texto.replace(',', '.');
  }
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}
