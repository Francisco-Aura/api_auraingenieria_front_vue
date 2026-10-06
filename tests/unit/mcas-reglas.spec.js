const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');

const modulo = pathToFileURL(path.resolve(__dirname, '..', '..', 'src/components/CRM_Module/MCAS/mcasReglas.js')).href;
const cargar = () => import(modulo);

test('las condiciones de una regla real se leen en el formulario y se vuelven a escribir igual', async () => {
  const { leerCondiciones, escribirCondiciones } = await cargar();
  const json = '{"tipo_suministro":"LUZ","segmento":"PYME","codigo_producto":"PLAN_PERSONALIZADO","es_renovacion":false}';
  const { form, extras, error } = leerCondiciones(json);
  assert.equal(error, null);
  assert.equal(form.tipo_suministro, 'LUZ');
  assert.equal(form.segmento, 'PYME');
  assert.equal(form.es_renovacion, 'false');
  assert.equal(form.codigo_producto, 'PLAN_PERSONALIZADO');
  assert.deepEqual(extras, {});
  assert.deepEqual(JSON.parse(escribirCondiciones(form, extras)), JSON.parse(json));
});

test('los valores en minúsculas se ajustan a las opciones del desplegable (el motor no distingue mayúsculas)', async () => {
  const { leerCondiciones } = await cargar();
  const { form } = leerCondiciones('{"tipo_suministro":"luz","segmento":"Pyme","tipo_renovacion":"tacita","codigo_producto":"plan_x"}');
  assert.equal(form.tipo_suministro, 'LUZ');
  assert.equal(form.segmento, 'PYME');
  assert.equal(form.tipo_renovacion, 'TACITA');
  assert.equal(form.codigo_producto, 'plan_x');
});

test('un formulario sin condiciones significa "todos los contratos" (null)', async () => {
  const { condicionesVacias, escribirCondiciones } = await cargar();
  assert.equal(escribirCondiciones(condicionesVacias()), null);
});

test('los rangos respetan los límites por defecto del motor (mínimo incluido, máximo excluido)', async () => {
  const { leerCondiciones, escribirCondiciones, condicionesVacias } = await cargar();
  const form = { ...condicionesVacias(), consumoMin: 50000, consumoMax: 150000 };
  assert.deepEqual(JSON.parse(escribirCondiciones(form)), { consumo_min_kwh: 50000, consumo_max_kwh: 150000 });

  const inverso = { ...form, consumoMinInc: false, consumoMaxInc: true, consumoUnidad: 'mwh' };
  const json = escribirCondiciones(inverso);
  assert.deepEqual(JSON.parse(json), {
    consumo_min_mwh: 50000, consumo_min_mwh_inc: false, consumo_max_mwh: 150000, consumo_max_mwh_inc: true,
  });
  const leido = leerCondiciones(json).form;
  assert.equal(leido.consumoUnidad, 'mwh');
  assert.equal(leido.consumoMinInc, false);
  assert.equal(leido.consumoMaxInc, true);
});

test('las condiciones que el formulario no representa se conservan al guardar', async () => {
  const { leerCondiciones, escribirCondiciones } = await cargar();
  const { form, extras } = leerCondiciones('{"segmento":"PYME","consumo_min_kwh":1,"consumo_min_mwh":5,"otra_clave":"x"}');
  assert.deepEqual(extras, { consumo_min_mwh: 5, otra_clave: 'x' });
  assert.deepEqual(JSON.parse(escribirCondiciones(form, extras)),
    { segmento: 'PYME', consumo_min_kwh: 1, consumo_min_mwh: 5, otra_clave: 'x' });
});

test('un JSON de condiciones no válido se detecta en lugar de perderse', async () => {
  const { leerCondiciones } = await cargar();
  assert.match(leerCondiciones('{"segmento":').error, /no son un objeto JSON válido/);
  assert.match(leerCondiciones('[1,2]').error, /no son un objeto JSON válido/);
});

