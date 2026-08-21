# BIX Dashboard — terv

**Dátum:** 2026-08-21
**Állapot:** jóváhagyott terv, implementációs terv még nincs

## 1. Cél

Független, vizuális dashboard a Budapest Internet Exchange (BIX) nyilvános adataiból.

A `bix.hu` minden lényeges adatot közzétesz: a forgalmat grafikonként, a portokat és a tagokat táblázatban. Ez a projekt nem pótolni akar valamit, hanem **más köntösbe helyezni ugyanazt az információt** — a grafikonból idősort, a táblázatból kereshető, szűrhető nézetet, a gigabitekből pedig emberi léptékű összehasonlítást csinál. Aki a hiteles, hivatalos adatot keresi, annak továbbra is a `bix.hu` a helyes cím.

Referencia a hangvételre és az interaktivitásra: [holadelej.hu](https://holadelej.hu/) — független hobbiprojekt, kizárólag nyilvános forrásból, ami a magyar villamosenergia-rendszert teszi laikus számára is olvashatóvá.

### Hatókör

- **v1:** a repó publikus, az oldal viszont még nincs bejelentve és nincs saját domainje — előbb legyen mögötte elég adat
- **Hosszú távon:** publikus, közhasznú eszköz a magyar hálózati közösségnek

### Nem cél

- A `bix.hu` helyettesítése vagy a hivatalos felület látszatának keltése
- Tagok kapcsolattartói adatainak (e-mail, telefon) újraközlése
- Per-port pillanatnyi terheltség megjelenítése (lásd 3.4 — nem megszerezhető)
- Euro-IX IXPDB mint adatforrás — **elvetve** (2026-08-21). Két forrás (`bix.hu` + PeeringDB) elég; egy harmadik, bizonytalan API-jú forrás csak karbantartási terhet adna.

## 2. Közönség

Elsődlegesen érdeklődő laikus és hálózatos szakma határán: aki tudja, mi az az ISP, de nem tudja, mi az a peering policy. Minden szakmai szám mellé kerül emberi léptékű fordítás.

## 3. Adatforrások

Mind ellenőrizve 2026-08-21-én.

### 3.1 `bix.hu` főoldal — aggregát élő számok

Öt érték, tiszta HTML-ben, `<div class="value">` / `<div class="name">` párokban:

```html
<div class="value">679.68</div>
<div class="name">(Gb/s) aktuáls</div>
```

Mezők: `hálózat` (141), `port` (188), `(Gb/s) csúcs` (1116.82), `(Gb/s) aktuáls` (679.68), `(Gb/s) kapacitás` (8358).

Az `aktuáls` elgépelés a forrásoldalé — a parser erre a stringre illeszkedjen, de a mezőket **sorrend szerint is** ellenőrizze, mert az elgépelést egyszer kijavíthatják.

**Frissítés:** 15 percenként.

### 3.2 `bix.hu/statisztika` — port-szintű szerkezet

**137 sor**, soronként egy port, **111 egyedi ASN**. `data-title` attribútumokkal annotált tábla:

| Mező | Példa |
|---|---|
| Tag neve + weboldal | 3C Telecom, `http://www.3ctelecom.hu` |
| AS number | `AS3244` |
| Peering policy | `Open/Free` \| `Selective` \| `Restrictive` |
| Node | `VH`, `T-Systems`, `Digital Realty` |
| IPv4 cím | `193.188.137.35` |
| Sávszélesség | `1G`, `10G`, `100G`, `400G` |
| Megjegyzés | `Backup Link`, `1Gbps on 10G` |
| Port-grafikon link | `/statisztika/3c_telecom/<md5-hash>` |

A **Megjegyzés** mező önmagában is értékes: megmutatja, kinek van redundáns kapcsolata, és ki vett nagyobb fizikai portot, mint amennyi sávot előfizetett (`1Gbps on 10G` = van hova nőnie).

Tényleges eloszlások (2026-08-21):

| Node | Portok | | Sávszélesség | Portok | | Peering policy | Portok |
|---|---|---|---|---|---|---|---|
| VH (Budapest) | 66 | | 10G | 42 | | Open/Free | 111 |
| T-Systems Cloud & Datacenter (Dataplex) | 49 | | 100G | 39 | | Selective | 24 |
| Digital Realty (InterXion VIE1) — **Bécs** | 16 | | 1G | 34 | | Restrictive | 2 |
| 2Connect DC10 | 6 | | egyéb (2G–300G) | 22 | | | |

Két dolog, ami ebből kiderül és a tervezést befolyásolja:

**A `/statisztika` nem teljes.** A főoldal 188 portot és 141 hálózatot jelent, a statisztika-oldalon viszont 137 port és 111 ASN szerepel — a portok kb. **73%-a**. A különbség okát nem közlik. **Következmény:** a port-mátrix 137 cellás, és az oldalnak ezt őszintén ki kell írnia, nem szabad úgy tenni, mintha a teljes BIX-et mutatná.

**A BIX-nek van bécsi node-ja.** A `Digital Realty (InterXion VIE1)` 16 porttal Bécsben van, nem Budapesten. Ez a „budapesti IX" képet árnyalja, és a `Növekedés` nézetben önálló történet.

**Frissítés:** napi 1×.

### 3.3 PeeringDB API — rekord-történet

`https://www.peeringdb.com/api/netixlan?ix_id=55` — **137 rekord, 103 egyedi ASN**, auth nélkül, JSON. (Ellenőrizve 2026-08-21-én a nyers API-válaszon.)

Mezők rekordonként: `asn`, `speed`, `ipaddr4`, `ipaddr6`, `is_rs_peer`, `operational`, **`created`**, `updated`.

Ebből 103 rekord route-server peer, 115-ben van IPv6-cím.

**Figyelmeztetés 1: a `created` NEM a BIX-csatlakozás dátuma.** A legkorábbi `created` érték 2010-07-29, miközben a BIX 1996 óta működik. A mező azt mondja meg, mikor került be a rekord **a PeeringDB-be**, nem azt, mikor csatlakozott a hálózat a BIX-hez. A `Növekedés` nézet ezt **nem állíthatja csatlakozási dátumnak** — a helyes megfogalmazás: „mikor jelent meg a kapcsolat a PeeringDB-ben". A 2020-as kiugrás (24 rekord) valószínűleg egy PeeringDB-adattisztítás, nem csatlakozási hullám.

Éves eloszlás: 2010: 5, 2011: 3, 2012: 2, 2013: 3, 2014: 1, 2015: 4, 2016: 9, 2017: 6, 2018: 13, 2019: 6, **2020: 24**, 2021: 12, 2022: 10, **2023: 20**, 2024: 9, 2025: 3, 2026: 7.

**Figyelmeztetés 2: a PeeringDB önbevallásos, és van benne szemét.** Két rekordban `speed: 0` szerepel, és két rekord 400 000 Mb/s-t (400G) állít — mindkettő ugyanahhoz az ASN-hez (AS210788, `created` 2026-02-06) —, miközben a BIX saját `/statisztika` oldalán a legnagyobb sávszélesség **300G**. **Ütközés esetén a `bix.hu` az elsődleges** (az üzemeltető adata), a PeeringDB-t csak azokra a mezőkre használjuk, amiket a BIX nem közöl: `created`, `ipaddr6`, `is_rs_peer`. A PeeringDB `speed` mezője **egyáltalán nem kerül be a kimenetbe**.

**Frissítés:** napi 1×. Kíméletes rate — a PeeringDB anonim hívásokat korlátoz.

### 3.4 Ami NEM szerezhető meg

**Per-port és aggregát forgalmi számadat.** A `stats.bix.hu/graph.cgi` grafikont ad vissza (`image/png`), számadatot nem — a szokásos adat-kimeneti kapcsolókra sem. Gépi feldolgozásra szánt forgalmi végpont nincs közzétéve.

A grafikon tetszőleges időablakra lekérhető, de továbbra is képként.

**Következmény:** historikus forgalmi adat visszamenőleg nem létezik számként. Az idősor a gyűjtés indításának napjától épül. A PNG-ből való visszafejtés (OCR / pixelolvasás) **elvetve**: a legtöbb munka a legtörékenyebb eredményért.

**Következmény a design-ra:** a port-mátrix nem pillanatnyi terheltség szerint színeződik, hanem **kapacitás / node / peering policy** szerint. Ez stabilabb és tartalmasabb is: a pillanatnyi terhelés 15 perc múlva elavul, a szerkezet nem.

## 4. Architektúra

```
GitHub Actions (cron)
  ├─ collect/traffic.js      → data/traffic.csv   (append, 15 perc)
  ├─ collect/ports.js        → data/ports.json    (napi)
  ├─ collect/peeringdb.js    → data/peeringdb.json (napi)
  └─ collect/merge.js        → data/members.json  (napi, kulcs: ASN)
        ↓ commit
GitHub Pages  →  site/index.html + fetch('data/*')  →  böngésző
```

**Publikus repó.** A GitHub Actions publikus repóban korlátlan, privátban 2 000 perc/hó — a 15 perces cron havi 2 880 futás, ami privátban a hónap kétharmadánál elfogyasztaná a keretet. A GitHub Pages is csak publikus repóból ingyenes. A publikus repó nem jelent publikus terméket: nincs domain, nincs bejelentés.

Mellékhaszon: a gyűjtő saját commitjai életben tartják a repót, így nem fut bele abba, hogy a GitHub 60 nap inaktivitás után letiltja az ütemezett workflow-kat.

### 4.1 Build lépés nincs

Statikus HTML + vanilla JS modulok, grafikonok SVG-vel. Nem Astro, nem React, nem bundler.

**Indok:** a GitHub Pages-re így nincs mit deployolni, csak fájlok kerülnek ki. Egy hobbiprojekt, amihez hónapokig nem nyúlsz, ne azzal fogadjon, hogy közben a toolchain elavult. A gyűjtő Node-ban fut, mert az Actions runnerben eleve ott van.

### 4.2 Nyelv

v1 magyar. A felületi szövegek külön modulban (`site/strings.hu.js`), hogy az angol változat később ne az egész oldal átírása legyen.

## 5. Adatmodell

### `data/traffic.csv` — append-only idősor

```csv
ts,networks,ports,peak_gbps,current_gbps,capacity_gbps
2026-08-21T21:45:00Z,141,188,1116.82,679.68,8358
```

CSV, nem JSON: a hozzáfűzés egy sor, a diff olvasható marad, és a fájl akkor sem válik kezelhetetlenné, ha évekig gyűlik. (15 perces ritmus ≈ 35 000 sor/év ≈ 2 MB — ez évekig gond nélkül elfér.)

### `data/ports.json` — pillanatkép, 188 elem

```json
{
  "fetched_at": "2026-08-21T03:00:00Z",
  "ports": [
    {
      "member": "3C Telecom",
      "website": "http://www.3ctelecom.hu",
      "asn": 3244,
      "policy": "Open/Free",
      "node": "VH",
      "ipv4": "193.188.137.35",
      "bandwidth_mbps": 1000,
      "note": "1Gbps on 10G",
      "graph_id": "42d3fbefd870f8fb15b18b03c73f797f"
    }
  ]
}
```

### `data/members.json` — összefésült nézet, kulcs: ASN

A `ports.json` és a `peeringdb.json` uniója ASN szerint. **Egy ASN-hez több port is tartozhat** (a 3C Telecom például két porttal szerepel: egy éles és egy `Backup Link`), ezért a portok tömbként ülnek a tag alatt — a `/statisztika` 137 portja 111 ASN között oszlik el.

```json
{
  "fetched_at": "2026-08-21T03:00:00Z",
  "members": [
    {
      "asn": 3244,
      "name": "3C Telecom",
      "website": "http://www.3ctelecom.hu",
      "policy": "Open/Free",
      "first_seen": "2008-04-11T00:00:00Z",
      "is_rs_peer": false,
      "ipv6": "2001:7f8:35::3:244:1",
      "sources": ["bix", "peeringdb"],
      "ports": [
        { "node": "VH", "ipv4": "193.188.137.18", "bandwidth_mbps": 1000,
          "note": "Backup Link", "graph_id": "1c93472e613b32c0eaa37f02f65f10cd" },
        { "node": "VH", "ipv4": "193.188.137.35", "bandwidth_mbps": 1000,
          "note": "1Gbps on 10G", "graph_id": "42d3fbefd870f8fb15b18b03c73f797f" }
      ]
    }
  ]
}
```

A BIX oldala adja a node-ot, a policy-t, a sávszélességet és a megjegyzést; a PeeringDB adja a `created` dátumot (`first_seen`), az IPv6-ot és a route-server flaget. Egy ASN `first_seen` értéke a hozzá tartozó PeeringDB-rekordok **legkorábbi** `created` dátuma.

A két forrás **nem fedi egymást pontosan** (BIX: 137 port / 111 ASN, PeeringDB: 137 rekord / 103 ASN — a rekordszám egyezése valószínűleg abból ered, hogy a PeeringDB a BIX IX-F exportját olvassa be, de az ASN-halmazok eltérnek), ezért a merge tartsa meg a csak-egyik-forrásban-létező rekordokat is, a `sources` mezővel jelölve: `["bix"]`, `["peeringdb"]` vagy `["bix","peeringdb"]`. A csak-PeeringDB-s rekordoknak nincs `node`-juk és `note`-juk; a csak-BIX-eseknek nincs `first_seen`-jük. A nézetek ezt kezeljék, ne feltételezzenek teljes rekordot.

### `data/meta.json` — forrásonkénti állapot

```json
{
  "traffic":   { "last_success": "2026-08-21T21:45:00Z", "last_error": null },
  "ports":     { "last_success": "2026-08-21T03:00:00Z", "last_error": null },
  "peeringdb": { "last_success": "2026-08-21T03:00:00Z", "last_error": "429 rate limited" }
}
```

## 6. Komponensek

Minden gyűjtő önállóan futtatható és önállóan hibázhat. Ha a PeeringDB nem elérhető, a 15 perces forgalmi gyűjtés attól még megy tovább.

| Modul | Felelősség | Függ |
|---|---|---|
| `collect/fetch.js` | HTTP-hívás User-Agenttel, timeout, retry | — |
| `collect/parse-traffic.js` | HTML → 5 szám (tiszta függvény) | — |
| `collect/parse-ports.js` | HTML → 188 port objektum (tiszta függvény) | — |
| `collect/traffic.js` | fetch + parse + validál + CSV-hez fűz | fetch, parse-traffic |
| `collect/ports.js` | fetch + parse + validál + ports.json ír | fetch, parse-ports |
| `collect/peeringdb.js` | API-hívás + peeringdb.json ír | fetch |
| `collect/merge.js` | ports + peeringdb → members.json | — (fájlból olvas) |
| `site/views/now.js` | „Most" nézet | data/traffic.csv, meta |
| `site/views/members.js` | „Tagok" nézet + port-mátrix | data/members.json |
| `site/views/growth.js` | „Növekedés" nézet | data/members.json |
| `site/chart.js` | SVG grafikon-primitívek | — |

A parserek **tiszta függvények**: HTML string be, objektum ki. Se hálózat, se fájlrendszer. Ettől tesztelhetők és ettől lehet őket fixtúrán futtatni.

## 7. Nézetek

### 7.1 „Most"

- Hero: aktuális forgalom nagyban (Gb/s), változás az előző órához képest, 24 órás görbe
- Kihasználtság három sávja egymás alatt: most → valaha mért csúcs → beépített kapacitás
- „Mennyi ez valójában?" kártyák: emberi léptékű fordítások (egyidejű 4K streamek, GB/másodperc)
- „Tudtad?" doboz: miért nem pazarlás a ~8%-os kihasználtság

### 7.2 „Tagok"

- Kereshető, szűrhető tábla: név, ASN, node, sávszélesség, peering policy
- **137 cellás** port-mátrix, **kapacitás / node / policy szerint színezve**, hover a tag nevéért
- Szűrők: node, sávszélesség, peering policy
- Látható jelzés arról, hogy ez a 188 portból 137 — a `/statisztika` nem teljes (lásd 3.2)

### 7.3 „Növekedés"

- Kumulatív görbe a PeeringDB `created` dátumaiból, évszám-annotációkkal — **kifejezetten „PeeringDB-ben megjelent kapcsolatok" felirattal**, nem „csatlakozások"-ként (lásd 3.3, Figyelmeztetés 1)
- Sávszélesség-összetétel a `/statisztika` pillanatképéből: 1G-től 300G-ig, node-onkénti bontásban
- A bécsi node (16 port) önálló története a budapesti 121 mellett

A `Térkép` és a `Mi ez?` fül **nincs v1-ben** (lásd 11.).

## 8. Hibakezelés

Egy csendben elromló scraper hónapokig ír nullákat az idősorba, és mire kiderül, az adat használhatatlan. Ezért a hallgatólagos hiba tilos:

- **Parse-hiba = hiba, nem üres sor.** Ha a `parse-traffic` nem talál pontosan 5 számot, kivételt dob. A gyűjtő nem ír sort, nem nulláz, hanem nem-nulla exit kóddal kilép → a workflow pirosra vált.
- **Értéktartomány-ellenőrzés.** `0 < current_gbps < 20000`, `networks` és `ports` pozitív egész, `current <= capacity`. Tartományon kívüli érték elutasítva, hibaként kezelve.
- **Forrásonkénti izoláció.** Minden gyűjtő külön workflow-lépés, `continue-on-error` a nem-kritikusakon. A `meta.json` rögzíti forrásonként az utolsó sikert és az utolsó hibát.
- **Az oldal kiírja, ha elavult.** Ha a `meta.json` szerint egy forrás régen frissült, a nézet ezt láthatóan jelzi („utolsó friss adat: 3 órája"), nem tesz úgy, mintha élő lenne.
- **A böngésző az utolsó ismert adatot mutatja**, ha a `fetch` elhal — elavultság-jelzéssel, nem üres képernyővel.

## 9. Tesztelés

- **Parser-tesztek fixtúrán.** A `bix.hu` főoldal és `/statisztika` HTML-je lementve a repóba (`test/fixtures/`). A parserek erre futnak: hálózat nélkül tesztelhetők, és amikor a BIX egyszer átalakítja az oldalát, a teszt pontosan megmondja, melyik mező tört el.
- **Validációs tesztek:** tartományon kívüli és hiányos bemenet elutasítása.
- **Merge-tesztek:** csak-BIX, csak-PeeringDB és mindkettőben szereplő ASN kezelése.
- A vizuális réteghez v1-ben nincs teszt.

## 10. Jogi és etikai keretek

- **Csak nyilvános adat.** Nincs bejelentkezés, nincs `ixpman.bix.hu`.
- **Kapcsolattartói adat nem kerül át.** A `/tagok` oldalon szerepel a tagok e-mail-címe és telefonszáma; ezek **nem** kerülnek a projektbe. Név, ASN, peering policy, node, sávszélesség igen — az cégadat. A kapcsolattartói elérhetőségek tömeges újraközlése fölösleges GDPR-kockázat, és semmit nem tenne hozzá.
- **`robots.txt` betartva.** A `bix.hu/robots.txt` csak `/admin/` és `/index.html` alatt tilt; a használt útvonalak engedettek.
- **Kíméletes terhelés.** 15 perces ritmus, User-Agentben kontakt-URL.
- **Egyértelmű forrásmegjelölés.** Lábléc: független projekt, nincs kapcsolat az ISZT-vel, adatforrás `bix.hu` és PeeringDB — a holadelej.hu mintájára.

## 11. Nyitott kérdések (nem v1)

- **`Térkép` fül.** A BIX négy csatlakozási pontja kevés önálló térképhez. Érdemesebb lenne a tagok országa / központja szerint (PeeringDB-ből kinyerhető), de az plusz adatforrás és külön gondolkodás.
- **`Mi ez?` fül.** Statikus szövegoldal a BIX-ről és a peeringről; bármikor hozzácsapható.
- **Sötét téma.** A NOC-stílusú sötét változat témakapcsolóként visszahozható.

## 12. Sikerkritérium v1-re

1. A gyűjtő magától fut, és egy hét után hézagmentes 15 perces idősor van a `traffic.csv`-ben.
2. A három nézet valós adatból renderel, hardcode-olt szám nincs bennük.
3. Ha a `bix.hu` HTML-je megváltozik, a workflow pirosra vált — nem ír csendben hibás adatot.
4. Az oldal magától érthető annak, aki nem tudja, mi az a peering.
