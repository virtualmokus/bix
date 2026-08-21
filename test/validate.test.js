import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTraffic, ValidationError } from '../collect/validate.js';

const valid = {
  networks: 141,
  ports: 188,
  peak_gbps: 1116.82,
  current_gbps: 679.68,
  capacity_gbps: 8358,
};

test('az érvényes mérést változatlanul visszaadja', () => {
  assert.deepEqual(validateTraffic(valid), valid);
});

test('elutasítja a nulla forgalmat', () => {
  assert.throws(() => validateTraffic({ ...valid, current_gbps: 0 }), ValidationError);
});

test('elutasítja az irreálisan nagy forgalmat', () => {
  assert.throws(() => validateTraffic({ ...valid, current_gbps: 20000 }), ValidationError);
});

test('elutasítja, ha az aktuális meghaladja a kapacitást', () => {
  assert.throws(() => validateTraffic({ ...valid, current_gbps: 9000 }), ValidationError);
});

test('elutasítja, ha kevesebb port van, mint hálózat', () => {
  assert.throws(() => validateTraffic({ ...valid, ports: 140 }), ValidationError);
});

test('elutasítja a tört hálózatszámot', () => {
  assert.throws(() => validateTraffic({ ...valid, networks: 141.5 }), ValidationError);
});

test('a hibaüzenet tartalmazza a tényleges értéket', () => {
  assert.throws(
    () => validateTraffic({ ...valid, current_gbps: 0 }),
    (err) => err.message.includes('0')
  );
});
