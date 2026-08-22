import test from 'node:test';
import assert from 'node:assert/strict';
import { render as renderFaq } from '../assets/views/faq.js';
import strings from '../assets/i18n.js';
import en from '../assets/strings.en.js';
import hu from '../assets/strings.hu.js';

test('minden kérdés megjelenik nyitható elemként', () => {
  const html = renderFaq();
  assert.equal((html.match(/faq-item/g) ?? []).length, strings.faq.items.length);
  assert.equal((html.match(/<summary>/g) ?? []).length, strings.faq.items.length);
});

test('a két nyelv ugyanannyi kérdést tartalmaz', () => {
  assert.equal(en.faq.items.length, hu.faq.items.length);
  assert.ok(en.faq.items.length >= 5, 'a GYIK ne legyen csonk');
  for (const bundle of [en, hu]) {
    for (const item of bundle.faq.items) {
      assert.ok(item.q.trim().length > 0);
      assert.ok(item.a.trim().length > 40, `túl rövid válasz: ${item.q}`);
    }
  }
});

test('a fül felirata mindkét nyelven megvan', () => {
  assert.ok(en.tabs.faq);
  assert.ok(hu.tabs.faq);
});

test('a válaszok escapelve kerülnek ki', () => {
  const html = renderFaq();
  assert.ok(!/<script/i.test(html));
  assert.ok(html.includes('&amp;') || !html.includes(' & '));
});

// A GYIK nem hozhat be olyan fenntartást, ami a felületen máshol nem szerepel:
// ha elcsúszna, a látogató két különböző igazságot olvasna ugyanarról.
test('a fenntartások a felület állításait ismétlik, nem újakat állítanak', () => {
  const answers = en.faq.items.map((x) => x.a).join(' ').toLowerCase();
  assert.ok(answers.includes('peeringdb'), 'nevesítse a forrást');
  assert.ok(answers.includes('not a wire') || answers.includes('logical relationship'));
  assert.ok(answers.includes('three quarters'), 'a lefedettség ugyanaz a szám legyen');
  assert.ok(answers.includes('cc by-nc-sa'), 'a licenc nevesítve legyen');
});

test('nincs emoji a GYIK-ben', () => {
  const all = [...en.faq.items, ...hu.faq.items].map((x) => x.q + x.a).join('');
  assert.ok(!/\p{Emoji_Presentation}/u.test(all));
});
