<template>
  <div class="boe">
    <div class="back-fila">
      <button type="button" class="secondary" @click="volver">← Volver a propuestas</button>
    </div>
    <div class="costes-titulo">
      <h1>Peajes y cargos del BOE</h1>
      <div class="titulo-acciones">
        <button type="button" class="secondary" :disabled="!datos || guardando" @click="nuevoBoe">+ Nuevo BOE</button>
      </div>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="!datos && !error" class="muted">Cargando…</p>

    <template v-if="datos">
      <div v-if="lista.length > 0" class="boe-lista" role="tablist" aria-label="BOE">
        <button v-for="b in lista" :key="b.id === null ? 'nuevo' : b.id" type="button" role="tab" class="boe-opcion" :class="{ on: esElegido(b) }" :aria-selected="esElegido(b)" @click="elegir(b)">
          <span class="boe-opcion-nombre">{{ b.nombre.trim() || 'Nuevo BOE' }}</span>
          <span class="boe-opcion-fecha">
            {{ b.vigenteDesde ? 'desde ' + fechaCorta(b.vigenteDesde) : 'sin fecha' }}<template v-if="b.id !== null && b.id === vigenteId"> · vigente</template><template v-if="b.id === null"> · nuevo</template>
          </span>
        </button>
      </div>
      <p v-else class="muted">No hay ningún BOE cargado.</p>

      <template v-if="borrador">
        <div class="boe-datos">
          <label class="cuestionario-campo">Nombre
            <input v-model="borrador.nombre" placeholder="Ej.: Peajes y cargos 2027" maxlength="255" :class="{ 'obligatorio-vacio': intentado && !borrador.nombre.trim() }">
          </label>
          <label class="cuestionario-campo">Vigente desde
            <input v-model="borrador.vigenteDesde" type="date" :class="{ 'obligatorio-vacio': intentado && !fechaValida }">
          </label>
          <label class="cuestionario-campo">Referencia de los peajes<input v-model="borrador.refs.peaje" placeholder="BOE-A-…" maxlength="255"></label>
          <label class="cuestionario-campo">Referencia de los cargos<input v-model="borrador.refs.cargo" placeholder="BOE-A-…" maxlength="255"></label>
        </div>

        <section v-for="t in TERMINOS" :key="t.id" class="estudio-tabla boe-tabla">
          <table>
            <thead>
              <tr>
                <th>{{ t.titulo }} <span class="muted">({{ t.unidad }})</span></th>
                <th />
                <th v-for="p in 6" :key="p">P{{ p }}</th>
              </tr>
            </thead>
            <tbody v-for="tarifa in datos.tarifas" :key="tarifa">
              <tr v-for="(c, ic) in CONCEPTOS" :key="c.id">
                <th v-if="ic === 0" rowspan="3" scope="rowgroup">{{ tarifa }}</th>
                <td>{{ c.titulo }}</td>
                <td v-for="i in 6" :key="i">
                  <input v-if="i <= nPeriodos(tarifa, t.id)" v-model="borrador.celdas[clave(tarifa, t.id, c.id)][i - 1]" inputmode="decimal"
                         :class="{ 'obligatorio-vacio': intentado && malas.has(clave(tarifa, t.id, c.id) + '|' + (i - 1)) }"
                         :aria-label="`${c.titulo} de ${t.titulo.toLowerCase()} P${i} de la ${tarifa}`">
                  <span v-else class="muted">—</span>
                </td>
              </tr>
              <tr class="boe-total">
                <td>Total</td>
                <td v-for="i in 6" :key="i">{{ i <= nPeriodos(tarifa, t.id) ? fmt(total(borrador, tarifa, t.id, i - 1)) : '' }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div class="estudio-pie">
          <button v-if="borrador.guardado" type="button" class="secondary peligro" :disabled="guardando" @click="eliminar">Eliminar este BOE</button>
          <span v-else />
          <div class="boe-botones">
            <button type="button" class="secondary" :disabled="guardando || !sucio" @click="descartar">Descartar cambios</button>
            <button type="button" :disabled="guardando || !sucio" @click="guardar">{{ guardando ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { CONCEPTOS, TERMINOS, borradorDe, celdasMalas, clave, cuerpoDe, faltas, fechaCorta, firma, nPeriodos, total, vigenteEn } from '@/utils/planificador/preciosBoe'

const dos = (n) => String(n).padStart(2, '0')
/** Hoy como AAAA-MM-DD, en la hora del navegador. */
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}` }

// Los peajes y cargos del BOE con los que se calculan los estudios. Cada BOE tiene su nombre y la fecha desde la que vale (puede haber
// varios en el mismo año, o uno cada dos); los estudios usan el vigente hoy, salvo que elijan uno. Se edita un BOE entero y se guarda de una vez.
export default {
  name: 'Precios-Boe',
  emits: ['volver'],
  data() {
    return { TERMINOS, CONCEPTOS, datos: null, borrador: null, original: '', intentado: false, guardando: false, error: '' }
  },
  computed: {
    /** Los BOE guardados, del más reciente al más antiguo (el que se está editando con sus cambios a la vista), y el nuevo aún sin guardar arriba. */
    lista() {
      if (!this.datos) return []
      const b = this.borrador
      const guardados = this.datos.boes.map((x) => (b && b.id === x.id ? { id: x.id, nombre: b.nombre, vigenteDesde: b.vigenteDesde } : x))
      return b && b.id === null ? [{ id: null, nombre: b.nombre, vigenteDesde: b.vigenteDesde }, ...guardados] : guardados
    },
    vigenteId() { const v = this.datos ? vigenteEn(this.datos.boes, hoy()) : null; return v ? v.id : null },
    fechaValida() { return /^\d{4}-\d{2}-\d{2}$/.test(this.borrador.vigenteDesde) },
    sucio() { return !!this.borrador && (!this.borrador.guardado || firma(this.borrador) !== this.original) },
    malas() { return this.borrador ? celdasMalas(this.borrador) : new Set() }
  },
  mounted() { this.cargar() },
  methods: {
    clave, nPeriodos, total, fechaCorta,
    esElegido(b) { return !!this.borrador && b.id === this.borrador.id },
    async cargar(id = null) {
      try {
        this.datos = await planificadorApi.preciosBoe()
        this.error = ''
        // Al entrar se abre el vigente hoy (o el primero de la lista si ninguno ha empezado)
        const elegido = id !== null && this.datos.boes.some((b) => b.id === id) ? id : (vigenteEn(this.datos.boes, hoy()) || this.datos.boes[0] || {}).id
        if (elegido !== undefined) this.abrir(borradorDe(this.datos, elegido))
        else this.borrador = null
      } catch (e) {
        this.error = mensajeError(e)
      }
    },
    abrir(b) {
      this.borrador = b
      this.original = firma(b)
      this.intentado = false
    },
    seguir() { return !this.sucio || window.confirm('Hay cambios sin guardar en «' + (this.borrador.nombre.trim() || 'el BOE nuevo') + '» que se perderán. ¿Continuar?') },
    elegir(b) {
      if (this.esElegido(b) || b.id === null) return
      if (!this.seguir()) return
      this.error = ''
      this.abrir(borradorDe(this.datos, b.id))
    },
    /** Un BOE nuevo parte de los precios del más reciente (sin nombre, fecha ni referencias: esos se ponen a mano). */
    nuevoBoe() {
      if (!this.seguir()) return
      this.error = ''
      this.abrir(borradorDe(this.datos, null, this.datos.boes.length > 0 ? this.datos.boes[0].id : null))
    },
    descartar() {
      if (!window.confirm('Se descartarán los cambios. ¿Continuar?')) return
      this.error = ''
      if (this.borrador.guardado) this.abrir(borradorDe(this.datos, this.borrador.id))
      else this.cargar()
    },
    async guardar() {
      this.intentado = true
      const falta = faltas(this.borrador)
      if (falta.length > 0) {
        this.error = falta[0]
        return
      }
      if (this.malas.size > 0) {
        this.error = 'Rellena todos los periodos con un número (sin negativos).'
        return
      }
      this.guardando = true
      this.error = ''
      try {
        const cuerpo = cuerpoDe(this.borrador)
        const nuevo = this.borrador.id === null
        const r = nuevo ? await planificadorApi.crearPreciosBoe(cuerpo) : await planificadorApi.guardarPreciosBoe(this.borrador.id, cuerpo)
        this.datos = r
        this.abrir(borradorDe(this.datos, nuevo ? r.id : this.borrador.id))
      } catch (e) {
        this.error = 'No se ha podido guardar: ' + mensajeError(e)
      } finally {
        this.guardando = false
      }
    },
    async eliminar() {
      const nombre = this.borrador.nombre.trim()
      if (!window.confirm('Se eliminarán los peajes y cargos de «' + nombre + '». Los estudios que lo tengan elegido pasarán a usar el BOE vigente. ¿Continuar?')) return
      this.guardando = true
      this.error = ''
      try {
        this.datos = await planificadorApi.borrarPreciosBoe(this.borrador.id)
        this.cargar()
      } catch (e) {
        this.error = 'No se ha podido eliminar: ' + mensajeError(e)
      } finally {
        this.guardando = false
      }
    },
    volver() { if (this.seguir()) this.$emit('volver') },
    fmt(n) { return n === null ? '—' : n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) }
  }
}
</script>
