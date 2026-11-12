<template>
  <DialogoRegistro titulo="¿Qué día empezaste a trabajar?" @cerrar="$emit('cerrar')">
    <p class="rh-nota">Los días anteriores saldrán en blanco: sin horas, sin firma y sin anotaciones. Solo hace falta si entraste a mitad de mes.</p>
    <div class="rh-fila-campos" style="grid-template-columns: 80px 1fr 100px">
      <select v-model.number="dia" aria-label="Día">
        <option v-for="n in 31" :key="n" :value="n">{{ n }}</option>
      </select>
      <select v-model.number="mes" aria-label="Mes">
        <option v-for="(m, i) in MESES" :key="m" :value="i + 1">{{ m }}</option>
      </select>
      <select v-model.number="anio" aria-label="Año">
        <option v-for="a in anios" :key="a" :value="a">{{ a }}</option>
      </select>
    </div>
    <p v-if="!existe" class="rh-aviso rh-aviso-error" role="alert">Esa fecha no existe (por ejemplo, el 31 de febrero).</p>
    <div class="rh-fila-botones">
      <button type="button" class="rh-btn" @click="$emit('cerrar')">Cancelar</button>
      <button v-if="hayAlta" type="button" class="rh-btn rh-btn-peligro rh-empuja" @click="$emit('quitar')">Quitar la fecha de alta</button>
      <button type="button" class="rh-btn rh-btn-primario" :class="{ 'rh-empuja': !hayAlta }" :disabled="!existe" @click="$emit('guardar', fecha)">Guardar</button>
    </div>
  </DialogoRegistro>
</template>

<script>
import DialogoRegistro from './DialogoRegistro.vue';
import { diasDelMes, iso, MESES, partes } from '@/utils/registroHorario/fechas';

// Primer día de trabajo; solo hace falta si se entró a mitad de mes.
export default {
  name: 'DialogoAltaRegistro',
  components: { DialogoRegistro },
  props: {
    inicial: { type: String, required: true }, // AAAA-MM-DD
    hayAlta: { type: Boolean, default: false }
  },
  emits: ['guardar', 'quitar', 'cerrar'],
  data() {
    const p = partes(this.inicial);
    return { dia: p.dia, mes: p.mes, anio: p.anio, MESES, anioInicial: p.anio };
  },
  computed: {
    anios() {
      return Array.from({ length: 5 }, (_, i) => this.anioInicial - 2 + i);
    },
    existe() {
      return this.dia <= diasDelMes(this.anio, this.mes);
    },
    fecha() {
      return iso(this.anio, this.mes, this.dia);
    }
  }
};
</script>
