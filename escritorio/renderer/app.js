// Lógica del widget. Habla con la API de la intranet a través del proceso principal (window.workmeeter).
(() => {
  'use strict';

  const api = window.workmeeter;
  const $ = id => document.getElementById(id);

  const REFRESCO_MS = 30000;

  const estado = {
    config: null,
    usuario: null,
    estados: [],        // estados del módulo de tareas
    tareas: [],         // tareas del usuario no finalizadas, con `_base` (s) y `_recibida` (ms) para el cronómetro
    ocupado: false,     // hay un cambio de estado en marcha
    vistaAnterior: 'login',
    avisoTimer: null,
    confirmarFin: null
  };

  // ---------- Utilidades ----------

  function formatoTiempo(segundos) {
    const s = Math.max(0, Math.floor(segundos));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return [h, m, r].map(n => String(n).padStart(2, '0')).join(':');
  }

  function formatoCorto(segundos) {
    const s = Math.max(0, Math.floor(segundos));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
  }

  function mostrarAviso(texto, ms = 5000) {
    const el = $('aviso');
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(estado.avisoTimer);
    estado.avisoTimer = setTimeout(() => { el.hidden = true; }, ms);
  }

  function ocultarAviso() {
    clearTimeout(estado.avisoTimer);
    $('aviso').hidden = true;
  }

  function mostrarVista(nombre) {
    for (const id of ['login', 'principal', 'ajustes']) $(`vista-${id}`).hidden = id !== nombre;
    if (nombre !== 'ajustes') estado.vistaAnterior = nombre;
  }

  // Convierte una respuesta fallida en un mensaje legible.
  function mensajeError(resp, porDefecto) {
    if (resp.error) return resp.error;
    const d = resp.datos;
    if (d && typeof d === 'object' && (d.error || d.message)) return d.error || d.message;
    if (typeof d === 'string' && d.length < 140) return d;
    return `${porDefecto} (error ${resp.estado})`;
  }

  // ---------- Estados de las tareas ----------

  const estadoQueCuenta = () => estado.estados.find(e => e.cuentaTiempo && !e.estadoFinal);
  const estadoFinal = () => estado.estados.find(e => e.estadoFinal);
  // «Pausar» devuelve la tarea al estado de espera (el que ni cuenta tiempo, ni bloquea, ni cierra).
  const estadoEspera = () => estado.estados.find(e => !e.cuentaTiempo && !e.estadoBloqueo && !e.estadoFinal);

  const estaCorriendo = t => !!estado.estados.find(e => e.id === t.estadoId && e.cuentaTiempo);

  function segundosActuales(t) {
    const base = t._base || 0;
    return estaCorriendo(t) ? base + (Date.now() - t._recibida) / 1000 : base;
  }

  // ---------- Carga de datos ----------

  async function cargarEstados() {
    const r = await api.api('GET', '/tareas/estados');
    if (!r.ok) throw new Error(mensajeError(r, 'No se pudieron cargar los estados'));
    estado.estados = Array.isArray(r.datos) ? r.datos : [];
    if (!estadoQueCuenta()) throw new Error('El módulo de tareas no tiene un estado que cuente tiempo');
  }

  async function cargarTareas({ silencioso = false } = {}) {
    if (!estado.usuario) return;
    const r = await api.api('GET', `/tareas/usuario/${estado.usuario.id}`);
    if (!r.ok) {
      if (!silencioso) mostrarAviso(mensajeError(r, 'No se pudieron cargar las tareas'));
      return;
    }
    const ahora = Date.now();
    estado.tareas = (Array.isArray(r.datos) ? r.datos : [])
      .filter(t => !t.estadoFinal)
      .map(t => ({ ...t, _base: t.duracionActivaSegundos || 0, _recibida: ahora }));
    if (!silencioso) ocultarAviso();
    pintar();
  }

  // ---------- Acciones ----------

  async function cambiarEstado(tarea, destino) {
    const r = await api.api('PATCH', `/tareas/${tarea.id}/estado`, {
      estadoId: destino.id,
      usuarioAccionId: estado.usuario.id
    });
    if (!r.ok) throw new Error(mensajeError(r, 'No se pudo cambiar el estado'));
  }

  async function ejecutar(accion) {
    if (estado.ocupado) return;
    estado.ocupado = true;
    pintar();
    try {
      await accion();
    } catch (e) {
      mostrarAviso(e.message || String(e));
    } finally {
      estado.ocupado = false;
      await cargarTareas({ silencioso: true });
    }
  }

  const tareaEnCurso = () => estado.tareas.find(estaCorriendo);

  function iniciar(tarea) {
    return ejecutar(async () => {
      // Un solo cronómetro a la vez: la que estuviera en curso pasa a espera.
      const otra = tareaEnCurso();
      if (otra && otra.id !== tarea.id) {
        const espera = estadoEspera();
        if (!espera) throw new Error('No hay un estado de espera al que pasar la tarea en curso');
        await cambiarEstado(otra, espera);
      }
      await cambiarEstado(tarea, estadoQueCuenta());
    });
  }

  function pausar(tarea) {
    return ejecutar(async () => {
      const espera = estadoEspera();
      if (!espera) throw new Error('No hay un estado de espera al que pasar la tarea');
      await cambiarEstado(tarea, espera);
    });
  }

  function finalizar(tarea) {
    return ejecutar(async () => {
      const fin = estadoFinal();
      if (!fin) throw new Error('No hay un estado final en el módulo de tareas');
      await cambiarEstado(tarea, fin);
    });
  }

  // ---------- Pintado ----------

  function textoVencimiento(t) {
    if (!t.fechaVencimiento) return '';
    const f = new Date(t.fechaVencimiento);
    if (isNaN(f)) return '';
    const txt = f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    return t.vencida ? `<span class="vencida">Vencida ${txt}</span>` : `Vence ${txt}`;
  }

  function escapar(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function ordenar(tareas) {
    return [...tareas].sort((a, b) => {
      if (estaCorriendo(a) !== estaCorriendo(b)) return estaCorriendo(a) ? -1 : 1;
      if ((a.prioridad ?? 2) !== (b.prioridad ?? 2)) return (a.prioridad ?? 2) - (b.prioridad ?? 2);
      const va = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity;
      const vb = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity;
      return va - vb;
    });
  }

  function pintar() {
    const enCurso = tareaEnCurso();

    $('punto').classList.toggle('activo', !!enCurso);
    $('actual').classList.toggle('corriendo', !!enCurso);
    $('actual-botones').hidden = !enCurso;
    if (enCurso) {
      $('actual-etiqueta').textContent = 'En curso';
      $('actual-titulo').textContent = enCurso.titulo;
      $('actual-titulo').title = enCurso.titulo;
    } else {
      $('actual-etiqueta').textContent = 'Sin tarea en curso';
      $('actual-titulo').textContent = 'Pulsa ▶ en una tarea para empezar';
      $('actual-titulo').title = '';
    }
    $('btn-pausar').disabled = estado.ocupado;
    $('btn-finalizar').disabled = estado.ocupado;
    $('btn-finalizar').textContent = estado.confirmarFin === (enCurso && enCurso.id) ? '¿Seguro?' : 'Finalizar';

    const filtro = $('filtro').value.trim().toLowerCase();
    const visibles = ordenar(estado.tareas).filter(t =>
      !filtro || [t.titulo, t.clienteRelacionadoNombre, t.clientePotencialNombre, t.categoriaNombre]
        .some(v => v && String(v).toLowerCase().includes(filtro)));

    const lista = $('lista');
    if (!visibles.length) {
      lista.innerHTML = `<li class="vacio">${estado.tareas.length ? 'Ninguna tarea coincide.' : 'No tienes tareas pendientes.'}</li>`;
    } else {
      lista.innerHTML = visibles.map(t => {
        const corriendo = estaCorriendo(t);
        const cliente = t.clienteRelacionadoNombre || t.clientePotencialNombre || '';
        // El vencimiento va primero: es lo que no debe quedar cortado en una línea estrecha.
        const meta = [textoVencimiento(t), escapar(t.estadoNombre), cliente && escapar(cliente)].filter(Boolean).join(' · ');
        return `
          <li class="tarea${corriendo ? ' corriendo' : ''}" data-id="${t.id}" style="--color:${escapar(t.estadoColor || '')}">
            <div class="tarea-info">
              <div class="tarea-titulo" title="${escapar(t.titulo)}">${escapar(t.titulo)}</div>
              <div class="tarea-meta">${meta}</div>
            </div>
            <span class="tarea-tiempo" data-tiempo="${t.id}">${formatoCorto(segundosActuales(t))}</span>
            <button class="btn-play${corriendo ? ' parar' : ''}" data-accion="${corriendo ? 'pausar' : 'iniciar'}"
              title="${corriendo ? 'Pausar' : 'Iniciar cronómetro'}" ${estado.ocupado ? 'disabled' : ''}>${corriendo ? '❚❚' : '▶'}</button>
          </li>`;
      }).join('');
    }
    pintarCronometro();
  }

  // Se llama cada segundo: solo toca los textos que cambian.
  function pintarCronometro() {
    const enCurso = tareaEnCurso();
    $('cronometro').textContent = formatoTiempo(enCurso ? segundosActuales(enCurso) : 0);
    for (const t of estado.tareas) {
      const el = document.querySelector(`[data-tiempo="${t.id}"]`);
      if (el) el.textContent = formatoCorto(segundosActuales(t));
    }
  }

  // ---------- Sesión ----------

  function ponerUsuario(usuario) {
    estado.usuario = usuario;
    $('usuario').textContent = usuario ? usuario.nombre : '';
  }

  async function entrarEnPrincipal() {
    mostrarVista('principal');
    try {
      await cargarEstados();
      await cargarTareas();
    } catch (e) {
      mostrarAviso(e.message || String(e), 8000);
    }
  }

  async function iniciarSesion(ev) {
    ev.preventDefault();
    const boton = $('login-enviar');
    boton.disabled = true;
    boton.textContent = 'Entrando…';
    ocultarAviso();
    try {
      const q = `user=${encodeURIComponent($('login-usuario').value.trim())}&pass=${encodeURIComponent($('login-clave').value)}`;
      const r = await api.api('GET', `/usuarios/login?${q}`);
      if (r.ok && r.datos && r.datos.id != null) {
        $('login-clave').value = '';
        const usuario = r.datos;
        await api.guardarSesion(usuario);
        ponerUsuario(usuario);
        await entrarEnPrincipal();
      } else if (r.estado === 401) {
        mostrarAviso('Usuario o contraseña incorrectos');
      } else {
        mostrarAviso(mensajeError(r, 'No se pudo iniciar sesión'));
      }
    } finally {
      boton.disabled = false;
      boton.textContent = 'Entrar';
    }
  }

  async function cerrarSesion() {
    await api.guardarSesion(null);
    ponerUsuario(null);
    estado.tareas = [];
    pintar();
    mostrarVista('login');
  }

  // ---------- Ajustes ----------

  function abrirAjustes() {
    $('ajustes-servidor').value = estado.config.servidor;
    $('btn-cerrar-sesion').hidden = !estado.usuario;
    mostrarVista('ajustes');
  }

  async function guardarAjustes(ev) {
    ev.preventDefault();
    const r = await api.guardarServidor($('ajustes-servidor').value);
    if (!r.ok) return mostrarAviso(r.error);
    estado.config.servidor = r.servidor;
    $('login-servidor').textContent = r.servidor;
    ocultarAviso();
    mostrarVista(estado.vistaAnterior);
    if (estado.usuario) entrarEnPrincipal();
  }

  // ---------- Vista compacta ----------

  function aplicarCompacto(compacto) {
    $('widget').classList.toggle('compacto', !!compacto);
    estado.config.compacto = !!compacto;
  }

  // ---------- Arranque ----------

  async function init() {
    estado.config = await api.leerConfig();
    $('login-servidor').textContent = estado.config.servidor;
    $('version').textContent = `Workmeeter ${estado.config.version}`;
    aplicarCompacto(estado.config.compacto);

    // Eventos
    $('form-login').addEventListener('submit', iniciarSesion);
    $('login-cambiar').addEventListener('click', ev => { ev.preventDefault(); abrirAjustes(); });
    $('btn-ajustes').addEventListener('click', abrirAjustes);
    $('ajustes-volver').addEventListener('click', () => mostrarVista(estado.vistaAnterior));
    $('form-ajustes').addEventListener('submit', guardarAjustes);
    $('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
    $('btn-salir').addEventListener('click', () => api.salir());
    $('btn-ocultar').addEventListener('click', () => api.ocultar());
    $('btn-compacto').addEventListener('click', () => {
      aplicarCompacto(!estado.config.compacto);
      api.fijarCompacto(estado.config.compacto);
    });
    api.alCambiarCompacto(aplicarCompacto);

    $('btn-refrescar').addEventListener('click', () => cargarTareas());
    $('filtro').addEventListener('input', pintar);

    $('lista').addEventListener('click', ev => {
      const boton = ev.target.closest('button[data-accion]');
      if (!boton) return;
      const tarea = estado.tareas.find(t => String(t.id) === boton.closest('.tarea').dataset.id);
      if (!tarea) return;
      boton.dataset.accion === 'iniciar' ? iniciar(tarea) : pausar(tarea);
    });

    $('btn-pausar').addEventListener('click', () => { const t = tareaEnCurso(); if (t) pausar(t); });
    $('btn-finalizar').addEventListener('click', () => {
      const t = tareaEnCurso();
      if (!t) return;
      // Doble pulsación para no cerrar una tarea por error.
      if (estado.confirmarFin === t.id) {
        estado.confirmarFin = null;
        finalizar(t);
      } else {
        estado.confirmarFin = t.id;
        pintar();
        setTimeout(() => { if (estado.confirmarFin === t.id) { estado.confirmarFin = null; pintar(); } }, 3000);
      }
    });

    // Cronómetro y refresco periódico (los cambios hechos desde la intranet también se ven aquí).
    setInterval(pintarCronometro, 1000);
    setInterval(() => { if (estado.usuario && !estado.ocupado) cargarTareas({ silencioso: true }); }, REFRESCO_MS);
    window.addEventListener('focus', () => { if (estado.usuario && !estado.ocupado) cargarTareas({ silencioso: true }); });

    if (estado.config.usuario && estado.config.usuario.id != null) {
      ponerUsuario(estado.config.usuario);
      await entrarEnPrincipal();
    } else {
      mostrarVista('login');
    }
  }

  init();
})();
