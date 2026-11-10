// Datos de las partes y del lugar del contrato (equivale a lo que exportaba ContractGenerator.tsx): sin pantalla.

import { inverterKw, parseNumber } from '../motor/reglasContrato.js'

/** Datos de las partes y del lugar que no vienen en el presupuesto (o que conviene revisar). */
export const PARTE_VACIA = { empresa: '', cif: '', domicilio: '', representante: '', dni: '', cubierta_de: '', instalacion: '', kw_nominal: '' }

// El orden es el de la pantalla: las parejas comparten fila y «Domicilio» e «Instalación» ocupan una entera.
export const ETIQUETAS_PARTE = {
  empresa: 'Empresa promotora',
  cif: 'CIF',
  domicilio: 'Domicilio social',
  representante: 'Representante legal',
  dni: 'DNI del representante',
  instalacion: 'Dirección de la instalación',
  cubierta_de: 'Cubierta de… (nave, gasolinera…)',
  kw_nominal: 'Potencia nominal (kW)'
}

// Datos del contrato inicial (los del presupuesto) que también hacen falta para generar el contrato.
export const DATOS_OBLIGATORIOS_DEL_CONTRATO = [
  ['potencia_kwp', 'Potencia total (kWp)'],
  ['importe_total', 'Importe total'],
  ['paneles_uds', 'Paneles (unidades)'],
  ['paneles_modelo', 'Paneles (modelo)'],
  ['inversor_uds', 'Inversor (unidades)'],
  ['inversor_modelo', 'Inversor (modelo)'],
  ['estructura', 'Estructura']
]

/** kW nominales sugeridos: los del modelo del inversor por sus unidades, si el modelo los indica (p. ej. 50KTL → 50). */
export function kwSugeridos(contrato) {
  const kw = inverterKw(contrato.inversor_modelo)
  const unidades = parseNumber(contrato.inversor_uds) ?? 1
  return kw ? String(Math.round(kw * unidades * 100) / 100).replace('.', ',') : ''
}

/** Lo que falta para poder generar el contrato: los datos de las partes (la potencia nominal vale con la sugerida) y los del contrato inicial. */
export function datosQueFaltan(parte, contrato) {
  const valor = (clave) => (clave === 'kw_nominal' ? parte.kw_nominal || kwSugeridos(contrato) : parte[clave])
  return [
    ...Object.keys(ETIQUETAS_PARTE).filter((k) => !String(valor(k) ?? '').trim()).map((k) => ETIQUETAS_PARTE[k]),
    ...DATOS_OBLIGATORIOS_DEL_CONTRATO.filter(([clave]) => !String(contrato[clave] ?? '').trim()).map(([, etiqueta]) => etiqueta)
  ]
}
