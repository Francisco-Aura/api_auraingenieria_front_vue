// Letra legible sobre un fondo de color que viene de la base de datos (el color de
// cada estado de tarea). Con letra blanca siempre, «Pendiente» (naranja) y
// «Completada» (verde) se quedaban por debajo de 3:1 y costaba leerlos.

const OSCURO = '#1f2a36';
const BLANCO = '#fff';

function canales(color) {
  const texto = (color || '').toString().trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(texto);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(texto);
  return rgb ? rgb.slice(1, 4).map(Number) : null;
}

function luminancia([r, g, b]) {
  const lineal = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

const LUZ_OSCURO = luminancia(canales(OSCURO));

/** Blanco o casi negro, el que más contraste dé sobre el fondo. Si el color no se entiende, blanco (como antes). */
export function colorTextoSobre(fondo) {
  const rgb = canales(fondo);
  if (!rgb) return BLANCO;
  const luz = luminancia(rgb);
  const conBlanco = 1.05 / (luz + 0.05);
  const conOscuro = (luz + 0.05) / (LUZ_OSCURO + 0.05);
  return conOscuro > conBlanco ? OSCURO : BLANCO;
}
