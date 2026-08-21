import * as cheerio from 'cheerio';
import { ParseError } from './parse-traffic.js';

export { ParseError };

const BANDWIDTH_RE = /^(\d+(?:\.\d+)?)\s*([GM])$/i;
const ASN_RE = /^AS(\d+)$/;
const GRAPH_ID_RE = /\/([a-f0-9]{32})$/;
const IPV4_RE = /(\d{1,3}(?:\.\d{1,3}){3})/;

export function parseBandwidth(text) {
  const match = BANDWIDTH_RE.exec(text.trim());
  if (!match) {
    throw new ParseError(`Ismeretlen sávszélesség-formátum: "${text.trim()}"`);
  }
  const value = Number(match[1]);
  return match[2].toUpperCase() === 'G' ? value * 1000 : value;
}

export function parsePorts(html) {
  const $ = cheerio.load(html);
  const ports = [];

  $('tr').each((_, tr) => {
    const $tr = $(tr);
    const asnText = $tr.find('td[data-title="AS number"]').first().text().trim();
    if (!asnText) return; // fejléc vagy nem port-sor

    const asnMatch = ASN_RE.exec(asnText);
    if (!asnMatch) {
      throw new ParseError(`Nem értelmezhető ASN: "${asnText}"`);
    }

    const $name = $tr.find('span.mname').first();
    const graphHref = $tr.find('td[data-title="Megtekint"] a').first().attr('href') ?? '';
    const graphMatch = GRAPH_ID_RE.exec(graphHref);
    const ipv4Match = IPV4_RE.exec($tr.find('span.mdata').first().text());
    const note = $tr.find('td[data-title="Megjegyzés"]').first().text().trim();

    ports.push({
      member: $name.text().trim(),
      website: $name.find('a').first().attr('href') ?? null,
      asn: Number(asnMatch[1]),
      policy: $tr.find('td[data-title="Peering policy"]').first().text().trim(),
      node: $tr.find('td[data-title="Node"]').first().text().trim(),
      ipv4: ipv4Match ? ipv4Match[1] : null,
      bandwidth_mbps: parseBandwidth($tr.find('td[data-title="Sávszélesség"]').first().text()),
      note: note || null,
      graph_id: graphMatch ? graphMatch[1] : null,
    });
  });

  if (ports.length === 0) {
    throw new ParseError('Egyetlen port-sort sem találtam a /statisztika oldalon');
  }
  return ports;
}
