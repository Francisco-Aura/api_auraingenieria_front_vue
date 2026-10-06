<template>
  <div class="mcas-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mcas-modal-matriz-titulo" @click.self="cerrar">
    <div class="mcas-modal mcas-modal--matriz">
      <div class="mcas-modal-header aura-modal-header">
        <div class="mcas-modal-title">
          <div class="mcas-modal-icon"><i class="fas fa-table"></i></div>
          <div class="title-text">
            <h2 id="mcas-modal-matriz-titulo">Tabla de importes</h2>
            <p>{{ nombreRegla }} · {{ editable ? 'Borrador: puede cambiar los importes' : 'Solo lectura' }}</p>
          </div>
        </div>
        <button type="button" class="close-button" title="Cerrar" aria-label="Cerrar" @click="cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="mcas-modal-body">
        <div v-if="cargando" class="matriz-cargando" role="status">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Cargando la tabla…</span>
        </div>

        <div v-else-if="errorCarga" class="mcas-alert mcas-alert--danger">
          <i class="fas fa-times-circle"></i>
          <div>
            {{ errorCarga }}
            <div class="matriz-acciones-aviso">
              <button type="button" class="btn btn-refresh" @click="cargar">
                <i class="fas fa-sync-alt"></i>
                <span>Reintentar</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="noCartesiana" class="mcas-alert mcas-alert--warning">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            Esta tabla no se puede mostrar en rejilla: {{ noCartesiana }}. Puede revisarla fila a fila en la «Vista avanzada».
            <div class="matriz-acciones-aviso">
              <button type="button" class="btn btn-outline" @click="$emit('vista-avanzada')">
                <i class="fas fa-list"></i>
                <span>Abrir vista avanzada</span>
              </button>
            </div>
          </div>
        </div>

        <template v-else-if="rejilla">
          <div v-if="!editable" class="mcas-alert mcas-alert--info">
            <i class="fas fa-lock"></i>
            <div>Solo se pueden cambiar las tablas en borrador. Para cambiar un importe de una tabla activa, cree una «Nueva versión» desde la pestaña Tablas.</div>
          </div>

          <div v-if="conflicto" class="mcas-alert mcas-alert--danger">
            <i class="fas fa-user-edit"></i>
            <div>
              <strong>Otra persona cambió la tabla: recárguela.</strong> Al recargar se pierden los cambios que no haya guardado.
              <div class="matriz-acciones-aviso">
                <button type="button" class="btn btn-refresh" @click="recargar">
                  <i class="fas fa-sync-alt"></i>
                  <span>Recargar la tabla</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Tabla nueva: se elige qué datos van en filas y columnas -->
          <section v-if="!rejilla.filas" class="form-section">
            <div class="section-header"><i class="fas fa-th"></i><h3>¿Qué datos tiene la tabla?</h3></div>
            <p v-if="!editable" class="form-hint-inline">Esta regla todavía no tiene importes.</p>
            <template v-else>
              <p class="form-hint-inline">
                Elija el dato del contrato que va en las filas y, si la tabla tiene dos entradas, el de las columnas.
                Después añada los tramos o pegue desde Excel el bloque completo, con la primera fila y la primera columna.
              </p>
              <div class="form-grid form-grid--3">
                <div class="form-group">
                  <label class="mcas-label" for="mcas-matriz-dim-filas">Filas <span class="required-asterisk">*</span></label>
                  <select id="mcas-matriz-dim-filas" v-model="estructura.filas" class="mcas-input">
                    <option value="">Seleccionar...</option>
                    <option v-for="d in dimensionesDisponibles" :key="d.value" :value="d.value">{{ d.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-matriz-dim-columnas">Columnas</label>
                  <select id="mcas-matriz-dim-columnas" v-model="estructura.columnas" class="mcas-input" :disabled="esTablaDeTramos">
                    <option value="">Una sola columna (importe)</option>
                    <option v-for="d in dimensionesDisponibles" :key="d.value" :value="d.value">{{ d.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="mcas-label" for="mcas-matriz-dim-pestanas">Pestañas</label>
                  <select id="mcas-matriz-dim-pestanas" v-model="estructura.pestanas" class="mcas-input" :disabled="esTablaDeTramos">
                    <option value="">Sin pestañas</option>
                    <option v-for="d in dimensionesCategoria" :key="d.value" :value="d.value">{{ d.label }}</option>
                  </select>
                </div>
              </div>
              <small v-if="errorEstructura" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errorEstructura }}</small>
              <div class="matriz-acciones-aviso">
                <button type="button" class="btn btn-primary" @click="crearEstructura">
                  <i class="fas fa-check"></i>
                  <span>Crear la tabla</span>
                </button>
              </div>
            </template>
          </section>

          <template v-else>
            <div class="matriz-leyenda">
              <span><strong>Filas:</strong> {{ nombreDimension(rejilla.filas.dimension) }}</span>
              <span v-if="rejilla.columnas"><strong>Columnas:</strong> {{ nombreDimension(rejilla.columnas.dimension) }}</span>
              <span v-if="rejilla.pestanas.dimensiones.length"><strong>Pestañas:</strong> {{ rejilla.pestanas.dimensiones.map(nombreDimension).join(' · ') }}</span>
              <span class="matriz-leyenda-nota"><i class="fas fa-info-circle"></i> Importes en euros. Una celda vacía deja la propuesta en revisión manual.</span>
            </div>

            <div v-if="rejilla.pestanas.dimensiones.length" class="matriz-pestanas">
              <div class="vista-toggle" role="tablist" :aria-label="'Pestañas por ' + rejilla.pestanas.dimensiones.map(nombreDimension).join(' y ')">
                <button
                  v-for="(combinacion, p) in rejilla.pestanas.valores"
                  :key="'p' + p"
                  type="button"
                  role="tab"
                  class="btn-view-toggle"
                  :class="{ active: pestanaActiva === p }"
                  :aria-selected="pestanaActiva === p ? 'true' : 'false'"
                  @click="pestanaActiva = p"
                >
                  <span>{{ etiquetaPestana(rejilla, p) }}</span>
                  <span v-if="erroresPorPestana[p]" class="toggle-count matriz-contador-error">{{ erroresPorPestana[p] }}</span>
                </button>
              </div>
              <div v-if="editable && rejilla.pestanas.dimensiones.length === 1" class="matriz-anadir">
                <input v-model="nuevaPestana" class="mcas-input" :placeholder="'Nueva pestaña (p. ej. ZBR)'" aria-label="Nombre de la nueva pestaña" @keydown.enter.prevent="nuevaPestanaTabla">
                <button type="button" class="btn btn-outline" @click="nuevaPestanaTabla">
                  <i class="fas fa-plus"></i>
                  <span>Añadir pestaña</span>
                </button>
                <button v-if="rejilla.pestanas.valores.length > 1" type="button" class="btn btn-outline" @click="borrarPestana(pestanaActiva)">
                  <i class="fas fa-trash"></i>
                  <span>Quitar esta pestaña</span>
                </button>
              </div>
            </div>

            <div v-if="rejilla.celdas[pestanaActiva]" class="matriz-contenedor">
              <table class="matriz-tabla" @paste="onPegar">
                <thead>
                  <tr>
                    <th class="matriz-esquina" scope="col">
                      {{ nombreDimension(rejilla.filas.dimension) }}
                      <span v-if="rejilla.columnas" class="matriz-esquina-columnas">{{ nombreDimension(rejilla.columnas.dimension) }} →</span>
                    </th>
                    <th v-for="(valor, j) in valoresColumnas" :key="'c' + j" class="matriz-cabecera" scope="col">
                      <div class="matriz-cabecera-contenido">
                        <input
                          v-if="editable && rejilla.columnas"
                          class="matriz-input matriz-input--cabecera"
                          :value="etiquetaCabecera(rejilla.columnas.tipo, valor)"
                          :aria-label="'Tramo de la columna ' + (j + 1)"
                          @change="cambiarCabecera('columnas', j, $event.target.value, $event)"
                        >
                        <span v-else>{{ rejilla.columnas ? etiquetaCabecera(rejilla.columnas.tipo, valor) : 'Importe (€)' }}</span>
                        <button v-if="editable && rejilla.columnas" type="button" class="matriz-quitar" title="Quitar la columna" aria-label="Quitar la columna" @click="borrarColumna(j)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(valor, i) in rejilla.filas.valores" :key="'f' + i">
                    <th class="matriz-cabecera-fila" scope="row">
                      <div class="matriz-cabecera-contenido">
                        <input
                          v-if="editable"
                          class="matriz-input matriz-input--cabecera"
                          :value="etiquetaCabecera(rejilla.filas.tipo, valor)"
                          :aria-label="'Tramo de la fila ' + (i + 1)"
                          @change="cambiarCabecera('filas', i, $event.target.value, $event)"
                        >
                        <span v-else>{{ etiquetaCabecera(rejilla.filas.tipo, valor) }}</span>
                        <button v-if="editable" type="button" class="matriz-quitar" title="Quitar la fila" aria-label="Quitar la fila" @click="borrarFila(i)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </th>
                    <td
                      v-for="(celda, j) in rejilla.celdas[pestanaActiva][i]"
                      :key="'v' + j"
                      :class="claseCelda(pestanaActiva, i, j)"
                      :title="tituloCelda(pestanaActiva, i, j)"
                    >
                      <input
                        class="matriz-input"
                        :value="textoCelda(celda)"
                        :readonly="!editable"
                        inputmode="decimal"
                        :aria-label="'Importe de la fila ' + (i + 1) + ', columna ' + (j + 1)"
                        @focus="seleccion = { fila: i, columna: j }"
                        @change="cambiarCelda(pestanaActiva, i, j, $event.target.value)"
                      >
                    </td>
                  </tr>
                  <tr v-if="!rejilla.filas.valores.length">
                    <td :colspan="valoresColumnas.length + 1" class="matriz-sin-filas">
                      Añada la primera fila o pegue desde Excel el bloque con sus cabeceras.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="form-hint-inline">Añada la primera pestaña para empezar a rellenar la tabla.</p>

            <div v-if="editable" class="matriz-anadir">
              <input v-model="nuevaFilaTexto" class="mcas-input" :placeholder="ejemploTramo(rejilla.filas)" aria-label="Tramo de la nueva fila" @keydown.enter.prevent="nuevaFilaTabla">
              <button type="button" class="btn btn-outline" @click="nuevaFilaTabla">
                <i class="fas fa-plus"></i>
                <span>Añadir fila</span>
              </button>
              <template v-if="rejilla.columnas">
                <input v-model="nuevaColumnaTexto" class="mcas-input" :placeholder="ejemploTramo(rejilla.columnas)" aria-label="Tramo de la nueva columna" @keydown.enter.prevent="nuevaColumnaTabla">
                <button type="button" class="btn btn-outline" @click="nuevaColumnaTabla">
                  <i class="fas fa-plus"></i>
                  <span>Añadir columna</span>
                </button>
              </template>
            </div>
            <small v-if="errorCabecera" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errorCabecera }}</small>
            <p v-if="editable" class="form-hint-inline matriz-ayuda">
              Escriba los tramos como en el Excel: «0-5.000», «5.001-10.000», «>300.001». Para dejar una celda en revisión manual, déjela vacía.
            </p>
          </template>

          <!-- Pegar desde Excel -->
          <section v-if="panelPegado" class="form-section matriz-pegado">
            <div class="section-header"><i class="fas fa-paste"></i><h3>Pegar desde Excel</h3></div>
            <p class="form-hint-inline">
              Copie las celdas en Excel y péguelas aquí (Ctrl+V).
              <template v-if="rejilla.filas && rejilla.filas.valores.length">Se colocan a partir de la celda seleccionada (fila {{ seleccion.fila + 1 }}, columna {{ seleccion.columna + 1 }}).</template>
              <template v-else>Copie también la primera fila y la primera columna, con los tramos.</template>
              «N. Aplica», «Consultar» y las celdas vacías quedan vacías (revisión manual).
            </p>
            <textarea v-model="textoPegado" class="mcas-input matriz-textarea" rows="5" aria-label="Celdas copiadas de Excel"></textarea>
            <div class="matriz-acciones-aviso">
              <button type="button" class="btn btn-cancel" @click="panelPegado = false">
                <i class="fas fa-times"></i>
                <span>Cancelar</span>
              </button>
              <button type="button" class="btn btn-primary" :disabled="!textoPegado.trim()" @click="aplicarTextoPegado">
                <i class="fas fa-check"></i>
                <span>Colocar en la tabla</span>
              </button>
            </div>
          </section>
          <div v-if="mensajePegado" class="mcas-alert" :class="mensajePegado.tipo === 'error' ? 'mcas-alert--danger' : 'mcas-alert--info'">
            <i :class="mensajePegado.tipo === 'error' ? 'fas fa-times-circle' : 'fas fa-paste'"></i>
            <div>{{ mensajePegado.texto }}</div>
          </div>

          <!-- Qué hay que revisar -->
          <div v-if="editable && rejilla.filas && (validacion.errores.length || incidenciasGenerales.length)" class="mcas-alert mcas-alert--danger">
            <i class="fas fa-times-circle"></i>
            <div>
              <strong>Corrija lo siguiente antes de guardar:</strong>
              <ul>
                <li v-for="(e, k) in validacion.errores.slice(0, 8)" :key="'e' + k">{{ e.mensaje }}</li>
                <li v-for="(texto, k) in incidenciasGenerales" :key="'s' + k">{{ texto }}</li>
                <li v-if="validacion.errores.length > 8">Y {{ validacion.errores.length - 8 }} más, marcadas en rojo en la tabla.</li>
              </ul>
            </div>
          </div>
          <div v-if="rejilla.filas && validacion.avisos.length" class="mcas-alert mcas-alert--warning">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <ul>
                <li v-for="(a, k) in validacion.avisos" :key="'a' + k">{{ a.mensaje }}</li>
              </ul>
            </div>
          </div>
        </template>
      </div>

      <div class="mcas-modal-footer">
        <div class="matriz-pie-izquierda">
          <span v-if="!editable" class="footer-note"><i class="fas fa-lock"></i> Solo lectura</span>
          <span v-else-if="cambios" class="footer-note"><i class="fas fa-pen"></i> Cambios sin guardar</span>
          <span v-else class="footer-note"><i class="fas fa-check"></i> Sin cambios</span>
          <button type="button" class="btn btn-outline" title="Ver la tabla fila a fila, tal como la guarda el motor" @click="$emit('vista-avanzada')">
            <i class="fas fa-list"></i>
            <span>Vista avanzada</span>
          </button>
        </div>
        <div class="footer-actions">
          <button v-if="editable && rejilla && !noCartesiana" type="button" class="btn btn-outline" @click="abrirPegado">
            <i class="fas fa-paste"></i>
            <span>Pegar desde Excel</span>
          </button>
          <button type="button" class="btn btn-cancel" @click="cerrar">
            <i class="fas fa-times"></i>
            <span>{{ editable ? 'Cancelar' : 'Cerrar' }}</span>
          </button>
          <button v-if="editable" type="button" class="btn btn-save" :disabled="!cambios || guardando || conflicto" @click="guardar">
            <i :class="guardando ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
            <span>Guardar tabla</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { confirmar, mostrarError, mostrarExito, textoError } from './mcasDialogs'
