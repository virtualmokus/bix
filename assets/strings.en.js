export default {
  siteName: 'BIX',
  siteTagline: 'Budapest Internet Exchange — independent data view',
  tabs: { overview: 'Overview', members: 'Members', map: 'World map', legal: 'About & legal' },
  live: 'LIVE',
  noData: 'No data for this yet.',
  showMore: 'What does this mean?',

  // Rövid magyarázatok, amiket több nézet is használ.
  glossary: {
    ixp:
      'An internet exchange point (IXP) is a physical place where separate networks plug into shared switches and hand traffic to each other directly, instead of paying a third party to carry it. Shorter paths, lower cost, less latency.',
    peering:
      'Peering is the agreement between two networks to exchange traffic directly. “Open” means the network peers with anyone who asks; “selective” means it has conditions; “restrictive” means it generally declines.',
    asn:
      'An autonomous system number (ASN) is the unique identifier of an independently routed network — the closest thing the internet has to a company registration number.',
    routeServer:
      'A route server lets a member peer with many others through one connection instead of negotiating each pairing separately. It is the difference between one handshake and a hundred.',
    prefixes:
      'A prefix is a block of IP addresses a network announces to the world. More prefixes usually means a larger or more fragmented address footprint — it is a rough proxy for size, not a precise one.',
    port:
      'A port is one physical connection into the exchange. A member can hold several: for redundancy, or across different buildings.',
  },

  overview: {
    heroEyebrow: 'Flowing through BIX right now',
    utilization: 'Utilisation',
    current: 'right now',
    peak: 'all-time peak',
    capacity: 'installed capacity',
    didYouKnow: 'Did you know?',
    capacityNote:
      'Headroom is not waste: it is why a sudden traffic surge does not take down the country’s internet. An exchange must keep working even when several times the usual peak arrives.',
    seriesStarting: 'The time series has just started.',
    seriesStartingBody:
      '{count} measurements collected so far, the first {since}. Give it a few days before the curve tells a story.',
    chartY: 'Gb/s',

    keyFigures: 'Key figures',
    keyFiguresHint: 'Click any figure for what it means and where it comes from.',
    fig: {
      networks: 'networks', networksHint: 'as reported by BIX itself',
      networksExplain:
        'Distinct networks connected to the exchange, per the number BIX publishes on its own homepage. We do not recount it — we read it.',
      ports: 'ports', portsHint: 'total, per the homepage',
      portsExplain:
        'Physical connections into the exchange. Higher than the network count because many members hold more than one port.',
      portsPublic: 'public ports', portsPublicHint: '{p} of reported ports',
      portsPublicExplain:
        'Ports that appear in the public statistics page, which is fewer than the total BIX reports. The reason for the gap is not published, so this site only ever claims what it can see.',
      members: 'members', membersHint: 'unique ASNs from two merged sources',
      membersExplain:
        'Unique networks after merging the BIX statistics page with PeeringDB. Higher than the public port count because some networks appear in PeeringDB without a public port entry.',
      nodes: 'points of presence', nodesHint: 'three in Budapest, one in Vienna',
      nodesExplain:
        'Buildings where members can physically plug in. Three sit in Budapest; the fourth is a Vienna facility, which is why a “Budapest” exchange has an Austrian leg.',
      largestPort: 'largest port', largestPortHint: 'in the public list',
      largestPortExplain:
        'The fastest single connection visible in the public statistics. Twenty years ago 10 gigabit was exotic; today it is the entry level.',
      routeServer: 'route-server peers', routeServerHint: 'also peer via the shared route server',
      ipv6: 'with IPv6', ipv6Hint: 'for peering inside BIX',
      ipv6Explain:
        'Members that have an IPv6 address configured on the exchange fabric — a prerequisite for exchanging IPv6 traffic locally rather than routing it abroad.',
    },

    // Sötét sávok a szekciók között — egy szám, egy állítás.
    bands: {
      reachUnit: 'internet exchanges',
      reachHead: '{name} plugs into this many exchanges worldwide',
      reachBody:
        'BIX is one of them. That is why a request from a Hungarian household for such a network’s content usually never crosses a border — the answer is already in the building.',
      viennaUnit: 'of the 137 ports',
      viennaHead: 'The “Budapest” exchange has a leg in Vienna',
      viennaBody:
        'Digital Realty InterXion VIE1 sits in Austria and carries {gbps} Gb/s of member capacity. A national exchange that stops at the border would be a smaller exchange.',
      decixUnit: 'BIX members',
      decixHead: 'also peer at DE-CIX Frankfurt',
      decixBody:
        'That is {pct} of the {total} members. The networks here are not confined to Hungary; most of the large ones sit at several exchanges at once, and BIX is the local doorway to them.',
    },

    humanScale: 'How much is that, really?',
    human: {
      streams: 'simultaneous 4K streams would fit into the current traffic',
      bytes: 'of data passes through every single second',
      prefixes: 'IPv4 prefixes announced by the members combined (with overlaps, self-reported)',
    },

    whoEyebrow: 'Who peers at BIX',
    whoTitle: 'Far more than Hungarian ISPs',
    whoHint:
      '{n} of the {t} members have a public network profile on PeeringDB. The breakdowns below cover that subset, and the data is self-reported.',
    byType: 'Network type',
    byTypeExplain:
      '“Content” networks mostly send data out (streaming, CDNs, social platforms). “Cable/DSL/ISP” networks mostly receive it — these are the ones with household subscribers. “NSP” carriers sell transit to others.',
    byScope: 'Geographic scope',
    byScopeExplain:
      'How far the network reaches, as the operator describes it. A “Global” network at BIX means Hungarian traffic can reach a worldwide platform without leaving the building.',
    byTraffic: 'Traffic class',
    byTrafficExplain:
      'Self-declared total traffic across the network’s whole footprint — not what flows through BIX. It shows the calibre of company present, not local volume.',
    byRatio: 'Traffic ratio',
    byRatioExplain:
      'Whether a network sends more than it receives. “Mostly outbound” is typical of content platforms; “mostly inbound” of consumer ISPs. Balanced ratios make peering easiest to agree.',

    howEyebrow: 'How they connect',
    howTitle: 'Four buildings, 137 ports, from 1 to 300 gigabit',
    byNode: 'Ports by point of presence',
    byBandwidth: 'Ports by bandwidth',
    byPolicy: 'Peering policy',
    biggestMembers: 'Largest members by combined port capacity',
    biggestMembersExplain:
      'Sum of every port a member holds. Bar colour follows the network type, so you can see at a glance whether the biggest pipes belong to content platforms or to consumer ISPs.',
    viennaNote:
      'Digital Realty (InterXion VIE1) is not in Budapest but in Vienna — the “Budapest” exchange has an Austrian leg.',

    worldEyebrow: 'BIX and the world',
    worldTitle: 'Where BIX stands among {total} exchanges',
    worldHint:
      'Computed from where BIX members also peer. Member counts come from PeeringDB and count registered networks, not traffic.',
    worldRank:
      'By member count, BIX ranks #{rank} of the {total} exchanges where its members are present.',
    topExchanges: 'Largest exchanges compared with BIX (members)',
    topExchangesExplain:
      'Member count is a rough measure of gravity, not of traffic. Frankfurt and Amsterdam are continental hubs that draw networks from everywhere; a national exchange serves a country. Both can be healthy.',
    sharedTitle: 'Where else do BIX members peer?',
    sharedHint: 'Number of BIX members also present at each exchange.',

    factsEyebrow: 'Findings',
    factsTitle: 'What the data quietly reveals',
    facts: {
      reachTitle: 'One of many — in good company',
      reachBody:
        '{name} is present at {n} internet exchanges worldwide, and BIX is one of them. When a Hungarian user requests content from such a network, the data most likely never leaves the country.',
      viennaTitle: 'The closest neighbour is Vienna',
      viennaBody:
        '{n} BIX members also peer at VIX in Vienna — nearly as many as at Frankfurt’s far larger DE-CIX ({de}). Geography still matters, even for packets.',
      redundancyTitle: 'Who is prepared for failure',
      redundancyBody:
        '{multi} members have more than one port, and {backup} ports are explicitly labelled “backup”. A single cut cable takes none of them offline.',
      headroomTitle: 'Room to grow',
      headroomBody:
        'On {n} ports the note reveals a bigger physical port than the subscribed bandwidth. For them, an upgrade is a contract amendment, not an engineering visit.',
      ipv6Title: 'IPv6 is no longer optional',
      ipv6Body:
        '{n} of the {t} profiled networks announce IPv6 prefixes — a far higher share than the internet at large. Exchange membership is itself a filter: those who get here tend to be prepared.',
    },
    topIx: 'Present at how many other exchanges',
    topPrefixes: 'IPv4 prefixes announced',

    growthEyebrow: 'Growth',
    growthTitle: 'Where today’s capacity came from',
    growthLede:
      'The {n} members hold {gbps} Gb/s of port capacity between them. Grouping them by the year each network’s record first appeared shows which arrivals brought the weight — and it is not the oldest ones.',
    growthCapacityTitle: 'Capacity held today, accumulated by arrival year',
    growthCapacityUnit: 'Gb/s',
    growthCapacityNote:
      'Read as: networks that appeared by this year hold this much capacity today. The 2023 arrivals alone account for 1,155 Gb/s.',
    growthCountTitle: 'Networks, accumulated by arrival year',
    growthCountUnit: 'networks',
    growthCountNote:
      'The two curves diverge: the count rises steadily, the capacity in steps. Later arrivals bring far bigger ports than early ones.',
    growthWarnTitle: 'This is not a history of capacity.',
    growthCaption:
      'Both charts place today’s figures against the year each network’s PeeringDB record first appeared. They do not show what capacity existed in the past — no such measurement is published. PeeringDB’s “created” field also marks when the entry reached that database, not when the network joined BIX: the exchange has run since 1996, yet the oldest record is from 2010.',
  },

  members: {
    eyebrow: 'Members',
    title: 'All 123 networks, with everything known about them',
    lede:
      'Sorted by combined port capacity. Colour marks the network type. Hover a column heading for what it measures.',
    searchPlaceholder: 'Search by name or ASN',
    allNodes: 'All PoPs',
    allBandwidths: 'All bandwidths',
    allPolicies: 'All peering policies',
    allTypes: 'All network types',
    matrixTitle: 'Ports by capacity',
    matrixHint: 'Every square is one port. Hover for the member; colour marks the speed.',
    coverageWarning:
      'BIX’s public statistics list {shown} ports while the homepage reports {total}. This view covers {percent}% of the ports.',
    showing: 'Showing {n} of {t} members',
    reset: 'Reset filters',
    columns: {
      name: 'Member', asn: 'ASN', type: 'Type', scope: 'Scope',
      node: 'PoP', bandwidth: 'Capacity', policy: 'Policy',
      prefixes: 'Prefixes', ix: 'IXPs', v6: 'IPv6', rs: 'RS',
    },
    noResults: 'No matches.',
    onlyPeeringdb: 'PeeringDB only',
    legend: {
      prefixes: 'Announced IPv4 prefixes (PeeringDB, self-reported)',
      ix: 'Number of internet exchanges the network is present at',
      v6: 'Has an IPv6 address at BIX',
      rs: 'Peers with the route server',
    },
  },

  map: {
    homeLabel: "Viewpoint",
    homeHint: "Everything on this page is computed relative to the chosen exchange.",
    foreignTitle: "Viewing from {name}.",
    foreignBody: "Live traffic and port-level detail exist only for BIX, because it is the one exchange whose raw figures are published as numbers. Everything else here — memberships, overlaps, cables, arrival years — is computed the same way for every exchange.",
    backHome: "Back to BIX",
    filterNote: "Hidden by the min. shared members filter: {n}.",
    eyebrow: 'World map',
    title: 'Where BIX members also peer',
    intro:
      'Every dot is an internet exchange where at least one BIX member is also present — {n} exchanges across {c} cities. Drag, zoom, and click a dot to see who is there.',
    explainTitle: 'How to read this map',
    explainBody:
      'Lines run from Budapest to each exchange, coloured by how many BIX members are also present there. Click any dot and the view changes: the panel lists the members, the lines redraw from that exchange, and every other exchange sharing the same networks stays lit while the rest fade. That is how you can see, for example, that the crowd at Vienna overlaps almost entirely with the crowd at Frankfurt.',
    cableLabel: 'Submarine cables',
    cablePopup: {
      owners: 'Owners',
      suppliers: 'Built by',
      length: 'Length',
      rfs: 'In service',
      landings: 'Lands in',
      planned: 'planned',
      site: 'Official site',
    },
    cableToggle: 'Show',
    minShared: 'Min. shared members',
    regionLabel: 'Region',
    allRegions: 'All regions',
    memberLabel: 'Member',
    allMembers: 'All members',
    reset: 'Reset',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    close: 'Close',
    countLabel: 'Showing {n} of {t} exchanges',
    dotLegend: 'Dot size ≈ shared members',
    lineLegend: 'Line colour ≈ overlap',
    panelEmpty: 'Click an exchange on the map to see which BIX members peer there, and which other exchanges share the same networks.',
    panel: {
      shared: 'BIX members here',
      total: 'networks in total',
      linked: 'linked exchanges',
      membersHere: 'BIX members present',
      relatedTitle: 'Shares networks with',
      relatedHint: 'Exchanges whose members overlap with this one. Click to jump.',
      openPage: 'Open full dossier',
      cablesTitle: 'Submarine cables within reach',
      cablesHint:
        '{n} cables land within 150 km of this exchange. Turn on the cable layer to see them highlighted.',
      inland:
        'No submarine cable lands near this exchange. The closest is {landing}, {km} km away — everything here arrives overland.',
      sharedCableTitle: 'Shares a physical cable with',
      sharedCableHint:
        'These exchanges sit near a landing of the same cable. This is a genuinely shared piece of physical infrastructure — unlike the peering lines, which are logical.',
    },
    physicalWarnTitle: 'The lines are logical, not physical.',
    physicalWarnBody:
      'The connections drawn from Budapest show that the same networks are present at both exchanges. They are not circuits, and no public data says which fibre any of that traffic actually follows. The submarine cable layer is the one thing on this map that is physical infrastructure — and Hungary, being landlocked, touches none of it.',
    fallback:
      'The map library could not be loaded. The connection data is still available on the Overview tab.',
    attribution:
      'Map tiles © OpenStreetMap contributors. Exchange locations from PeeringDB. Submarine cable routes and landing points © TeleGeography, used under CC BY-NC-SA 3.0.',
  },

  exchange: {
    eyebrow: 'Exchange dossier',
    notFound: 'No exchange with id {id} in the collected data.',
    backToMap: 'Back to map',
    download: 'Download JSON',
    copy: 'Copy JSON',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    peeringdb: 'View on PeeringDB',
    visitSite: 'Official site',
    visitStats: 'Official statistics',
    officialNote:
      'The links above go to the operator’s own pages. Where this site and the operator disagree, the operator is right.',
    planned: 'planned',
    membersHint:
      'Networks present at both this exchange and BIX. Figures come from each network’s own PeeringDB profile.',
    relatedHint: 'Exchanges where the same networks appear. A logical overlap, not a circuit.',
    sharedCableHint: 'Exchanges near a landing of the same submarine cable — a shared physical asset.',
    inland:
      'No submarine cable lands within 150 km. The nearest is {landing}, {km} km away, so everything here arrives overland.',
    stats: {
      networks: 'networks registered here',
      bixMembers: 'also peer at BIX',
      relatedIx: 'exchanges share networks',
      cables: 'submarine cables in reach',
    },
    fields: {
      id: 'PeeringDB id',
      city: 'City',
      country: 'Country',
      region: 'Region',
      coords: 'Coordinates',
      nearestLanding: 'Nearest cable landing',
      longName: 'Full name',
      alsoKnown: 'Also known as',
      website: 'Official website',
      stats: 'Official statistics page',
      dashboard: 'Status dashboard',
      ipv6: 'IPv6 on the fabric',
      serviceLevel: 'Service level',
    },
    sections: {
      members: 'BIX members present here',
      cables: 'Submarine cables within 150 km',
      relatedIx: 'Shares networks with',
      sharedCable: 'Shares a physical cable with',
      landings: 'Cable landings within 150 km',
    },
    cols: {
      member: 'Network', asn: 'ASN', type: 'Type', scope: 'Scope',
      ix: 'IXPs', prefixes: 'Prefixes',
      cable: 'Cable', owners: 'Owners', builder: 'Built by',
      length: 'Length', rfs: 'In service', lands: 'Lands in',
      exchange: 'Exchange', city: 'City',
      sharedNetworks: 'Shared networks', sharedCables: 'Shared cables',
      landing: 'Landing point', country: 'Country', distance: 'Distance',
    },
    empty: {
      members: 'No BIX member is recorded at this exchange.',
      cables: 'No submarine cable within reach.',
      related: 'No overlap with other exchanges in this dataset.',
      sharedCable: 'No exchange shares a cable with this one.',
      landings: 'No landing point within 150 km.',
    },
  },

  legal: {
    eyebrow: 'About & legal',
    title: 'What this site is, and what it is not',
    updated: 'Last reviewed: 21 August 2026',
    sections: [
      {
        heading: 'What this is',
        body:
          'This is an independent, non-commercial hobby project. It reads information that third parties publish openly, and presents it in a different form — charts, tables and a map instead of raw pages. No original data is produced here. Every number shown is a copy or a calculation of something already public elsewhere.',
      },
      {
        heading: 'No affiliation',
        body:
          'This site is not operated by, endorsed by, affiliated with, or connected to the Council of Hungarian Internet Providers (ISZT), the operator of the Budapest Internet Exchange, PeeringDB, or any organisation listed on these pages. Names, trade marks and logos belong to their respective owners and are used here only to identify the organisations concerned. For authoritative information about the exchange, refer to bix.hu.',
      },
      {
        heading: 'Where the data comes from',
        body:
          'Aggregate traffic figures and the port-level table are read from pages published on bix.hu. Network profiles, exchange locations and worldwide membership come from the PeeringDB public API. Submarine cable routes and landing points come from TeleGeography’s Submarine Cable Map and are used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 licence — which is one reason this project stays non-commercial. Map tiles are served by OpenStreetMap. Each source is credited on the pages where its data appears, and the collection code is open for inspection in the project repository.',
      },
      {
        heading: 'Accuracy and liability',
        body:
          'The data is provided as-is, without any warranty. It may be incomplete, outdated, misread by the collection scripts, or wrong at the source. Substantial parts of it are self-reported by the networks themselves and are not verified by anyone. The operator of this site accepts no liability for any loss or decision arising from reliance on what is shown here. Do not use this site as a basis for operational, commercial, or contractual decisions.',
      },
      {
        heading: 'Known limitations',
        body:
          'The public statistics page covers roughly three quarters of the ports the exchange reports, so the port-level views are a subset. PeeringDB record dates mark when an entry appeared in that database, not when a network joined the exchange. Traffic history only exists from the day collection started, because historical figures are published as images rather than numbers. These gaps are labelled wherever they affect a figure.',
      },
      {
        heading: 'Personal data',
        body:
          "Only organisation-level information is collected: company names, autonomous system numbers, connection points, capacities and peering policies. Contact names, e-mail addresses and telephone numbers are deliberately excluded, even where they appear publicly at the source.\n\nThis site sets no cookies and runs no analytics. Nothing you do here is recorded or transmitted anywhere. One item is stored in your browser: your language choice, under the key bix-lang in local storage. It exists only because you asked for that language, holds nothing that identifies you, never leaves your device, and disappears when you clear site data. Under the ePrivacy rules a preference the visitor set themselves does not require a consent banner, which is why there is none.\n\nFonts and the map library are served from this site rather than a content delivery network, so no third party learns that you visited. The one unavoidable exception is the map: its tiles come from OpenStreetMap servers, which receive your IP address as part of any ordinary web request. That happens only if you open the World map tab.",
      },
      {
        heading: 'Collection conduct',
        body:
          'Pages are requested at most once every fifteen minutes, with an identifying User-Agent that points back to the project repository. Robots directives are respected. No authentication is bypassed and no non-public interface is accessed.',
      },
      {
        heading: 'Requests and removal',
        body:
          'If you operate one of the sources or appear in this data and would like something corrected or removed, open an issue in the project repository and it will be acted on. There is no commercial interest here to defend.',
      },
      {
        heading: 'Not legal advice',
        body:
          "Where this site summarises licence terms or interprets legislation, it does so in good faith and without review by a lawyer. If you reuse the data, the original licence text governs, not the summary given here. The section on data handling is not an interpretation but a commitment: the site operates as it is described there.",
      },
    ],
  },

  footer: {
    independent:
      'Independent hobby project. Not affiliated with ISZT or the operator of BIX.',
    sources: 'Data: bix.hu and PeeringDB — public sources only.',
    legalLink: 'About & legal',
    updated: 'Updated {when}',
    stale: 'Data is stale — last successful update {when}',
  },
};
