// Interruptor del Workmeter (cronómetro de tareas y todo lo que se le añada en la web).
// Solo está activo en local: se enciende con VUE_APP_WORKMETER=true en .env.development.local (git lo ignora).
// Los pipelines de DES, PRE y PRO no lo definen, así que ahí nada del Workmeter se ve.
// REGLA: todo lo nuevo del Workmeter en la web (pantallas, columnas, botones, rutas) va detrás de esta constante.
export const WORKMETER_ACTIVO = process.env.VUE_APP_WORKMETER === 'true'
