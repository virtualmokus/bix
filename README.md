# BIX Dashboard

Független hobbiprojekt, ami a [Budapest Internet Exchange](https://www.bix.hu/)
nyilvánosan közzétett adatait gyűjti, és olvasható formában mutatja meg.

*All information is publicly fetched from bix.hu.*

**Ez nem hivatalos oldal.** Nincs kapcsolatunk az ISZT-vel, a BIX üzemeltetőjével
vagy bármelyik tagszervezettel. Az itt látható adatok értelmezése a miénk, a
hibákért is mi felelünk — hivatalos információért a [bix.hu](https://www.bix.hu/)
az irányadó.

## Mit tartalmaz

| Adat | Forrás | Frissítés |
|---|---|---|
| Aggregát forgalom (aktuális, csúcs, kapacitás) | bix.hu | 15 perc |
| Port-szintű szerkezet: tag, ASN, node, sávszélesség, peering policy | bix.hu | napi |
| IPv6-cím, route-server jelölés, rekord-dátumok | [PeeringDB](https://www.peeringdb.com/ix/55) | napi |

Kizárólag **szervezeti szintű adatot** használunk: cégnév, autonóm rendszer
száma, csatlakozási pont, sávszélesség, peering-irányelv. Természetes személyhez
köthető adat — kapcsolattartó neve, e-mail-címe, telefonszáma — nem kerül
a projektbe, akkor sem, ha nyilvánosan elérhető.

## Adatfájlok

Minden adat nyers formában is elérhető, gépi feldolgozásra:

- `data/traffic.csv` — forgalmi idősor, 2026 augusztusától gyűlik
- `data/ports.json` — port-szintű pillanatkép
- `data/peeringdb.json` — a PeeringDB-ből átvett mezők
- `data/members.json` — ASN szerint összefésült nézet
- `data/meta.json` — forrásonként az utolsó sikeres frissítés

## Amit az adatról tudni kell

Három dolog, ami félreértésre ad okot, ha nem mondjuk ki:

**A PeeringDB rekord-dátuma nem csatlakozási dátum.** A legkorábbi érték 2010-es,
miközben a BIX 1996 óta működik. A mező azt mutatja, mikor került be a rekord a
PeeringDB-be. Ezért az oldal sehol nem nevezi „csatlakozásnak".

**A publikus statisztika nem teljes.** A bix.hu statisztikaoldala 137 portot
listáz, miközben a főoldal 188 portot jelent — a portok nagyjából 73%-a. Az
oldal ezt láthatóan kiírja, nem tesz úgy, mintha a teljes képet mutatná.

**Ütközés esetén a bix.hu az elsődleges.** A PeeringDB önbevallásos, akadnak
benne pontatlan sávszélesség-értékek, ezért a sebesség-mezőjét nem használjuk.

**Forgalmi idősor csak előre van.** A BIX a historikus forgalmat grafikonként
teszi közzé, számadatként nem, ezért visszamenőleges adat nincs. A gyűjtés
indulásának napjától épül az idősor.

## Futtatás helyben

```bash
npm ci
npm test
node collect/traffic.js
```

A weboldalhoz bármilyen statikus kiszolgáló megteszi a repó gyökeréből.

## Terhelés és etikett

15 percenként egyetlen oldalletöltés, azonosítható `User-Agent`-tel, ami erre a
repóra mutat. A `robots.txt` tiltásait tiszteletben tartjuk. Ha az oldal
üzemeltetőjeként bármi kifogásod van a gyűjtés ellen, nyiss egy issue-t —
leállítjuk.
