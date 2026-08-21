# BIX Dashboard — adatgyűjtő

Független hobbiprojekt, ami a [Budapest Internet Exchange](https://www.bix.hu/)
nyilvános adatait gyűjti és teszi géppel olvashatóvá.
*All information is publicly fetched from bix.hu.*

**Nincs kapcsolatunk az ISZT-vel vagy a BIX üzemeltetőjével.**

## Adatforrások

| Forrás | Mit ad | Frissítés |
|---|---|---|
| `bix.hu` főoldal | aggregát forgalmi számok | 15 perc |
| `bix.hu/statisztika` | port-szintű szerkezet (137 port, 111 ASN) | napi |
| PeeringDB `netixlan?ix_id=55` | IPv6, route-server flag, rekord-dátumok (137 rekord, 103 ASN) | napi |

Ütközés esetén a `bix.hu` az elsődleges forrás. A PeeringDB önbevallásos —
szerepel benne `speed: 0` és a BIX saját adatával ellentmondó 400G is —,
ezért a `speed` mezőjét egyáltalán nem használjuk.

## Adatfájlok

- `data/traffic.csv` — append-only idősor, 2026 augusztusától
- `data/ports.json` — port-szintű pillanatkép
- `data/peeringdb.json` — szűrt PeeringDB rekordok
- `data/members.json` — ASN szerint összefésült nézet (123 tag)
- `data/meta.json` — forrásonkénti utolsó siker és hiba

## Fontos adatértelmezési figyelmeztetés

A PeeringDB `created` mezője **nem** a BIX-csatlakozás dátuma. A legkorábbi
érték 2010-es, miközben a BIX 1996 óta működik — a mező azt mondja meg, mikor
került be a rekord a PeeringDB-be. Bármilyen megjelenítés, ami ezt
„csatlakozási dátumként" mutatja, félrevezető.

Ugyanígy: a `/statisztika` oldal 137 portot listáz, miközben a főoldal 188-at
jelent. A publikus statisztika a portok kb. 78%-át fedi le.

## Amit szándékosan NEM gyűjtünk

- **Tagok e-mail-címe és telefonszáma.** Szerepel a `bix.hu/tagok` oldalon,
  de kapcsolattartói adat tömeges újraközlése fölösleges GDPR-kockázat.
- **Per-port forgalmi adat.** A `stats.bix.hu/graph.cgi` kizárólag PNG-t ad
  vissza — `format=csv`, `format=json`, `xport=1`, `output=csv` és `type=csv`
  mind képet eredményez. A képből való visszafejtést elvetettük.

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
