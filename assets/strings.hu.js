export default {
  siteName: 'BIX',
  siteTagline: 'Budapest Internet Exchange — független adatnézet',
  tabs: { overview: 'Áttekintés', members: 'Tagok', map: 'Világtérkép', faq: 'GYIK', legal: 'A projektről' },
  live: 'ÉLŐ',
  noData: 'Ehhez még nincs adat.',
  showMore: 'Mit jelent ez?',

  glossary: {
    ixp:
      'Az internetcsomópont (IXP) egy fizikai hely, ahol különálló hálózatok közös switchekbe csatlakoznak, és közvetlenül adják át egymásnak a forgalmat ahelyett, hogy harmadik félnek fizetnének a továbbításért. Rövidebb út, kisebb költség, kisebb késleltetés.',
    peering:
      'A peering két hálózat megállapodása a forgalom közvetlen cseréjéről. Az „Open” azt jelenti, hogy a hálózat bárkivel peerel, aki kéri; a „Selective” feltételeket szab; a „Restrictive” általában elutasítja.',
    asn:
      'Az autonóm rendszer száma (ASN) egy önállóan útvonalválasztott hálózat egyedi azonosítója — ez az internet legközelebbi megfelelője a cégjegyzékszámnak.',
    routeServer:
      'A route server segítségével egy tag egyetlen kapcsolaton át peerelhet sokakkal ahelyett, hogy minden párosítást külön tárgyalna végig. Egy kézfogás száz helyett.',
    prefixes:
      'A prefix egy IP-címtartomány, amit a hálózat meghirdet a világnak. A több prefix általában nagyobb vagy tagoltabb címállományt jelent — durva méretbecslés, nem pontos mérőszám.',
    port:
      'A port egy fizikai csatlakozás a csomópontba. Egy tagnak több is lehet: redundancia miatt, vagy különböző épületekben.',
  },

  overview: {
    heroEyebrow: 'Épp most folyik át a BIX-en',
    utilization: 'Kihasználtság',
    current: 'most',
    peak: 'valaha mért csúcs',
    capacity: 'beépített kapacitás',
    didYouKnow: 'Tudtad?',
    capacityNote:
      'A tartalék nem pazarlás: ez az, ami miatt egy váratlan forgalmi robbanás nem dönti be az ország internetét. Egy csomópontnak akkor is működnie kell, amikor a csúcs többszöröse érkezik.',
    seriesStarting: 'Az idősor most indult.',
    seriesStartingBody:
      'Eddig {count} mérés gyűlt össze, az első {since}. Néhány nap kell, mire a görbe elmond valamit.',
    chartY: 'Gb/s',

    keyFigures: 'Kulcsszámok',
    keyFiguresHint: 'Kattints bármelyik számra, ha érdekel, mit jelent és honnan jön.',
    fig: {
      networks: 'hálózat', networksHint: 'a BIX saját bejelentése szerint',
      networksExplain:
        'A csomóponthoz kapcsolódó különálló hálózatok száma, ahogy a BIX a saját főoldalán közli. Nem számoljuk újra — beolvassuk.',
      ports: 'port', portsHint: 'összesen, a főoldal szerint',
      portsExplain:
        'Fizikai csatlakozások a csomópontba. Több, mint a hálózatok száma, mert sok tag egynél több portot tart.',
      portsPublic: 'publikus port', portsPublicHint: 'a bejelentett portok {p}-a',
      portsPublicExplain:
        'Azok a portok, amik megjelennek a nyilvános statisztikaoldalon — kevesebb, mint amennyit a BIX összesen jelent. A különbség okát nem közlik, ezért ez az oldal csak azt állítja, amit lát.',
      members: 'tag', membersHint: 'egyedi ASN két forrás egyesítéséből',
      membersExplain:
        'Egyedi hálózatok a BIX statisztikaoldalának és a PeeringDB-nek az összefésülése után. Több, mint a publikus portszám, mert néhány hálózat a PeeringDB-ben szerepel, publikus port-bejegyzés nélkül.',
      nodes: 'csatlakozási pont', nodesHint: 'három Budapesten, egy Bécsben',
      nodesExplain:
        'Épületek, ahol a tagok fizikailag csatlakozhatnak. Három Budapesten van; a negyedik egy bécsi létesítmény — ezért van a „budapesti” csomópontnak osztrák lába.',
      largestPort: 'legnagyobb port', largestPortHint: 'a publikus listában',
      largestPortExplain:
        'A leggyorsabb egyedi kapcsolat a nyilvános statisztikában. Húsz éve a 10 gigabit egzotikum volt; ma belépőszint.',
      routeServer: 'route-server peer', routeServerHint: 'a közös útvonalszerveren keresztül is peerel',
      ipv6: 'IPv6-címmel', ipv6Hint: 'a BIX-en belüli peeringhez',
      ipv6Explain:
        'Azok a tagok, akiknek van IPv6-címük a csomópont hálózatán — ez az előfeltétele annak, hogy az IPv6-forgalom helyben cserélődjön, ne külföldön keresztül.',
    },

    bands: {
      reachUnit: 'internetcsomópont',
      reachHead: '{name} ennyi csomóponton van jelen világszerte',
      reachBody:
        'A BIX ezek egyike. Ezért van az, hogy amikor egy magyar háztartás ilyen hálózat tartalmát kéri le, az adat rendszerint nem lép át határt — a válasz már az épületben van.',
      viennaUnit: 'a 137 portból',
      viennaHead: 'A „budapesti” csomópontnak van egy lába Bécsben',
      viennaBody:
        'A Digital Realty InterXion VIE1 Ausztriában van, és {gbps} Gb/s tagkapacitást visz. Egy olyan nemzeti csomópont, ami megáll a határon, kisebb csomópont lenne.',
      decixUnit: 'BIX-tag',
      decixHead: 'peerel a frankfurti DE-CIX-en is',
      decixBody:
        'Ez a {total} tag {pct}-a. Az itteni hálózatok nem szorulnak Magyarországra; a nagyok többsége egyszerre több csomóponton ül, és a BIX a helyi bejárat hozzájuk.',
    },

    humanScale: 'Mennyi ez valójában?',
    human: {
      streams: 'egyidejű 4K stream férne bele a jelenlegi forgalomba',
      bytes: 'adat halad át minden egyes másodpercben',
      prefixes: 'IPv4 prefixet hirdetnek együttesen a tagok (átfedésekkel, önbevallás alapján)',
    },

    whoEyebrow: 'Kik peerelnek a BIX-en',
    whoTitle: 'Jóval több, mint magyar szolgáltatók',
    whoHint:
      'A(z) {t} tagból {n}-nek van nyilvános hálózati profilja a PeeringDB-ben. Az alábbi bontások erre a részhalmazra vonatkoznak, és önbevallott adatok.',
    byType: 'Hálózat típusa',
    byTypeExplain:
      'A „Content” hálózatok főleg adatot küldenek (streaming, CDN-ek, közösségi platformok). A „Cable/DSL/ISP” hálózatok főleg fogadnak — ezeknek vannak háztartási előfizetőik. Az „NSP” gerincszolgáltatók tranzitot adnak el másoknak.',
    byScope: 'Földrajzi hatókör',
    byScopeExplain:
      'Meddig ér el a hálózat, ahogy az üzemeltető leírja. Egy „Global” hálózat a BIX-en azt jelenti, hogy a magyar forgalom úgy ér el egy világméretű platformot, hogy közben el sem hagyja az épületet.',
    byTraffic: 'Forgalmi osztály',
    byTrafficExplain:
      'A hálózat önbevallott teljes forgalma az egész működési területén — nem az, ami a BIX-en átfolyik. Azt mutatja, milyen kaliberű cégek vannak jelen, nem a helyi mennyiséget.',
    byRatio: 'Forgalmi arány',
    byRatioExplain:
      'Többet küld-e a hálózat, mint amennyit fogad. A „Mostly outbound” a tartalomszolgáltatókra jellemző, a „Mostly inbound” a lakossági ISP-kre. A kiegyensúlyozott arányra a legkönnyebb peeringet kötni.',

    howEyebrow: 'Hogyan kapcsolódnak',
    howTitle: 'Négy épület, 137 port, 1 gigabittől 300-ig',
    byNode: 'Portok csatlakozási pont szerint',
    byBandwidth: 'Portok sávszélesség szerint',
    byPolicy: 'Peering-irányelv',
    biggestMembers: 'Legnagyobb tagok együttes portkapacitás szerint',
    biggestMembersExplain:
      'A tag összes portjának összege. A sáv színe a hálózat típusát követi, így egy pillantással látszik, hogy a legvastagabb csövek tartalomszolgáltatóké vagy lakossági ISP-ké.',
    viennaNote:
      'A Digital Realty (InterXion VIE1) nem Budapesten van, hanem Bécsben — a „budapesti” csomópontnak van egy osztrák lába.',

    worldEyebrow: 'A BIX és a világ',
    worldTitle: 'Hol áll a BIX a(z) {total} csomópont között',
    worldHint:
      'Abból számolva, hogy a BIX tagjai hol peerelnek még. A tagszámok a PeeringDB-ből jönnek, és regisztrált hálózatokat számolnak, nem forgalmat.',
    worldRank:
      'Tagszám szerint a BIX a(z) {rank}. a(z) {total} csomópont közül, ahol a tagjai jelen vannak.',
    topExchanges: 'A legnagyobb csomópontok a BIX-hez mérve (tagszám)',
    topExchangesExplain:
      'A tagszám a vonzerő durva mércéje, nem a forgalomé. Frankfurt és Amszterdam kontinentális gyűjtőpontok, amik mindenhonnan vonzanak hálózatokat; egy nemzeti csomópont egy országot szolgál ki. Mindkettő lehet egészséges.',
    sharedTitle: 'Hol peerelnek még a BIX tagjai?',
    sharedHint: 'Hány BIX-tag van jelen az adott csomóponton is.',

    factsEyebrow: 'Megfigyelések',
    factsTitle: 'Amit az adat csendben elárul',
    facts: {
      reachTitle: 'Egy a sok közül — de jó társaságban',
      reachBody:
        '{name} {n} internetcsomóponton van jelen világszerte, és a BIX ezek egyike. Amikor egy magyar felhasználó ilyen hálózat tartalmát kéri le, az adat nagy eséllyel el sem hagyja az országot.',
      viennaTitle: 'A legközelebbi szomszéd Bécs',
      viennaBody:
        '{n} BIX-tag peerel a bécsi VIX-en is — majdnem annyi, mint a sokkal nagyobb frankfurti DE-CIX-en ({de}). A földrajz a csomagoknak is számít.',
      redundancyTitle: 'Ki készült fel a kiesésre',
      redundancyBody:
        '{multi} tagnak van egynél több portja, és {backup} porton szerepel kifejezetten „backup” megjelölés. Egyetlen elvágott kábel egyiküket sem viszi le.',
      headroomTitle: 'Van hova nőni',
      headroomBody:
        '{n} port esetében a megjegyzés elárulja, hogy a fizikai port nagyobb, mint az előfizetett sávszélesség. Náluk a bővítés szerződésmódosítás, nem szerelés.',
      ipv6Title: 'Az IPv6 már nem opció',
      ipv6Body:
        'A profillal rendelkező {t} hálózatból {n} hirdet IPv6-prefixet — jóval magasabb arány, mint az interneten általában. A csomóponti tagság önmagában is szűrő: aki ide eljut, az általában felkészült.',
    },
    topIx: 'Hány másik csomóponton van még jelen',
    topPrefixes: 'Hány IPv4 prefixet hirdet',

    growthEyebrow: 'Növekedés',
    growthTitle: 'Honnan jött a mai kapacitás',
    growthLede:
      'A(z) {n} tag együtt {gbps} Gb/s portkapacitást birtokol. Az érkezési év szerint csoportosítva látszik, melyik évjárat hozta a súlyt — és nem a legrégebbiek.',
    growthCapacityTitle: 'Ma birtokolt kapacitás, érkezési év szerint halmozva',
    growthCapacityUnit: 'Gb/s',
    growthCapacityNote:
      'Így olvasandó: az ebben az évben vagy előtte megjelent hálózatok ma ennyi kapacitást birtokolnak. A 2023-ban érkezettek egymaguk 1 155 Gb/s-ot adnak.',
    growthCountTitle: 'Hálózatok, érkezési év szerint halmozva',
    growthCountUnit: 'hálózat',
    growthCountNote:
      'A két görbe szétválik: a darabszám egyenletesen nő, a kapacitás lépcsőzetesen. A később érkezők sokkal nagyobb portokkal jönnek.',
    growthWarnTitle: 'Ez nem a kapacitás története.',
    growthCaption:
      'Mindkét diagram a mai számokat helyezi el az érkezési év mentén. Nem azt mutatják, mekkora volt a kapacitás a múltban — ilyen mérés nincs közzétéve. A PeeringDB „created” mezője ráadásul azt jelöli, mikor került a bejegyzés az adatbázisba, nem azt, mikor csatlakozott a hálózat a BIX-hez: a csomópont 1996 óta működik, a legrégebbi rekord viszont 2010-es.',
  },

  members: {
    eyebrow: 'Tagok',
    title: 'Mind a 123 hálózat, minden ismert adattal',
    lede:
      'Együttes portkapacitás szerint rendezve. A szín a hálózat típusát jelöli. Vidd az egeret egy oszlopfej fölé, ha érdekel, mit mér.',
    searchPlaceholder: 'Keresés név vagy ASN szerint',
    allNodes: 'Összes csatlakozási pont',
    allBandwidths: 'Összes sávszélesség',
    allPolicies: 'Összes peering-irányelv',
    allTypes: 'Összes hálózattípus',
    matrixTitle: 'Portok kapacitás szerint',
    matrixHint: 'Minden négyzet egy port. Vidd rá az egeret a tag nevéért; a szín a sebességet jelöli.',
    coverageWarning:
      'A BIX nyilvános statisztikája {shown} portot listáz, miközben a főoldal {total} portot jelent. Ez a nézet a portok {percent}%-át fedi le.',
    showing: '{n} tag látszik a(z) {t}-ból',
    reset: 'Szűrők törlése',
    columns: {
      name: 'Tag', asn: 'ASN', type: 'Típus', scope: 'Hatókör',
      node: 'Pont', bandwidth: 'Kapacitás', policy: 'Irányelv',
      prefixes: 'Prefix', ix: 'Csomópont', v6: 'IPv6', rs: 'RS',
    },
    noResults: 'Nincs találat.',
    onlyPeeringdb: 'csak PeeringDB',
    legend: {
      prefixes: 'Hirdetett IPv4 prefixek száma (PeeringDB, önbevallás)',
      ix: 'Hány internetcsomóponton van jelen a hálózat',
      v6: 'Van IPv6-címe a BIX-en',
      rs: 'Peerel a route-serverrel is',
    },
  },

  map: {
    homeLabel: "Nézőpont",
    homeHint: "Ezen az oldalon minden a kiválasztott csomóponthoz képest számolódik.",
    foreignTitle: "{name} nézőpontjából.",
    foreignBody: "Élő forgalmi és port-szintű adat csak a BIX-hez van, mert egyedül az teszi közzé a nyers számait számként. Minden más itt — tagságok, átfedések, kábelek, érkezési évek — minden csomópontra ugyanúgy számolódik.",
    backHome: "Vissza a BIX-hez",
    filterNote: "A min. közös tag szűrő elrejt: {n}.",
    eyebrow: 'Világtérkép',
    title: 'Hol peerelnek még a BIX tagjai',
    intro:
      'Minden pötty egy internetcsomópont, ahol legalább egy BIX-tag szintén jelen van — {n} csomópont {c} városban. Húzd, nagyítsd, és kattints egy pöttyre, hogy lásd, ki van ott.',
    explainTitle: 'Hogyan kell olvasni ezt a térképet',
    explainBody:
      'A vonalak Budapestről futnak az egyes csomópontokhoz, aszerint színezve, hány BIX-tag van ott is jelen. Ha rákattintasz egy pöttyre, megváltozik a nézet: a panel felsorolja a tagokat, a vonalak onnan rajzolódnak újra, és minden olyan csomópont világos marad, amelyik ugyanazokon a hálózatokon osztozik, a többi elhalványul. Így látszik például, hogy a bécsi társaság szinte teljesen átfedésben van a frankfurtival.',
    cableLabel: 'Tengeralatti kábelek',
    cableToggle: 'Mutasd',
    cablePopup: {
      owners: 'Tulajdonos',
      suppliers: 'Kivitelező',
      length: 'Hossz',
      rfs: 'Üzemben',
      landings: 'Partraszállás',
      planned: 'tervezett',
      site: 'Hivatalos oldal',
    },
    minShared: 'Min. közös tag',
    regionLabel: 'Régió',
    allRegions: 'Összes régió',
    memberLabel: 'Tag',
    allMembers: 'Összes tag',
    reset: 'Alaphelyzet',
    wholeWorld: 'Teljes világ',
    fullscreen: 'Teljes képernyő',
    exitFullscreen: 'Kilépés',
    close: 'Bezárás',
    countLabel: '{n} csomópont látszik a(z) {t}-ból',
    dotLegend: 'A pötty mérete ≈ közös tagok',
    lineLegend: 'A vonal színe ≈ átfedés',
    panelEmpty:
      'Kattints egy csomópontra a térképen, hogy lásd, mely BIX-tagok peerelnek ott, és mely más csomópontok osztoznak ugyanazokon a hálózatokon.',
    panel: {
      shared: 'BIX-tag itt',
      total: 'hálózat összesen',
      linked: 'kapcsolódó csomópont',
      membersHere: 'Jelen lévő BIX-tagok',
      openPage: 'Teljes adatlap',
      relatedTitle: 'Közös hálózatok',
      relatedHint: 'Csomópontok, amelyek tagjai átfedésben vannak ezzel. Kattints az ugráshoz.',
      cablesTitle: 'Elérhető tengeralatti kábelek',
      cablesHint:
        '{n} kábel ér partot 150 km-en belül. Kapcsold be a kábelréteget, hogy kiemelve lásd őket.',
      inland:
        'Ehhez a csomóponthoz nem ér partot tengeralatti kábel. A legközelebbi {landing}, {km} km-re — ide minden szárazföldön érkezik.',
      sharedCableTitle: 'Közös fizikai kábel',
      sharedCableHint:
        'Ezek a csomópontok ugyanannak a kábelnek a partraszállása közelében vannak. Ez valódi közös fizikai infrastruktúra — szemben a peering-vonalakkal, amik logikaiak.',
    },
    physicalWarnTitle: 'A vonalak logikaiak, nem fizikaiak.',
    physicalWarnBody:
      'A Budapestről húzott kapcsolatok azt mutatják, hogy ugyanazok a hálózatok jelen vannak mindkét csomóponton. Nem áramkörök, és semmilyen nyilvános adat nem mondja meg, melyik szálon halad ez a forgalom. A tengeralatti kábelréteg az egyetlen fizikai infrastruktúra ezen a térképen — Magyarország pedig, szárazföldi országként, egyikhez sem ér hozzá.',
    fallback:
      'A térképkönyvtárt nem sikerült betölteni. A kapcsolati adatok az Áttekintés fülön továbbra is elérhetők.',
    attribution:
      'Térképcsempék © OpenStreetMap közreműködők. Csomópont-helyszínek: PeeringDB. Tengeralatti kábelnyomvonalak és partraszállások © TeleGeography, CC BY-NC-SA 3.0 alatt felhasználva.',
  },

  exchange: {
    eyebrow: 'Csomópont-adatlap',
    notFound: 'Nincs {id} azonosítójú csomópont a gyűjtött adatban.',
    backToMap: 'Vissza a térképhez',
    download: 'JSON letöltése',
    copy: 'JSON másolása',
    copied: 'Másolva',
    copyFailed: 'A másolás nem sikerült',
    peeringdb: 'Megtekintés a PeeringDB-n',
    visitSite: 'Hivatalos oldal',
    visitStats: 'Hivatalos statisztika',
    officialNote:
      'A fenti hivatkozások az üzemeltető saját oldalaira mutatnak. Ahol ez az oldal és az üzemeltető nem egyezik, az üzemeltetőnek van igaza.',
    planned: 'tervezett',
    membersHint:
      'Olyan hálózatok, amelyek ezen a csomóponton és a BIX-en is jelen vannak. A számok az egyes hálózatok saját PeeringDB-profiljából jönnek.',
    relatedHint: 'Csomópontok, ahol ugyanazok a hálózatok megjelennek. Logikai átfedés, nem áramkör.',
    sharedCableHint:
      'Csomópontok ugyanannak a tengeralatti kábelnek a partraszállása közelében — közös fizikai eszköz.',
    inland:
      '150 km-en belül nem ér partot tengeralatti kábel. A legközelebbi {landing}, {km} km-re, tehát ide minden szárazföldön érkezik.',
    stats: {
      networks: 'itt regisztrált hálózat',
      bixMembers: 'a BIX-en is peerel',
      relatedIx: 'csomóponttal közös hálózat',
      cables: 'elérhető tengeralatti kábel',
    },
    fields: {
      id: 'PeeringDB azonosító',
      city: 'Város',
      country: 'Ország',
      region: 'Régió',
      coords: 'Koordináták',
      longName: 'Teljes név',
      alsoKnown: 'Más néven',
      website: 'Hivatalos weboldal',
      stats: 'Hivatalos statisztikaoldal',
      dashboard: 'Státusz-dashboard',
      ipv6: 'IPv6 a hálózaton',
      serviceLevel: 'Szolgáltatási szint',
      nearestLanding: 'Legközelebbi partraszállás',
    },
    sections: {
      members: 'Itt jelen lévő BIX-tagok',
      cables: 'Tengeralatti kábelek 150 km-en belül',
      relatedIx: 'Közös hálózatok',
      sharedCable: 'Közös fizikai kábel',
      landings: 'Partraszállások 150 km-en belül',
    },
    tableFilter: 'Sorok szűrése…',
    tableCount: '{t} sorból {n}',
    cols: {
      member: 'Hálózat', asn: 'ASN', type: 'Típus', scope: 'Hatókör',
      ix: 'Csomópont', prefixes: 'Prefix',
      cable: 'Kábel', owners: 'Tulajdonos', builder: 'Kivitelező',
      length: 'Hossz', rfs: 'Üzemben', lands: 'Partraszállás',
      exchange: 'Csomópont', city: 'Város',
      sharedNetworks: 'Közös hálózat', sharedCables: 'Közös kábel',
      landing: 'Partraszállási pont', country: 'Ország', distance: 'Távolság',
    },
    empty: {
      members: 'Egyetlen BIX-tag sincs nyilvántartva ezen a csomóponton.',
      cables: 'Nincs elérhető tengeralatti kábel.',
      related: 'Nincs átfedés más csomóponttal ebben az adathalmazban.',
      sharedCable: 'Egyetlen csomópont sem osztozik kábelen ezzel.',
      landings: 'Nincs partraszállási pont 150 km-en belül.',
    },
  },

  faq: {
    eyebrow: "Gyakori kérdések",
    title: "Mit mond ez az adat, és mit nem",
    intro: "Ezeket a kérdéseket kapja a felület a leggyakrabban. A válaszok ott is szerepelnek, ahol számítanak — a diagramok mellett —, itt viszont egy helyen megtalálhatók és hivatkozhatók.",
    items: [
      {
        q: "Honnan jönnek az adatok?",
        a:
          "Négy nyilvános forrásból: a PeeringDB adja a csomópontokat, a hálózatokat és a tagságokat; a bix.hu a hazai port- és forgalmi számokat; a TeleGeography a tengeralatti kábeleket és a partraszállásokat; a Natural Earth az országhatárokat. Ez az oldal nem állít elő saját adatot — minden szám másolat vagy számítás olyasmiből, ami máshol már nyilvános. A jogi oldal mindegyik forrást megnevezi a licencével együtt.",
      },
      {
        q: "A csatlakozás éve azt mutatja, mikor lépett be egy hálózat?",
        a:
          "Nem, és a felület sehol nem is nevezi annak. A PeeringDB azt rögzíti, mikor jött létre a rekord a saját adatbázisában, ami rendszerint jóval a peering tényleges megkezdése után van — sokszor egyszerűen az a nap, amikor valaki végre regisztrált. Az erre épülő diagramok azt mutatják, mikor jelentek meg a rekordok, nem azt, mikor érkeztek a hálózatok, és ez oda is van írva a tengely fölé.",
      },
      {
        q: "A térképen a vonalak fizikai kábelnyomvonalak?",
        a:
          "Nem. Egy vonal azt jelenti, hogy két csomópontnak van legalább egy közös tagja: logikai kapcsolat, nem vezeték. A fizikai útvonalak külön jelennek meg tengeralatti kábelként, a TeleGeography geometriája alapján. Ahol egy kapcsolat és egy kábel történetesen ugyanazt a folyosót követi, azt az adatlap kiírja — de ez földrajzi megfigyelés, nem állítás arról, hogy melyik szálon melyik forgalom megy.",
      },
      {
        q: "A hazai forgalmi adat miért csak a csomópont egy részét fedi le?",
        a:
          "Mert a nyilvános statisztikai oldal is csak annyit fed le. A portok nagyjából háromnegyedéről közöl adatot, így az összegek alsó korlátot jelentenek, nem teljes képet. A lefedettség a diagram mellett szerepel, nem az apróbetűs részben, és a hiányzó részt nem próbáljuk becsléssel kiegészíteni.",
      },
      {
        q: "Mennyire friss ez?",
        a:
          "A forgalomból óránként, a szerkezeti adatokból naponta egyszer készül mintavétel, mindkettőt ütemezett feladat gyűjti és menti a tárolóba. A lábléc mutatja, mikor futott le utoljára sikeres gyűjtés, és figyelmeztet, ha elavult. Forgalmi előzmény csak a gyűjtés indulásától létezik — az azt megelőző időszakról nincs archívum.",
      },
      {
        q: "Hiányzik a hálózatom vagy a csomópontom, illetve rossz az adat.",
        a:
          "Szinte mindig a forrás elavult, nem ez az oldal. A PeeringDB-ben elvégzett javítás egy napon belül, a következő gyűjtéskor megjelenik itt is. Ha valami olyan módon hibás, amit a forrás nem magyaráz, a jogi oldalon van javítási és törlési elérhetőség.",
      },
      {
        q: "Felhasználhatom bármelyik részét?",
        a:
          "A kód MIT licenc alatt nyílt. Az adatfájlokra annak a feltételei vonatkoznak, aki közzétette őket, és ezek eltérnek — a tengeralatti kábelek fájlja CC BY-NC-SA 3.0, ami kizárja a kereskedelmi felhasználást. A licencfájl tételesen leírja, melyik fájlra mi vonatkozik. Az eredeti licenc szövegét olvasd el, ne erre az összefoglalóra hagyatkozz.",
      },
    ],
  },

  legal: {
    eyebrow: 'A projektről',
    title: 'Mi ez az oldal, és mi nem',
    updated: 'Utolsó átnézés: 2026. augusztus 21.',
    sections: [
      {
        heading: 'Mi ez',
        body:
          'Ez egy független, nem kereskedelmi hobbiprojekt. Harmadik felek által nyilvánosan közzétett információt olvas be, és más formában mutatja meg — diagramokként, táblázatokként és térképként, nyers oldalak helyett. Eredeti adat nem keletkezik itt. Minden szám másolata vagy számítása valaminek, ami máshol már nyilvános.',
      },
      {
        heading: 'Nincs kapcsolat',
        body:
          'Ezt az oldalt nem az Internet Szolgáltatók Tanácsa (ISZT), nem a Budapest Internet Exchange üzemeltetője, nem a PeeringDB és nem is bármely, ezeken az oldalakon szereplő szervezet üzemelteti, támogatja vagy hagyta jóvá. A nevek, védjegyek és logók a jogtulajdonosaiké, és itt kizárólag az érintett szervezetek azonosítására szolgálnak. A csomópontról szóló hiteles információért a bix.hu az irányadó.',
      },
      {
        heading: 'Honnan jön az adat',
        body:
          'Az aggregált forgalmi számok és a port-szintű tábla a bix.hu közzétett oldalairól származnak. A hálózati profilok, a csomópontok helyszínei és a világméretű tagságok a PeeringDB nyilvános API-jából. A tengeralatti kábelnyomvonalak és partraszállások a TeleGeography Submarine Cable Map adatai, Creative Commons Nevezd meg! – Ne add el! – Így add tovább! 3.0 licenc alatt felhasználva — többek között ezért marad a projekt nem kereskedelmi. A térképcsempéket az OpenStreetMap szolgálja ki. Minden forrás meg van jelölve azon az oldalon, ahol az adata megjelenik, a gyűjtőkód pedig megtekinthető a projekt tárolójában.',
      },
      {
        heading: 'Pontosság és felelősség',
        body:
          'Az adat úgy áll rendelkezésre, ahogy van, mindenféle garancia nélkül. Lehet hiányos, elavult, a gyűjtőszkriptek által félreolvasott, vagy már a forrásnál is hibás. Jelentős része a hálózatok önbevallása, amit senki nem ellenőriz. Az oldal üzemeltetője nem vállal felelősséget semmilyen veszteségért vagy döntésért, ami az itt látottakra támaszkodik. Ne használd ezt az oldalt üzemeltetési, kereskedelmi vagy szerződéses döntések alapjául.',
      },
      {
        heading: 'Ismert korlátok',
        body:
          'A nyilvános statisztikaoldal a csomópont által jelentett portoknak nagyjából háromnegyedét fedi le, ezért a port-szintű nézetek egy részhalmazt mutatnak. A PeeringDB rekord-dátumai azt jelölik, mikor jelent meg a bejegyzés abban az adatbázisban, nem azt, mikor csatlakozott a hálózat a csomóponthoz. Forgalmi előzmény csak a gyűjtés indulásának napjától létezik, mert a korábbi értékeket képként, nem számként teszik közzé. Ezeket a hiányokat mindenhol jelezzük, ahol egy számot érintenek.',
      },
      {
        heading: 'Személyes adatok',
        body:
          "Kizárólag szervezeti szintű információt gyűjtünk: cégneveket, autonóm rendszerszámokat, csatlakozási pontokat, kapacitásokat és peering-irányelveket. A kapcsolattartók nevét, e-mail-címét és telefonszámát szándékosan kihagyjuk, akkor is, ha a forrásnál nyilvánosan szerepel.\n\nEz az oldal nem használ sütiket és nem futtat analitikát. Semmi nem kerül rögzítésre vagy továbbításra abból, amit itt csinálsz. Egyetlen dolgot tárol a böngésződben: a nyelvi választásodat, a bix-lang kulcs alatt a local storage-ban. Ez kizárólag azért van ott, mert te kérted azt a nyelvet, semmit nem tartalmaz, ami azonosítana, soha nem hagyja el az eszközödet, és a böngészőadatok törlésével eltűnik. Az ePrivacy-szabályok szerint a látogató által beállított beállítás nem igényel hozzájárulási sávot — ezért nincs ilyen.\n\nA betűtípusok és a térképkönyvtár erről az oldalról töltődnek, nem tartalomkiszolgáló hálózatról, így harmadik fél nem szerez tudomást a látogatásodról. Az egyetlen elkerülhetetlen kivétel a térkép: a csempéi az OpenStreetMap szervereiről érkeznek, amelyek — mint minden hétköznapi webkérésnél — megkapják az IP-címedet. Ez csak akkor történik meg, ha megnyitod a Világtérkép fület.",
      },
      {
        heading: 'A gyűjtés módja',
        body:
          'Legfeljebb tizenöt percenként egyetlen oldalletöltés, azonosítható User-Agenttel, ami a projekt tárolójára mutat. A robots-irányelveket tiszteletben tartjuk. Semmilyen hitelesítést nem kerülünk meg, és nem publikus felülethez nem nyúlunk.',
      },
      {
        heading: 'Kérések és eltávolítás',
        body:
          'Ha valamelyik forrás üzemeltetője vagy, vagy szerepelsz ebben az adatban, és szeretnél valamit javíttatni vagy eltávolíttatni, nyiss egy issue-t a projekt tárolójában, és intézkedünk. Nincs mögötte kereskedelmi érdek, amit védeni kellene.',
      },
      {
        heading: 'Ez nem jogi tanács',
        body:
          "Ahol ez az oldal licencfeltételeket foglal össze vagy jogszabályt értelmez, ott jóhiszemű olvasat szerepel, nem ügyvéd által ellenőrzött vélemény. Ha az adatokat újra felhasználod, az eredeti licenc szövege az irányadó, nem az itteni összefoglaló. Az adatkezelésről szóló szakasz ezzel szemben nem értelmezés, hanem vállalás: az oldal az ott leírtak szerint működik.",
      },
    ],
  },

  footer: {
    independent:
      'Független hobbiprojekt. Nincs kapcsolata az ISZT-vel vagy a BIX üzemeltetőjével.',
    sources: 'Adatforrás: bix.hu és PeeringDB — kizárólag nyilvános források.',
    legalLink: 'A projektről',
    updated: 'Frissítve: {when}',
    stale: 'Az adat elavult — utolsó sikeres frissítés: {when}',
  },
};
