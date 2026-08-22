import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, staleness, cacheBust } from '../assets/data.js';

const CSV =
  'ts,networks,ports,peak_gbps,current_gbps,capacity_gbps\n' +
  '2026-08-21T09:31:30Z,141,188,1116.82,718.5,8358\n';

function fakeFetch(map) {
  return async (url) => {
    const clean = String(url).split('?')[0];
    if (!(clean in map)) throw new Error(`404 ${clean}`);
    return {
      ok: true,
      text: async () => map[clean],
      json: async () => JSON.parse(map[clean]),
    };
  };
}

test('mind a négy forrást betölti', async () => {
  const data = await loadAll(
    fakeFetch({
      'data/traffic.csv': CSV,
      'data/members.json': '{"fetched_at":"2026-08-21T03:00:00Z","members":[{"asn":3244}]}',
      'data/ports.json': '{"fetched_at":"2026-08-21T03:00:00Z","ports":[{"asn":3244}]}',
      'data/meta.json': '{"traffic":{"last_success":"2026-08-21T09:31:30Z","last_error":null}}',
    })
  );

  assert.equal(data.traffic.length, 1);
  assert.equal(data.traffic[0].current_gbps, 718.5);
  assert.equal(data.members.length, 1);
  assert.equal(data.ports.length, 1);
  assert.equal(data.meta.traffic.last_success, '2026-08-21T09:31:30Z');
});

test('a friss forgalmi adat nem elavult', () => {
  const meta = { traffic: { last_success: '2026-08-21T12:00:00Z' } };
  const result = staleness(meta, 'traffic', new Date('2026-08-21T12:20:00Z'));
  assert.equal(result.minutes, 20);
  assert.equal(result.isStale, false);
});

test('a 45 percnél régebbi forgalmi adat elavult', () => {
  const meta = { traffic: { last_success: '2026-08-21T12:00:00Z' } };
  assert.equal(staleness(meta, 'traffic', new Date('2026-08-21T13:00:00Z')).isStale, true);
});

test('a napi források 48 óráig frissnek számítanak', () => {
  const meta = { ports: { last_success: '2026-08-20T03:00:00Z' } };
  assert.equal(staleness(meta, 'ports', new Date('2026-08-21T12:00:00Z')).isStale, false);
  assert.equal(staleness(meta, 'ports', new Date('2026-08-23T12:00:00Z')).isStale, true);
});

test('ismeretlen forrásra elavultat jelez, nem dob', () => {
  const result = staleness({}, 'nincs-ilyen', new Date());
  assert.equal(result.minutes, null);
  assert.equal(result.isStale, true);
});

test('a cache-törés ötperces ablakonként változik', () => {
  const base = 1_700_000_000_000;
  assert.equal(cacheBust(base), cacheBust(base + 60_000), 'egy percen belül ugyanaz');
  assert.notEqual(cacheBust(base), cacheBust(base + 6 * 60_000), 'hat perc múlva más');
});