// En una sola línea: los tests cargan este <script> en Node (tests/unit/helpers/sfc.js) y solo reconocen import de una línea.
import { NOMBRES_DIMENSION, DIMENSIONES_CATEGORIA, nombreDimension, formatearNumero, leerImporte, etiquetaCabecera, leerCabecera, etiquetaPestana, aRejilla, aFilas, rejillaVacia, numerarCeldas, posicionDeOrden, validarRejilla, pegarDesdeExcel, aplicarPegado, rejillaDesdePegado, anadirFila, quitarFila, anadirColumna, quitarColumna, anadirPestana, quitarPestana } from './mcasMatriz'

// Estructura propuesta para una tabla nueva según el método de la regla.
const ESTRUCTURA_INICIAL = {
  RANGE_LOOKUP: { filas: 'consumo_kwh', columnas: '', pestanas: '' },
  MATRIX_LOOKUP: { filas: 'consumo_kwh', columnas: 'potencia_kw', pestanas: '' },
  MULTI_DIMENSION_LOOKUP: { filas: 'potencia_kw', columnas: 'codigo_producto', pestanas: '' },
}

const clavePosicion = (p, f, c) => `${p}|${f}|${c}`

export default {
  name: 'McasMatrizEditor',
  props: {
    regla: { type: Object, required: true },
    editable: { type: Boolean, default: false },
    ordenResaltado: { type: Number, default: null },
  },
  emits: ['cerrar', 'guardado', 'vista-avanzada'],
  data() {
    return {
      cargando: false,
      errorCarga: '',
      noCartesiana: '',
      firma: null,
      rejilla: null,
      pestanaActiva: 0,
      seleccion: { fila: 0, columna: 0 },
      posicionResaltada: null,
      cambios: false,
      guardando: false,
      conflicto: false,
      incidenciasServidor: {},
      incidenciasGenerales: [],
      estructura: { ...(ESTRUCTURA_INICIAL[this.regla?.metodoCalculo] || ESTRUCTURA_INICIAL.MATRIX_LOOKUP) },
      errorEstructura: '',
      errorCabecera: '',
      nuevaFilaTexto: '',
      nuevaColumnaTexto: '',
      nuevaPestana: '',
      panelPegado: false,
      textoPegado: '',
      mensajePegado: null,
    }
  },
  computed: {
    nombreRegla() {
      return this.regla?.nombre || this.regla?.codigo || `Regla #${this.regla?.id ?? ''}`
    },
    esTablaDeTramos() {
      return this.regla?.metodoCalculo === 'RANGE_LOOKUP'
    },
    dimensionesDisponibles() {
      return Object.entries(NOMBRES_DIMENSION).map(([value, label]) => ({ value, label }))
    },
    dimensionesCategoria() {
      return this.dimensionesDisponibles.filter(d => DIMENSIONES_CATEGORIA.includes(d.value))
    },
    valoresColumnas() {
      return this.rejilla?.columnas ? this.rejilla.columnas.valores : [null]
    },
    validacion() {
      if (!this.rejilla?.filas) return { ok: false, errores: [], avisos: [] }
      return validarRejilla(this.rejilla)
    },
    erroresPorPestana() {
      const cuenta = {}
      for (const e of this.validacion.errores) if (e.pestana !== undefined) cuenta[e.pestana] = (cuenta[e.pestana] || 0) + 1
      for (const clave of Object.keys(this.incidenciasServidor)) {
        const p = Number(clave.split('|')[0])
        cuenta[p] = (cuenta[p] || 0) + 1
      }
      return cuenta
    },
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown)
    this.cargar()
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    nombreDimension,
    etiquetaCabecera,
    etiquetaPestana,
    async cargar() {
      this.cargando = true
      this.errorCarga = ''
      this.noCartesiana = ''
      try {
        const { data } = await axios.get(`/mcas/reglas/${this.regla.id}/tabla`)
        this.firma = data?.firma ?? null
        this.ponerRejilla(Array.isArray(data?.valores) ? data.valores : [])
        this.posicionResaltada = posicionDeOrden(this.rejilla, this.ordenResaltado)
        if (this.posicionResaltada) {
          this.pestanaActiva = this.posicionResaltada.pestana
          this.seleccion = { fila: this.posicionResaltada.fila, columna: this.posicionResaltada.columna }
        }
        this.cambios = false
        this.conflicto = false
        this.incidenciasServidor = {}
        this.incidenciasGenerales = []
      } catch (e) {
        console.error('Error al cargar la tabla de la regla MCAS:', e)
        this.errorCarga = textoError(e, 'No se pudo cargar la tabla de importes.')
      } finally {
        this.cargando = false
      }
    },
    ponerRejilla(valores) {
      const rejilla = aRejilla(valores)
      if (!rejilla.ok) {
        this.rejilla = null
        this.noCartesiana = rejilla.motivo
        return
      }
      if (rejilla.idRegla == null) rejilla.idRegla = this.regla.id
      this.rejilla = rejilla
      if (this.pestanaActiva >= rejilla.celdas.length) this.pestanaActiva = 0
    },
    async recargar() {
      await this.cargar()
    },
    // -----------------------------------------------
    // Celdas y cabeceras
    // -----------------------------------------------
    textoCelda(celda) {
      if (!celda) return ''
      if (celda.invalido) return celda.invalido
      return celda.valor === null || celda.valor === undefined ? '' : formatearNumero(celda.valor)
    },
    cambiarCelda(p, f, c, texto) {
      if (!this.editable || !this.rejilla) return
      const celda = this.rejilla.celdas[p]?.[f]?.[c]
      if (!celda) return
      const leido = leerImporte(texto)
      if (leido.error) {
        celda.valor = null
        celda.invalido = String(texto).trim()
      } else {
        delete celda.invalido
        celda.valor = leido.vacia ? null : leido.valor
        if (celda.valor !== null && !celda.unidad) celda.unidad = this.rejilla.unidad
      }
      delete this.incidenciasServidor[clavePosicion(p, f, c)]
      this.cambios = true
    },
    cambiarCabecera(eje, i, texto, evento) {
      if (!this.editable) return
      const tipo = this.rejilla[eje].tipo
      const valor = leerCabecera(tipo, texto)
      if (!valor) {
        this.errorCabecera = `No se entiende «${String(texto).trim()}». ${this.explicacionTramo(tipo)}`
        if (evento?.target) evento.target.value = etiquetaCabecera(tipo, this.rejilla[eje].valores[i])
        return
      }
      this.errorCabecera = ''
      this.rejilla[eje].valores.splice(i, 1, valor)
      this.cambios = true
    },
    explicacionTramo(tipo) {
      return tipo === 'categoria'
        ? 'Escriba el valor tal como aparece en el contrato (p. ej. ZBR o 3.0TD).'
        : 'Escriba el tramo como en el Excel: 0-5.000, 5.001-10.000 o >300.001.'
    },
    ejemploTramo(eje) {
      if (!eje) return ''
      return eje.tipo === 'categoria' ? `Nuevo valor de ${nombreDimension(eje.dimension).toLowerCase()}` : 'Nuevo tramo, p. ej. 5.001-10.000'
    },
    nuevaFilaTabla() {
      const valor = leerCabecera(this.rejilla.filas.tipo, this.nuevaFilaTexto)
      if (!valor) {
        this.errorCabecera = `No se entiende la fila «${this.nuevaFilaTexto.trim()}». ${this.explicacionTramo(this.rejilla.filas.tipo)}`
        return
      }
      this.errorCabecera = ''
      anadirFila(this.rejilla, valor)
      this.nuevaFilaTexto = ''
      this.cambios = true
    },
    nuevaColumnaTabla() {
      const valor = leerCabecera(this.rejilla.columnas.tipo, this.nuevaColumnaTexto)
      if (!valor) {
        this.errorCabecera = `No se entiende la columna «${this.nuevaColumnaTexto.trim()}». ${this.explicacionTramo(this.rejilla.columnas.tipo)}`
        return
      }
      this.errorCabecera = ''
      anadirColumna(this.rejilla, valor)
      this.nuevaColumnaTexto = ''
      this.cambios = true
    },
    nuevaPestanaTabla() {
      const valor = String(this.nuevaPestana || '').trim()
      if (!valor) return
      this.pestanaActiva = anadirPestana(this.rejilla, valor)
      this.nuevaPestana = ''
      this.cambios = true
    },
    async borrarFila(i) {
      if (!await this.confirmarBorrado('¿Quitar la fila?', 'Se quitarán también sus importes en todas las pestañas.')) return
      quitarFila(this.rejilla, i)
      this.cambios = true
    },
    async borrarColumna(j) {
      if (!await this.confirmarBorrado('¿Quitar la columna?', 'Se quitarán también sus importes en todas las pestañas.')) return
      quitarColumna(this.rejilla, j)
      this.cambios = true
    },
    async borrarPestana(p) {
      if (!await this.confirmarBorrado('¿Quitar la pestaña?', `Se quitarán los importes de «${etiquetaPestana(this.rejilla, p)}».`)) return
      quitarPestana(this.rejilla, p)
      this.pestanaActiva = 0
      this.cambios = true
    },
    confirmarBorrado(titulo, texto) {
      return confirmar(this.$swal, { titulo, texto, textoConfirmar: 'Sí, quitar', peligroso: true })
    },
    crearEstructura() {
      const { filas, columnas, pestanas } = this.estructura
      const elegidas = [filas, columnas, pestanas].filter(Boolean)
      if (!filas) this.errorEstructura = 'Elija qué dato va en las filas'
      else if (new Set(elegidas).size !== elegidas.length) this.errorEstructura = 'Filas, columnas y pestañas deben ser datos distintos'
      else if (this.regla.metodoCalculo === 'MATRIX_LOOKUP' && !columnas) this.errorEstructura = 'Una matriz necesita también un dato en las columnas'
      else this.errorEstructura = ''
      if (this.errorEstructura) return
      this.rejilla = rejillaVacia({
        filas,
        columnas: this.esTablaDeTramos ? null : (columnas || null),
        pestanas: !this.esTablaDeTramos && pestanas ? [pestanas] : [],
        idRegla: this.regla.id,
      })
      this.pestanaActiva = 0
      this.cambios = true
    },
    claseCelda(p, f, c) {
      const celda = this.rejilla?.celdas[p]?.[f]?.[c]
      const clave = clavePosicion(p, f, c)
      const r = this.posicionResaltada
      const errorLocal = this.validacion.errores.some(e => e.pestana === p && e.fila === f && e.columna === c)
      return {
        'celda-con-error': !!this.incidenciasServidor[clave] || !!celda?.invalido || errorLocal,
        'celda-resaltada': !!r && r.pestana === p && r.fila === f && r.columna === c,
        'celda-vacia': !celda || celda.valor === null || celda.valor === undefined,
        'celda-seleccionada': this.editable && this.seleccion.fila === f && this.seleccion.columna === c,
      }
    },
    tituloCelda(p, f, c) {
      const clave = clavePosicion(p, f, c)
      if (this.incidenciasServidor[clave]) return this.incidenciasServidor[clave]
      const error = this.validacion.errores.find(e => e.pestana === p && e.fila === f && e.columna === c)
      if (error) return error.mensaje
      const celda = this.rejilla?.celdas[p]?.[f]?.[c]
      return !celda || celda.valor === null ? 'Vacía: revisión manual' : ''
    },
    // -----------------------------------------------
    // Pegar desde Excel
    // -----------------------------------------------
    abrirPegado() {
      this.panelPegado = true
      this.textoPegado = ''
      this.mensajePegado = null
    },
    aplicarTextoPegado() {
      this.pegarTexto(this.textoPegado)
      if (this.mensajePegado?.tipo !== 'error') this.panelPegado = false
    },
    onPegar(evento) {
      if (!this.editable) return
      const texto = evento?.clipboardData?.getData('text') || ''
      if (!/[\t\n]/.test(texto.trim())) return // un solo valor: lo pega el navegador en la celda
      evento.preventDefault()
      this.pegarTexto(texto)
    },
    pegarTexto(texto) {
      if (!this.editable || !this.rejilla?.filas) {
        this.mensajePegado = { tipo: 'error', texto: 'Elija primero qué datos van en las filas y columnas y pulse «Crear la tabla».' }
        return
      }
      const pegado = pegarDesdeExcel(texto)
      if (!this.rejilla.filas.valores.length && this.rejilla.pestanas.dimensiones.length) {
        this.mensajePegado = { tipo: 'error', texto: 'En una tabla con pestañas, añada antes la pestaña y sus filas; después pegue los importes desde la primera celda.' }
        return
      }
      if (!this.rejilla.filas.valores.length) {
        const nueva = rejillaDesdePegado(pegado, {
          filas: this.rejilla.filas.dimension, columnas: this.rejilla.columnas?.dimension || null,
          idRegla: this.regla.id, unidad: this.rejilla.unidad,
        })
        if (!nueva.ok) {
          this.mensajePegado = { tipo: 'error', texto: nueva.motivo }
          return
        }
        this.rejilla = nueva.rejilla
        this.pestanaActiva = 0
        this.marcarNoEntendidas(pegado, { fila: 0, columna: 0 })
        this.cambios = true
        this.mensajePegado = { tipo: 'info', texto: this.textoResultadoPegado(pegado, null) }
        return
      }
      const inicio = { pestana: this.pestanaActiva, fila: this.seleccion.fila, columna: this.seleccion.columna }
      const resultado = aplicarPegado(this.rejilla, pegado, inicio)
      this.marcarNoEntendidas(pegado, inicio)
      this.cambios = this.cambios || resultado.escritas > 0
      this.mensajePegado = { tipo: 'info', texto: this.textoResultadoPegado(pegado, resultado) }
    },
    marcarNoEntendidas(pegado, { fila, columna }) {
      for (const e of pegado.errores) {
        const celda = this.rejilla.celdas[this.pestanaActiva]?.[fila + e.fila]?.[columna + e.columna]
        if (celda) celda.invalido = e.texto
      }
    },
    textoResultadoPegado(pegado, resultado) {
      const partes = []
      const escritas = resultado ? resultado.escritas : pegado.filas.reduce((n, f) => n + f.length, 0)
      partes.push(escritas === 1 ? 'Se ha colocado 1 celda.' : `Se han colocado ${escritas} celdas.`)
      if (resultado?.fuera) {
        partes.push(`${resultado.fuera === 1 ? '1 celda no cabe' : `${resultado.fuera} celdas no caben`} en la tabla: añada antes las filas o columnas que falten.`)
      }
      if (pegado.errores.length) {
        partes.push(`${pegado.errores.length === 1 ? '1 celda no es' : `${pegado.errores.length} celdas no son`} un importe (p. ej. «${pegado.errores[0].texto}»): están marcadas en rojo.`)
      }
      partes.push('Revise la tabla y pulse «Guardar tabla».')
      return partes.join(' ')
    },
    // -----------------------------------------------
    // Guardar y cerrar
    // -----------------------------------------------
    async guardar() {
      if (!this.editable || this.guardando || !this.rejilla?.filas || !this.cambios) return
      const validacion = validarRejilla(this.rejilla)
      if (!validacion.ok) {
        const [primero, ...resto] = validacion.errores
        mostrarError(this.$swal, 'Revise la tabla', `${primero.mensaje}${resto.length ? ` (y ${resto.length} más)` : ''}.`)
        return
      }
      const posiciones = numerarCeldas(this.rejilla)
      this.guardando = true
      this.incidenciasServidor = {}
      this.incidenciasGenerales = []
      try {
        const { data } = await axios.put(`/mcas/reglas/${this.regla.id}/tabla`, { firma: this.firma, valores: aFilas(this.rejilla) })
        this.firma = data?.firma ?? this.firma
        if (Array.isArray(data?.valores)) this.ponerRejilla(data.valores)
        this.cambios = false
        this.mensajePegado = null
        this.$emit('guardado', { idRegla: this.regla.id, firma: this.firma })
        mostrarExito(this.$swal, 'Tabla guardada', 'Los importes se han guardado. La tabla de comisiones se usará cuando la active.')
      } catch (e) {
        const estado = e?.response?.status
        const datos = e?.response?.data
        if (estado === 409) {
          this.conflicto = true
          mostrarError(this.$swal, 'No se ha guardado', 'Otra persona cambió la tabla: recárguela. Sus cambios de ahora no se han guardado.')
        } else if (estado === 400 && Array.isArray(datos?.incidencias) && datos.incidencias.length) {
          for (const inc of datos.incidencias) {
            const pos = posiciones.find(x => x.orden === Number(inc.orden))
            if (pos) this.incidenciasServidor[clavePosicion(pos.pestana, pos.fila, pos.columna)] = inc.mensaje
            else this.incidenciasGenerales.push(inc.mensaje)
          }
          const primera = posiciones.find(x => x.orden === Number(datos.incidencias[0].orden))
          if (primera) this.pestanaActiva = primera.pestana
          mostrarError(this.$swal, 'No se ha guardado', textoError(e, 'Revise las celdas marcadas en rojo.'))
        } else {
          mostrarError(this.$swal, 'No se ha guardado', textoError(e, 'No se pudo guardar la tabla.'))
        }
      } finally {
        this.guardando = false
      }
    },
    async cerrar() {
      if (this.editable && this.cambios) {
        const salir = await confirmar(this.$swal, {
          titulo: '¿Salir sin guardar?',
          texto: 'Los cambios de la tabla que no ha guardado se perderán.',
          textoConfirmar: 'Sí, salir',
          peligroso: true,
        })
        if (!salir) return
      }
      this.$emit('cerrar')
    },
    onKeydown(e) {
      if (e.key !== 'Escape' || this.$swal?.isVisible?.()) return
      this.cerrar()
    },
  },
}
</script>

