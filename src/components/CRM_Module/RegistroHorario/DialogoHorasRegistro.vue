<template>
  <DialogoRegistro :titulo="`Horas del ${dia} de ${mesTexto}`" @cerrar="$emit('cerrar')">
    <p class="rh-nota">Escribe las horas reales de ese día ({{ fechaCorta }}).</p>
    <div class="rh-horario">
      <label class="rh-etiqueta" for="rh-man-ini">Mañana</label>
      <input id="rh-man-ini" v-model="man[0]" type="time" aria-label="Mañana, entrada" />
      <span class="rh-sep">a</span>
      <input v-model="man[1]" type="time" aria-label="Mañana, salida" />
      <template v-if="conTarde">
        <label class="rh-etiqueta" for="rh-tar-ini">Tarde</label>
        <input id="rh-tar-ini" v-model="tar[0]" type="time" aria-label="Tarde, entrada" />
        <span class="rh-sep">a</span>
        <input v-model="tar[1]" type="time" aria-label="Tarde, salida" />
      </template>
    </div>
    <p v-if="error" class="rh-aviso rh-aviso-error" role="alert">{{ error }}</p>
    <div class="rh-fila-botones">
      <button type="button" class="rh-btn" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" class="rh-btn rh-empuja" @click="$emit('habituales')">Horas habituales</button>
      <button type="button" class="rh-btn rh-btn-primario" @click="guardar">Guardar</button>
    </div>
  </DialogoRegistro>
</template>

<script>
import DialogoRegistro from './DialogoRegistro.vue';
import { corta, MESES, partes } from '@/utils/registroHorario/fechas';
import { errorHorario, normalizarHora } from '@/utils/registroHorario/horas';

// Horas reales de un día concreto (las que difieren del horario habitual).
export default {
  name: 'DialogoHorasRegistro',
  components: { DialogoRegistro },
  props: {
    fecha: { type: String, required: true },
    estado: { type: String, required: true }, // MANANA o TARDE
    horario: { type: Object, required: true },
    propias: { type: Object, default: undefined }
  },
  emits: ['guardar', 'habituales', 'cerrar'],
  data() {
    const p = this.propias || {};
    return {
      man: [...(p.manana || this.horario.manana)],
      tar: [...(p.tarde || this.horario.tarde)],
      error: ''
    };
  },
  computed: {
    dia() {
      return partes(this.fecha).dia;
    },
    mesTexto() {
      return MESES[partes(this.fecha).mes - 1].toLowerCase();
    },
    fechaCorta() {
      return corta(this.fecha);
    },
    conTarde() {
      return this.estado === 'TARDE';
    }
  },
  methods: {
    guardar() {
      const m = [normalizarHora(this.man[0]) ?? '', normalizarHora(this.man[1]) ?? ''];
      const t = [normalizarHora(this.tar[0]) ?? '', normalizarHora(this.tar[1]) ?? ''];
      const e = errorHorario(m, this.conTarde ? t : null);
      if (e) {
        this.error = e;
        return;
      }
      this.$emit('guardar', this.conTarde ? { manana: m, tarde: t } : { manana: m });
    }
  }
};
</script>
