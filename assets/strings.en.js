export default {
  siteName: 'BIX',
  siteTagline: 'Budapest Internet Exchange — independent data view',
  tabs: { overview: 'Overview', members: 'Members', map: 'World map' },
  live: 'LIVE',
  noData: 'No data for this yet.',

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
    fig: {
      networks: 'networks', networksHint: 'as reported by BIX itself',
      ports: 'ports', portsHint: 'total, per the homepage',
      portsPublic: 'public ports', portsPublicHint: '{p} of reported ports',
      members: 'members', membersHint: 'unique ASNs from two merged sources',
      nodes: 'points of presence', nodesHint: 'three in Budapest, one in Vienna',
      largestPort: 'largest port', largestPortHint: 'in the public list',
      routeServer: 'route-server peers', routeServerHint: 'also peer via the shared route server',
      ipv6: 'with IPv6', ipv6Hint: 'for peering inside BIX',
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
    byScope: 'Geographic scope',
    byTraffic: 'Traffic class',
    byRatio: 'Traffic ratio',

    howEyebrow: 'How they connect',
    howTitle: 'Four buildings, 137 ports, from 1 to 300 gigabit',
    byNode: 'Ports by point of presence',
    byBandwidth: 'Ports by bandwidth',
    byPolicy: 'Peering policy',
    biggestMembers: 'Largest members by combined port capacity',
    viennaNote:
      'Digital Realty (InterXion VIE1) is not in Budapest but in Vienna — the “Budapest” exchange has an Austrian leg.',

    worldEyebrow: 'BIX and the world',
    worldTitle: 'Where BIX stands among 621 exchanges',
    worldHint:
      'Computed from where BIX members also peer. Member counts come from PeeringDB and count registered networks, not traffic.',
    worldRank:
      'By member count, BIX ranks #{rank} of the {total} exchanges where its members are present.',
    topExchanges: 'Largest exchanges compared with BIX (members)',
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
        '{n} BIX members also peer at VIX in Vienna — more than at Frankfurt’s giant DE-CIX ({de}). Geography still matters, even for packets.',
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
    growthTitle: 'Twenty years ago 10 gigabit was the ceiling — today it is the entry level',
    growthCaption:
      'PeeringDB’s “created” field records when the entry appeared in the database — not when the network connected to BIX. BIX has operated since 1996, yet the oldest record is from 2010.',
    growthY: 'records',
  },

  members: {
    eyebrow: 'Members',
    title: 'All 123 networks, with everything known about them',
    searchPlaceholder: 'Search by name or ASN',
    allNodes: 'All PoPs',
    allBandwidths: 'All bandwidths',
    allPolicies: 'All peering policies',
    allTypes: 'All network types',
    matrixTitle: 'Ports by capacity',
    matrixHint: 'Hover a cell for the member’s name.',
    coverageWarning:
      'BIX’s public statistics list {shown} ports while the homepage reports {total}. This view covers {percent}% of the ports.',
    showing: 'Showing {n} of {t} members',
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
    eyebrow: 'World map',
    title: 'Where BIX members also peer',
    intro:
      'Every dot is an internet exchange where at least one BIX member is also present — {n} exchanges in {c} cities. Lines connect Budapest to the exchanges with the most shared members. Drag and zoom freely.',
    minShared: 'Show exchanges with at least',
    sharedSuffix: 'shared members',
    dotLegend: 'Dot size ≈ shared members',
    lineLegend: 'Line colour ≈ strength of overlap',
    popup: {
      shared: 'shared members with BIX',
      total: 'networks in total',
    },
    fallback:
      'The map library could not be loaded. The connection data is still available on the Overview tab.',
    attribution: 'Map data © OpenStreetMap contributors',
  },

  footer: {
    independent:
      'Independent hobby project. Not affiliated with ISZT or the operator of BIX.',
    sources: 'Data: bix.hu and PeeringDB — public sources only.',
    updated: 'Updated {when}',
    stale: 'Data is stale — last successful update {when}',
  },
};
