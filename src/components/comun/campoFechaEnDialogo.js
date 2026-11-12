// Campo de fecha (CampoFecha.vue) dentro de un SweetAlert, cuyo «html» es texto y no admite
// componentes de Vue: se monta en un hueco del HTML al abrirse y se desmonta al cerrarse.
//
//   const campo = campoFechaEnDialogo({ id: 'swal-fecha-baja', modelValue: hoy, required: true });
//   await this.$swal.fire({
//     html: `... <label for="swal-fecha-baja">Fecha de baja</label> ${campo.html} ...`,
//     didOpen: campo.montar, willClose: campo.desmontar,
//     preConfirm: () => campo.valor() || (this.$swal.showValidationMessage('…'), false),
//   });
import { createApp, h, ref } from 'vue';
import CampoFecha from './CampoFecha.vue';

let contador = 0;

/** Props: las de CampoFecha (id, modelValue, min, max, atajos, required…). */
export function campoFechaEnDialogo(props = {}) {
  contador += 1;
  const hueco = `campo-fecha-dialogo-${contador}`;
  const valor = ref(props.modelValue || '');
  let app = null;
  return {
    html: `<div id="${hueco}" class="campo-fecha-dialogo"></div>`,
    montar() {
      const elemento = document.getElementById(hueco);
      if (!elemento || app) return;
      // El calendario se abre dentro de la capa del SweetAlert: en <body> quedaba debajo de
      // ella y un clic en él contaba como clic fuera (cerraba el diálogo).
      const capa = elemento.closest('.swal2-container') || true;
      app = createApp({
        render: () => h(CampoFecha, {
          ...props,
          modelValue: valor.value,
          teleportar: capa,
          'onUpdate:modelValue': (nuevo) => { valor.value = nuevo; },
        }),
      });
      app.mount(elemento);
    },
    desmontar() {
      if (app) app.unmount();
      app = null;
    },
    /** 'AAAA-MM-DD' elegida, o '' si no hay. */
    valor: () => valor.value,
  };
}
