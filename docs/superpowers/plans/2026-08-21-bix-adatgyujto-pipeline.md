# BIX adatgyűjtő pipeline — implementációs terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatikusan futó adatgyűjtő, ami 15 percenként rögzíti a BIX aggregát forgalmi számait, naponta pedig a port-szintű szerkezetet és a PeeringDB csatlakozási történetet, majd mindezt commitolja a repóba.

**Architecture:** Tiszta parser-függvények (HTML/JSON be, objektum ki) + vékony gyűjtő-wrapperek, amik I/O-t injektálva tesztelhetők. Négy független gyűjtő, forrásonként izolált hibakezeléssel: az egyik forrás kiesése nem állítja meg a többit. Futtatás GitHub Actions cronból, az adat a repóban ül.

**Tech Stack:** Node 20 (ESM), `cheerio` HTML-parseoláshoz, beépített `node:test` tesztfuttató, GitHub Actions. Nincs build lépés, nincs teszt-framework.

**Spec:** [`docs/superpowers/specs/2026-08-21-bix-dashboard-design.md`](../specs/2026-08-21-bix-dashboard-design.md)

## Global Constraints

- **Node 20+**, ESM modulok (`"type": "module"` a `package.json`-ban). CommonJS `require` nincs.
- **Egyetlen runtime függőség:** `cheerio`. Teszteléshez a beépített `node:test` és `node:assert/strict` — teszt-framework nem kerül be.
- **Nincs build lépés.** Ami a repóban van, az fut.
- **User-Agent minden kimenő HTTP-kérésen:** `bix-dashboard/1.0 (+https://github.com/OWNER/REPO)` — az `OWNER/REPO` a tényleges repó útvonalára cserélendő az 1. feladatban.
- **Minden hibaüzenet magyarul**, és tartalmazza a tényleges értéket, amin elhasalt.
- **Adatfájlok helye:** `data/` a repó gyökerében. A weboldal később innen olvas.
- **Forrás-elsőbbség:** ütközés esetén a `bix.hu` az elsődleges. A PeeringDB-t csak a `created`, `ipaddr6` és `is_rs_peer` mezőkre használjuk. A PeeringDB `speed` mezője **nem** kerül a kimenetbe.
- **Validációs tartományok** (kötelezően pontosan ezek):
  - `0 < current_gbps < 20000`
  - `0 < peak_gbps < 20000`
  - `0 < capacity_gbps < 100000`
  - `networks` és `ports`: pozitív egész
  - `current_gbps <= capacity_gbps`, `peak_gbps <= capacity_gbps`, `ports >= networks`
- **Hallgatólagos hiba tilos.** Parse- vagy validációs hiba esetén a gyűjtő nem ír adatot, hanem nem-nulla exit kóddal kilép.

---

### Task 1: Repó váz és `parse-traffic.js`

**Files:**
- Create: `package.json`, `.gitignore`
- Create: `collect/parse-traffic.js`
- Create: `test/fixtures/traffic-minimal.html`
- Create: `test/fixtures/bix-home.html` (élő mentés)
- Test: `test/parse-traffic.test.js`

**Interfaces:**
- Consumes: semmi
- Produces: `parseTraffic(html: string) → { networks: number, ports: number, peak_gbps: number, current_gbps: number, capacity_gbps: number }`, dob `ParseError`-t. Exportálja a `ParseError` osztályt is.

- [ ] **Step 1: Repó inicializálása**

```bash
git init
npm init -y
npm pkg set type=module
npm pkg set name=bix-dashboard
npm pkg set scripts.test="node --test test/"
npm install cheerio
```

`.gitignore`:

```
node_modules/
.superpowers/
```

- [ ] **Step 2: Élő fixtúra mentése**

```bash
mkdir -p test/fixtures data collect
curl -sS -A "bix-dashboard/1.0" https://www.bix.hu/ -o test/fixtures/bix-home.html
```

Ellenőrzés: `grep -c '<div class="value">' test/fixtures/bix-home.html` → `5`

- [ ] **Step 3: Kézi fixtúra létrehozása**

`test/fixtures/traffic-minimal.html` — ismert értékekkel, hogy a teszt ne függjön az élő számoktól:

```html
<div class="stats hidden-xs">
	<div class="container">
		<div class="stat first">
			<div class="value">141</div>
			<div class="name">hálózat</div>
		</div>
		<div class="stat">
			<div class="value">188</div>
			<div class="name">port</div>
		</div>
		<div class="stat">
			<div class="value">1116.82</div>
			<div class="name">(Gb/s) csúcs</div>
		</div>
		<div class="stat">
			<div class="value">679.68</div>
			<div class="name">(Gb/s) aktuáls</div>
		</div>
		<div class="stat">
			<div class="value">8358</div>
			<div class="name">(Gb/s) kapacitás</div>
		</div>
	</div>
</div>
```

- [ ] **Step 4: Write the failing test**

`test/parse-traffic.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseTraffic, ParseError } from '../collect/parse-traffic.js';

const minimal = await readFile('test/fixtures/traffic-minimal.html', 'utf8');
const live = await readFile('test/fixtures/bix-home.html', 'utf8');

test('kinyeri mind az öt értéket a kézi fixtúrából', () => {
  assert.deepEqual(parseTraffic(minimal), {
    networks: 141,
    ports: 188,
    peak_gbps: 1116.82,
    current_gbps: 679.68,
    capacity_gbps: 8358,
  });
});

test('elfogadja az "aktuális" helyesírást is', () => {
  const fixed = minimal.replace('aktuáls', 'aktuális');
  assert.equal(parseTraffic(fixed).current_gbps, 679.68);
});

test('hibát dob, ha nincs meg mind az öt pár', () => {
  const truncated = minimal.replace(/<div class="stat">\s*<div class="value">8358[\s\S]*?<\/div>\s*<\/div>/, '');
  assert.throws(() => parseTraffic(truncated), ParseError);
});

test('hibát dob, ha a címkék sorrendje más', () => {
  const swapped = minimal
    .replace('>hálózat<', '>ZZZ<')
    .replace('>port<', '>hálózat<');
  assert.throws(() => parseTraffic(swapped), ParseError);
});

test('az élő mentésből is öt valós számot ad', () => {
  const t = parseTraffic(live);
  for (const key of ['networks', 'ports', 'peak_gbps', 'current_gbps', 'capacity_gbps']) {
    assert.ok(Number.isFinite(t[key]), `${key} nem szám: ${t[key]}`);
    assert.ok(t[key] > 0, `${key} nem pozitív: ${t[key]}`);
  }
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `node --test test/parse-traffic.test.js`
Expected: FAIL — `Cannot find module '../collect/parse-traffic.js'`

- [ ] **Step 6: Write minimal implementation**

`collect/parse-traffic.js`:

```js
export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}

