import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocale, BUNDLES, LOCALES } from '../assets/i18n.js';
import { formatRelativeIn } from '../assets/format.js';
import en from '../assets/strings.en.js';
import hu from '../assets/strings.hu.js';

test('alapértelmezés az angol, nem a böngésző nyelve', () => {
  assert.equal(resolveLocale('', null), 'en');
  assert.equal(resolveLocale('?foo=1', null), 'en');
});

test('az URL-paraméter erősebb a tárolt választásnál', () => {
  assert.equal(resolveLocale('?lang=hu', 'en'), 'hu');
  assert.equal(resolveLocale('?lang=en', 'hu'), 'en');
});

test('a tárolt választás akkor számít, ha nincs paraméter', () => {
  assert.equal(resolveLocale('', 'hu'), 'hu');
});

test('ismeretlen nyelvkód nem borítja fel', () => {
  assert.equal(resolveLocale('?lang=de', null), 'en');
  assert.equal(resolveLocale('', 'klingon'), 'en');
});

test('mindkét nyelv szerepel a választóban', () => {
  assert.deepEqual(LOCALES.map((l) => l.code).sort(), ['en', 'hu']);
  assert.deepEqual(Object.keys(BUNDLES).sort(), ['en', 'hu']);
});

/**
 * A két szótár szerkezetének azonosnak kell lennie. Enélkül egy hiányzó
 * magyar kulcs csak futásidőben, `undefined`-ként derülne ki a felületen.
 */
function shape(value, path = '', out = []) {
  if (Array.isArray(value)) {
    out.push(`${path}[]:${value.length}`);
    value.forEach((v, i) => shape(v, `${path}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value).sort()) shape(value[key], `${path}.${key}`, out);
  } else {
    out.push(`${path}:${typeof value}`);
  }
  return out;
}

test('a magyar szótár szerkezete megegyezik az angollal', () => {
  const a = shape(en);
  const b = shape(hu);
  const missing = a.filter((k) => !b.includes(k));
  const extra = b.filter((k) => !a.includes(k));
  assert.deepEqual(missing, [], `hiányzó magyar kulcsok: ${missing.slice(0, 5).join(', ')}`);
  assert.deepEqual(extra, [], `fölösleges magyar kulcsok: ${extra.slice(0, 5).join(', ')}`);
});

test('a helyőrzők mindkét nyelvben ugyanazok', () => {
  const holders = (obj, out = new Map(), path = '') => {
    if (typeof obj === 'string') {
      const found = obj.match(/\{[a-z]+\}/g);
      if (found) out.set(path, found.sort().join(','));
    } else if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) holders(v, out, `${path}.${k}`);
    }
    return out;
  };
  const a = holders(en);
  const b = holders(hu);
  for (const [path, value] of a) {
    assert.equal(b.get(path), value, `eltérő helyőrzők itt: ${path}`);
  }
});

test('a relatív idő nyelvenként helyes alakot ad', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  assert.equal(formatRelativeIn('2026-08-21T11:59:30Z', now, 'en'), 'just now');
  assert.equal(formatRelativeIn('2026-08-21T11:59:30Z', now, 'hu'), 'épp most');
  assert.equal(formatRelativeIn('2026-08-21T11:48:00Z', now, 'hu'), '12 perce');
  assert.equal(formatRelativeIn('2026-08-21T09:00:00Z', now, 'hu'), '3 órája');
  assert.equal(formatRelativeIn('2026-08-19T12:00:00Z', now, 'hu'), '2 napja');
});

test('ismeretlen nyelvnél az angol alak jön, nem hiba', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  assert.equal(formatRelativeIn('2026-08-21T09:00:00Z', now, 'de'), '3 hours ago');
});

test('a jogi szakaszok száma megegyezik', () => {
  assert.equal(hu.legal.sections.length, en.legal.sections.length);
});

test('a magyar jogi szöveg is kimondja a felelősségkizárást', () => {
  const body = hu.legal.sections.map((x) => x.body).join(' ');
  assert.ok(body.includes('nem vállal felelősséget'));
  assert.ok(body.includes('nem ügyvéd által ellenőrzött'));
  assert.ok(body.includes('Nincs kapcsolat') || hu.legal.sections.some((x) => x.heading === 'Nincs kapcsolat'));
});