test('el tipo de renovación solo convive con "solo renovaciones"', async () => {
  const { condicionesVacias, normalizarCondiciones } = await cargar();
  const form = { ...condicionesVacias(), tipo_renovacion: 'TACITA' };
  normalizarCondiciones(form, 'tipo_renovacion');
  assert.equal(form.es_renovacion, 'true');
  form.es_renovacion = 'false';
  normalizarCondiciones(form, 'es_renovacion');
  assert.equal(form.tipo_renovacion, '');
});

test('el porcentaje del FEE se muestra en % y se guarda como factor, sin errores de redondeo', async () => {
  const { leerCalculo, escribirCalculo } = await cargar();
  const { form } = leerCalculo('FEE_PERCENTAGE', '{"porcentaje_aplicacion_fee":0.29,"fee_minimo_eur_mwh":5}');
  assert.equal(form.porcentaje, 29);
  assert.equal(form.feeMinimo, 5);
  assert.deepEqual(JSON.parse(escribirCalculo('FEE_PERCENTAGE', { ...form, porcentaje: 44 })),
    { porcentaje_aplicacion_fee: 0.44, fee_minimo_eur_mwh: 5 });
});

test('cada método escribe exactamente los parámetros que lee el motor', async () => {
  const { escribirCalculo, calculoVacio } = await cargar();
  assert.equal(escribirCalculo('FIXED_AMOUNT', { ...calculoVacio(), importe: 95 }), '{"importe":95}');
  assert.equal(escribirCalculo('RATE_PER_MWH', { ...calculoVacio(), tasa: 4.05 }), '{"tasa_eur_mwh":4.05}');
  assert.equal(escribirCalculo('RANGE_LOOKUP', { ...calculoVacio(), importe: 1 }), null);
  assert.equal(escribirCalculo('MANUAL', calculoVacio()), null);
});

test('la suma de líneas hace ida y vuelta con importes, tasas y porcentajes', async () => {
  const { leerCalculo, escribirCalculo } = await cargar();
  const json = JSON.stringify({ lineas: [
    { metodo: 'FIXED_AMOUNT', descripcion: 'Alta', importe: 50 },
    { metodo: 'RATE_PER_MWH', tasa_eur_mwh: 2 },
    { metodo: 'PERCENTAGE_OF_PREVIOUS', porcentaje: 0.1 },
  ] });
  const { form } = leerCalculo('COMPOSITE_SUM', json);
  assert.deepEqual(form.lineas.map(l => [l.metodo, l.valor]), [['FIXED_AMOUNT', 50], ['RATE_PER_MWH', 2], ['PERCENTAGE_OF_PREVIOUS', 10]]);
  assert.deepEqual(JSON.parse(escribirCalculo('COMPOSITE_SUM', form)), JSON.parse(json));
});

test('la validación del cálculo pide lo obligatorio y limita los porcentajes', async () => {
  const { validarCalculo, calculoVacio, lineaVacia } = await cargar();
  assert.ok(validarCalculo('FIXED_AMOUNT', calculoVacio()).calcImporte);
  assert.ok(validarCalculo('FEE_PERCENTAGE', { ...calculoVacio(), porcentaje: 120 }).calcPorcentaje);
  assert.deepEqual(validarCalculo('FEE_PERCENTAGE', { ...calculoVacio(), porcentaje: 44 }), {});
  assert.ok(validarCalculo('COMPOSITE_SUM', calculoVacio()).calcLineas);
  assert.match(validarCalculo('COMPOSITE_SUM', { ...calculoVacio(), lineas: [lineaVacia()] }).calcLineas, /línea 1/);
  assert.deepEqual(validarCalculo('MANUAL', calculoVacio()), {});
});

test('la validación de condiciones detecta rangos invertidos', async () => {
  const { validarCondiciones, condicionesVacias } = await cargar();
  assert.ok(validarCondiciones({ ...condicionesVacias(), consumoMin: 10, consumoMax: 5 }).consumoMax);
  assert.deepEqual(validarCondiciones({ ...condicionesVacias(), potenciaMin: 10, potenciaMax: 15 }), {});
});

