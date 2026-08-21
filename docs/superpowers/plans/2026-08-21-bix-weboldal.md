# BIX weboldal — implementációs terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statikus, build lépés nélküli weboldal, ami a `data/` alatt gyűlő BIX-adatot három nézetben mutatja meg: `Most`, `Tagok`, `Növekedés`.

**Architecture:** Tiszta render-függvények (adat be, HTML string ki) + vékony mount-réteg, ami eseményeket köt. A render-függvények DOM nélkül futnak, ezért `node:test`-tel tesztelhetők — a vizuális réteg így nem tesztelhetetlen fekete doboz. Az adat `fetch`-csel jön a saját repóból, a GitHub Pages statikusan szolgálja ki.

**Tech Stack:** ESM modulok `<script type="module">`-lel, sallangmentes CSS egyedi tulajdonságokkal, kézzel írt SVG. Nulla böngészőoldali függőség, nulla build lépés. Tesztek: beépített `node:test`.

**Spec:** [`docs/superpowers/specs/2026-08-21-bix-dashboard-design.md`](../specs/2026-08-21-bix-dashboard-design.md) 7. szakasz
**Előfeltétel:** [`2026-08-21-bix-adatgyujto-pipeline.md`](2026-08-21-bix-adatgyujto-pipeline.md) — kész, a `data/` fel van töltve

## Global Constraints

- **Nincs build lépés, nincs bundler, nincs böngészőoldali npm-függőség.** Ami a repóban van, azt szolgálja ki a Pages.
- **GitHub Pages:** `main` branch, `/` (root). Ezért az `index.html` a repó gyökerében ül, az adat pedig relatív `data/…` útvonalon érhető el.
- **Minden felületi szöveg** az `assets/strings.hu.js`-ből jön. Sehol nincs beégetett magyar szöveg a nézetekben.
- **hu-HU formázás:** tizedesvessző. Csoportelválasztó **csak ötjegyűtől** (`8358`, de `10 000`) — ez a magyar helyesírás, és az `Intl` `hu-HU` alapból így viselkedik. Az elválasztó U+00A0.
- **Az oldalnak egyetlen adatponttal is működnie kell.** A `traffic.csv` jelenleg 1 sort tartalmaz; a `Most` nézet ilyenkor nem rajzol csonka grafikont, hanem kiírja, hány mérés van és mikortól gyűlik.
- **Tilos a `created` mezőt „csatlakozás"-ként feliratozni.** A `Növekedés` nézet felirata kötelezően „PeeringDB-ben megjelent kapcsolatok" (spec 3.3, Figyelmeztetés 1).
- **Az adathiányt ki kell írni:** a `/statisztika` 137 portot fed le a főoldal által jelentett 188-ból. Ez látható jelzés, nem lábjegyzet.

### Design rendszer (kötelező tokenek)

A `minimalist-ui` skill a vezető rendszer, a `high-end-visual-design` csak a mozgásra, a tipográfia-tiltásokra és a teljesítmény-szabályokra vonatkozik. A landing-page-specifikus előírásai (Double-Bezel beágyazott kártyák, `rounded-[2rem]`, lebegő üveg-pill navbar, `py-40`) **nem alkalmazandók** — adatsűrű felületen rontanák az olvashatóságot.

```css
:root {
  --canvas:        #FBFBFA;
  --surface:       #FFFFFF;
  --border:        #EAEAEA;
  --text:          #2F3437;
  --text-muted:    #787774;

  --blue-bg:       #E1F3FE;  --blue-fg:   #1F6C9F;
  --yellow-bg:     #FBF3DB;  --yellow-fg: #956400;
  --green-bg:      #EDF3EC;  --green-fg:  #346538;
  --red-bg:        #FDEBEC;  --red-fg:    #9F2F2D;

  --radius-card:   8px;
  --radius-button: 4px;

  --ease:          cubic-bezier(0.16, 1, 0.3, 1);
}
```

- **Betűk:** `--font-sans: 'Geist', system-ui, sans-serif`, `--font-serif: 'Instrument Serif', Georgia, serif`, `--font-mono: 'Geist Mono', ui-monospace, monospace`. Google Fontsról betöltve. **Tilos:** Inter, Roboto, Open Sans, Arial.
- **Monospace kötelező** minden ASN, IP-cím és numerikus táblaérték esetén — `font-variant-numeric: tabular-nums`.
- **Keretek:** kizárólag `1px solid var(--border)`. Árnyék alapból nincs; hoveren legfeljebb `0 2px 8px rgba(0,0,0,0.04)`.
- **Emoji tilos** bárhol — markup, szöveg, alt-szöveg. Helyette inline SVG.
- **Nincs primer színű nagy háttérblokk.** Az akcentus kizárólag a fenti tompított pasztellek.
- **Mozgás:** scroll-entry `IntersectionObserver`-rel, `translateY(12px)` + `opacity: 0` → 600ms `var(--ease)`. Kizárólag `transform` és `opacity` animálható.
- **Szekciótávok:** 64–96px. (Nem `py-40` — ez dashboard.)

### Fájlszerkezet

| Fájl | Felelősség | Tesztelt |
|---|---|---|
| `index.html` | váz, fülek, Google Fonts, modul-belépő | – |
| `assets/style.css` | tokenek és minden stílus | – |
| `assets/strings.hu.js` | minden felületi szöveg | – |
| `assets/csv-parse.js` | `traffic.csv` → objektumtömb | ✓ |
| `assets/format.js` | hu-HU szám-, dátum- és relatívidő-formázás | ✓ |
| `assets/humanize.js` | emberi léptékű fordítások | ✓ |
| `assets/data.js` | adatbetöltés, elavultság-számítás | ✓ |
| `assets/chart.js` | SVG primitívek (string-et ad vissza) | ✓ |
| `assets/icons.js` | inline SVG ikonok (emoji helyett) | – |
| `assets/views/now.js` | `Most` nézet | ✓ (render) |
| `assets/views/members.js` | `Tagok` nézet, port-mátrix, szűrők | ✓ (render) |
| `assets/views/growth.js` | `Növekedés` nézet | ✓ (render) |
| `assets/app.js` | fül-routing, boot, scroll-entry | – |

**Minden nézet két dolgot exportál:** `render(data) → string` (tiszta, DOM nélkül, tesztelhető) és `mount(root, data)` (eseménykötés). A tesztek a `render`-t hívják.

---

### Task 1: Oldalváz és design rendszer

**Files:**
- Create: `index.html`, `assets/style.css`, `assets/strings.hu.js`, `assets/icons.js`, `assets/app.js`

**Interfaces:**
- Consumes: semmi
- Produces: `strings` objektum (`assets/strings.hu.js` default export), `icons` objektum (`assets/icons.js`), működő fül-váltás

- [ ] **Step 1: `assets/strings.hu.js`**

