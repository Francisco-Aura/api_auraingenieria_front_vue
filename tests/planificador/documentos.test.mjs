import test from 'node:test'
import assert from 'node:assert/strict'
import { withoutDatePrefix, projectLabelOf, shortCompany, suggestedPlace, folderBase, relativoABase } from '../../src/utils/planificador/documentos/carpetas.js'
import { extensionOf, withExtension, suggestFileName } from '../../src/utils/planificador/documentos/nombresArchivo.js'
import { PARTE_VACIA, ETIQUETAS_PARTE, kwSugeridos, datosQueFaltan } from '../../src/utils/planificador/contratos/partes.js'

test('los nombres de carpeta de Dropbox salen como en el Planificador actual', () => {
  assert.equal(withoutDatePrefix('260201_BONAQUIA'), 'BONAQUIA')
  assert.equal(projectLabelOf('/AURA/02_TRABAJOS/2026/260202_ALPEMA_PUNTA BALLENA/'), 'ALPEMA_PUNTA BALLENA')
  assert.equal(shortCompany('BONAQUIA, S.L. (CAMPING DEL AGUA)'), 'BONAQUIA')
  assert.equal(shortCompany('Aura Renovables S.L.U.'), 'AURA RENOVABLES')
  assert.equal(suggestedPlace('BONAQUIA, S.L. (camping del agua)'), 'CAMPING DEL AGUA')
  assert.equal(suggestedPlace('SIN PARENTESIS'), '')
  assert.equal(folderBase(' alpema ', 'punta  ballena'), 'ALPEMA_PUNTA BALLENA')
  assert.equal(folderBase('ALPEMA', ''), 'ALPEMA')
  assert.equal(relativoABase('/A/B/2026/x', '/A/B'), '2026/x')
  assert.equal(relativoABase('/otra/ruta', '/A/B'), '/otra/ruta')
})

test('el nombre propuesto para un archivo sale del documento requerido', () => {
  assert.equal(extensionOf('informe.final.pdf'), '.pdf')
  assert.equal(extensionOf('sin_extension'), '')
  assert.equal(withExtension('Factura 12', 'scan.pdf'), 'Factura 12.pdf')
  assert.equal(withExtension('Factura 12.png', 'scan.pdf'), 'Factura 12.png')
  const base = { projectLabel: 'ALPEMA_PUNTA BALLENA', existing: 0 }
  assert.equal(suggestFileName({ ...base, requirement: '', original: 'x.pdf' }), 'x.pdf', 'otra documentación conserva el nombre original')
  assert.equal(suggestFileName({ ...base, requirement: 'Contrato firmado', original: 'x.pdf' }), 'CONTRATO INSTALACION FV_AURA RENOVABLES_ALPEMA_PUNTA BALLENA firmado.pdf')
  assert.equal(suggestFileName({ ...base, requirement: 'Albarán de entrega (mínimo 1)', original: 'a.jpg' }), 'Albarán de entrega.jpg')
  assert.equal(suggestFileName({ ...base, requirement: 'Fotos de paneles', original: 'a.jpg' }), 'Fotos de paneles 1.jpg')
  assert.equal(suggestFileName({ ...base, existing: 2, requirement: 'Albarán', original: 'a.pdf' }), 'Albarán 3.pdf')
})

test('qué falta para generar el contrato: datos de las partes y del contrato inicial', () => {
  assert.equal(Object.keys(ETIQUETAS_PARTE).length, 8)
  const todo = { empresa: 'X', cif: '1', domicilio: 'd', representante: 'r', dni: '1', cubierta_de: 'nave', instalacion: 'i', kw_nominal: '20' }
  const contrato = { potencia_kwp: '22,5', importe_total: '1000', paneles_uds: '4', paneles_modelo: 'M', inversor_uds: '1', inversor_modelo: 'Huawei 20KTL', estructura: 'E' }
  assert.deepEqual(datosQueFaltan(todo, contrato), [])
  assert.equal(datosQueFaltan(PARTE_VACIA, {}).length, 15, '8 datos de las partes y 7 del contrato inicial')
})

test('los kW nominales se sugieren del modelo del inversor y sus unidades', () => {
  assert.equal(kwSugeridos({ inversor_modelo: 'Huawei SUN2000-50KTL', inversor_uds: '2' }), '100')
  assert.equal(kwSugeridos({ inversor_modelo: 'sin potencia' }), '')
  // Con la potencia sugerida, la nominal no cuenta como dato que falta
  const contrato = { inversor_modelo: 'Huawei 20KTL', inversor_uds: '1' }
  assert.ok(!datosQueFaltan({ ...PARTE_VACIA, empresa: 'X' }, contrato).includes('Potencia nominal (kW)'))
})
