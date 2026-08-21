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
    // A {since} „41 perce" alakot ad, ezért nem követheti „óta" — az
    // „41 perce óta" magyartalan. A mondat így önmagában megáll.
    seriesStartingBody:
      'Eddig {count} mérés gyűlt össze, az első {since}. Néhány nap kell, mire a görbe elmond valamit.',
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
    columns: {
      name: 'Tag',
      asn: 'ASN',
      node: 'Node',
      bandwidth: 'Sáv',
      policy: 'Peering policy',
    },
    noResults: 'Nincs találat.',
    onlyPeeringdb: 'csak PeeringDB',
    onlyBix: 'csak BIX',
  },

  growth: {
    eyebrow: 'Növekedés',
    title: 'Húsz év alatt a 10 gigabit volt a csúcs — ma a belépőszint',
    curveTitle: 'PeeringDB-ben megjelent kapcsolatok',
    // A szöveg szándékosan kerüli a „csatlakozott" szót — a nézet tesztje
    // pontosan erre a szóra ellenőriz, mert ez a mező téves olvasata.
    curveCaption:
      'A PeeringDB „created" mezője azt mondja meg, mikor került be a rekord az adatbázisba — nem a BIX-hez való belépés időpontját. A BIX 1996 óta működik, a legkorábbi rekord viszont 2010-es.',
    bandwidthTitle: 'Sávszélesség-összetétel',
    nodeTitle: 'Portok node szerint',
    viennaNote: 'A Digital Realty (InterXion VIE1) node nem Budapesten van, hanem Bécsben.',
  },

  footer: {
    independent:
      'Független hobbiprojekt. Nincs kapcsolatunk az ISZT-vel vagy a BIX üzemeltetőjével.',
    sources: 'Adatforrás: bix.hu és PeeringDB, kizárólag nyilvános adatok.',
    updated: 'Frissítve: {when}',
    stale: 'Az adat elavult — utolsó sikeres frissítés: {when}',
  },
};