```js
export default {
  siteName: 'BIX',
  siteTagline: 'Budapest Internet Exchange — független adatnézet',
  tabs: { now: 'Most', members: 'Tagok', growth: 'Növekedés' },
  live: 'ÉLŐ',
  now: {
    eyebrow: 'Épp most folyik át a BIX-en',
    unit: 'Gb/s',
    utilization: 'Kihasználtság',
    current: 'most',
    peak: 'valaha mért csúcs',
    capacity: 'beépített kapacitás',
    humanScale: 'Mennyi ez valójában?',
    didYouKnow: 'Tudtad?',
    capacityNote:
      'A BIX a beépített kapacitásának töredékét használja. Ez nem pazarlás — a tartalék az, ami miatt egy váratlan forgalmi robbanás nem dönti be az ország internetét.',
    seriesStarting: 'Az idősor most indult',
    seriesStartingBody:
      'Eddig {count} mérés gyűlt össze, {since} óta. Néhány nap kell, mire a görbe elmond valamit.',
  },
  members: {
    eyebrow: 'Tagok',
    title: 'Ki ül a BIX-en, hol, és mekkora sávval',
    searchPlaceholder: 'Keresés név vagy ASN szerint',
    allNodes: 'Összes node',
    allBandwidths: 'Összes sávszélesség',
    allPolicies: 'Összes peering policy',
    matrixTitle: 'Portok kapacitás szerint',
    matrixHint: 'Vidd rá az egeret egy cellára a tag nevéért.',
    coverageWarning:
      'A BIX publikus statisztikája {shown} portot listáz, miközben a főoldal {total} portot jelent. Ez a nézet a portok {percent}%-át fedi le.',
    columns: { name: 'Tag', asn: 'ASN', node: 'Node', bandwidth: 'Sáv', policy: 'Peering policy' },
    noResults: 'Nincs találat.',
    onlyPeeringdb: 'csak PeeringDB',
    onlyBix: 'csak BIX',
  },
  growth: {
    eyebrow: 'Növekedés',
    title: 'Húsz év alatt a 10 gigabit volt a csúcs — ma a belépőszint',
    // KÖTELEZŐ megfogalmazás: a created mező NEM csatlakozási dátum
    curveTitle: 'PeeringDB-ben megjelent kapcsolatok',
    // A szöveg szándékosan kerüli a „csatlakozott" szót — a 9. feladat
    // tesztje pontosan erre a szóra ellenőriz, mert ez a mező téves olvasata.
    curveCaption:
      'A PeeringDB `created` mezője azt mondja meg, mikor került be a rekord az adatbázisba — nem a BIX-hez való belépés időpontját. A BIX 1996 óta működik, a legkorábbi rekord viszont 2010-es.',
    bandwidthTitle: 'Sávszélesség-összetétel',
    nodeTitle: 'Portok node szerint',
    viennaNote: 'A Digital Realty (InterXion VIE1) node nem Budapesten van, hanem Bécsben.',
  },
  footer: {
    independent: 'Független hobbiprojekt. Nincs kapcsolatunk az ISZT-vel vagy a BIX üzemeltetőjével.',
    sources: 'Adatforrás: bix.hu és PeeringDB, kizárólag nyilvános adatok.',
    updated: 'Frissítve: {when}',
    stale: 'Az adat elavult — utolsó sikeres frissítés: {when}',
  },
};
```

- [ ] **Step 2: `assets/icons.js`**

Emoji helyett inline SVG (a `minimalist-ui` tiltja az emojikat). Phosphor-szerű, egységes 1.5px vonalvastagság:

```js
const wrap = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export default {
  stream: wrap('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M10 9.5v5l4-2.5z"/>'),
  storage: wrap('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  network: wrap('<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v4M12 11.5 6.5 17M12 11.5 17.5 17"/>'),
  info: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  warning: wrap('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>'),
};
```

- [ ] **Step 3: `index.html`**

```html
<!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BIX — Budapest Internet Exchange adatnézet</title>
<meta name="description" content="Független, vizuális adatnézet a Budapest Internet Exchange nyilvános adataiból.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Instrument+Serif&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="site-header">
    <div class="brand">
      <span class="brand-mark">BIX</span>
      <span class="brand-tagline" data-str="siteTagline"></span>
    </div>
    <nav class="tabs" role="tablist">
      <button class="tab" role="tab" data-view="now" aria-selected="true"></button>
      <button class="tab" role="tab" data-view="members" aria-selected="false"></button>
      <button class="tab" role="tab" data-view="growth" aria-selected="false"></button>
    </nav>
    <span class="live-badge" id="live-badge"></span>
  </header>

  <main id="view" class="view"></main>

  <footer class="site-footer" id="footer"></footer>

  <script type="module" src="assets/app.js"></script>
</body>
</html>
```

- [ ] **Step 4: `assets/style.css`**

A fenti design-token blokkot írd be `:root`-ba, majd:

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--canvas);
  color: var(--text);
  font-family: var(--font-sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.site-header {
  display: flex; align-items: center; gap: 24px;
  padding: 16px 32px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 10;
}
.brand { display: flex; align-items: baseline; gap: 10px; }
.brand-mark { font-weight: 700; font-size: 18px; letter-spacing: -0.02em; }
.brand-tagline { font-size: 12px; color: var(--text-muted); }

.tabs { display: flex; gap: 4px; margin-left: auto; }
.tab {
  font: inherit; font-size: 14px; color: var(--text-muted);
  background: none; border: none; cursor: pointer;
  padding: 6px 12px; border-radius: var(--radius-button);
  transition: color 200ms var(--ease), background 200ms var(--ease);
}
.tab:hover { background: var(--canvas); color: var(--text); }
.tab[aria-selected="true"] { color: var(--text); font-weight: 500; background: var(--canvas); }

.live-badge {
  font-family: var(--font-mono); font-size: 11px;
  color: var(--green-fg); background: var(--green-bg);
  padding: 4px 10px; border-radius: 9999px;
  letter-spacing: 0.05em;
}

.view { max-width: 1120px; margin: 0 auto; padding: 64px 32px 96px; }
.section { margin-bottom: 80px; }
.eyebrow {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em;
  color: var(--text-muted); font-weight: 500; margin-bottom: 8px;
}
.section-title {
  font-family: var(--font-serif); font-size: 34px;
  line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 12px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  padding: 24px;
  transition: box-shadow 200ms var(--ease);
}
.card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }

.bento { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }

.mono, td.num, .asn { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.note { border-radius: var(--radius-card); padding: 16px 20px; font-size: 14px; }
.note--info    { background: var(--blue-bg);   color: var(--blue-fg); }
.note--warning { background: var(--yellow-bg); color: var(--yellow-fg); }

.reveal { opacity: 0; transform: translateY(12px); }
.reveal.is-visible {
  opacity: 1; transform: none;
  transition: opacity 600ms var(--ease), transform 600ms var(--ease);
}
@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal.is-visible { opacity: 1; transform: none; transition: none; }
}

@media (max-width: 768px) {
  .site-header { flex-wrap: wrap; padding: 12px 16px; gap: 12px; }
  .view { padding: 32px 16px 64px; }
  .bento { grid-template-columns: 1fr; }
  .section-title { font-size: 26px; }
}
```

- [ ] **Step 5: `assets/app.js` — fül-routing és boot**

```js
import strings from './strings.hu.js';

const VIEWS = ['now', 'members', 'growth'];

function applyStaticStrings() {
  document.querySelector('[data-str="siteTagline"]').textContent = strings.siteTagline;
  for (const btn of document.querySelectorAll('.tab')) {
    btn.textContent = strings.tabs[btn.dataset.view];
  }
}

function revealOnScroll(root) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  for (const el of root.querySelectorAll('.reveal')) observer.observe(el);
}

function selectTab(name) {
  for (const btn of document.querySelectorAll('.tab')) {
    btn.setAttribute('aria-selected', String(btn.dataset.view === name));
  }
  location.hash = name;
}

