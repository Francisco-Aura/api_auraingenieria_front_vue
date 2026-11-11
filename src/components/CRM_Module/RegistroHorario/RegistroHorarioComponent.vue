<template>
  <div class="registro-horario">
    <div class="rh-pagina">
      <!-- La intranet ya pone «Registro horario» en su cabecera: aquí el título solo lo oyen los lectores de pantalla -->
      <h1 class="rh-oculto">Registro horario</h1>

      <div class="rh-rejilla">
        <!-- ------------------------------------------------ datos -->
        <section class="rh-tarjeta" aria-labelledby="rh-t-datos">
          <h2 id="rh-t-datos">Mis datos</h2>

          <div class="rh-campo">
            <label for="rh-trabajador">Nombre y apellidos</label>
            <input id="rh-trabajador" v-model="perfil.trabajador" type="text" autocomplete="name" maxlength="120" />
          </div>
          <div class="rh-fila-campos">
            <div class="rh-campo">
              <label for="rh-nif">NIF</label>
              <input id="rh-nif" v-model="perfil.nif" type="text" autocomplete="off" maxlength="30" />
            </div>
            <div class="rh-campo">
              <label for="rh-afiliacion">Nº afiliación</label>
              <input id="rh-afiliacion" v-model="perfil.num_afiliacion" type="text" autocomplete="off" maxlength="30" />
            </div>
          </div>

          <h3>Mi empresa</h3>
          <div class="rh-campo">
            <label for="rh-empresa">Empresa</label>
            <select id="rh-empresa" v-model="perfil.empresa" :disabled="!hayEmpresas">
              <option value="">{{ empresas ? (hayEmpresas ? 'Selecciona tu empresa' : '(sin empresas configuradas)') : 'Cargando…' }}</option>
              <option v-for="e in listaEmpresas" :key="e.texto" :value="e.texto">{{ e.texto }}</option>
            </select>
          </div>
          <p v-if="errorEmpresas" class="rh-aviso rh-aviso-error" role="alert">{{ errorEmpresas }}</p>
          <p class="rh-datos-empresa">
            <template v-if="empresa">CIF {{ empresa.cif }} · CCC {{ empresa.ccc }}<br />Centro de trabajo: {{ empresa.centro_trabajo }}</template>
            <template v-else-if="hayEmpresas">Elige tu empresa de la lista.</template>
          </p>

          <h3>Horario habitual</h3>
          <div class="rh-horario">
            <template v-for="f in ['manana', 'tarde']" :key="f">
              <span>{{ f === 'manana' ? 'Mañana' : 'Tarde' }}</span>
              <input v-model="perfil.horario[f][0]" type="time" :aria-label="`${f === 'manana' ? 'Mañana' : 'Tarde'}, entrada`" />
              <span class="rh-sep">a</span>
              <input v-model="perfil.horario[f][1]" type="time" :aria-label="`${f === 'manana' ? 'Mañana' : 'Tarde'}, salida`" />
            </template>
          </div>
          <p v-if="errorDeHorario" class="rh-aviso rh-aviso-error" role="alert">{{ errorDeHorario }}</p>

          <h3>Firma</h3>
          <div class="rh-firma-vista" :class="{ 'rh-vacia': !firma }">
            <img v-if="firma" :src="firma" alt="Tu firma" />
            <span v-else>Aún no has cargado tu firma</span>
          </div>
          <div class="rh-fila-botones">
            <button type="button" class="rh-btn rh-btn-primario" @click="dialogo = { tipo: 'dibujo' }">
              <svg class="rh-icono" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Firmar aquí
            </button>
            <button type="button" class="rh-btn" @click="$refs.entradaFirma.click()">Subir imagen…</button>
            <button v-if="firma" type="button" class="rh-btn rh-btn-peligro" @click="firma = null">Quitar</button>
          </div>
          <input ref="entradaFirma" type="file" accept="image/png,image/jpeg,image/*" class="rh-oculto" tabindex="-1"
            aria-label="Elegir imagen de la firma" @change="elegirImagen" />
        </section>

        <!-- ------------------------------------------------ calendario -->
        <section class="rh-tarjeta" aria-label="Calendario del mes">
          <CalendarioRegistro
            :anio="anio" :mes="mes" :hoy="hoy" :ctx="ctx" :limite="limite" :pincel="pincel"
            @pincel="pincel = $event" @mes="cambiarMes" @hoy="irAHoy"
            @pintar="pintarDia" @quitar="quitarDia" @horas="pedirHoras"
          />

          <div class="rh-resumen" aria-label="Resumen del mes">
            <div class="rh-dato"><strong>{{ resumen.dias }}</strong><span>Días trabajados</span></div>
            <div class="rh-dato"><strong>{{ resumen.tardes }}</strong><span>Días con tarde</span></div>
            <div class="rh-dato">
              <strong>{{ errorDeHorario ? '—' : fmtHoras(resumen.minutos) }}</strong>
              <span>{{ limite ? 'Horas hasta hoy' : 'Horas del mes' }}</span>
            </div>
          </div>

          <p v-if="errorFestivos" class="rh-aviso rh-aviso-falta" role="status">
            No se pudieron cargar los festivos: revisa que estén bien marcados antes de generar.
          </p>
          <p v-if="falta.length" class="rh-aviso rh-aviso-falta" role="status">Para generar el documento falta: {{ unir(falta) }}.</p>
          <p v-else class="rh-nota">Los festivos nacionales vienen marcados; añade a mano los locales.</p>
          <p v-if="mensaje" class="rh-aviso" :class="claseMensaje" :role="mensaje.tipo === 'error' ? 'alert' : 'status'">{{ mensaje.texto }}</p>

          <div class="rh-fila-botones">
            <button type="button" class="rh-btn" @click="restablecer">Restablecer mes</button>
            <button type="button" class="rh-btn" @click="dialogo = { tipo: 'alta' }">
              {{ perfil.fecha_alta ? `Alta: ${corta(perfil.fecha_alta)}` : 'Fecha de alta…' }}
            </button>
            <label v-if="esMesActual" class="rh-interruptor">
              <input v-model="hastaHoy" type="checkbox" />
              Solo hasta hoy ({{ Number(hoy.slice(8)) }} {{ MESES[Number(hoy.slice(5, 7)) - 1].slice(0, 3).toLowerCase() }})
            </label>
          </div>
          <div class="rh-fila-botones">
            <button type="button" class="rh-btn" :disabled="falta.length > 0 || generando" @click="generar('docx')">Descargar en Word</button>
            <button type="button" class="rh-btn rh-btn-primario rh-empuja" :disabled="falta.length > 0 || generando" @click="generar('pdf')">
              {{ generando ? 'Generando…' : 'Generar documento (PDF)' }}
            </button>
          </div>
        </section>
      </div>

      <!-- ------------------------------------------------ diálogos -->
      <DialogoHorasRegistro
        v-if="dialogo && dialogo.tipo === 'horas'"
        :fecha="dialogo.fecha" :estado="estadoDe(dialogo.fecha, ctx)" :horario="perfil.horario" :propias="marcas.horas[dialogo.fecha]"
        @guardar="guardarHoras" @habituales="horasHabituales" @cerrar="dialogo = null"
      />
      <DialogoAltaRegistro
        v-if="dialogo && dialogo.tipo === 'alta'"
        :inicial="perfil.fecha_alta || (esMesActual ? hoy : iso(anio, mes, 1))" :hay-alta="!!perfil.fecha_alta"
        @guardar="guardarAlta" @quitar="guardarAlta('')" @cerrar="dialogo = null"
      />
      <DialogoFirmaDibujoRegistro v-if="dialogo && dialogo.tipo === 'dibujo'" @usar="usarFirma" @cerrar="dialogo = null" />
      <DialogoFirmaFotoRegistro v-if="dialogo && dialogo.tipo === 'foto'" :archivo="dialogo.archivo" @usar="usarFirma" @cerrar="dialogo = null" />
    </div>
  </div>
