/*
 * v-cierre-fondo="cerrar": en la capa oscura de un modal, lo cierra al pulsar el fondo.
 *
 * Sustituye a @click.self (y a @click en la capa). Si se pulsaba dentro del modal, al
 * seleccionar texto o al arrastrar su barra de desplazamiento, y se soltaba fuera, el
 * navegador mandaba el clic a la capa, que es lo común a los dos sitios, y el modal se
 * cerraba perdiendo lo que hubiera a medias (y lo mismo al revés: pulsar fuera y soltar
 * dentro). Aquí solo cierra si se pulsa y se suelta en la propia capa, y no en su barra
 * de desplazamiento.
 *
 * Para cerrar solo en algún caso: v-cierre-fondo="() => soloLectura && cerrar()".
 */
const estados = new WeakMap();

function enLaBarra(el, evento) {
  return evento.offsetX >= el.clientWidth || evento.offsetY >= el.clientHeight;
}

export default {
  mounted(el, binding) {
    const estado = { cerrar: binding.value, empezoEnFondo: false, acaboEnFondo: false };
    estado.alPulsar = (evento) => {
      estado.empezoEnFondo = evento.target === el && !enLaBarra(el, evento);
    };
    estado.alSoltar = (evento) => {
      estado.acaboEnFondo = evento.target === el;
    };
    estado.alHacerClic = (evento) => {
      const enElFondo = estado.empezoEnFondo && estado.acaboEnFondo;
      estado.empezoEnFondo = false;
      estado.acaboEnFondo = false;
      if (enElFondo && evento.target === el && typeof estado.cerrar === 'function') estado.cerrar(evento);
    };
    el.addEventListener('pointerdown', estado.alPulsar);
    el.addEventListener('pointerup', estado.alSoltar);
    el.addEventListener('click', estado.alHacerClic);
    estados.set(el, estado);
  },
  updated(el, binding) {
    const estado = estados.get(el);
    if (estado) estado.cerrar = binding.value;
  },
  unmounted(el) {
    const estado = estados.get(el);
    if (!estado) return;
    el.removeEventListener('pointerdown', estado.alPulsar);
    el.removeEventListener('pointerup', estado.alSoltar);
    el.removeEventListener('click', estado.alHacerClic);
    estados.delete(el);
  },
};
