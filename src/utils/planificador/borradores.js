// Borradores de proyecto compartidos: cómo decir cuándo se guardó uno.

/** «hoy 10:32» o «26/10 10:32». */
export function horaBorrador(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hm = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const hoy = new Date()
  const mismoDia = d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate()
  return mismoDia ? `hoy ${hm}` : `${d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} ${hm}`
}
