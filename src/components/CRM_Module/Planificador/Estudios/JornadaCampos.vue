<template>
  <div class="estudio-jornada-filas">
    <span class="estudio-jornada-etq">Abierto de</span>
    <div class="estudio-jornada-rango">
      <input :value="jornada.ini" type="number" min="0" max="23" step="1" aria-label="Hora de entrada" @input="$emit('cambia', 'ini', numero($event))">
      <span>a</span>
      <input :value="jornada.fin" type="number" min="1" max="24" step="1" aria-label="Hora de salida" @input="$emit('cambia', 'fin', numero($event))">
      <span>h</span>
    </div>
    <span class="estudio-jornada-etq">Fuera de horario</span>
    <div class="estudio-jornada-rango">
      <input :value="jornada.fuera" type="number" min="0" max="100" step="1" aria-label="Consumo fuera de horario, en porcentaje" @input="$emit('cambia', 'fuera', numero($event))">
      <span>% de lo que consume en horario</span>
    </div>
    <span class="estudio-jornada-etq">Fin de semana</span>
    <div class="estudio-jornada-rango">
      <input :value="jornada.finde" type="number" min="0" max="100" step="1" aria-label="Consumo en fin de semana, en porcentaje" @input="$emit('cambia', 'finde', numero($event))">
      <span>% de lo que consume en horario</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'JornadaCampos',
  props: { jornada: { type: Object, required: true } },
  emits: ['cambia'],
  methods: {
    numero(e) { return e.target.value === '' ? '' : Number(e.target.value) }
  }
}
</script>