</template>

<script>
import './RegistroHorarioComponent.css';
import CalendarioRegistro from './CalendarioRegistro.vue';
import DialogoAltaRegistro from './DialogoAltaRegistro.vue';
import DialogoFirmaDibujoRegistro from './DialogoFirmaDibujoRegistro.vue';
import DialogoFirmaFotoRegistro from './DialogoFirmaFotoRegistro.vue';
import DialogoHorasRegistro from './DialogoHorasRegistro.vue';
import { descargar, ErrorRegistroHorario, generarDocumento, obtenerEmpresas, obtenerFestivos } from '@/services/registroHorarioApi';
import { cargarFirma, cargarMarcas, cargarPerfil, guardarFirma, guardarMarcas, guardarPerfil } from '@/utils/registroHorario/almacen';
import { corta, hoyISO, iso, MESES } from '@/utils/registroHorario/fechas';
import { errorHorario, fmtHoras } from '@/utils/registroHorario/horas';
import {
  estadoDe, estadoDiasDelMes, faltan, hayMarcasEnMes, horasDelMes, limiteDe, pintar, ponerHoras, quitarMarca,
  restablecerMes, resumenMes, unir
} from '@/utils/registroHorario/jornada';

// Registro horario: cada persona genera el registro de jornada mensual (Word o PDF). Sus datos (perfil, calendario y
// firma) viven en SU navegador; el servidor solo hace el documento al pulsar «Generar» y no guarda nada.
export default {
  name: 'RegistroHorario-Component',
  components: { CalendarioRegistro, DialogoAltaRegistro, DialogoFirmaDibujoRegistro, DialogoFirmaFotoRegistro, DialogoHorasRegistro },
  data() {
    const hoy = hoyISO();
    const perfil = cargarPerfil();
    return {
      hoy,
      MESES,
      perfil: { ...perfil, horario: { manana: [...perfil.horario.manana], tarde: [...perfil.horario.tarde] } },
      marcas: cargarMarcas(),
      firma: cargarFirma(),
      empresas: null, // { localidad, empresas: [...] } cuando llega del servidor
      errorEmpresas: '',
      anio: Number(hoy.slice(0, 4)),
      mes: Number(hoy.slice(5, 7)),
      festivosPorAnio: {}, // { 2026: [AAAA-MM-DD, ...] }
      errorFestivos: false,
      hastaHoy: true,
      pincel: 'TARDE',
      dialogo: null, // { tipo: 'horas', fecha } | { tipo: 'alta' } | { tipo: 'dibujo' } | { tipo: 'foto', archivo }
      mensaje: null, // { tipo: 'ok' | 'error' | 'info', texto }
      generando: false
    };
  },
  computed: {
    listaEmpresas() {
      return this.empresas ? this.empresas.empresas : [];
    },
    hayEmpresas() {
      return this.listaEmpresas.length > 0;
    },
    empresa() {
      return this.listaEmpresas.find((e) => e.texto === this.perfil.empresa);
    },
    ctx() {
      return { festivos: new Set(this.festivosPorAnio[this.anio] || []), marcas: this.marcas, alta: this.perfil.fecha_alta || null };
    },
    limite() {
      return limiteDe(this.anio, this.mes, this.hastaHoy, this.hoy);
    },
    errorDeHorario() {
      return errorHorario(this.perfil.horario.manana, this.perfil.horario.tarde);
    },
    resumen() {
      return this.errorDeHorario
        ? { dias: 0, tardes: 0, minutos: 0 }
        : resumenMes(this.anio, this.mes, this.ctx, this.perfil.horario, this.limite);
    },
    falta() {
      return faltan(this.perfil, !!this.empresa, this.hayEmpresas, !!this.firma, this.perfil.horario, this.resumen);
    },
    esMesActual() {
      return this.anio === Number(this.hoy.slice(0, 4)) && this.mes === Number(this.hoy.slice(5, 7));
    },
    claseMensaje() {
      return `rh-aviso-${this.mensaje.tipo === 'ok' ? 'ok' : this.mensaje.tipo === 'error' ? 'error' : 'falta'}`;
    }
  },
  watch: {
    // ---- persistencia en el navegador
    perfil: { deep: true, handler(p) { guardarPerfil(p); } },
    marcas: { deep: true, handler(m) { guardarMarcas(m); } },
    firma(f) { guardarFirma(f); },
    // Con una sola empresa no hay nada que elegir; si la guardada ya no está en la lista, se borra
    empresas() { this.ajustarEmpresa(); },
    'perfil.empresa'() { this.ajustarEmpresa(); },
    anio: { immediate: true, handler(a) { this.cargarFestivos(a); } }
  },
  created() {
    obtenerEmpresas()
      .then((e) => { this.empresas = e; })
      .catch((e) => { this.errorEmpresas = e instanceof ErrorRegistroHorario ? e.message : 'No se pudieron cargar las empresas.'; });
  },
  methods: {
    corta,
    iso,
    fmtHoras,
    unir,
    estadoDe,
    ajustarEmpresa() {
      if (!this.empresas) return;
      const textos = this.listaEmpresas.map((e) => e.texto);
      if (this.perfil.empresa && !textos.includes(this.perfil.empresa)) this.perfil.empresa = '';
      else if (!this.perfil.empresa && textos.length === 1) this.perfil.empresa = textos[0];
    },
    cargarFestivos(anio) {
      if (this.festivosPorAnio[anio]) return;
      obtenerFestivos(anio)
        .then((f) => { this.festivosPorAnio = { ...this.festivosPorAnio, [anio]: f }; this.errorFestivos = false; })
        .catch(() => { this.errorFestivos = true; });
    },
    // ---- acciones
    cambiarMes(delta) {
      const m = this.mes + delta;
      this.anio = this.anio + Math.floor((m - 1) / 12);
      this.mes = ((m - 1 + 12) % 12) + 1;
    },
    irAHoy() {
      this.anio = Number(this.hoy.slice(0, 4));
      this.mes = Number(this.hoy.slice(5, 7));
    },
    pintarDia(fecha, estado) {
      this.marcas = pintar(this.marcas, fecha, estado, this.ctx);
    },
    quitarDia(fecha) {
      this.marcas = quitarMarca(this.marcas, fecha);
    },
    pedirHoras(fecha) {
      const est = estadoDe(fecha, this.ctx);
      if (this.perfil.fecha_alta && fecha < this.perfil.fecha_alta) {
        this.mensaje = { tipo: 'info', texto: 'Ese día es anterior a tu fecha de alta, así que sale en blanco.' };
        return;
      }
      if (est !== 'MANANA' && est !== 'TARDE') {
        this.mensaje = { tipo: 'info', texto: 'Ese día no se trabaja. Márcalo antes como «Solo mañana» o «Mañana y tarde» para poder poner sus horas.' };
        return;
      }
      if (this.errorDeHorario) {
        this.mensaje = { tipo: 'error', texto: `Corrige antes tu horario habitual. ${this.errorDeHorario}` };
        return;
      }
      this.mensaje = null;
      this.dialogo = { tipo: 'horas', fecha };
    },
    guardarHoras(horas) {
      this.marcas = ponerHoras(this.marcas, this.dialogo.fecha, horas, this.perfil.horario);
      this.dialogo = null;
    },
    horasHabituales() {
      const fecha = this.dialogo.fecha;
      this.marcas = { ...this.marcas, horas: Object.fromEntries(Object.entries(this.marcas.horas).filter(([k]) => k !== fecha)) };
      this.dialogo = null;
    },
    guardarAlta(fecha) {
      this.perfil.fecha_alta = fecha;
      this.dialogo = null;
    },
    restablecer() {
      if (!hayMarcasEnMes(this.marcas, this.anio, this.mes)) return;
      if (window.confirm(`Se borrarán las marcas y las horas propias de ${MESES[this.mes - 1].toLowerCase()} ${this.anio}. ¿Continuar?`)) {
        this.marcas = restablecerMes(this.marcas, this.anio, this.mes);
      }
    },
    elegirImagen(e) {
      const archivo = e.target.files && e.target.files[0];
      e.target.value = ''; // permite elegir el mismo archivo otra vez
      if (archivo) this.dialogo = { tipo: 'foto', archivo };
    },
    usarFirma(dataUrl) {
      this.firma = dataUrl;
      this.dialogo = null;
    },
    async generar(formato) {
      if (this.falta.length || !this.firma) return;
      this.generando = true;
      this.mensaje = null;
      try {
        const doc = await generarDocumento({
          anio: this.anio,
          mes: this.mes,
          trabajador: this.perfil.trabajador,
          nif: this.perfil.nif,
          num_afiliacion: this.perfil.num_afiliacion,
          empresa: this.perfil.empresa,
          horario: this.perfil.horario,
          estado_dias: estadoDiasDelMes(this.anio, this.mes, this.ctx, this.limite),
          horas_dia: horasDelMes(this.anio, this.mes, this.marcas),
          firma_png_base64: this.firma.split(',')[1],
          fecha_firma: this.limite ? this.hoy : 'ultimo_dia',
          formato
        });
        descargar(doc.blob, doc.nombre);
        this.mensaje = {
          tipo: 'ok',
          texto: `Documento generado${this.limite ? ` (rellenado hasta el ${Number(this.limite.slice(8))})` : ''}: ${doc.dias} días · ${doc.horas} Se ha descargado como ${doc.nombre}.`
        };
      } catch (e) {
        this.mensaje = { tipo: 'error', texto: e instanceof ErrorRegistroHorario ? e.message : 'No se pudo generar el documento.' };
      } finally {
        this.generando = false;
      }
    }
  }
};
</script>
