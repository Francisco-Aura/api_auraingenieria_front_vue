# Planificador (página propia dentro del front de la intranet)

- Se compila con el resto: `npm run build` genera `dist/planificador/index.html` además de la intranet (ver `pages` en `vue.config.js`).
- La intranet lo enseña en un marco (`src/components/PlanificadorComponent.vue`, dirección `/planificador/`), como antes: así sus estilos
  (copiados del Planificador anterior) no se mezclan con los de la intranet.
- Código: `src/components/CRM_Module/Planificador/`, `src/utils/planificador/`, `src/styles/planificador/`, `src/services/planificadorApi.js`
  y `src/services/usuarioActual.js` (el usuario viaja en cabeceras, igual que en la intranet).
- API: `/api/planificador/…`, del módulo Planificador del backend de la intranet (carpeta `modulo_planificador`).
- Pruebas de las reglas: `npm run test:planificador` (146).
- Servidor: nginx debe servir `/planificador/` desde el `dist` del front (ya no del servicio Python) y mandar `/api/` al backend de la intranet.
