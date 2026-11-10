<template>
  <div class="deliverables">
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="acciones.subidaBloqueada" class="hint" role="status">📁 {{ acciones.subidaBloqueada }} Los enlaces y las notas sí se pueden añadir.</p>
    <p v-if="acciones.dropbox" class="hint">📁 Los archivos que subas se guardan en Dropbox, en <strong>{{ tarea.dropbox_folder || 'la carpeta del proyecto' }}</strong>. Quitarlos de aquí no los borra de Dropbox.</p>
    <p v-if="tarea.deliverables.length === 0" class="hint">Esta tarea no tiene elementos requeridos. Puedes añadir los que necesite abajo.</p>

    <section v-for="d in tarea.deliverables" :key="d.key" class="deliv" :class="estadoDe(d)">
      <header>
        <span class="deliv-mark">{{ estadoDe(d) === 'ok' ? '✓' : estadoDe(d) === 'na' ? '∅' : '○' }}</span>
        <strong>{{ d.label }}</strong>
        <span class="deliv-state">{{ estadoDe(d) === 'ok' ? 'Aportado' : estadoDe(d) === 'na' ? 'No aplica' : 'Pendiente' }}</span>
        <span v-if="d.locked" class="deliv-lock" title="Requerido por la plantilla: solo puede marcarse como «No aplica»">🔒</span>
        <button v-else type="button" class="icon-btn" title="Quitar este elemento requerido" :disabled="ocupado" @click="ejecutar(() => acciones.cambiarEntregables(tarea.deliverables.filter((x) => x.key !== d.key)))">×</button>
      </header>
      <p v-if="d.na" class="na-reason">No aplica: {{ d.na_reason }}
        <button type="button" class="link-btn" @click="ejecutar(() => acciones.cambiarEntregables(tarea.deliverables.map((x) => (x.key === d.key ? { ...x, na: false, na_reason: '' } : x))))">Deshacer</button>
      </p>
      <ul v-if="de(d.key).length > 0" class="att-list"><li v-for="a in de(d.key)" :key="a.id" class="att">
        <span class="att-icon">{{ a.kind === 'file' ? '📎' : a.kind === 'link' ? '🔗' : '📝' }}</span>
        <span class="att-main">
          <a v-if="a.kind === 'file'" :href="urlArchivo(a)" target="_blank" rel="noreferrer">{{ a.name }}</a>
          <a v-else-if="a.kind === 'link'" :href="a.url" target="_blank" rel="noreferrer">{{ a.name }}</a><span v-else class="att-note">{{ a.text }}</span>
          <span v-if="a.kind === 'file' && a.size" class="att-size"> · {{ tamano(a.size) }}</span><span v-if="a.storage === 'dropbox'" class="att-size" :title="a.path"> · en Dropbox</span>
        </span>
        <button type="button" class="icon-btn" :title="a.storage === 'dropbox' ? 'Quitar de la tarea (el archivo sigue en Dropbox)' : 'Quitar'" :disabled="ocupado" @click="ejecutar(() => acciones.quitar(a.id))">×</button>
      </li></ul>
      <div v-if="!d.na" class="att-actions">
        <span v-if="acciones.subidaBloqueada" class="btn-ish disabled" :title="acciones.subidaBloqueada" aria-disabled="true">Subir archivo</span>
        <label v-else class="btn-ish" :class="{ disabled: ocupado }">Subir archivo<input type="file" hidden :disabled="ocupado" @change="elegirArchivo($event, d.key, d.label)"></label>
        <button type="button" class="btn-ish" @click="abrirFormulario(d.key, 'link')">Enlace</button>
        <button type="button" class="btn-ish" @click="abrirFormulario(d.key, 'note')">Nota</button>
        <button v-if="de(d.key).length === 0" type="button" class="btn-ish muted-btn" @click="abrirFormulario(d.key, 'na')">No aplica</button>
        <div v-if="formulario && formulario.requisito === d.key" class="att-form">
          <input v-if="formulario.modo === 'link'" v-model="url" placeholder="https://… (Dropbox, Drive, correo…)">
          <textarea v-else v-model="texto" rows="2" :placeholder="formulario.modo === 'note' ? 'Escribe la nota o el dato aportado' : 'Explica por qué no aplica'" />
          <div class="row">
            <button type="button" :disabled="ocupado || (formulario.modo === 'link' ? !url.trim() : !texto.trim())" @click="enviarFormulario">{{ formulario.modo === 'na' ? 'Marcar como no aplica' : 'Añadir' }}</button>
            <button type="button" class="secondary" @click="cerrarFormulario">Cancelar</button>
          </div>
        </div>
      </div>
    </section>

    <section class="deliv extra">
      <header><strong>Otra documentación</strong><span class="deliv-state">Opcional</span></header>
      <ul v-if="otros.length > 0" class="att-list"><li v-for="a in otros" :key="a.id" class="att">
        <span class="att-icon">{{ a.kind === 'file' ? '📎' : a.kind === 'link' ? '🔗' : '📝' }}</span>
        <span class="att-main">
          <a v-if="a.kind === 'file'" :href="urlArchivo(a)" target="_blank" rel="noreferrer">{{ a.name }}</a>
          <a v-else-if="a.kind === 'link'" :href="a.url" target="_blank" rel="noreferrer">{{ a.name }}</a><span v-else class="att-note">{{ a.text }}</span>
          <span v-if="a.kind === 'file' && a.size" class="att-size"> · {{ tamano(a.size) }}</span><span v-if="a.storage === 'dropbox'" class="att-size" :title="a.path"> · en Dropbox</span>
        </span>
        <button type="button" class="icon-btn" :title="a.storage === 'dropbox' ? 'Quitar de la tarea (el archivo sigue en Dropbox)' : 'Quitar'" :disabled="ocupado" @click="ejecutar(() => acciones.quitar(a.id))">×</button>
      </li></ul>
      <div class="att-actions">
        <span v-if="acciones.subidaBloqueada" class="btn-ish disabled" :title="acciones.subidaBloqueada" aria-disabled="true">Subir archivo</span>
        <label v-else class="btn-ish" :class="{ disabled: ocupado }">Subir archivo<input type="file" hidden :disabled="ocupado" @change="elegirArchivo($event, '', '')"></label>
        <button type="button" class="btn-ish" @click="abrirFormulario('', 'link')">Enlace</button>
        <button type="button" class="btn-ish" @click="abrirFormulario('', 'note')">Nota</button>
        <div v-if="formulario && formulario.requisito === ''" class="att-form">
          <input v-if="formulario.modo === 'link'" v-model="url" placeholder="https://…">
          <textarea v-else v-model="texto" rows="2" placeholder="Escribe la nota o el dato aportado" />
          <div class="row">
            <button type="button" :disabled="ocupado || (formulario.modo === 'link' ? !url.trim() : !texto.trim())" @click="enviarFormulario">Añadir</button>
            <button type="button" class="secondary" @click="cerrarFormulario">Cancelar</button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="pendiente" class="att-form pending-upload">
      <label class="field">Nombre con el que se guarda en Dropbox
        <input v-model="pendiente.nombre" @keydown.enter.prevent="subirPendiente">
      </label>
      <p class="hint">Archivo elegido: {{ pendiente.archivo.name }}. Cámbialo si quieres (por ejemplo, para poner el número de la factura).</p>
      <div class="row">
        <button type="button" :disabled="ocupado || !pendiente.nombre.trim()" @click="subirPendiente">{{ ocupado ? 'Subiendo…' : 'Subir' }}</button>
        <button type="button" class="secondary" :disabled="ocupado" @click="pendiente = null">Cancelar</button>
      </div>
    </div>

    <form class="add-req" @submit.prevent="anadirRequerido">
      <input v-model="nuevaEtiqueta" placeholder="Añadir otro elemento requerido para esta tarea…">
      <button type="submit" class="secondary" :disabled="ocupado || !nuevaEtiqueta.trim()">Añadir</button>
    </form>
  </div>