// A bix.hu főoldalon pontosan öt ilyen pár van, ebben a sorrendben.
// Az "aktuáls" elgépelés a forrásoldalé — ha egyszer javítják, az
// "aktuális" változatot is elfogadjuk.
const LABELS = [
  { key: 'networks',      accept: ['hálózat'] },
  { key: 'ports',         accept: ['port'] },
  { key: 'peak_gbps',     accept: ['(gb/s) csúcs'] },
  { key: 'current_gbps',  accept: ['(gb/s) aktuáls', '(gb/s) aktuális'] },
  { key: 'capacity_gbps', accept: ['(gb/s) kapacitás'] },
];

const PAIR_RE =
  /<div class="value">\s*([0-9]+(?:\.[0-9]+)?)\s*<\/div>\s*<div class="name">\s*([^<]+?)\s*<\/div>/g;

export function parseTraffic(html) {
  const pairs = [...html.matchAll(PAIR_RE)].map((m) => ({
    value: Number(m[1]),
    label: m[2].toLowerCase().replace(/\s+/g, ' ').trim(),
  }));

  if (pairs.length !== LABELS.length) {
    throw new ParseError(
      `${LABELS.length} érték/címke párt vártam, ${pairs.length} volt: ` +
        pairs.map((p) => p.label).join(' | ')
    );
  }

  const out = {};
  for (let i = 0; i < LABELS.length; i++) {
    const { key, accept } = LABELS[i];
    const pair = pairs[i];
    if (!accept.includes(pair.label)) {
      throw new ParseError(
        `A(z) ${i + 1}. mező címkéje "${pair.label}", vártam: ${accept.join(' vagy ')}`
      );
    }
    out[key] = pair.value;
  }
  return out;
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `node --test test/parse-traffic.test.js`
Expected: PASS — 5 tests

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .gitignore collect/parse-traffic.js test/
git commit -m "feat: bix.hu főoldal forgalmi parser"
```

---

### Task 2: `validate.js` — forgalmi validáció

**Files:**
- Create: `collect/validate.js`
- Test: `test/validate.test.js`

**Interfaces:**
- Consumes: `parseTraffic` kimeneti alakja (Task 1)
- Produces: `validateTraffic(t) → t` (visszaadja a bemenetet, ha érvényes), dob `ValidationError`-t. Exportálja a `ValidationError` osztályt.

- [ ] **Step 1: Write the failing test**

`test/validate.test.js`:

```js
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
  assert.throws(
    () => validateTraffic({ ...valid, current_gbps: 9000 }),
    ValidationError
  );
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/validate.test.js`
Expected: FAIL — `Cannot find module '../collect/validate.js'`

- [ ] **Step 3: Write minimal implementation**

`collect/validate.js`:

```js
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

const RANGES = {
  current_gbps: { min: 0, max: 20000 },
  peak_gbps: { min: 0, max: 20000 },
  capacity_gbps: { min: 0, max: 100000 },
};

export function validateTraffic(t) {
  for (const [key, { min, max }] of Object.entries(RANGES)) {
    const v = t[key];
    if (!Number.isFinite(v) || v <= min || v >= max) {
      throw new ValidationError(`${key} tartományon kívül: ${v} (várt: ${min} < x < ${max})`);
    }
  }

  for (const key of ['networks', 'ports']) {
    const v = t[key];
    if (!Number.isInteger(v) || v <= 0) {
      throw new ValidationError(`${key} nem pozitív egész: ${v}`);
    }
  }

  if (t.current_gbps > t.capacity_gbps) {
    throw new ValidationError(`aktuális (${t.current_gbps}) meghaladja a kapacitást (${t.capacity_gbps})`);
  }
  if (t.peak_gbps > t.capacity_gbps) {
    throw new ValidationError(`csúcs (${t.peak_gbps}) meghaladja a kapacitást (${t.capacity_gbps})`);
  }
  if (t.ports < t.networks) {
    throw new ValidationError(`port (${t.ports}) kevesebb, mint hálózat (${t.networks})`);
  }

  return t;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/validate.test.js`
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add collect/validate.js test/validate.test.js
git commit -m "feat: forgalmi mérés validációja"
```

---

### Task 3: `csv.js` — append-only idősor

**Files:**
- Create: `collect/csv.js`
- Test: `test/csv.test.js`

**Interfaces:**
- Consumes: `parseTraffic` kimeneti alakja (Task 1)
- Produces:
  - `CSV_HEADER: string` — `'ts,networks,ports,peak_gbps,current_gbps,capacity_gbps'`
  - `toCsvRow(ts: string, t) → string`
  - `appendTrafficRow(path: string, ts: string, t) → Promise<void>` — ha a fájl nem létezik, előbb kiírja a fejlécet

- [ ] **Step 1: Write the failing test**

`test/csv.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CSV_HEADER, toCsvRow, appendTrafficRow } from '../collect/csv.js';

const t = {
  networks: 141,
  ports: 188,
  peak_gbps: 1116.82,
  current_gbps: 679.68,
  capacity_gbps: 8358,
};

test('a sor a fejléc oszlopsorrendjét követi', () => {
  assert.equal(
    toCsvRow('2026-08-21T21:45:00Z', t),
    '2026-08-21T21:45:00Z,141,188,1116.82,679.68,8358'
  );
});

test('új fájlba fejlécet és egy sort ír', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bix-'));
  const path = join(dir, 'traffic.csv');

  await appendTrafficRow(path, '2026-08-21T21:45:00Z', t);

  const content = await readFile(path, 'utf8');
  assert.equal(content, `${CSV_HEADER}\n2026-08-21T21:45:00Z,141,188,1116.82,679.68,8358\n`);
});

test('meglévő fájlhoz fűz, nem ír új fejlécet', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bix-'));
  const path = join(dir, 'traffic.csv');

  await appendTrafficRow(path, '2026-08-21T21:45:00Z', t);
  await appendTrafficRow(path, '2026-08-21T22:00:00Z', { ...t, current_gbps: 701.2 });

  const lines = (await readFile(path, 'utf8')).trim().split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], CSV_HEADER);
  assert.ok(lines[2].endsWith('701.2,8358'));
});

test('nem ír duplán fejlécet, ha a fájl már létezik de üres sorral kezdődik', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bix-'));
  const path = join(dir, 'traffic.csv');
  await writeFile(path, `${CSV_HEADER}\n`, 'utf8');

  await appendTrafficRow(path, '2026-08-21T21:45:00Z', t);

  const lines = (await readFile(path, 'utf8')).trim().split('\n');
  assert.equal(lines.length, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/csv.test.js`
Expected: FAIL — `Cannot find module '../collect/csv.js'`

- [ ] **Step 3: Write minimal implementation**

`collect/csv.js`:

```js
import { appendFile, writeFile, access } from 'node:fs/promises';

export const CSV_HEADER = 'ts,networks,ports,peak_gbps,current_gbps,capacity_gbps';

export function toCsvRow(ts, t) {
  return [ts, t.networks, t.ports, t.peak_gbps, t.current_gbps, t.capacity_gbps].join(',');
}

export async function appendTrafficRow(path, ts, t) {
  let exists = true;
  try {
    await access(path);
  } catch {
    exists = false;
  }
  if (!exists) {
    await writeFile(path, `${CSV_HEADER}\n`, 'utf8');
  }
  await appendFile(path, `${toCsvRow(ts, t)}\n`, 'utf8');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/csv.test.js`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add collect/csv.js test/csv.test.js
git commit -m "feat: append-only CSV idősor"
```

---

### Task 4: `meta.js` — forrásonkénti állapot

**Files:**
- Create: `collect/meta.js`
- Test: `test/meta.test.js`

**Interfaces:**
- Consumes: semmi
- Produces:
  - `recordSuccess(path: string, source: string, ts: string) → Promise<void>`
  - `recordError(path: string, source: string, ts: string, message: string) → Promise<void>`
  - Fájlalak: `{ "<source>": { "last_success": string|null, "last_error": { "at": string, "message": string }|null } }`

- [ ] **Step 1: Write the failing test**

`test/meta.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { recordSuccess, recordError } from '../collect/meta.js';

async function read(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('sikert rögzít nem létező fájlba', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'bix-')), 'meta.json');

  await recordSuccess(path, 'traffic', '2026-08-21T21:45:00Z');

  assert.deepEqual(await read(path), {
    traffic: { last_success: '2026-08-21T21:45:00Z', last_error: null },
  });
});