export function boot({ views, data }) {
  applyStaticStrings();
  const root = document.getElementById('view');

  function show(name) {
    const view = views[name];
    root.innerHTML = view.render(data);
    view.mount?.(root, data);
    selectTab(name);
    revealOnScroll(root);
  }

  for (const btn of document.querySelectorAll('.tab')) {
    btn.addEventListener('click', () => show(btn.dataset.view));
  }

  const initial = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'now';
  show(initial);
}
```

Az `app.js` alja egyelőre üres marad — a `boot` hívása a 10. feladatban kerül be, amikor minden nézet készen áll.

- [ ] **Step 6: Ellenőrzés böngészőben**

```bash
python -m http.server 8000
```

(Vagy `npx -y serve .` ha nincs Python.) Nyisd meg a `http://localhost:8000` címet. Expected: fejléc a három füllel, a fülek szövege magyarul, üres tartalomterület. A betűk **nem** rendszerbetűk — a Geist töltődik.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/
git commit -m "feat: oldalváz és design rendszer"
```

---

### Task 2: `csv-parse.js`

**Files:**
- Create: `assets/csv-parse.js`
- Test: `test/csv-parse.test.js`

**Interfaces:**
- Consumes: a `data/traffic.csv` fejléce (`ts,networks,ports,peak_gbps,current_gbps,capacity_gbps`)
- Produces: `parseTrafficCsv(text) → Array<{ ts: string, networks: number, ports: number, peak_gbps: number, current_gbps: number, capacity_gbps: number }>`

- [ ] **Step 1: Write the failing test**

`test/csv-parse.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrafficCsv } from '../assets/csv-parse.js';

const HEADER = 'ts,networks,ports,peak_gbps,current_gbps,capacity_gbps';

test('üres fájlra üres tömböt ad', () => {
  assert.deepEqual(parseTrafficCsv(''), []);
});

test('csak fejlécre üres tömböt ad', () => {
  assert.deepEqual(parseTrafficCsv(`${HEADER}\n`), []);
});

test('egy sort objektummá alakít, számokkal', () => {
  const rows = parseTrafficCsv(`${HEADER}\n2026-08-21T09:31:30Z,141,188,1116.82,718.5,8358\n`);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    ts: '2026-08-21T09:31:30Z',
    networks: 141,
    ports: 188,
    peak_gbps: 1116.82,
    current_gbps: 718.5,
    capacity_gbps: 8358,
  });
});

test('CRLF sorvégeket is kezel', () => {
  const rows = parseTrafficCsv(`${HEADER}\r\n2026-08-21T09:31:30Z,141,188,1116.82,718.5,8358\r\n`);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].current_gbps, 718.5);
});

test('a hibás oszlopszámú sort kihagyja, nem dob', () => {
  const rows = parseTrafficCsv(`${HEADER}\nrossz,sor\n2026-08-21T09:31:30Z,141,188,1116.82,718.5,8358\n`);
  assert.equal(rows.length, 1);
});

test('időrendben adja vissza a sorokat', () => {
  const rows = parseTrafficCsv(
    `${HEADER}\n` +
      '2026-08-21T10:00:00Z,141,188,1116.82,700,8358\n' +
      '2026-08-21T09:00:00Z,141,188,1116.82,650,8358\n'
  );
  assert.deepEqual(rows.map((r) => r.current_gbps), [650, 700]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/csv-parse.test.js`
Expected: FAIL — `Cannot find module '../assets/csv-parse.js'`

- [ ] **Step 3: Write minimal implementation**

`assets/csv-parse.js`:

```js
const COLUMNS = ['ts', 'networks', 'ports', 'peak_gbps', 'current_gbps', 'capacity_gbps'];

export function parseTrafficCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length <= 1) return [];

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    if (cells.length !== COLUMNS.length) continue; // sérült sor, kihagyjuk

    const row = { ts: cells[0] };
    let valid = true;
    for (let i = 1; i < COLUMNS.length; i++) {
      const value = Number(cells[i]);
      if (!Number.isFinite(value)) { valid = false; break; }
      row[COLUMNS[i]] = value;
    }
    if (valid) rows.push(row);
  }

  return rows.sort((a, b) => a.ts.localeCompare(b.ts));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/csv-parse.test.js`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add assets/csv-parse.js test/csv-parse.test.js
git commit -m "feat: traffic.csv böngészőoldali parser"
```

---

### Task 3: `format.js` — hu-HU formázás

**Files:**
- Create: `assets/format.js`
- Test: `test/format.test.js`

**Interfaces:**
- Consumes: semmi
- Produces:
  - `formatDecimal(n, digits = 2) → string` — `679,68`
  - `formatInt(n) → string` — `8 358` (keskeny szóköz ezresenként)
  - `formatPercent(n, digits = 1) → string` — `8,6%`
  - `formatBandwidth(mbps) → string` — `100G`, `1G`, `100M`
  - `formatRelative(isoString, now) → string` — `épp most`, `12 perce`, `3 órája`, `2 napja`

- [ ] **Step 1: Write the failing test**

`test/format.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDecimal, formatInt, formatPercent, formatBandwidth, formatRelative,
} from '../assets/format.js';

test('tizedesvesszőt használ', () => {
  assert.equal(formatDecimal(679.68), '679,68');
  assert.equal(formatDecimal(718.5), '718,50');
});

test('az egész számokat ezresenként tagolja', () => {
  assert.equal(formatInt(8358).replace(/ | |\s/g, ' '), '8 358');
  assert.equal(formatInt(137), '137');
});

test('a százalékot egy tizedessel adja', () => {
  assert.equal(formatPercent(8.5949), '8,6%');
});

test('a sávszélességet emberi alakra hozza', () => {
  assert.equal(formatBandwidth(1000), '1G');
  assert.equal(formatBandwidth(100000), '100G');
  assert.equal(formatBandwidth(300000), '300G');
  assert.equal(formatBandwidth(100), '100M');
});

test('a relatív idő magyarul, a megfelelő ragozással', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  assert.equal(formatRelative('2026-08-21T11:59:30Z', now), 'épp most');
  assert.equal(formatRelative('2026-08-21T11:48:00Z', now), '12 perce');
  assert.equal(formatRelative('2026-08-21T09:00:00Z', now), '3 órája');
  assert.equal(formatRelative('2026-08-19T12:00:00Z', now), '2 napja');
});

test('a null bemenetre üres stringet ad, nem dob', () => {
  assert.equal(formatRelative(null, new Date()), '');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/format.test.js`
Expected: FAIL — `Cannot find module '../assets/format.js'`

- [ ] **Step 3: Write minimal implementation**

`assets/format.js`:

```js
const LOCALE = 'hu-HU';

export function formatDecimal(n, digits = 2) {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatInt(n) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(n);
}

export function formatPercent(n, digits = 1) {
  return `${formatDecimal(n, digits)}%`;
}

export function formatBandwidth(mbps) {
  return mbps >= 1000 ? `${mbps / 1000}G` : `${mbps}M`;
}

export function formatRelative(isoString, now) {
  if (!isoString) return '';
  const diffMs = now.getTime() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'épp most';
  if (minutes < 60) return `${minutes} perce`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} órája`;

  return `${Math.floor(hours / 24)} napja`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/format.test.js`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add assets/format.js test/format.test.js
git commit -m "feat: hu-HU formázó függvények"
```

---

### Task 4: `humanize.js` — emberi léptékű fordítások

**Files:**
- Create: `assets/humanize.js`
- Test: `test/humanize.test.js`

**Interfaces:**
- Consumes: semmi
- Produces:
  - `STREAM_MBPS: 15` — a Netflix 4K nagyságrendje, exportált konstans hogy a teszt és a felirat ugyanabból dolgozzon
  - `concurrent4kStreams(gbps) → number`
  - `gigabytesPerSecond(gbps) → number`
  - `utilizationPercent(current, capacity) → number`

- [ ] **Step 1: Write the failing test**

`test/humanize.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STREAM_MBPS, concurrent4kStreams, gigabytesPerSecond, utilizationPercent,
} from '../assets/humanize.js';

test('a stream-konstans dokumentált és 15 Mb/s', () => {
  assert.equal(STREAM_MBPS, 15);
});

test('a 4K streamek számát a konstansból számolja', () => {
  assert.equal(concurrent4kStreams(679.68), Math.round((679.68 * 1000) / STREAM_MBPS));
  assert.equal(concurrent4kStreams(15 / 1000), 1);
});

test('a gigabájt/másodperc nyolcadolás', () => {
  assert.equal(gigabytesPerSecond(8), 1);
  assert.equal(Math.round(gigabytesPerSecond(679.68)), 85);
});

test('a kihasználtság százalék', () => {
  assert.equal(utilizationPercent(679.68, 8358).toFixed(2), '8.13');
});

test('nulla kapacitásnál nem oszt nullával', () => {
  assert.equal(utilizationPercent(100, 0), 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/humanize.test.js`
Expected: FAIL — `Cannot find module '../assets/humanize.js'`

- [ ] **Step 3: Write minimal implementation**

`assets/humanize.js`:

```js
// Netflix 4K stream nagyságrendje. Exportált, hogy a felirat és a teszt
// ugyanabból a számból dolgozzon — ne lehessen szétcsúszni.
export const STREAM_MBPS = 15;

export function concurrent4kStreams(gbps) {
  return Math.round((gbps * 1000) / STREAM_MBPS);
}

export function gigabytesPerSecond(gbps) {
  return gbps / 8;
}

export function utilizationPercent(current, capacity) {
  if (!capacity) return 0;
  return (current / capacity) * 100;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/humanize.test.js`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add assets/humanize.js test/humanize.test.js
git commit -m "feat: emberi léptékű fordítások"
```

---

### Task 5: `data.js` — betöltés és elavultság

**Files:**
- Create: `assets/data.js`
- Test: `test/data.test.js`

**Interfaces:**
- Consumes: `parseTrafficCsv` (Task 2)
- Produces:
  - `loadAll(fetchFn, base = 'data') → Promise<{ traffic, members, ports, meta }>`
  - `staleness(meta, source, now) → { minutes: number|null, isStale: boolean }` — 45 percnél régebbi `traffic` elavult, a napi forrásoknál 48 óra

- [ ] **Step 1: Write the failing test**

`test/data.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, staleness } from '../assets/data.js';

