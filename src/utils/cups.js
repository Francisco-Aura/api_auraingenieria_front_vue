// CUPS de un punto de suministro: el de luz si tiene y, si no, el de gas.

const tieneValor = (cups) => cups && cups.trim() !== '';

/** El CUPS que se enseña (tal cual, sin recortar): el de luz, si no el de gas, si no `vacio`. */
export function cupsVisible(luz, gas, vacio = '') {
  if (tieneValor(luz)) return luz;
  if (tieneValor(gas)) return gas;
  return vacio;
}

/** 'Luz', 'Gas' o `vacio`, según el CUPS que tenga (mismo orden que cupsVisible). */
export function tipoCups(luz, gas, vacio = '') {
  if (tieneValor(luz)) return 'Luz';
  if (tieneValor(gas)) return 'Gas';
  return vacio;
}

/** El CUPS del punto ya recortado (el que se guarda en contratos y servicios), o ''. */
export function cupsRecortado(punto) {
  return punto?.cupsluz?.trim() || punto?.cupsgas?.trim() || '';
}