</template>

<script>
import { mensajeError, planificadorApi } from '@/services/planificadorApi'
import { suggestFileName, withExtension } from '@/utils/planificador/documentos/nombresArchivo'

// Lista de elementos requeridos de una tarea y lo aportado para cada uno (archivos en Dropbox, enlaces y notas).
// `acciones`: { aportarEnlace(url, nombre, requisito), aportarNota(texto, requisito), subirArchivo(archivo, requisito), quitar(id),
//   cambiarEntregables(lista), dropbox, subidaBloqueada, etiquetaProyecto }
export default {
  name: 'Entregables-Panel',
  props: { tarea: { type: Object, required: true }, acciones: { type: Object, required: true } },
  // Archivo elegido y el nombre con el que se guardará (propuesto; se puede cambiar antes de subirlo)
  data() { return { formulario: null, texto: '', url: '', ocupado: false, error: null, nuevaEtiqueta: '', pendiente: null } },
  computed: {
    claves() { return new Set(this.tarea.deliverables.map((d) => d.key)) },
    otros() { return this.tarea.attachments.filter((a) => !a.requirement || !this.claves.has(a.requirement)) }
  },
  methods: {
    urlArchivo(a) { return planificadorApi.urlArchivo(this.tarea.id, a.id) },
    tamano(bytes) { return bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? Math.round(bytes / 1024) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB' },
    // No se sube todavía: primero se enseña el nombre propuesto, que se puede cambiar
    elegirArchivo(evento, requisito, etiqueta) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (!archivo) return
      this.formulario = null
      this.pendiente = { archivo, requisito, nombre: suggestFileName({ requirement: etiqueta, original: archivo.name, projectLabel: this.acciones.etiquetaProyecto || '', existing: this.de(requisito).length }) }
    },
    async subirPendiente() {
      const p = this.pendiente
      if (!p || !p.nombre.trim()) return
      const nombre = withExtension(p.nombre, p.archivo.name)
      const archivo = new File([p.archivo], nombre, { type: p.archivo.type })
      if (await this.ejecutar(() => this.acciones.subirArchivo(archivo, p.requisito))) this.pendiente = null
    },
    de(clave) { return this.tarea.attachments.filter((a) => a.requirement === clave) },
    estadoDe(d) { return d.na ? 'na' : this.de(d.key).length > 0 ? 'ok' : 'pending' },
    abrirFormulario(requisito, modo) { this.formulario = { requisito, modo } },
    cerrarFormulario() { this.formulario = null; this.texto = ''; this.url = '' },
    // Ejecuta la acción mostrando el error si falla; devuelve si salió bien
    async ejecutar(accion) {
      this.ocupado = true
      this.error = null
      try { await accion(); return true } catch (e) { this.error = mensajeError(e); return false } finally { this.ocupado = false }
    },
    enviarFormulario() {
      const f = this.formulario
      if (!f) return
      this.ejecutar(async () => {
        if (f.modo === 'link') await this.acciones.aportarEnlace(this.url.trim(), '', f.requisito)
        else if (f.modo === 'note') await this.acciones.aportarNota(this.texto.trim(), f.requisito)
        else await this.acciones.cambiarEntregables(this.tarea.deliverables.map((d) => (d.key === f.requisito ? { ...d, na: true, na_reason: this.texto.trim() } : d)))
        this.cerrarFormulario()
      })
    },
    anadirRequerido() {
      const etiqueta = this.nuevaEtiqueta.trim()
      if (!etiqueta) return
      this.ejecutar(async () => {
        await this.acciones.cambiarEntregables([...this.tarea.deliverables, { key: '', label: etiqueta, na: false, na_reason: '' }])
        this.nuevaEtiqueta = ''
      })
    }
  }
}
</script>
