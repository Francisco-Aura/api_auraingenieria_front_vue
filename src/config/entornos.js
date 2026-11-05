// Direcciones (host, con el puerto si lo lleva) desde las que se abre la intranet en los entornos donde el Planificador
// NO debe estar disponible. En PRO se entra sin puerto; DES y PRE usan otros, así que no coinciden.
export const HOSTS_SIN_PLANIFICADOR = ['5.34.148.92'];

export const planificadorDisponible = () => !HOSTS_SIN_PLANIFICADOR.includes(window.location.host);
