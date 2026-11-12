// Las 52 provincias del desplegable «Provincia» (puntos de suministro y clientes) y de las zonas
// de comisión. El código son las dos primeras cifras de sus códigos postales. Es la misma lista
// que api.aura.util.Provincias en el servidor.

/** Código, nombre del desplegable y otras formas en que se ha escrito a mano. */
const DATOS = [
  ['01', 'Álava', 'Araba', 'Araba/Álava', 'Vitoria', 'Vitoria-Gasteiz'],
  ['02', 'Albacete'],
  ['03', 'Alicante', 'Alacant', 'Alicante/Alacant'],
  ['04', 'Almería'],
  ['05', 'Ávila'],
  ['06', 'Badajoz'],
  ['07', 'Baleares', 'Illes Balears', 'Islas Baleares', 'Balears', 'Mallorca', 'Palma de Mallorca', 'Palma'],
  ['08', 'Barcelona'],
  ['09', 'Burgos'],
  ['10', 'Cáceres'],
  ['11', 'Cádiz'],
  ['12', 'Castellón', 'Castelló', 'Castellón de la Plana', 'Castellón/Castelló'],
  ['13', 'Ciudad Real'],
  ['14', 'Córdoba'],
  ['15', 'A Coruña', 'La Coruña', 'Coruña'],
  ['16', 'Cuenca'],
  ['17', 'Girona', 'Gerona'],
  ['18', 'Granada'],
  ['19', 'Guadalajara'],
  ['20', 'Gipuzkoa', 'Guipúzcoa', 'San Sebastián', 'Donostia'],
  ['21', 'Huelva'],
  ['22', 'Huesca'],
  ['23', 'Jaén'],
  ['24', 'León'],
  ['25', 'Lleida', 'Lérida'],
  ['26', 'La Rioja', 'Rioja', 'Logroño'],
  ['27', 'Lugo'],
  ['28', 'Madrid', 'Comunidad de Madrid'],
  ['29', 'Málaga'],
  ['30', 'Murcia', 'Región de Murcia', 'Murcia (Región de)'],
  ['31', 'Navarra', 'Nafarroa', 'Comunidad Foral de Navarra', 'Pamplona'],
  ['32', 'Ourense', 'Orense'],
  ['33', 'Asturias', 'Principado de Asturias', 'Oviedo'],
  ['34', 'Palencia'],
  ['35', 'Las Palmas', 'Palmas', 'Las Palmas de Gran Canaria', 'Gran Canaria'],
  ['36', 'Pontevedra'],
  ['37', 'Salamanca'],
  ['38', 'Santa Cruz de Tenerife', 'Tenerife', 'S.C. Tenerife', 'Sta. Cruz de Tenerife'],
  ['39', 'Cantabria', 'Santander'],
  ['40', 'Segovia'],
  ['41', 'Sevilla'],
  ['42', 'Soria'],
  ['43', 'Tarragona'],
  ['44', 'Teruel'],
  ['45', 'Toledo'],
  ['46', 'Valencia', 'València', 'Valencia/València'],
  ['47', 'Valladolid'],
  ['48', 'Bizkaia', 'Vizcaya', 'Bilbao'],
  ['49', 'Zamora'],
  ['50', 'Zaragoza'],
  ['51', 'Ceuta'],
  ['52', 'Melilla'],
];

/** Solo letras, en mayúsculas y sin tildes: «  Alicante / Alacant » y «ALICANTEALACANT» son lo mismo. */
function clave(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-ZÑ]/g, '');
}

const ORDEN = new Intl.Collator('es');

/** Las 52, por orden alfabético: { codigo, nombre }. */
export const PROVINCIAS = DATOS
  .map(([codigo, nombre]) => ({ codigo, nombre }))
  .sort((a, b) => ORDEN.compare(a.nombre, b.nombre));

const NOMBRE_POR_CODIGO = new Map(DATOS.map(([codigo, nombre]) => [codigo, nombre]));
const CODIGO_POR_CLAVE = new Map(DATOS.flatMap(([codigo, ...formas]) => formas.map((forma) => [clave(forma), codigo])));

/** Nombre de la provincia con ese código; el propio código si no existe. */
export function nombreProvincia(codigo) {
  return NOMBRE_POR_CODIGO.get(String(codigo ?? '')) || String(codigo ?? '');
}

/** Código de una provincia escrita de cualquiera de las formas conocidas; null si no se reconoce. */
export function codigoProvincia(texto) {
  return CODIGO_POR_CLAVE.get(clave(texto)) || null;
}

/** El nombre del desplegable para lo escrito a mano («MURCIA» es «Murcia»); null si no se reconoce. */
export function provinciaDeLista(texto) {
  const codigo = codigoProvincia(texto);
  return codigo ? nombreProvincia(codigo) : null;
}

/**
 * Opciones del desplegable para un formulario: las 52 y, si lo que hay guardado no se
 * reconoce, también ese texto (marcado) para no perderlo hasta que se elija una de la lista.
 */
export function opcionesProvincia(valorGuardado) {
  const opciones = PROVINCIAS.map((p) => ({ valor: p.nombre, etiqueta: p.nombre }));
  const texto = String(valorGuardado ?? '').trim();
  if (texto && !provinciaDeLista(texto)) {
    opciones.unshift({ valor: texto, etiqueta: `${texto} (no está en la lista)`, fueraDeLista: true });
  }
  return opciones;
}
