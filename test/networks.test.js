import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNetwork } from '../collect/networks.js';
import { attachNetworks } from '../collect/merge.js';

const raw = {
  asn: 13335,
  name: 'Cloudflare',
  aka: '',
  website: 'https://www.cloudflare.com',
  info_type: 'Content',
  info_scope: 'Global',
  info_traffic: '',
  info_ratio: 'Mostly Outbound',
  info_prefixes4: 80000,
  info_prefixes6: 30000,
  ix_count: 357,
  fac_count: 224,
  policy_general: 'Open',
  poc_set: [{ email: 'peering@example.com', phone: '+1' }],
  notes: 'lorem',
};

test('csak a megengedett szervezeti mezőket tartja meg', () => {
  assert.deepEqual(pickNetwork(raw), {
    asn: 13335,
    name: 'Cloudflare',
    aka: null,
    website: 'https://www.cloudflare.com',
    type: 'Content',
    scope: 'Global',
    traffic: null,
    ratio: 'Mostly Outbound',
    prefixes4: 80000,
    prefixes6: 30000,
    ix_count: 357,
    fac_count: 224,
    policy: 'Open',
  });
});

test('kapcsolattartói adat nem szivárog be', () => {
  const picked = pickNetwork(raw);
  assert.equal(picked.poc_set, undefined);
  assert.ok(!JSON.stringify(picked).includes('@example.com'));
});

const members = [
  { asn: 13335, name: 'Cloudflare', website: null, policy: 'Selective', sources: ['bix'], ports: [{ node: 'VH', bandwidth_mbps: 200000 }] },
  { asn: 64500, name: 'AS64500', website: null, policy: null, sources: ['peeringdb'], ports: [] },
];

test('a hálózati profilt ASN szerint köti a taghoz', () => {
  const [cf] = attachNetworks(members, [pickNetwork(raw)]);
  assert.equal(cf.network.type, 'Content');
  assert.equal(cf.network.ix_count, 357);
});

test('profil nélküli tagnál network: null marad', () => {
  const result = attachNetworks(members, [pickNetwork(raw)]);
  assert.equal(result[1].network, null);
});

test('a BIX nevét nem írja felül a PeeringDB neve', () => {
  const other = { ...pickNetwork(raw), name: 'Valami más név' };
  const [cf] = attachNetworks(members, [other]);
  assert.equal(cf.name, 'Cloudflare');
});

test('a hiányzó weboldalt kitölti a PeeringDB-ből', () => {
  const [cf] = attachNetworks(members, [pickNetwork(raw)]);
  assert.equal(cf.website, 'https://www.cloudflare.com');
});

test('a sources bővül peeringdb-vel, ha onnan jött profil', () => {
  const [cf] = attachNetworks(members, [pickNetwork(raw)]);
  assert.deepEqual(cf.sources, ['bix', 'peeringdb']);
});