<style scoped src="./McasShared.css"></style>
<style scoped>
.mcas-modal--matriz {
  max-width: 1180px;
}

.matriz-cargando {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  color: var(--text-secondary);
}

.matriz-acciones-aviso {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.matriz-leyenda {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 20px;
  margin-bottom: 12px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.matriz-leyenda strong {
  color: var(--text-primary);
  font-weight: 600;
}

.matriz-leyenda-nota i {
  margin-right: 4px;
  color: var(--text-muted);
}

.matriz-pestanas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  margin-bottom: 12px;
}

.matriz-contador-error {
  background: rgba(220, 53, 69, 0.15);
  color: #991b1b;
}

.matriz-contenedor {
  max-height: 56vh;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.matriz-tabla {
  border-collapse: separate;
  border-spacing: 0;
  min-width: 100%;
  font-size: 0.85rem;
}

.matriz-tabla th,
.matriz-tabla td {
  padding: 0;
  border-right: 1px solid #edf0f3;
  border-bottom: 1px solid #edf0f3;
  background: #fff;
}

.matriz-tabla thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8fafc;
  font-weight: 600;
  color: var(--text-primary);
}

.matriz-tabla tbody th {
  position: sticky;
  left: 0;
  z-index: 1;
  background: #f8fafc;
  font-weight: 600;
  text-align: left;
}

.matriz-tabla thead th.matriz-esquina {
  left: 0;
  z-index: 3;
  min-width: 170px;
  padding: 8px 10px;
  text-align: left;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.matriz-esquina-columnas {
  display: block;
  font-weight: 500;
}

.matriz-cabecera {
  min-width: 118px;
}

.matriz-cabecera-contenido {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
}

.matriz-cabecera-contenido > span {
  padding: 4px;
  white-space: nowrap;
}

.matriz-input {
  width: 100%;
  min-width: 90px;
  height: 34px;
  margin: 0;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.matriz-input--cabecera {
  text-align: left;
  font-weight: 600;
}

.matriz-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: #fff;
  box-shadow: var(--focus-ring);
}

.matriz-input[readonly] {
  cursor: default;
}

.matriz-quitar {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.7rem;
}

.matriz-quitar:hover {
  background: #fcebeb;
  color: #a32d2d;
  transform: none;
}

.matriz-tabla td.celda-vacia {
  background: repeating-linear-gradient(135deg, #fff, #fff 6px, #f6f7f9 6px, #f6f7f9 12px);
}

.matriz-tabla td.celda-seleccionada .matriz-input {
  border-color: rgba(var(--color-brand-yellow-rgb), 0.8);
}

.matriz-tabla td.celda-resaltada {
  background: rgba(var(--color-brand-yellow-rgb), 0.25);
}

.matriz-tabla td.celda-con-error {
  background: rgba(220, 53, 69, 0.1);
}

.matriz-tabla td.celda-con-error .matriz-input {
  border-color: rgba(220, 53, 69, 0.55);
  color: #991b1b;
}

.matriz-sin-filas {
  padding: 16px !important;
  color: var(--text-secondary);
  text-align: center;
}

.matriz-anadir {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.matriz-anadir .mcas-input {
  width: 220px;
  min-height: 38px;
}

.matriz-ayuda {
  margin-top: 8px;
}

.matriz-pegado {
  margin-top: 16px;
}

.matriz-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
}

.matriz-pie-izquierda {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.mcas-modal-body > .mcas-alert + .mcas-alert,
.mcas-modal-body > .mcas-alert + section,
.mcas-modal-body > .matriz-anadir + .mcas-alert,
.mcas-modal-body > .form-hint-inline + .mcas-alert,
.mcas-modal-body > .form-section + .mcas-alert,
.mcas-modal-body > .mcas-alert + .matriz-leyenda {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .matriz-anadir .mcas-input {
    width: 100%;
  }
}
</style>