test('a siker törli a korábbi hibát', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'bix-')), 'meta.json');

  await recordError(path, 'traffic', '2026-08-21T21:30:00Z', 'HTTP 500');
  await recordSuccess(path, 'traffic', '2026-08-21T21:45:00Z');

  assert.equal((await read(path)).traffic.last_error, null);
});

test('a hiba megőrzi a korábbi sikert', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'bix-')), 'meta.json');

  await recordSuccess(path, 'traffic', '2026-08-21T21:45:00Z');
  await recordError(path, 'traffic', '2026-08-21T22:00:00Z', 'HTTP 500');

  const meta = await read(path);
  assert.equal(meta.traffic.last_success, '2026-08-21T21:45:00Z');
  assert.deepEqual(meta.traffic.last_error, { at: '2026-08-21T22:00:00Z', message: 'HTTP 500' });
});

test('a források nem írják felül egymást', async () => {
  const path = join(await mkdtemp(join(tmpdir(), 'bix-')), 'meta.json');

  await recordSuccess(path, 'traffic', '2026-08-21T21:45:00Z');
  await recordError(path, 'peeringdb', '2026-08-21T03:00:00Z', '429 rate limited');

  const meta = await read(path);
  assert.equal(meta.traffic.last_success, '2026-08-21T21:45:00Z');
  assert.equal(meta.peeringdb.last_error.message, '429 rate limited');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/meta.test.js`
Expected: FAIL — `Cannot find module '../collect/meta.js'`

- [ ] **Step 3: Write minimal implementation**

`collect/meta.js`:

```js
import { readFile, writeFile } from 'node:fs/promises';

async function load(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return {};
  }
}

async function save(path, meta) {
  await writeFile(path, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

export async function recordSuccess(path, source, ts) {
  const meta = await load(path);
  meta[source] = { last_success: ts, last_error: null };
  await save(path, meta);
}

export async function recordError(path, source, ts, message) {
  const meta = await load(path);
  const previous = meta[source] ?? { last_success: null };
  meta[source] = {
    last_success: previous.last_success,
    last_error: { at: ts, message },
  };
  await save(path, meta);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/meta.test.js`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add collect/meta.js test/meta.test.js
git commit -m "feat: forrásonkénti állapotnapló"
```

---

### Task 5: `fetch.js` és `traffic.js` — a forgalmi gyűjtő

**Files:**
- Create: `collect/fetch.js`
- Create: `collect/traffic.js`
- Test: `test/traffic.test.js`

**Interfaces:**
- Consumes: `parseTraffic` (Task 1), `validateTraffic` (Task 2), `appendTrafficRow` (Task 3), `recordSuccess` / `recordError` (Task 4)
- Produces:
  - `fetchText(url, { timeoutMs?, retries? }) → Promise<string>`
  - `fetchJson(url, opts?) → Promise<unknown>`
  - `USER_AGENT: string`
  - `collectTraffic({ fetch?, now?, dataDir? }) → Promise<{ ts, traffic }>` — hiba esetén rögzíti a `meta.json`-ba, majd újradobja

- [ ] **Step 1: Write the failing test**

`test/traffic.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectTraffic } from '../collect/traffic.js';

const html = await readFile('test/fixtures/traffic-minimal.html', 'utf8');
const now = () => new Date('2026-08-21T21:45:00.123Z');

test('lekér, parseol, validál és sort ír', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  const result = await collectTraffic({ fetch: async () => html, now, dataDir });

  assert.equal(result.ts, '2026-08-21T21:45:00Z');
  assert.equal(result.traffic.current_gbps, 679.68);

  const csv = await readFile(join(dataDir, 'traffic.csv'), 'utf8');
  assert.ok(csv.includes('2026-08-21T21:45:00Z,141,188,1116.82,679.68,8358'));

  const meta = JSON.parse(await readFile(join(dataDir, 'meta.json'), 'utf8'));
  assert.equal(meta.traffic.last_success, '2026-08-21T21:45:00Z');
});

test('parse-hiba esetén NEM ír CSV sort', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(
    collectTraffic({ fetch: async () => '<html>semmi</html>', now, dataDir })
  );

  await assert.rejects(readFile(join(dataDir, 'traffic.csv'), 'utf8'));
});

test('parse-hiba esetén rögzíti a hibát a meta.json-ba', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(
    collectTraffic({ fetch: async () => '<html>semmi</html>', now, dataDir })
  );

  const meta = JSON.parse(await readFile(join(dataDir, 'meta.json'), 'utf8'));
  assert.equal(meta.traffic.last_success, null);
  assert.ok(meta.traffic.last_error.message.includes('párt vártam'));
});

test('hálózati hiba esetén NEM ír CSV sort', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(
    collectTraffic({
      fetch: async () => {
        throw new Error('HTTP 503 — https://www.bix.hu/');
      },
      now,
      dataDir,
    })
  );

  await assert.rejects(readFile(join(dataDir, 'traffic.csv'), 'utf8'));
});

test('tartományon kívüli értéknél NEM ír CSV sort', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));
  const zeroed = html.replace('679.68', '0');

  await assert.rejects(collectTraffic({ fetch: async () => zeroed, now, dataDir }));

  await assert.rejects(readFile(join(dataDir, 'traffic.csv'), 'utf8'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/traffic.test.js`
Expected: FAIL — `Cannot find module '../collect/traffic.js'`

- [ ] **Step 3: Write `fetch.js`**

**Az `OWNER/REPO` helyére a tényleges GitHub-útvonal kerül** (pl. `bence/bix-dashboard`). Ez az egyetlen hely a kódban, ahol szerepel; a `git remote get-url origin` megmondja, mi az.

`collect/fetch.js`:

```js
export const USER_AGENT = 'bix-dashboard/1.0 (+https://github.com/OWNER/REPO)';

export async function fetchText(url, { timeoutMs = 20000, retries = 2 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }

  throw lastError;
}

export async function fetchJson(url, opts) {
  return JSON.parse(await fetchText(url, opts));
}
```

- [ ] **Step 4: Write `traffic.js`**

`collect/traffic.js`:

```js
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { parseTraffic } from './parse-traffic.js';
import { validateTraffic } from './validate.js';
import { appendTrafficRow } from './csv.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchText } from './fetch.js';

export const SOURCE_URL = 'https://www.bix.hu/';

export async function collectTraffic({
  fetch = fetchText,
  now = () => new Date(),
  dataDir = 'data',
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const html = await fetch(SOURCE_URL);
    const traffic = validateTraffic(parseTraffic(html));
    await appendTrafficRow(join(dataDir, 'traffic.csv'), ts, traffic);
    await recordSuccess(metaPath, 'traffic', ts);
    return { ts, traffic };
  } catch (err) {
    await recordError(metaPath, 'traffic', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { ts, traffic } = await collectTraffic();
    console.log(`OK ${ts} — ${traffic.current_gbps} Gb/s, ${traffic.ports} port`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/traffic.test.js`
Expected: PASS — 5 tests

- [ ] **Step 6: Éles próba**

Run: `node collect/traffic.js`
Expected: `OK 2026-...Z — <szám> Gb/s, 188 port`, és a `data/traffic.csv` egy fejléccel plusz egy sorral létrejön.

- [ ] **Step 7: Commit**

```bash
git add collect/fetch.js collect/traffic.js test/traffic.test.js data/traffic.csv data/meta.json
git commit -m "feat: forgalmi gyűjtő"
```

---

### Task 6: 15 perces forgalmi workflow

**Files:**
- Create: `.github/workflows/collect-traffic.yml`

**Interfaces:**
- Consumes: `node collect/traffic.js` CLI belépési pont (Task 5)
- Produces: automatikus commitok a `data/traffic.csv` és `data/meta.json` fájlokba

- [ ] **Step 1: Workflow létrehozása**

`.github/workflows/collect-traffic.yml`:

```yaml
name: Forgalmi gyűjtés

on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: bix-data-write
  cancel-in-progress: false

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Mintavétel
        run: node collect/traffic.js

      - name: Commit
        run: |
          git config user.name  "bix-collector"
          git config user.email "bix-collector@users.noreply.github.com"
          git add data/traffic.csv data/meta.json
          git diff --staged --quiet && exit 0
          git commit -m "data: forgalmi mintavétel"
          git pull --rebase --autostash
          git push
```

A `concurrency` csoport neve szándékosan `bix-data-write`, nem a workflow neve: a napi workflow (8. feladat) ugyanezt a csoportot használja, így a két gyűjtő soha nem ír egyszerre a repóba.

- [ ] **Step 2: Push és kézi futtatás**

```bash
git add .github/workflows/collect-traffic.yml
git commit -m "ci: 15 perces forgalmi gyűjtés"
git push -u origin main
```

Ezután a GitHub felületén: **Actions → Forgalmi gyűjtés → Run workflow**.

- [ ] **Step 3: Ellenőrzés**

Expected: a futás zöld, és a repóban megjelenik egy `data: forgalmi mintavétel` commit egy új sorral a `data/traffic.csv`-ben.

Ha piros: nyisd meg a lépés logját. A `HIBA:` sor pontosan megmondja, mi tört el — parse-hiba esetén a tényleges címkéket is kiírja.

- [ ] **Step 4: Commit**

Nincs mit commitolni — a workflow már fent van. Ellenőrizd, hogy a cron aktív: **Actions → Forgalmi gyűjtés** alatt 15 percen belül megjelenik egy ütemezett futás.

---

### Task 7: `parse-ports.js` — a `/statisztika` tábla

**Files:**
- Create: `collect/parse-ports.js`
- Create: `test/fixtures/ports-minimal.html`
- Create: `test/fixtures/bix-statisztika.html` (élő mentés)
- Test: `test/parse-ports.test.js`

**Interfaces:**
- Consumes: `cheerio` (Task 1-ben telepítve), `ParseError` (Task 1-ből újraexportálva)
- Produces:
  - `parseBandwidth(text: string) → number` (Mb/s-ben)
  - `parsePorts(html: string) → Array<{ member: string, website: string|null, asn: number, policy: string, node: string, ipv4: string|null, bandwidth_mbps: number, note: string|null, graph_id: string|null }>`

- [ ] **Step 1: Élő fixtúra mentése**

```bash
curl -sS -A "bix-dashboard/1.0" https://www.bix.hu/statisztika -o test/fixtures/bix-statisztika.html
```

Ellenőrzés: `grep -c 'data-title="AS number"' test/fixtures/bix-statisztika.html` → 130 körüli szám (2026-08-21-én 137).

- [ ] **Step 2: Kézi fixtúra létrehozása**

`test/fixtures/ports-minimal.html` — három sor: két port ugyanahhoz az ASN-hez, egy harmadik weboldal-link nélkül:

```html
<table>
<tr>
	<th>Tag</th><th>AS number</th><th>Peering policy</th><th>Node</th>
	<th>IP</th><th>Sávszélesség</th><th>Megjegyzés</th><th>Megtekint</th>
</tr>
<tr>
	<td><span class="mname"><a href="http://www.3ctelecom.hu" target="_blank">3C Telecom</a></span></td>
	<td data-title="AS number" class="c clearpad">AS3244</td>
	<td data-title="Peering policy" class="c clearpad">Open/Free</td>
	<td data-title="Node" class="c clearpad">VH</td>
	<td><span class="mdata"><i>IPv4 cím:</i> 193.188.137.18</span></td>
	<td data-title="Sávszélesség" class="c clearpad">1G</td>
	<td data-title="Megjegyzés" class="clearpad">Backup Link</td>
	<td data-title="Megtekint" class="c clearpad"><a href="/statisztika/3c_telecom/1c93472e613b32c0eaa37f02f65f10cd"><i class="fa fa-area-chart staticon"></i></a></td>
</tr>
<tr>
	<td><span class="mname"><a href="http://www.3ctelecom.hu" target="_blank">3C Telecom</a></span></td>
	<td data-title="AS number" class="c clearpad">AS3244</td>
	<td data-title="Peering policy" class="c clearpad">Open/Free</td>
	<td data-title="Node" class="c clearpad">VH</td>
	<td><span class="mdata"><i>IPv4 cím:</i> 193.188.137.35</span></td>
	<td data-title="Sávszélesség" class="c clearpad">1G</td>
	<td data-title="Megjegyzés" class="clearpad">1Gbps on 10G</td>
	<td data-title="Megtekint" class="c clearpad"><a href="/statisztika/3c_telecom/42d3fbefd870f8fb15b18b03c73f797f"><i class="fa fa-area-chart staticon"></i></a></td>
</tr>
<tr>
	<td><span class="mname">Névtelen Kft.</span></td>
	<td data-title="AS number" class="c clearpad">AS64500</td>
	<td data-title="Peering policy" class="c clearpad">Selective</td>
	<td data-title="Node" class="c clearpad">Digital Realty (InterXion VIE1)</td>
	<td><span class="mdata"><i>IPv4 cím:</i> 193.188.137.99</span></td>
	<td data-title="Sávszélesség" class="c clearpad">100G</td>
	<td data-title="Megjegyzés" class="clearpad"></td>
	<td data-title="Megtekint" class="c clearpad"></td>
</tr>
</table>
```

- [ ] **Step 3: Write the failing test**

`test/parse-ports.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parsePorts, parseBandwidth, ParseError } from '../collect/parse-ports.js';

const minimal = await readFile('test/fixtures/ports-minimal.html', 'utf8');
const live = await readFile('test/fixtures/bix-statisztika.html', 'utf8');

test('a sávszélességet Mb/s-re váltja', () => {
  assert.equal(parseBandwidth('1G'), 1000);
  assert.equal(parseBandwidth('10G'), 10000);
  assert.equal(parseBandwidth('100G'), 100000);
  assert.equal(parseBandwidth('300G'), 300000);
  assert.equal(parseBandwidth(' 100M '), 100);
});

test('ismeretlen sávszélesség-formátumra hibát dob', () => {
  assert.throws(() => parseBandwidth('gyors'), ParseError);
});

test('a fejlécsort kihagyja', () => {
  assert.equal(parsePorts(minimal).length, 3);
});

test('minden mezőt kinyer az első sorból', () => {
  assert.deepEqual(parsePorts(minimal)[0], {
    member: '3C Telecom',
    website: 'http://www.3ctelecom.hu',
    asn: 3244,
    policy: 'Open/Free',
    node: 'VH',
    ipv4: '193.188.137.18',
    bandwidth_mbps: 1000,
    note: 'Backup Link',
    graph_id: '1c93472e613b32c0eaa37f02f65f10cd',
  });
});

test('a weboldal és a grafikon-link nélküli sort is kezeli', () => {
  const third = parsePorts(minimal)[2];
  assert.equal(third.member, 'Névtelen Kft.');
  assert.equal(third.website, null);
  assert.equal(third.note, null);
  assert.equal(third.graph_id, null);
  assert.equal(third.bandwidth_mbps, 100000);
});

test('ugyanaz az ASN kétszer is szerepelhet', () => {
  const rows = parsePorts(minimal).filter((p) => p.asn === 3244);
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].ipv4, rows[1].ipv4);
});

test('üres bemenetre hibát dob', () => {
  assert.throws(() => parsePorts('<html><body></body></html>'), ParseError);
});

test('az élő mentésből 100-nál több portot ad, minden kötelező mezővel', () => {
  const ports = parsePorts(live);
  assert.ok(ports.length > 100, `csak ${ports.length} port`);
  for (const p of ports) {
    assert.ok(Number.isInteger(p.asn) && p.asn > 0, `rossz ASN: ${p.asn}`);
    assert.ok(p.member.length > 0, 'üres tagnév');
    assert.ok(p.node.length > 0, `üres node: ${p.member}`);
    assert.ok(p.bandwidth_mbps > 0, `rossz sávszélesség: ${p.member}`);
  }
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `node --test test/parse-ports.test.js`
Expected: FAIL — `Cannot find module '../collect/parse-ports.js'`

- [ ] **Step 5: Write minimal implementation**

`collect/parse-ports.js`:

```js
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `node --test test/parse-ports.test.js`
Expected: PASS — 8 tests

- [ ] **Step 7: Commit**

```bash
git add collect/parse-ports.js test/parse-ports.test.js test/fixtures/
git commit -m "feat: /statisztika port-tábla parser"
```

---

### Task 8: `ports.js` és `peeringdb.js` gyűjtők

**Files:**
- Create: `collect/ports.js`
- Create: `collect/peeringdb.js`
- Test: `test/collectors.test.js`

**Interfaces:**
- Consumes: `parsePorts` (Task 7), `fetchText` / `fetchJson` (Task 5), `recordSuccess` / `recordError` (Task 4), `ValidationError` (Task 2)
- Produces:
  - `collectPorts({ fetch?, now?, dataDir? }) → Promise<{ ts, ports }>` → `data/ports.json`
  - `collectPeeringdb({ fetch?, now?, dataDir? }) → Promise<{ ts, records }>` → `data/peeringdb.json`
  - `data/peeringdb.json` alakja: `{ fetched_at: string, records: Array<{ asn, ipaddr6, is_rs_peer, created }> }`

- [ ] **Step 1: Write the failing test**

`test/collectors.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectPorts } from '../collect/ports.js';
import { collectPeeringdb } from '../collect/peeringdb.js';

const liveHtml = await readFile('test/fixtures/bix-statisztika.html', 'utf8');
const minimalHtml = await readFile('test/fixtures/ports-minimal.html', 'utf8');
const now = () => new Date('2026-08-21T03:00:00.000Z');

const pdbPayload = {
  data: [
    {
      asn: 3244,
      speed: 1000,
      ipaddr4: '193.188.137.18',
      ipaddr6: '2001:7f8:35::3:244:1',
      is_rs_peer: true,
      operational: true,
      created: '2010-07-29T00:00:00Z',
      updated: '2016-03-14T21:50:30Z',
    },
    {
      asn: 13335,
      speed: 200000,
      ipaddr4: '193.188.137.27',
      ipaddr6: '2001:7f8:35::1:3335:1',
      is_rs_peer: false,
      operational: true,
      created: '2017-02-10T15:02:18Z',
      updated: '2026-07-06T09:29:51Z',
    },
  ],
};

// A gyűjtő 50 rekord alatt hibát dob (féloldalas válasz elleni védelem),
// ezért a payloadot feltöltjük érdektelen kitöltő rekordokkal.
while (pdbPayload.data.length < 50) {
  pdbPayload.data.push({
    asn: 64500 + pdbPayload.data.length,
    speed: 10000,
    ipaddr4: null,
    ipaddr6: null,
    is_rs_peer: false,
    operational: true,
    created: '2020-01-01T00:00:00Z',
    updated: '2020-01-01T00:00:00Z',
  });
}

test('a port-gyűjtő kiírja a ports.json-t', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  const result = await collectPorts({ fetch: async () => liveHtml, now, dataDir });

  assert.ok(result.ports.length > 100);

  const file = JSON.parse(await readFile(join(dataDir, 'ports.json'), 'utf8'));
  assert.equal(file.fetched_at, '2026-08-21T03:00:00Z');
  assert.equal(file.ports.length, result.ports.length);
});

test('a port-gyűjtő elutasítja a gyanúsan rövid táblát', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(collectPorts({ fetch: async () => minimalHtml, now, dataDir }));

  await assert.rejects(readFile(join(dataDir, 'ports.json'), 'utf8'));
});

test('a PeeringDB gyűjtő csak a megengedett mezőket tartja meg', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await collectPeeringdb({ fetch: async () => pdbPayload, now, dataDir });

  const file = JSON.parse(await readFile(join(dataDir, 'peeringdb.json'), 'utf8'));
  assert.deepEqual(file.records[0], {
    asn: 3244,
    ipaddr6: '2001:7f8:35::3:244:1',
    is_rs_peer: true,
    created: '2010-07-29T00:00:00Z',
  });
  assert.equal(file.records[0].speed, undefined, 'a speed mező nem kerülhet be');
});

test('a PeeringDB gyűjtő hibát dob üres válaszra', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'bix-'));

  await assert.rejects(collectPeeringdb({ fetch: async () => ({ data: [] }), now, dataDir }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/collectors.test.js`
Expected: FAIL — `Cannot find module '../collect/ports.js'`

- [ ] **Step 3: Write `ports.js`**

`collect/ports.js`:

```js
import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parsePorts } from './parse-ports.js';
import { ValidationError } from './validate.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchText } from './fetch.js';

export const SOURCE_URL = 'https://www.bix.hu/statisztika';
const MIN_PORTS = 50;

export async function collectPorts({
  fetch = fetchText,
  now = () => new Date(),
  dataDir = 'data',
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const ports = parsePorts(await fetch(SOURCE_URL));
    if (ports.length < MIN_PORTS) {
      throw new ValidationError(
        `Gyanúsan kevés port: ${ports.length} (legalább ${MIN_PORTS} várt) — féloldalas letöltés?`
      );
    }
    await writeFile(
      join(dataDir, 'ports.json'),
      `${JSON.stringify({ fetched_at: ts, ports }, null, 2)}\n`,
      'utf8'
    );
    await recordSuccess(metaPath, 'ports', ts);
    return { ts, ports };
  } catch (err) {
    await recordError(metaPath, 'ports', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { ports } = await collectPorts();
    console.log(`OK — ${ports.length} port`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Write `peeringdb.js`**

`collect/peeringdb.js`:

```js
import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError } from './validate.js';
import { recordSuccess, recordError } from './meta.js';
import { fetchJson } from './fetch.js';

export const SOURCE_URL = 'https://www.peeringdb.com/api/netixlan?ix_id=55';
const MIN_RECORDS = 50;

// Szándékosan NEM tartjuk meg a `speed` mezőt: ütközés esetén a bix.hu
// az elsődleges forrás, a PeeringDB önbevallásos (lásd spec 3.3).
function pick(record) {
  return {
    asn: record.asn,
    ipaddr6: record.ipaddr6 ?? null,
    is_rs_peer: Boolean(record.is_rs_peer),
    created: record.created ?? null,
  };
}

export async function collectPeeringdb({
  fetch = fetchJson,
  now = () => new Date(),
  dataDir = 'data',
} = {}) {
  const ts = now().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const metaPath = join(dataDir, 'meta.json');

  try {
    const payload = await fetch(SOURCE_URL);
    const raw = Array.isArray(payload?.data) ? payload.data : [];
    if (raw.length < MIN_RECORDS) {
      throw new ValidationError(
        `Gyanúsan kevés PeeringDB rekord: ${raw.length} (legalább ${MIN_RECORDS} várt)`
      );
    }
    const records = raw.map(pick);
    await writeFile(
      join(dataDir, 'peeringdb.json'),
      `${JSON.stringify({ fetched_at: ts, records }, null, 2)}\n`,
      'utf8'
    );
    await recordSuccess(metaPath, 'peeringdb', ts);
    return { ts, records };
  } catch (err) {
    await recordError(metaPath, 'peeringdb', ts, err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { records } = await collectPeeringdb();
    console.log(`OK — ${records.length} PeeringDB rekord`);
  } catch (err) {
    console.error(`HIBA: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/collectors.test.js`
Expected: PASS — 4 tests

- [ ] **Step 6: Éles próba**

```bash
node collect/ports.js
node collect/peeringdb.js
```

Expected: `OK — 137 port` és `OK — 137 PeeringDB rekord` (a pontos számok változhatnak).

- [ ] **Step 7: Commit**

```bash
git add collect/ports.js collect/peeringdb.js test/collectors.test.js data/ports.json data/peeringdb.json data/meta.json
git commit -m "feat: port- és PeeringDB-gyűjtő"
```

---

### Task 9: `merge.js` — a két forrás összefésülése

**Files:**
- Create: `collect/merge.js`
- Test: `test/merge.test.js`

**Interfaces:**
- Consumes: `data/ports.json` (Task 8), `data/peeringdb.json` (Task 8)
- Produces:
  - `mergeMembers(ports, records) → { members: Array<{ asn, name, website, policy, first_seen, is_rs_peer, ipv6, sources, ports }> }` — tiszta függvény, nincs I/O
  - `runMerge({ now?, dataDir? }) → Promise<{ ts, members }>` — beolvassa a `ports.json`-t és a `peeringdb.json`-t, kiírja a `members.json`-t, naplóz a `meta.json`-ba
  - `data/members.json` alakja: `{ fetched_at: string, members: [...] }`

- [ ] **Step 1: Write the failing test**

`test/merge.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeMembers } from '../collect/merge.js';

const ports = [
  { member: '3C Telecom', website: 'http://www.3ctelecom.hu', asn: 3244, policy: 'Open/Free',
    node: 'VH', ipv4: '193.188.137.18', bandwidth_mbps: 1000, note: 'Backup Link', graph_id: 'aaa' },
  { member: '3C Telecom', website: 'http://www.3ctelecom.hu', asn: 3244, policy: 'Open/Free',
    node: 'VH', ipv4: '193.188.137.35', bandwidth_mbps: 1000, note: '1Gbps on 10G', graph_id: 'bbb' },
  { member: 'Csak BIX Kft.', website: null, asn: 65001, policy: 'Selective',
    node: 'VH', ipv4: '193.188.137.99', bandwidth_mbps: 100000, note: null, graph_id: null },
];

const records = [
  { asn: 3244, ipaddr6: '2001:7f8:35::3:244:1', is_rs_peer: false, created: '2012-05-01T00:00:00Z' },
  { asn: 3244, ipaddr6: null, is_rs_peer: true, created: '2010-07-29T00:00:00Z' },
  { asn: 65002, ipaddr6: '2001:7f8:35::6:5002:1', is_rs_peer: false, created: '2021-03-03T00:00:00Z' },
];

test('egy ASN több portja egyetlen tag alá kerül', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.equal(member.ports.length, 2);
  assert.equal(member.name, '3C Telecom');
  assert.deepEqual(member.ports.map((p) => p.ipv4), ['193.188.137.18', '193.188.137.35']);
});

test('a first_seen a legkorábbi created dátum', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.equal(member.first_seen, '2010-07-29T00:00:00Z');
});

test('az is_rs_peer igaz, ha bármelyik rekordban igaz', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.equal(member.is_rs_peer, true);
});

test('az ipv6 az első nem üres értéket veszi fel', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.equal(member.ipv6, '2001:7f8:35::3:244:1');
});

test('mindkét forrásban szereplő tag sources mezője kettős', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 3244);
  assert.deepEqual(member.sources, ['bix', 'peeringdb']);
});

test('csak a BIX-ben szereplő tagnak nincs first_seen-je', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 65001);
  assert.deepEqual(member.sources, ['bix']);
  assert.equal(member.first_seen, null);
  assert.equal(member.ports.length, 1);
});

test('csak a PeeringDB-ben szereplő tag név nélkül, port nélkül kerül be', () => {
  const member = mergeMembers(ports, records).members.find((m) => m.asn === 65002);
  assert.deepEqual(member.sources, ['peeringdb']);
  assert.equal(member.name, 'AS65002');
  assert.equal(member.policy, null);
  assert.deepEqual(member.ports, []);
});

test('a tagok ASN szerint növekvő sorrendben állnak', () => {
  const asns = mergeMembers(ports, records).members.map((m) => m.asn);
  assert.deepEqual(asns, [...asns].sort((a, b) => a - b));
});

test('a PeeringDB sebesség-adata nem szivárog be', () => {
  const withSpeed = records.map((r) => ({ ...r, speed: 400000 }));
  for (const member of mergeMembers(ports, withSpeed).members) {
    assert.equal(member.speed, undefined);
    for (const port of member.ports) {
      assert.notEqual(port.bandwidth_mbps, 400000);
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/merge.test.js`
Expected: FAIL — `Cannot find module '../collect/merge.js'`

- [ ] **Step 3: Write minimal implementation**

`collect/merge.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/merge.test.js`
Expected: PASS — 9 tests

- [ ] **Step 5: Éles próba**

Run: `node collect/merge.js`
Expected: `OK — <szám> tag`, ahol a szám nagyobb, mint a 111 BIX-es ASN (a csak-PeeringDB-s tagok miatt).

- [ ] **Step 6: Teljes tesztfuttatás**

Run: `npm test`
Expected: PASS — minden tesztfájl zöld (összesen 46 teszt).

- [ ] **Step 7: Commit**

```bash
git add collect/merge.js test/merge.test.js data/members.json data/meta.json
git commit -m "feat: BIX és PeeringDB összefésülése"
```

---

### Task 10: Napi szerkezeti workflow

**Files:**
- Create: `.github/workflows/collect-daily.yml`

**Interfaces:**
- Consumes: `node collect/ports.js`, `node collect/peeringdb.js`, `node collect/merge.js` CLI belépési pontok (Task 8, 9)
- Produces: napi automatikus commitok a `data/ports.json`, `data/peeringdb.json`, `data/members.json`, `data/meta.json` fájlokba

- [ ] **Step 1: Workflow létrehozása**

`.github/workflows/collect-daily.yml`:

```yaml
name: Napi szerkezeti gyűjtés

on:
  schedule:
    - cron: '17 3 * * *'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: bix-data-write
  cancel-in-progress: false

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - id: ports
        name: Port-tábla
        run: node collect/ports.js
        continue-on-error: true

      - id: peeringdb
        name: PeeringDB
        run: node collect/peeringdb.js
        continue-on-error: true

      - name: Összefésülés
        run: node collect/merge.js

      - name: Commit
        run: |
          git config user.name  "bix-collector"
          git config user.email "bix-collector@users.noreply.github.com"
          git add data/
          git diff --staged --quiet && exit 0
          git commit -m "data: napi szerkezeti gyűjtés"
          git pull --rebase --autostash
          git push

      - name: Hibás forrás jelzése
        if: steps.ports.outcome == 'failure' || steps.peeringdb.outcome == 'failure'
        run: |
          echo "Legalább egy forrás hibázott. Részletek a data/meta.json last_error mezőiben."
          exit 1
```

A `continue-on-error` a két gyűjtőn a forrás-izolációt valósítja meg: ha a PeeringDB kiesik, a port-gyűjtés és az összefésülés attól még lefut a meglévő adaton. Az utolsó lépés viszont gondoskodik róla, hogy a futás **mégis pirosra váltson** — a hiba nem tűnik el csendben.

- [ ] **Step 2: Push és kézi futtatás**

```bash
git add .github/workflows/collect-daily.yml
git commit -m "ci: napi szerkezeti gyűjtés"
git push
```

Ezután: **Actions → Napi szerkezeti gyűjtés → Run workflow**.

- [ ] **Step 3: Ellenőrzés**

Expected: a futás zöld, és megjelenik egy `data: napi szerkezeti gyűjtés` commit. Ha nem változott semmi az adatban, a `git diff --staged --quiet && exit 0` miatt nincs commit — ez helyes viselkedés, nem hiba.

---

### Task 11: README és jogi lábjegyzet

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: minden korábbi feladat
- Produces: semmi kód — a repó dokumentációja

- [ ] **Step 1: README megírása**

`README.md`:

````markdown
# BIX Dashboard — adatgyűjtő

Független hobbiprojekt, ami a [Budapest Internet Exchange](https://www.bix.hu/)
nyilvános adatait gyűjti és teszi géppel olvashatóvá.

**Nincs kapcsolatunk az ISZT-vel vagy a BIX üzemeltetőjével.**

## Adatforrások

| Forrás | Mit ad | Frissítés |
|---|---|---|
| `bix.hu` főoldal | aggregát forgalmi számok | 15 perc |
| `bix.hu/statisztika` | port-szintű szerkezet | napi |
| PeeringDB `netixlan?ix_id=55` | csatlakozási dátumok, IPv6, route-server flag | napi |

Ütközés esetén a `bix.hu` az elsődleges forrás. A PeeringDB önbevallásos,
ezért csak azokra a mezőkre használjuk, amiket a BIX nem közöl.

## Adatfájlok

- `data/traffic.csv` — append-only idősor, 2026 augusztusától
- `data/ports.json` — port-szintű pillanatkép
- `data/peeringdb.json` — szűrt PeeringDB rekordok
- `data/members.json` — ASN szerint összefésült nézet
- `data/meta.json` — forrásonkénti utolsó siker és hiba

## Amit szándékosan NEM gyűjtünk

- **Tagok e-mail-címe és telefonszáma.** Szerepel a `bix.hu/tagok` oldalon,
  de kapcsolattartói adat tömeges újraközlése fölösleges GDPR-kockázat.
- **Per-port forgalmi adat.** A `stats.bix.hu/graph.cgi` kizárólag PNG-t ad
  vissza, számadatot nem — a képből való visszafejtést elvetettük.

## Futtatás helyben

```bash
npm ci
npm test
node collect/traffic.js
node collect/ports.js
node collect/peeringdb.js
node collect/merge.js
```

## Terhelés

15 perces mintavétel, kérésenként egy oldalletöltés, `User-Agent`-ben
kontakt-URL-lel. A `bix.hu/robots.txt` csak `/admin/` és `/index.html`
alatt tilt; a használt útvonalak engedettek.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README és jogi lábjegyzet"
git push
```

- [ ] **Step 3: Záró ellenőrzés**

```bash
npm test
```

Expected: PASS — 46 teszt.

Ezután a GitHub **Actions** fülén mindkét workflow-nak zöldnek kell lennie, és a `data/traffic.csv`-nek 15 percenként új sorral kell bővülnie.

---

## Mi marad a következő tervre

A weboldal (`index.html`, nézetek, SVG-grafikonok, GitHub Pages) **nem része ennek a tervnek**. Az a spec 7. szakaszát valósítja meg, és külön tervet kap — miközben az itt elkészült gyűjtő már gyűjti a forgalmi idősort.