const CSV = 'ts,networks,ports,peak_gbps,current_gbps,capacity_gbps\n2026-08-21T09:31:30Z,141,188,1116.82,718.5,8358\n';

function fakeFetch(map) {
  return async (url) => {
    if (!(url in map)) throw new Error(`404 ${url}`);
    return {
      ok: true,
      text: async () => map[url],
      json: async () => JSON.parse(map[url]),
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/data.test.js`
Expected: FAIL — `Cannot find module '../assets/data.js'`

- [ ] **Step 3: Write minimal implementation**

`assets/data.js`:

```js
import { parseTrafficCsv } from './csv-parse.js';

// Forrásonkénti elavultsági küszöb percben.
// A forgalmi gyűjtő 15 percenként fut; 45 perc három kihagyott futás.
const STALE_AFTER_MINUTES = {
  traffic: 45,
  ports: 48 * 60,
  peeringdb: 48 * 60,
  members: 48 * 60,
};

export async function loadAll(fetchFn, base = 'data') {
  const [csv, members, ports, meta] = await Promise.all([
    fetchFn(`${base}/traffic.csv`).then((r) => r.text()),
    fetchFn(`${base}/members.json`).then((r) => r.json()),
    fetchFn(`${base}/ports.json`).then((r) => r.json()),
    fetchFn(`${base}/meta.json`).then((r) => r.json()),
  ]);

  return {
    traffic: parseTrafficCsv(csv),
    members: members.members ?? [],
    ports: ports.ports ?? [],
    meta,
  };
}

export function staleness(meta, source, now) {
  const lastSuccess = meta?.[source]?.last_success;
  if (!lastSuccess) return { minutes: null, isStale: true };

  const minutes = Math.floor((now.getTime() - new Date(lastSuccess).getTime()) / 60000);
  const threshold = STALE_AFTER_MINUTES[source] ?? 48 * 60;
  return { minutes, isStale: minutes > threshold };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/data.test.js`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add assets/data.js test/data.test.js
git commit -m "feat: adatbetöltés és elavultság-számítás"
```

---

### Task 6: `chart.js` — SVG primitívek

**Files:**
- Create: `assets/chart.js`
- Test: `test/chart.test.js`

**Interfaces:**
- Consumes: semmi
- Produces (mind string-et ad vissza, DOM nélkül — ezért tesztelhető):
  - `areaChart({ points, width, height, accent }) → string` — `points` = `Array<{ x: number, y: number }>` nyers értékekkel, a skálázás belül történik
  - `barRow({ label, value, max, accent }) → string` — egy vízszintes sáv
  - `cumulativeChart({ buckets, width, height }) → string` — `buckets` = `Array<{ label: string, value: number }>`, kumulatív vonal

- [ ] **Step 1: Write the failing test**

`test/chart.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { areaChart, barRow, cumulativeChart } from '../assets/chart.js';

test('az areaChart svg-t ad vissza a megadott mérettel', () => {
  const svg = areaChart({
    points: [{ x: 0, y: 10 }, { x: 1, y: 20 }, { x: 2, y: 15 }],
    width: 400, height: 100,
  });
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('viewBox="0 0 400 100"'));
  assert.ok(svg.includes('<path'));
});

test('az areaChart egyetlen pontnál sem dob', () => {
  const svg = areaChart({ points: [{ x: 0, y: 42 }], width: 400, height: 100 });
  assert.ok(svg.startsWith('<svg'));
});

test('az areaChart üres adatra üres svg-t ad', () => {
  const svg = areaChart({ points: [], width: 400, height: 100 });
  assert.ok(svg.startsWith('<svg'));
  assert.ok(!svg.includes('<path'));
});

test('a barRow a max-hoz arányosítja a szélességet', () => {
  const svg = barRow({ label: 'most', value: 50, max: 200 });
  assert.ok(svg.includes('25%'));
  assert.ok(svg.includes('most'));
});

test('a barRow nulla max esetén nem oszt nullával', () => {
  const svg = barRow({ label: 'x', value: 5, max: 0 });
  assert.ok(svg.includes('0%'));
});

test('a barRow escapeli a címkét', () => {
  const svg = barRow({ label: '<script>', value: 1, max: 2 });
  assert.ok(!svg.includes('<script>'));
  assert.ok(svg.includes('&lt;script&gt;'));
});

test('a cumulativeChart összegzi a bucketeket', () => {
  const svg = cumulativeChart({
    buckets: [{ label: '2010', value: 5 }, { label: '2011', value: 3 }],
    width: 400, height: 100,
  });
  assert.ok(svg.includes('<path'));
  assert.ok(svg.includes('2010'));
  assert.ok(svg.includes('2011'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/chart.test.js`
Expected: FAIL — `Cannot find module '../assets/chart.js'`

- [ ] **Step 3: Write minimal implementation**

`assets/chart.js`:

```js
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function scale(points, width, height, pad = 4) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY || 1;

  return points.map((p) => ({
    x: ((p.x - minX) / spanX) * width,
    y: height - pad - ((p.y / spanY) * (height - pad * 2)),
  }));
}

export function areaChart({ points, width, height, accent = 'var(--blue-fg)' }) {
  const open = `<svg viewBox="0 0 ${width} ${height}" class="chart" preserveAspectRatio="none" role="img">`;
  if (points.length === 0) return `${open}</svg>`;

  const scaled = scale(points, width, height);
  const line = scaled.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = scaled[scaled.length - 1];

  return (
    open +
    `<path d="${area}" fill="${accent}" fill-opacity="0.08"/>` +
    `<path d="${line}" fill="none" stroke="${accent}" stroke-width="2" ` +
    `stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` +
    `<circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3" fill="${accent}"/>` +
    `</svg>`
  );
}

export function barRow({ label, value, max, accent = 'var(--blue-fg)' }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    `<div class="bar-row">` +
    `<span class="bar-label">${escapeHtml(label)}</span>` +
    `<span class="bar-track"><span class="bar-fill" style="width:${percent.toFixed(1)}%;background:${accent}"></span></span>` +
    `</div>`
  );
}

export function cumulativeChart({ buckets, width, height }) {
  const open = `<svg viewBox="0 0 ${width} ${height}" class="chart" role="img">`;
  if (buckets.length === 0) return `${open}</svg>`;

  let running = 0;
  const points = buckets.map((bucket, i) => {
    running += bucket.value;
    return { x: i, y: running };
  });

  const scaled = scale(points, width, height - 18);
  const line = scaled.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const labels = buckets
    .map((bucket, i) => {
      if (i !== 0 && i !== buckets.length - 1 && i % 4 !== 0) return '';
      return `<text x="${scaled[i].x.toFixed(1)}" y="${height - 4}" font-size="10" ` +
        `fill="var(--text-muted)" text-anchor="middle">${escapeHtml(bucket.label)}</text>`;
    })
    .join('');

  return (
    open +
    `<path d="${line} L${width},${height - 18} L0,${height - 18} Z" fill="var(--blue-fg)" fill-opacity="0.08"/>` +
    `<path d="${line}" fill="none" stroke="var(--blue-fg)" stroke-width="2" stroke-linejoin="round"/>` +
    labels +
    `</svg>`
  );
}
```

Egészítsd ki az `assets/style.css`-t a sávokhoz:

```css
.chart { width: 100%; height: auto; display: block; }
.bar-row { display: grid; grid-template-columns: 160px 1fr; gap: 12px; align-items: center; margin-bottom: 10px; }
.bar-label { font-size: 13px; color: var(--text-muted); }
.bar-track { height: 8px; background: var(--canvas); border-radius: 4px; overflow: hidden; }
.bar-fill { display: block; height: 100%; border-radius: 4px; transition: width 600ms var(--ease); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/chart.test.js`
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add assets/chart.js assets/style.css test/chart.test.js
git commit -m "feat: SVG grafikon-primitívek"
```

---

### Task 7: `Most` nézet

**Files:**
- Create: `assets/views/now.js`
- Test: `test/view-now.test.js`

**Interfaces:**
- Consumes: `strings` (Task 1), `icons` (Task 1), `format.js` (Task 3), `humanize.js` (Task 4), `chart.js` (Task 6), `staleness` (Task 5)
- Produces: `render(data) → string`, `mount(root, data)` (itt nincs esemény, ezért `mount` elhagyható)

- [ ] **Step 1: Write the failing test**

`test/view-now.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../assets/views/now.js';

const oneRow = [{
  ts: '2026-08-21T09:31:30Z', networks: 141, ports: 188,
  peak_gbps: 1116.82, current_gbps: 718.5, capacity_gbps: 8358,
}];

const manyRows = Array.from({ length: 40 }, (_, i) => ({
  ts: `2026-08-21T${String(i % 24).padStart(2, '0')}:00:00Z`,
  networks: 141, ports: 188, peak_gbps: 1116.82,
  current_gbps: 600 + i, capacity_gbps: 8358,
}));

const meta = { traffic: { last_success: '2026-08-21T09:31:30Z', last_error: null } };

test('a legutolsó mérést mutatja nagyban', () => {
  const html = render({ traffic: oneRow, meta, members: [], ports: [] });
  assert.ok(html.includes('718,50'));
});

// FIGYELEM: `<path`-ra nem szabad asszertálni — az ikonok SVG-jei is
// tartalmaznak path elemet. A grafikont a `class="chart"` azonosítja.
test('egyetlen mérésnél nem rajzol grafikont, hanem kiírja hogy most indult', () => {
  const html = render({ traffic: oneRow, meta, members: [], ports: [] });
  assert.ok(html.includes('Az idősor most indult'));
  assert.ok(!html.includes('class="chart"'));
});

test('elég adatnál grafikont rajzol', () => {
  const html = render({ traffic: manyRows, meta, members: [], ports: [] });
  assert.ok(html.includes('class="chart"'));
  assert.ok(!html.includes('Az idősor most indult'));
});

test('üres adatnál sem dob, és nem mutat számot', () => {
  const html = render({ traffic: [], meta: {}, members: [], ports: [] });
  assert.ok(typeof html === 'string');
  assert.ok(html.length > 0);
});

test('nincs benne emoji', () => {
  const html = render({ traffic: manyRows, meta, members: [], ports: [] });
  assert.ok(!/\p{Extended_Pictographic}/u.test(html), 'emoji került a kimenetbe');
});

test('a kihasználtság három sávját mutatja', () => {
  const html = render({ traffic: oneRow, meta, members: [], ports: [] });
  assert.ok(html.includes('most'));
  assert.ok(html.includes('valaha mért csúcs'));
  assert.ok(html.includes('beépített kapacitás'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/view-now.test.js`
Expected: FAIL — `Cannot find module '../assets/views/now.js'`

- [ ] **Step 3: Write minimal implementation**

`assets/views/now.js`:

```js
import strings from '../strings.hu.js';
import icons from '../icons.js';
import { formatDecimal, formatInt, formatPercent, formatRelative } from '../format.js';
import { concurrent4kStreams, gigabytesPerSecond, utilizationPercent } from '../humanize.js';
import { areaChart, barRow, escapeHtml } from '../chart.js';

const MIN_POINTS_FOR_CHART = 4;
const s = strings.now;

function humanCard(icon, value, text) {
  return (
    `<div class="card human-card reveal">` +
    `<span class="human-icon">${icon}</span>` +
    `<div class="human-value">${value}</div>` +
    `<p class="human-text">${escapeHtml(text)}</p>` +
    `</div>`
  );
}

export function render(data) {
  const rows = data.traffic ?? [];
  if (rows.length === 0) {
    return `<section class="section"><p class="note note--warning">${escapeHtml(
      strings.footer.stale.replace('{when}', '—')
    )}</p></section>`;
  }

  const latest = rows[rows.length - 1];
  const util = utilizationPercent(latest.current_gbps, latest.capacity_gbps);

  const chartOrNotice =
    rows.length >= MIN_POINTS_FOR_CHART
      ? areaChart({
          points: rows.map((row, i) => ({ x: i, y: row.current_gbps })),
          width: 720,
          height: 140,
        })
      : `<div class="note note--info reveal">` +
        `<strong>${escapeHtml(s.seriesStarting)}</strong><br>` +
        escapeHtml(
          s.seriesStartingBody
            .replace('{count}', formatInt(rows.length))
            .replace('{since}', formatRelative(rows[0].ts, new Date()))
        ) +
        `</div>`;

  return (
    `<section class="section hero">` +
      `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
      `<div class="hero-number mono">${formatDecimal(latest.current_gbps)}` +
        `<span class="hero-unit">${escapeHtml(s.unit)}</span></div>` +
      chartOrNotice +
    `</section>` +

    `<section class="section reveal">` +
      `<p class="eyebrow">${escapeHtml(s.utilization)}</p>` +
      barRow({ label: s.current, value: latest.current_gbps, max: latest.capacity_gbps }) +
      barRow({ label: s.peak, value: latest.peak_gbps, max: latest.capacity_gbps }) +
      barRow({ label: s.capacity, value: latest.capacity_gbps, max: latest.capacity_gbps, accent: 'var(--border)' }) +
      `<p class="note note--warning reveal">${icons.info} <strong>${escapeHtml(s.didYouKnow)}</strong> ` +
        `${escapeHtml(s.capacityNote)} (${formatPercent(util)})</p>` +
    `</section>` +

    `<section class="section">` +
      `<p class="eyebrow">${escapeHtml(s.humanScale)}</p>` +
      `<div class="human-grid">` +
        humanCard(icons.stream, formatInt(concurrent4kStreams(latest.current_gbps)),
          'egyidejű 4K stream férne bele a jelenlegi forgalomba') +
        humanCard(icons.storage, `${formatInt(Math.round(gigabytesPerSecond(latest.current_gbps)))} GB`,
          'adat halad át minden egyes másodpercben') +
        humanCard(icons.network, formatInt(latest.networks),
          'hálózat kapcsolódik a BIX-hez, ' + formatInt(latest.ports) + ' porton keresztül') +
      `</div>` +
    `</section>`
  );
}
```

Egészítsd ki az `assets/style.css`-t:

```css
.hero-number { font-size: 72px; font-weight: 600; letter-spacing: -0.04em; line-height: 1; }
.hero-unit { font-size: 20px; color: var(--text-muted); margin-left: 8px; font-family: var(--font-sans); }
.human-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.human-icon { display: block; width: 22px; height: 22px; color: var(--blue-fg); margin-bottom: 12px; }
.human-icon svg { width: 100%; height: 100%; }
.human-value { font-family: var(--font-mono); font-size: 24px; font-weight: 500; letter-spacing: -0.02em; }
.human-text { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.note svg { width: 16px; height: 16px; vertical-align: -3px; margin-right: 6px; }
@media (max-width: 768px) { .human-grid { grid-template-columns: 1fr; } .hero-number { font-size: 48px; } }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/view-now.test.js`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add assets/views/now.js assets/style.css test/view-now.test.js
git commit -m "feat: Most nézet"
```

---

### Task 8: `Tagok` nézet és port-mátrix

**Files:**
- Create: `assets/views/members.js`
- Test: `test/view-members.test.js`

**Interfaces:**
- Consumes: `strings`, `format.js`, `chart.js` (`escapeHtml`)
- Produces:
  - `render(data) → string`
  - `mount(root, data)` — szűrők és keresés eseménykötése
  - `filterMembers(members, { query, node, bandwidth, policy }) → Array` — tiszta függvény, külön tesztelve
  - `bandwidthClass(mbps) → string` — a mátrix cellájának színosztálya

- [ ] **Step 1: Write the failing test**

`test/view-members.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, filterMembers, bandwidthClass } from '../assets/views/members.js';

const members = [
  { asn: 3244, name: '3C Telecom', website: null, policy: 'Open/Free', first_seen: '2010-07-29T00:00:00Z',
    is_rs_peer: true, ipv6: null, sources: ['bix', 'peeringdb'],
    ports: [{ node: 'VH', ipv4: '193.188.137.18', bandwidth_mbps: 1000, note: 'Backup Link', graph_id: 'a' }] },
  { asn: 13335, name: 'Cloudflare', website: null, policy: 'Selective', first_seen: '2017-02-10T15:02:18Z',
    is_rs_peer: false, ipv6: null, sources: ['bix', 'peeringdb'],
    ports: [{ node: 'Digital Realty (InterXion VIE1)', ipv4: '193.188.137.27', bandwidth_mbps: 200000, note: null, graph_id: 'b' }] },
  { asn: 65002, name: 'AS65002', website: null, policy: null, first_seen: '2021-03-03T00:00:00Z',
    is_rs_peer: false, ipv6: null, sources: ['peeringdb'], ports: [] },
];

const data = { members, ports: members.flatMap((m) => m.ports.map((p) => ({ ...p, asn: m.asn, member: m.name }))), traffic: [], meta: {} };

test('szűretlenül minden tagot visszaad', () => {
  assert.equal(filterMembers(members, {}).length, 3);
});

test('név szerint szűr, kis- és nagybetűtől függetlenül', () => {
  assert.deepEqual(filterMembers(members, { query: 'cloud' }).map((m) => m.asn), [13335]);
});

test('ASN szerint is keres', () => {
  assert.deepEqual(filterMembers(members, { query: '3244' }).map((m) => m.asn), [3244]);
});

test('node szerint szűr', () => {
  assert.deepEqual(filterMembers(members, { node: 'VH' }).map((m) => m.asn), [3244]);
});

test('policy szerint szűr', () => {
  assert.deepEqual(filterMembers(members, { policy: 'Selective' }).map((m) => m.asn), [13335]);
});

test('sávszélesség szerint szűr', () => {
  assert.deepEqual(filterMembers(members, { bandwidth: 200000 }).map((m) => m.asn), [13335]);
});

test('a port nélküli tag kiesik node-szűrésnél', () => {
  assert.ok(!filterMembers(members, { node: 'VH' }).some((m) => m.asn === 65002));
});

test('a sávszélesség-osztály a nagyságrendet követi', () => {
  assert.notEqual(bandwidthClass(1000), bandwidthClass(100000));
  assert.equal(bandwidthClass(1000), bandwidthClass(1000));
});

test('a render kiírja a lefedettségi figyelmeztetést', () => {
  const html = render(data);
  assert.ok(html.includes('78') || html.includes('%'));
});

test('a render escapeli a tagneveket', () => {
  const evil = [{ ...members[0], name: '<img onerror=alert(1)>' }];
  const html = render({ ...data, members: evil });
  assert.ok(!html.includes('<img onerror'));
});

test('nincs benne emoji', () => {
  assert.ok(!/\p{Extended_Pictographic}/u.test(render(data)));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/view-members.test.js`
Expected: FAIL — `Cannot find module '../assets/views/members.js'`

- [ ] **Step 3: Write minimal implementation**

`assets/views/members.js`:

```js
import strings from '../strings.hu.js';
import { formatBandwidth, formatInt, formatPercent } from '../format.js';
import { escapeHtml } from '../chart.js';

const s = strings.members;

// A főoldal által jelentett teljes portszám; a /statisztika ennél kevesebbet
// listáz, és ezt a különbséget láthatóvá kell tenni (spec 3.2).
const TOTAL_PORTS_REPORTED = 188;

export function bandwidthClass(mbps) {
  if (mbps >= 100000) return 'bw-xl';
  if (mbps >= 10000) return 'bw-l';
  if (mbps >= 2000) return 'bw-m';
  return 'bw-s';
}

export function filterMembers(members, { query = '', node = '', bandwidth = '', policy = '' } = {}) {
  const needle = String(query).trim().toLowerCase();

  return members.filter((member) => {
    if (needle) {
      const haystack = `${member.name} ${member.asn}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (node && !member.ports.some((p) => p.node === node)) return false;
    if (bandwidth && !member.ports.some((p) => p.bandwidth_mbps === Number(bandwidth))) return false;
    if (policy && member.policy !== policy) return false;
    return true;
  });
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function select(id, allLabel, options, format = (v) => v) {
  const items = options
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(format(value))}</option>`)
    .join('');
  return `<select id="${id}" class="filter"><option value="">${escapeHtml(allLabel)}</option>${items}</select>`;
}

function matrix(ports) {
  const cells = ports
    .map((port) => {
      const title = `${port.member} — ${port.node} — ${formatBandwidth(port.bandwidth_mbps)}`;
      return `<i class="cell ${bandwidthClass(port.bandwidth_mbps)}" title="${escapeHtml(title)}"></i>`;
    })
    .join('');
  return `<div class="matrix">${cells}</div>`;
}

function rows(members) {
  if (members.length === 0) return `<tr><td colspan="5">${escapeHtml(s.noResults)}</td></tr>`;

  return members
    .map((member) => {
      const nodes = uniqueSorted(member.ports.map((p) => p.node)).join(', ');
      const bandwidths = member.ports.map((p) => formatBandwidth(p.bandwidth_mbps)).join(', ');
      const onlyPdb = member.sources.length === 1 && member.sources[0] === 'peeringdb';
      const badge = onlyPdb ? ` <span class="badge">${escapeHtml(s.onlyPeeringdb)}</span>` : '';

      return (
        `<tr>` +
        `<td>${escapeHtml(member.name)}${badge}</td>` +
        `<td class="num asn">AS${member.asn}</td>` +
        `<td>${escapeHtml(nodes || '—')}</td>` +
        `<td class="num">${escapeHtml(bandwidths || '—')}</td>` +
        `<td>${escapeHtml(member.policy || '—')}</td>` +
        `</tr>`
      );
    })
    .join('');
}

export function render(data) {
  const members = data.members ?? [];
  const ports = data.ports ?? [];
  const coverage = TOTAL_PORTS_REPORTED > 0 ? (ports.length / TOTAL_PORTS_REPORTED) * 100 : 0;

  const warning = s.coverageWarning
    .replace('{shown}', formatInt(ports.length))
    .replace('{total}', formatInt(TOTAL_PORTS_REPORTED))
    .replace('{percent}', formatPercent(coverage, 0).replace('%', ''));

  return (
    `<section class="section">` +
      `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
      `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
      `<p class="note note--warning reveal">${escapeHtml(warning)}</p>` +
    `</section>` +

    `<section class="section reveal">` +
      `<p class="eyebrow">${escapeHtml(s.matrixTitle)}</p>` +
      `<p class="hint">${escapeHtml(s.matrixHint)}</p>` +
      matrix(ports) +
    `</section>` +

    `<section class="section">` +
      `<div class="filters">` +
        `<input id="f-query" class="filter" type="search" placeholder="${escapeHtml(s.searchPlaceholder)}">` +
        select('f-node', s.allNodes, uniqueSorted(ports.map((p) => p.node))) +
        select('f-bandwidth', s.allBandwidths,
          [...new Set(ports.map((p) => p.bandwidth_mbps))].sort((a, b) => a - b), formatBandwidth) +
        select('f-policy', s.allPolicies, uniqueSorted(members.map((m) => m.policy))) +
      `</div>` +
      `<table class="table"><thead><tr>` +
        `<th>${escapeHtml(s.columns.name)}</th>` +
        `<th>${escapeHtml(s.columns.asn)}</th>` +
        `<th>${escapeHtml(s.columns.node)}</th>` +
        `<th>${escapeHtml(s.columns.bandwidth)}</th>` +
        `<th>${escapeHtml(s.columns.policy)}</th>` +
      `</tr></thead><tbody id="member-rows">${rows(members)}</tbody></table>` +
    `</section>`
  );
}

export function mount(root, data) {
  const tbody = root.querySelector('#member-rows');
  const inputs = ['f-query', 'f-node', 'f-bandwidth', 'f-policy'].map((id) => root.querySelector(`#${id}`));

  function apply() {
    const [query, node, bandwidth, policy] = inputs.map((el) => el.value);
    tbody.innerHTML = rows(filterMembers(data.members ?? [], { query, node, bandwidth, policy }));
  }

  for (const el of inputs) el.addEventListener('input', apply);
}
```

Egészítsd ki az `assets/style.css`-t:

```css
.filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.filter {
  font: inherit; font-size: 13px; padding: 7px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-button);
  background: var(--surface); color: var(--text);
}
.filter:focus { outline: 2px solid var(--blue-bg); outline-offset: 1px; }

