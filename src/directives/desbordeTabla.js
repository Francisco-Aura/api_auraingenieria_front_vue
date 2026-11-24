/*
 * v-desborde-tabla: en el contenedor que desplaza una tabla (.table-responsive).
 *
 * Marca el contenedor con .tabla-desborda cuando la tabla no cabe y hay que
 * desplazarla, y con .tabla-al-final cuando ya se ve su borde derecho. Con eso la
 * columna de acciones solo se queda fija (y con sombra) cuando de verdad tapa algo;
 * si la tabla cabe, se ve como una columna más (estilos en shared-ui.css).
 */
const medidores = new WeakMap();

function medir(el) {
  const desborda = el.scrollWidth > el.clientWidth + 1;
  el.classList.toggle('tabla-desborda', desborda);
  el.classList.toggle('tabla-al-final', !desborda || el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
}

export default {
  mounted(el) {
    const actualizar = () => medir(el);
    const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(actualizar);
    if (observador) {
      observador.observe(el);
      const tabla = el.querySelector('table');
      if (tabla) observador.observe(tabla);
    }
    el.addEventListener('scroll', actualizar, { passive: true });
    medidores.set(el, { observador, actualizar });
    actualizar();
  },
  updated(el) {
    medir(el);
  },
  unmounted(el) {
    const medidor = medidores.get(el);
    if (!medidor) return;
    if (medidor.observador) medidor.observador.disconnect();
    el.removeEventListener('scroll', medidor.actualizar);
    medidores.delete(el);
  },
};
