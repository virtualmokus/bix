import { pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { recordSuccess, recordError } from './meta.js';

export function mergeMembers(ports, records) {
  const byAsn = new Map();

  for (const port of ports) {
    let member = byAsn.get(port.asn);
    if (!member) {
      member = {
        asn: port.asn,
        name: port.member,
        website: port.website,
        policy: port.policy,
        first_seen: null,
        is_rs_peer: false,
        ipv6: null,
        sources: ['bix'],
        ports: [],
      };
      byAsn.set(port.asn, member);
    }
    member.ports.push({
      node: port.node,
      ipv4: port.ipv4,
      bandwidth_mbps: port.bandwidth_mbps,
      note: port.note,
      graph_id: port.graph_id,
    });
  }

  for (const record of records) {
    let member = byAsn.get(record.asn);
    if (!member) {
      member = {
        asn: record.asn,
        name: `AS${record.asn}`,
        website: null,
        policy: null,
        first_seen: null,
        is_rs_peer: false,
        ipv6: null,
        sources: ['peeringdb'],
        ports: [],
      };
      byAsn.set(record.asn, member);
    } else if (!member.sources.includes('peeringdb')) {
      member.sources.push('peeringdb');
    }

    if (record.created && (member.first_seen === null || record.created < member.first_seen)) {
      member.first_seen = record.created;
    }
    if (record.is_rs_peer) {
      member.is_rs_peer = true;
    }
    if (record.ipaddr6 && !member.ipv6) {
      member.ipv6 = record.ipaddr6;
    }
  }

  return { members: [...byAsn.values()].sort((a, b) => a.asn - b.asn) };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function runMerge({ now = () => new Date(), dataDir = 'data' } = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const { ports } = await readJson(join(dataDir, 'ports.json'));
    const { records } = await readJson(join(dataDir, 'peeringdb.json'));
    const { members } = mergeMembers(ports, records);
    await writeFile(
      join(dataDir, 'members.json'),
      `${JSON.stringify({ fetched_at: ts, members }, null, 2)}\n`,
      'utf8'
    );
    await recordSuccess(metaPath, 'members', ts);
    return { ts, members };
  } catch (err) {
    await recordError(metaPath, 'members', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { members } = await runMerge();
    console.log(`OK — ${members.length} tag`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