.matrix { display: grid; grid-template-columns: repeat(auto-fill, minmax(14px, 1fr)); gap: 3px; }
.cell { aspect-ratio: 1; border-radius: 2px; display: block; transition: transform 200ms var(--ease); }
.cell:hover { transform: scale(1.35); }
.bw-s  { background: #EDF2F7; }
.bw-m  { background: #C7DFF3; }
.bw-l  { background: #7FB6E0; }
.bw-xl { background: var(--blue-fg); }

.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th {
  text-align: left; font-size: 10px; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text-muted); font-weight: 500;
  padding: 8px 12px 8px 0; border-bottom: 1px solid var(--border);
}
.table td { padding: 9px 12px 9px 0; border-bottom: 1px solid var(--border); }
.badge {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em;
  background: var(--yellow-bg); color: var(--yellow-fg);
  padding: 2px 8px; border-radius: 9999px;
}
.hint { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/view-members.test.js`
Expected: PASS — 11 tests

- [ ] **Step 5: Commit**

```bash
git add assets/views/members.js assets/style.css test/view-members.test.js
git commit -m "feat: Tagok nézet, port-mátrix és szűrők"
```

---

### Task 9: `Növekedés` nézet

**Files:**
- Create: `assets/views/growth.js`
- Test: `test/view-growth.test.js`

**Interfaces:**
- Consumes: `strings`, `format.js`, `chart.js`
- Produces:
  - `render(data) → string`
  - `bucketByYear(members) → Array<{ label: string, value: number }>` — a `first_seen` évek szerint, hiányzó dátum kihagyva

- [ ] **Step 1: Write the failing test**

`test/view-growth.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, bucketByYear } from '../assets/views/growth.js';

const members = [
  { asn: 1, name: 'A', policy: 'Open/Free', first_seen: '2010-07-29T00:00:00Z', sources: ['peeringdb'], ports: [{ node: 'VH', bandwidth_mbps: 1000 }] },
  { asn: 2, name: 'B', policy: 'Open/Free', first_seen: '2010-11-01T00:00:00Z', sources: ['peeringdb'], ports: [{ node: 'VH', bandwidth_mbps: 10000 }] },
  { asn: 3, name: 'C', policy: 'Selective', first_seen: '2017-02-10T00:00:00Z', sources: ['peeringdb'], ports: [{ node: 'Digital Realty (InterXion VIE1)', bandwidth_mbps: 100000 }] },
  { asn: 4, name: 'D', policy: 'Open/Free', first_seen: null, sources: ['bix'], ports: [{ node: 'VH', bandwidth_mbps: 1000 }] },
];

const data = { members, ports: members.flatMap((m) => m.ports), traffic: [], meta: {} };

test('évek szerint csoportosít', () => {
  assert.deepEqual(bucketByYear(members), [
    { label: '2010', value: 2 },
    { label: '2011', value: 0 },
    { label: '2012', value: 0 },
    { label: '2013', value: 0 },
    { label: '2014', value: 0 },
    { label: '2015', value: 0 },
    { label: '2016', value: 0 },
    { label: '2017', value: 1 },
  ]);
});

test('a first_seen nélküli tagot kihagyja', () => {
  assert.equal(bucketByYear(members).reduce((sum, b) => sum + b.value, 0), 3);
});

test('üres bemenetre üres tömb', () => {
  assert.deepEqual(bucketByYear([]), []);
});

test('a felirat NEM nevezi csatlakozásnak a PeeringDB dátumot', () => {
  const html = render(data);
  assert.ok(html.includes('PeeringDB-ben megjelent'));
  assert.ok(!/\bcsatlakozott\b/.test(html), 'a created mezőt tilos csatlakozásként feliratozni');
});

test('kiírja a bécsi node figyelmeztetést', () => {
  assert.ok(render(data).includes('Bécsben'));
});

test('nincs benne emoji', () => {
  assert.ok(!/\p{Extended_Pictographic}/u.test(render(data)));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/view-growth.test.js`
Expected: FAIL — `Cannot find module '../assets/views/growth.js'`

- [ ] **Step 3: Write minimal implementation**

`assets/views/growth.js`:

```js
import strings from '../strings.hu.js';
import { formatBandwidth, formatInt } from '../format.js';
import { cumulativeChart, barRow, escapeHtml } from '../chart.js';

const s = strings.growth;

export function bucketByYear(members) {
  const years = members.map((m) => m.first_seen).filter(Boolean).map((d) => Number(d.slice(0, 4)));
  if (years.length === 0) return [];

  const min = Math.min(...years);
  const max = Math.max(...years);
  const counts = new Map();
  for (const year of years) counts.set(year, (counts.get(year) ?? 0) + 1);

  const buckets = [];
  for (let year = min; year <= max; year++) {
    buckets.push({ label: String(year), value: counts.get(year) ?? 0 });
  }
  return buckets;
}

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function render(data) {
  const members = data.members ?? [];
  const ports = data.ports ?? [];

  const buckets = bucketByYear(members);
  const byBandwidth = countBy(ports, 'bandwidth_mbps').sort((a, b) => a[0] - b[0]);
  const byNode = countBy(ports, 'node');
  const maxNode = Math.max(1, ...byNode.map(([, count]) => count));
  const maxBandwidth = Math.max(1, ...byBandwidth.map(([, count]) => count));

  return (
    `<section class="section">` +
      `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
      `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
    `</section>` +

    `<section class="section reveal">` +
      `<p class="eyebrow">${escapeHtml(s.curveTitle)}</p>` +
      cumulativeChart({ buckets, width: 860, height: 200 }) +
      `<p class="note note--info">${escapeHtml(s.curveCaption)}</p>` +
    `</section>` +

    `<section class="section reveal">` +
      `<p class="eyebrow">${escapeHtml(s.bandwidthTitle)}</p>` +
      byBandwidth
        .map(([mbps, count]) =>
          barRow({ label: `${formatBandwidth(mbps)} — ${formatInt(count)} port`, value: count, max: maxBandwidth })
        )
        .join('') +
    `</section>` +

    `<section class="section reveal">` +
      `<p class="eyebrow">${escapeHtml(s.nodeTitle)}</p>` +
      byNode
        .map(([node, count]) =>
          barRow({ label: `${node} — ${formatInt(count)}`, value: count, max: maxNode })
        )
        .join('') +
      `<p class="note note--warning">${escapeHtml(s.viennaNote)}</p>` +
    `</section>`
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/view-growth.test.js`
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add assets/views/growth.js test/view-growth.test.js
git commit -m "feat: Növekedés nézet"
```

---

### Task 10: Összekötés, lábléc és GitHub Pages

**Files:**
- Modify: `assets/app.js` — boot-hívás beillesztése
- Modify: `assets/style.css` — lábléc

**Interfaces:**
- Consumes: minden korábbi modul
- Produces: működő, élő oldal

- [ ] **Step 1: `assets/app.js` kiegészítése**

Illeszd az `app.js` **aljára**:

```js
import { loadAll, staleness } from './data.js';
import { formatRelative } from './format.js';
import * as now from './views/now.js';
import * as members from './views/members.js';
import * as growth from './views/growth.js';

function renderFooter(data) {
  const state = staleness(data.meta, 'traffic', new Date());
  const last = data.meta?.traffic?.last_success;
  const line = state.isStale
    ? strings.footer.stale.replace('{when}', formatRelative(last, new Date()) || '—')
    : strings.footer.updated.replace('{when}', formatRelative(last, new Date()));

  document.getElementById('footer').innerHTML =
    `<p>${line}</p><p>${strings.footer.independent}</p><p>${strings.footer.sources}</p>`;

  const badge = document.getElementById('live-badge');
  badge.textContent = state.isStale ? '' : strings.live;
  badge.hidden = state.isStale;
}

const data = await loadAll((url) => fetch(url));
boot({ views: { now, members, growth }, data });
renderFooter(data);
```

- [ ] **Step 2: Lábléc stílus**

```css
.site-footer {
  max-width: 1120px; margin: 0 auto; padding: 32px;
  border-top: 1px solid var(--border);
  font-size: 12px; color: var(--text-muted); line-height: 1.8;
}
```

- [ ] **Step 3: Teljes tesztfuttatás**

Run: `npm test`
Expected: PASS — 46 (pipeline) + 46 (weboldal) = **92 teszt**

- [ ] **Step 4: Helyi ellenőrzés**

```bash
python -m http.server 8000
```

Nyisd meg a `http://localhost:8000` címet, és nézd végig mind a három fület. Expected:
- `Most`: nagy szám, „Az idősor most indult" doboz (amíg 4-nél kevesebb mérés van), három kihasználtsági sáv, három emberi léptékű kártya SVG ikonnal
- `Tagok`: lefedettségi figyelmeztetés, port-mátrix hoverrel, működő szűrők
- `Növekedés`: kumulatív görbe, sávszélesség- és node-eloszlás, bécsi figyelmeztetés

- [ ] **Step 5: Commit és push**

```bash
git add assets/ && git commit -m "feat: nézetek összekötése és lábléc" && git push
```

- [ ] **Step 6: GitHub Pages bekapcsolása**

A GitHub felületén: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.

Egy-két perc múlva az oldal a `https://virtualmokus.github.io/bix/` címen érhető el.

**Ellenőrzés:** nyisd meg, és nézd meg a böngésző konzolját. Ha a `data/…` letöltés 404-et ad, a Pages még nem szinkronizált — várj egy percet és frissíts.

---

## Mi marad ezután

- **Port-mátrix átszínezése.** A spec 7.2 „kapacitás / node / policy szerint színezve" lehetőséget említ; a v1-ben a mátrix **kizárólag kapacitás szerint** színez, a node és a policy a szűrőkön keresztül érhető el. A színezés-váltó kapcsoló későbbi bővítés.
- **Sötét téma** — a `minimalist-ui` warm monokróm palettájának sötét párja, témakapcsolóval.
- **`Térkép` fül** — a tagok országa szerint, ha lesz hozzá adatforrás (spec 11.).
- **`Mi ez?` fül** — statikus magyarázó oldal a peeringről.
- **Forgalmi grafikon gazdagítása** — napi/heti/havi nézet, amint a `traffic.csv` elég adatot gyűjtött.
