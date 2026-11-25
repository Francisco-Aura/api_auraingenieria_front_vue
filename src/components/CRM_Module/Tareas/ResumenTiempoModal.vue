<template>
  <div v-if="value" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="resumen-tiempo-title" v-cierre-fondo="cerrar">
    <div class="modal-resumen-tiempo" @click.stop>
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-stopwatch"></i></span>
        <div class="aura-modal-header__titulos">
          <h2 id="resumen-tiempo-title">Tiempo trabajado</h2>
          <span class="aura-modal-header__subtitulo">Cronómetro de tareas por trabajador</span>
        </div>
        <button type="button" class="close-button" @click="cerrar" aria-label="Cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="rt-filtros">
          <label class="rt-campo">
            <span>Trabajador</span>
            <select v-model="usuarioId" @change="consultar">
              <option :value="null" disabled>Elige un trabajador</option>
              <option v-for="u in usuariosOrdenados" :key="u.id" :value="u.id">{{ u.nombre }}</option>
            </select>
          </label>
          <label class="rt-campo">
            <span>Desde</span>
            <input type="date" v-model="desde" :max="hasta" @change="consultar" />
          </label>
          <label class="rt-campo">
            <span>Hasta</span>
            <input type="date" v-model="hasta" :min="desde" @change="consultar" />
          </label>
          <div class="rt-atajos">
            <button type="button" class="btn btn-outline" @click="atajo('hoy')">Hoy</button>
            <button type="button" class="btn btn-outline" @click="atajo('semana')">Semana</button>
            <button type="button" class="btn btn-outline" @click="atajo('mes')">Mes</button>
          </div>
        </div>

        <p v-if="error" class="rt-error">{{ error }}</p>
        <p v-else-if="!usuarioId" class="rt-vacio">Elige un trabajador para ver su tiempo.</p>
        <p v-else-if="cargando" class="rt-vacio"><i class="fas fa-spinner fa-spin"></i> Cargando…</p>

        <template v-else-if="resumen">
          <div class="rt-total">
            <span class="rt-total__valor">{{ formatoHoras(resumen.segundosTotales) }}</span>
            <span class="rt-total__texto">en total · {{ resumen.dias.length }} {{ resumen.dias.length === 1 ? 'día' : 'días' }} con actividad</span>
          </div>

          <p v-if="!resumen.tareas.length" class="rt-vacio">Sin tiempo registrado en estas fechas.</p>
          <div v-else class="rt-columnas">
            <section>
              <h3>Por tarea</h3>
              <table class="rt-tabla">
                <tbody>
                  <tr v-for="t in resumen.tareas" :key="t.tareaId">
                    <td class="rt-tarea">
                      <span class="rt-titulo" :title="t.titulo">{{ t.titulo }}</span>
                      <span class="rt-barra"><span :style="{ width: porcentaje(t.segundos, resumen.tareas[0].segundos) + '%' }"></span></span>
                    </td>
                    <td class="rt-tiempo">{{ formatoHoras(t.segundos) }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
            <section>
              <h3>Por día</h3>
              <table class="rt-tabla">
                <tbody>
                  <tr v-for="d in resumen.dias" :key="d.fecha">
                    <td>{{ fechaCorta(d.fecha) }}</td>
                    <td class="rt-tiempo">{{ formatoHoras(d.segundos) }}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'
import { fechaLocalISO } from '@/utils/fechas'

export default {
  name: 'ResumenTiempoModal',
  props: {
    value: { type: Boolean, default: false },
    usuarios: { type: Array, default: () => [] }
  },
  data() {
    const hoy = new Date()
    return {
      usuarioId: null,
      desde: fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      hasta: fechaLocalISO(hoy),
      resumen: null,
      cargando: false,
      error: '',
      peticion: 0
    }
  },
  computed: {
    usuariosOrdenados() {
      return [...this.usuarios].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
    }
  },
  methods: {
    cerrar() {
      this.$emit('cerrar')
    },
    atajo(tipo) {
      const hoy = new Date()
      let inicio = hoy
      if (tipo === 'semana') inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7))
      if (tipo === 'mes') inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      this.desde = fechaLocalISO(inicio)
      this.hasta = fechaLocalISO(hoy)
      this.consultar()
    },
    async consultar() {
      if (!this.usuarioId || !this.desde || !this.hasta) return
      const n = ++this.peticion
      this.cargando = true
      this.error = ''
      try {
        const datos = await tareasApi.resumenTiempo(this.usuarioId, this.desde, this.hasta)
        if (n === this.peticion) this.resumen = datos
      } catch (e) {
        if (n !== this.peticion) return
        this.resumen = null
        const d = e && e.response && e.response.data
        this.error = (d && (d.error || d.message)) || 'No se pudo cargar el tiempo.'
      } finally {
        if (n === this.peticion) this.cargando = false
      }
    },
    formatoHoras(segundos) {
      const min = Math.round(segundos / 60)
      return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')} min`
    },
    porcentaje(valor, maximo) {
      return maximo > 0 ? Math.max(2, Math.round((valor / maximo) * 100)) : 0
    },
    fechaCorta(iso) {
      const [a, m, d] = String(iso).split('-').map(Number)
      return new Date(a, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--backdrop-color);
  backdrop-filter: var(--backdrop-blur);
  z-index: var(--z-overlay-top);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-resumen-tiempo {
  background: white;
  border-radius: var(--radius-md);
  width: 95%;
  max-width: 860px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.modal-body { padding: 20px; overflow-y: auto; }
.rt-filtros { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 16px; }
.rt-campo { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #555; }
.rt-campo select, .rt-campo input { padding: 7px 10px; border: 1px solid #ccd; border-radius: 6px; font-size: 14px; min-width: 150px; }
.rt-atajos { display: flex; gap: 6px; }
.rt-total { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; }
.rt-total__valor { font-size: 28px; font-weight: 700; }
.rt-total__texto { color: #666; font-size: 13px; }
.rt-columnas { display: grid; grid-template-columns: 3fr 2fr; gap: 24px; }
.rt-columnas h3 { font-size: 14px; margin: 0 0 8px; }
.rt-tabla { width: 100%; border-collapse: collapse; }
.rt-tabla td { padding: 6px 4px; border-bottom: 1px solid #eee; font-size: 13px; vertical-align: middle; }
.rt-tarea { width: 100%; }
.rt-titulo { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 380px; }
.rt-barra { display: block; height: 4px; background: #eef; border-radius: 2px; margin-top: 4px; }
.rt-barra > span { display: block; height: 100%; background: #4a6cf7; border-radius: 2px; }
.rt-tiempo { white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
.rt-vacio { color: #777; text-align: center; padding: 24px 0; }
.rt-error { color: #b3261e; padding: 12px 0; }
@media (max-width: 700px) { .rt-columnas { grid-template-columns: 1fr; } }
</style>