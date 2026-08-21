export default {
  siteName: 'BIX',
  siteTagline: 'Budapest Internet Exchange — független adatnézet',
  tabs: { overview: 'Áttekintés', members: 'Tagok' },
  live: 'ÉLŐ',
  noData: 'Ehhez még nincs adat.',

  overview: {
    heroEyebrow: 'Épp most folyik át a BIX-en',
    utilization: 'Kihasználtság',
    current: 'most',
    peak: 'valaha mért csúcs',
    capacity: 'beépített kapacitás',
    didYouKnow: 'Tudtad?',
    capacityNote:
      'A tartalék nem pazarlás: ez az, ami miatt egy váratlan forgalmi robbanás nem dönti be az ország internetét. Egy IXP-nek akkor is működnie kell, amikor a csúcs többszöröse érkezik.',
    seriesStarting: 'Az idősor most indult.',
    seriesStartingBody: 'Eddig {count} mérés gyűlt össze, az első {since}. Néhány nap kell, mire a görbe elmond valamit.',

    keyFigures: 'Kulcsszámok',
    fig: {
      networks: 'hálózat', networksHint: 'a BIX saját bejelentése szerint',
      ports: 'port', portsHint: 'összesen, a főoldal szerint',
      portsPublic: 'publikus port', portsPublicHint: 'a bejelentett portok {p}-a',
      members: 'tag', membersHint: 'egyedi ASN két forrás egyesítéséből',
      nodes: 'csatlakozási pont', nodesHint: 'három Budapesten, egy Bécsben',
      largestPort: 'legnagyobb port', largestPortHint: 'a publikus listában',
      routeServer: 'route-server peer', routeServerHint: 'a közös útvonalszerveren keresztül is peerel',
      ipv6: 'IPv6-címmel', ipv6Hint: 'a BIX-en belüli kapcsolathoz',
    },

    humanScale: 'Mennyi ez valójában?',

    whoEyebrow: 'Kik ülnek a BIX-en',
    whoTitle: 'Nem csak magyar szolgáltatók',
    whoHint: 'A(z) {t} tagból {n}-nek van nyilvános hálózati profilja a PeeringDB-ben. Az alábbi bontások erre a részhalmazra vonatkoznak, és önbevallott adatok.',
    byType: 'Hálózat típusa',
    byScope: 'Földrajzi hatókör',
    byTraffic: 'Forgalmi osztály',
    byRatio: 'Forgalmi arány',

    howEyebrow: 'Hogyan kapcsolódnak',
    howTitle: 'Négy épület, 137 port, 1 gigabittől 300-ig',
    byNode: 'Portok csatlakozási pont szerint',
    byBandwidth: 'Portok sávszélesség szerint',
    byPolicy: 'Peering-irányelv',
    biggestMembers: 'Legnagyobb tagok együttes sávszélesség szerint',
    viennaNote: 'A Digital Realty (InterXion VIE1) nem Budapesten van, hanem Bécsben — a „budapesti” IX-nek van egy ausztriai lába is.',

    factsEyebrow: 'Érdekességek',
    factsTitle: 'Amit az adatból ki lehet olvasni',
    facts: {
      reachTitle: 'A BIX egy a sok közül — de jó társaságban',
      reachBody:
        '{name} világszerte {n} internetes csomóponton van jelen, és a BIX ezek egyike. Amikor egy magyar előfizető ilyen hálózat tartalmát kéri le, az adat jó eséllyel el sem hagyja az országot.',
      redundancyTitle: 'Ki készült fel a kiesésre',
      redundancyBody:
        '{multi} tagnak van egynél több portja, és {backup} porton szerepel kifejezetten „backup” megjelölés. Egyetlen kábel elvágása náluk nem jelent kiesést.',
      headroomTitle: 'Van hova nőni',
      headroomBody:
        '{n} port esetében a megjegyzés elárulja, hogy a tag nagyobb fizikai portot vásárolt, mint amennyi sávszélességet előfizetett. A bővítés náluk szerződésmódosítás, nem szerelés.',
      ipv6Title: 'Az IPv6 már nem opció',
      ipv6Body:
        'A profillal rendelkező {t} hálózatból {n} hirdet IPv6-prefixet. Ez lényegesen magasabb arány, mint az internet egészén — az IXP-tagság önmagában is szűrő: aki ide eljut, az általában felkészült.',
    },
    topIx: 'Hány másik csomóponton van még jelen',
    topPrefixes: 'Hány IPv4 prefixet hirdet',

    growthEyebrow: 'Növekedés',
    growthTitle: 'Húsz éve a 10 gigabit volt a csúcs — ma a belépőszint',
    growthCaption:
      'A PeeringDB „created” mezője azt mondja meg, mikor került be a rekord az adatbázisba — nem a BIX-hez való belépés időpontját. A BIX 1996 óta működik, a legkorábbi rekord viszont 2010-es.',
  },

  members: {
    eyebrow: 'Tagok',
    title: 'Mind a 123 hálózat, minden ismert adattal',
    searchPlaceholder: 'Keresés név vagy ASN szerint',
    allNodes: 'Összes node',
    allBandwidths: 'Összes sávszélesség',
    allPolicies: 'Összes peering policy',
    allTypes: 'Összes hálózattípus',
    matrixTitle: 'Portok kapacitás szerint',
    matrixHint: 'Vidd rá az egeret egy cellára a tag nevéért.',
    coverageWarning:
      'A BIX publikus statisztikája {shown} portot listáz, miközben a főoldal {total} portot jelent. Ez a nézet a portok {percent}%-át fedi le.',
    showing: '{n} tag látszik a(z) {t}-ból',
    columns: {
      name: 'Tag', asn: 'ASN', type: 'Típus', scope: 'Hatókör',
      node: 'Node', bandwidth: 'Sáv', policy: 'Irányelv',
      prefixes: 'Prefix', ix: 'IXP', v6: 'IPv6', rs: 'RS',
    },
    noResults: 'Nincs találat.',
    onlyPeeringdb: 'csak PeeringDB',
    legend: {
      prefixes: 'Hirdetett IPv4 prefixek száma (PeeringDB, önbevallás)',
      ix: 'Hány internetes csomóponton van jelen összesen',
      v6: 'Van IPv6-címe a BIX-en',
      rs: 'Peerel a route-serverrel is',
    },
  },

  footer: {
    independent:
      'Független hobbiprojekt. Nincs kapcsolatunk az ISZT-vel vagy a BIX üzemeltetőjével.',
    sources: 'Adatforrás: bix.hu és PeeringDB, kizárólag nyilvános adatok.',
    updated: 'Frissítve: {when}',
    stale: 'Az adat elavult — utolsó sikeres frissítés: {when}',
  },
};