test('la política de pago se lee y escribe como número de pagos sugerido', async () => {
  const { leerPago, escribirPago } = await cargar();
  assert.equal(leerPago('{"numero_pagos_sugerido":3}').numeroPagos, 3);
  assert.equal(escribirPago(2), '{"numero_pagos_sugerido":2}');
  assert.equal(escribirPago(''), null);
});

test('el resumen explica a quién se aplica la regla y da un ejemplo del importe', async () => {
  const { resumenRegla, condicionesVacias, calculoVacio } = await cargar();
  const r = resumenRegla({
    metodo: 'FEE_PERCENTAGE',
    condiciones: { ...condicionesVacias(), tipo_suministro: 'LUZ', segmento: 'PYME', es_renovacion: 'false', codigo_producto: 'PLAN_PERSONALIZADO' },
    calculo: { ...calculoVacio(), porcentaje: 44, feeMinimo: 5 },
    numeroPagos: '',
    nombreProducto: 'Plan Personalizado',
  });
  assert.deepEqual(r.aplica, ['Luz', 'PYME', 'Solo contratos nuevos', 'Producto «Plan Personalizado» (PLAN_PERSONALIZADO)']);
  assert.match(r.calcula, /consumo anual \(MWh\) × FEE del contrato \(€\/MWh\) × 44 %/);
  assert.match(r.calcula, /inferior a 5 €\/MWh/);
  assert.match(r.ejemplo, /100 MWh .* FEE de 10 €\/MWh → 440,00 €/);
  assert.match(r.pago, /Un pago/);

  const todos = resumenRegla({ metodo: 'MANUAL', motivo: 'Revisar a mano' });
  assert.deepEqual(todos.aplica, ['Todos los contratos de la tabla']);
  assert.match(todos.calcula, /Revisión manual.*Revisar a mano/);
  assert.equal(todos.pago, null);

  // Las tablas se editan con «Ver tabla» (la lista plana queda como «Vista avanzada»).
  assert.match(resumenRegla({ metodo: 'MATRIX_LOOKUP' }).calcula, /«Ver tabla»/);
  assert.doesNotMatch(resumenRegla({ metodo: 'RANGE_LOOKUP' }).calcula, /Valores de Rango/);
});

test('una regla guardada se resume en lenguaje llano, sin claves JSON', async () => {
  const { resumenDeRegla } = await cargar();
  // Copiada de V20260929_2_Seed_MCAS_Reglas_Hoja2.sql (ENDESA_RESIDENCIAL_10KW_O_MAS)
  const r = resumenDeRegla({
    metodoCalculo: 'FIXED_AMOUNT',
    condicionesJson: '{"tipo_suministro":"LUZ","segmento":"RESIDENCIAL","es_renovacion":false,"potencia_min_kw":10,"potencia_min_inc":true}',
    calculoJson: '{"importe":120}', politicaPagoJson: '{"numero_pagos_sugerido":1}',
  });
  assert.deepEqual(r.aplica, ['Luz', 'Residencial', 'Solo contratos nuevos', 'Potencia de cálculo ≥ 10 kW']);
  assert.equal(r.calcula, 'Comisión fija de 120,00 €.');

  const avanzada = resumenDeRegla({ metodoCalculo: 'MANUAL', motivoManual: 'A mano', condicionesJson: '{"segmento":"PYME","gestora":"X"}' });
  assert.deepEqual(avanzada.aplica, ['PYME', 'Otro criterio avanzado']);
  assert.doesNotMatch(avanzada.aplica.join(' '), /gestora/);

  const rota = resumenDeRegla({ metodoCalculo: 'FIXED_AMOUNT', condicionesJson: '{"segmento":' });
  assert.match(rota.aplica[0], /no se pueden leer/);
});
