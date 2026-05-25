// scripts/dorinda-brain/tools.test.cjs
const { test } = require('node:test');
const assert = require('node:assert');
const { FUNCTION_DECLARATIONS } = require('./tools.cjs');

test('declara exatamente as 5 funções', () => {
  const names = FUNCTION_DECLARATIONS.map((d) => d.name).sort();
  assert.deepStrictEqual(names, ['agendar_visita', 'consultar_imoveis', 'consultar_imovel_por_id', 'criar_lead', 'notificar_corretor']);
});

test('cada função tem description e parameters object', () => {
  for (const d of FUNCTION_DECLARATIONS) {
    assert.ok(d.description && d.description.length > 10, `${d.name} sem description`);
    assert.strictEqual(d.parameters.type, 'object', `${d.name} parameters.type`);
  }
});

test('required bate com o contrato das RPCs', () => {
  const byName = Object.fromEntries(FUNCTION_DECLARATIONS.map((d) => [d.name, d]));
  assert.deepStrictEqual(byName['consultar_imovel_por_id'].parameters.required, ['p_identifier']);
  assert.deepStrictEqual(byName['criar_lead'].parameters.required.sort(), ['p_name', 'p_phone']);
  assert.deepStrictEqual(byName['agendar_visita'].parameters.required.sort(), ['p_lead_name', 'p_lead_phone', 'p_property_id', 'p_starts_at']);
  assert.deepStrictEqual(byName['notificar_corretor'].parameters.required.sort(), ['p_mensagem', 'p_tipo']);
  assert.deepStrictEqual(byName['consultar_imoveis'].parameters.required || [], []);
});

test('tipos numéricos e array corretos', () => {
  const ci = FUNCTION_DECLARATIONS.find((d) => d.name === 'consultar_imoveis').parameters.properties;
  assert.strictEqual(ci.p_min_bedrooms.type, 'integer');
  assert.strictEqual(ci.p_max_sale_price.type, 'number');
  assert.strictEqual(ci.p_pet_friendly.type, 'boolean');
  const cl = FUNCTION_DECLARATIONS.find((d) => d.name === 'criar_lead').parameters.properties;
  assert.strictEqual(cl.p_property_ids.type, 'array');
});
