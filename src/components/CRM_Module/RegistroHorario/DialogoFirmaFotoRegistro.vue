<template>
  <DialogoRegistro titulo="Tu firma, sin el fondo" @cerrar="$emit('cerrar')">
    <p class="rh-nota">Se separa la firma del papel. Así se verá en el documento (fondo transparente).</p>
    <div class="rh-vista-firma" aria-live="polite">
      <img v-if="vista" :src="vista" alt="Vista previa de la firma sin fondo" />
      <span v-else>{{ mensaje }}</span>
    </div>
    <div class="rh-campo">
      <label for="rh-sensibilidad">Sensibilidad</label>
      <input id="rh-sensibilidad" v-model.number="sensibilidad" type="range" min="0" max="100" />
      <span class="rh-nota">Súbela si faltan trazos finos; bájala si aparecen manchas.</span>
    </div>
    <p v-if="errorFinal" class="rh-aviso rh-aviso-error" role="alert">{{ errorFinal }}</p>
    <div class="rh-fila-botones">
      <button type="button" class="rh-btn" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" class="rh-btn rh-btn-primario rh-empuja" :disabled="!vista || ocupado" @click="usar">
        {{ ocupado ? 'Preparando…' : 'Usar esta firma' }}
      </button>
    </div>
  </DialogoRegistro>
</template>

<script>
import DialogoRegistro from './DialogoRegistro.vue';
import { ErrorRegistroHorario, extraerFirma } from '@/services/registroHorarioApi';

const LADO_VISTA = 640; // la vista previa usa una versión ligera, como el programa de escritorio
const LADO_FINAL = 1400;

// La imagen reducida a `lado` px (con la orientación de la foto corregida). Un PNG sigue siendo PNG para no perder la transparencia.
function reducir(imagen, lado, png) {
  const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(imagen.width * escala));
  c.height = Math.max(1, Math.round(imagen.height * escala));
  c.getContext('2d').drawImage(imagen, 0, 0, c.width, c.height);
  return new Promise((ok, fallo) => c.toBlob((b) => (b ? ok(b) : fallo(new Error('toBlob'))), png ? 'image/png' : 'image/jpeg', 0.9));
}

const aDataUrl = (blob) =>
  new Promise((ok, fallo) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fallo(r.error);
    r.readAsDataURL(blob);
  });

// Quita el fondo de la foto de una firma y deja elegir la sensibilidad. La separación de la tinta la hace el servidor.
export default {
  name: 'DialogoFirmaFotoRegistro',
  components: { DialogoRegistro },
  props: { archivo: { type: File, required: true } },
  emits: ['usar', 'cerrar'],
  data() {
    return { sensibilidad: 50, vista: null, mensaje: 'Preparando la imagen…', ocupado: false, errorFinal: '', lista: false };
  },
  computed: {
    esPng() {
      return this.archivo.type === 'image/png';
    }
  },
  watch: {
    sensibilidad() {
      this.pedirVista();
    }
  },
  created() {
    this.vivo = true;
    this.imagen = null;
    this.ligera = null;
    this.control = null;
    this.espera = null;
  },
  mounted() {
    createImageBitmap(this.archivo, { imageOrientation: 'from-image' })
      .then(async (b) => {
        if (!this.vivo) return;
        this.imagen = b;
        this.ligera = await reducir(b, LADO_VISTA, this.esPng);
        if (this.vivo) {
          this.lista = true;
          this.pedirVista();
        }
      })
      .catch(() => {
        if (this.vivo) this.mensaje = 'No se pudo leer la imagen. Usa un PNG o un JPG.';
      });
  },
  beforeUnmount() {
    this.vivo = false;
    clearTimeout(this.espera);
    if (this.control) this.control.abort();
    if (this.imagen) this.imagen.close();
    if (this.vista) URL.revokeObjectURL(this.vista);
  },
  methods: {
    // Vista previa: tras mover el control se espera un momento para no pedir al servidor a cada paso
    pedirVista() {
      if (!this.lista || !this.ligera) return;
      clearTimeout(this.espera);
      if (this.control) this.control.abort();
      const control = new AbortController();
      this.control = control;
      this.espera = setTimeout(async () => {
        try {
          const res = await extraerFirma(this.ligera, this.sensibilidad / 100, true, control.signal);
          if (!this.vivo || control.signal.aborted) return;
          if (this.vista) URL.revokeObjectURL(this.vista);
          this.vista = URL.createObjectURL(res);
        } catch (e) {
          if (!this.vivo || control.signal.aborted || (e && (e.name === 'CanceledError' || e.name === 'AbortError'))) return;
          if (this.vista) URL.revokeObjectURL(this.vista);
          this.vista = null;
          this.mensaje = e instanceof ErrorRegistroHorario ? e.message : 'No se pudo preparar la vista previa.';
        }
      }, 200);
    },
    async usar() {
      if (!this.imagen) return;
      this.ocupado = true;
      this.errorFinal = '';
      try {
        const completa = await reducir(this.imagen, LADO_FINAL, this.esPng);
        this.$emit('usar', await aDataUrl(await extraerFirma(completa, this.sensibilidad / 100, false)));
      } catch (e) {
        this.errorFinal = e instanceof ErrorRegistroHorario ? e.message : 'No se pudo preparar la firma.';
      } finally {
        this.ocupado = false;
      }
    }
  }
};
</script>
