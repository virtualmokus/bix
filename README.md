# BIX Dashboard

An independent hobby project that collects what the
[Budapest Internet Exchange](https://www.bix.hu/) publishes openly, and presents
it in a form you can actually read.

**Live site:** https://virtualmokus.github.io/bix/ · available in English and
Hungarian.

**This is not an official site.** It is not operated by, endorsed by or
affiliated with ISZT, the operator of BIX, or any listed member. The
interpretation here is ours, and so are any mistakes. For authoritative
information, [bix.hu](https://www.bix.hu/) is the reference.

## What it shows

| Data | Source | Refresh |
|---|---|---|
| Aggregate traffic (current, peak, capacity) | bix.hu | 15 min (in practice hourly — GitHub throttles cron) |
| Port-level structure: member, ASN, PoP, bandwidth, peering policy | bix.hu | daily |
| Network profiles, worldwide memberships, exchange locations | [PeeringDB](https://www.peeringdb.com/ix/55) | daily |
| Submarine cable routes, landing points, owners | [TeleGeography](https://www.submarinecablemap.com/) | daily |

Three views plus a per-exchange dossier: an overview of BIX itself, the full
member table, and a world map of the 621 exchanges where BIX members also peer.
Any exchange opens as its own page with everything known about it, downloadable
as JSON.

## What the data does *not* say

Three things that are easy to misread, and that the site labels wherever they
affect a figure:

- **PeeringDB record dates are not join dates.** The oldest record is from 2010
  while BIX has run since 1996. The field marks when the entry reached that
  database.
- **The public statistics are incomplete.** bix.hu lists 137 ports while its own
  homepage reports 188 — roughly three quarters.
- **The map's connection lines are logical, not physical.** They show that the
  same networks are present at both exchanges. No public data says which fibre
  carries the traffic. The submarine cable layer is the only physical
  infrastructure on the map.

Traffic history only exists from the day collection started, because the
operator publishes past figures as images rather than numbers.

## Deliberately not collected

Contact names, e-mail addresses and telephone numbers, even where they appear
publicly at the source. Only organisation-level data is used: company names,
ASNs, connection points, capacities, peering policies.

## Running it locally

```bash
npm ci
npm test
node collect/traffic.js
```

Any static server will serve the site from the repository root. There is no
build step.

## How it collects

One page request at most every fifteen minutes, with an identifying User-Agent
pointing back at this repository. Robots directives are respected, no
authentication is bypassed, and no non-public interface is touched. If you
operate one of the sources and object to any of it, open an issue and it stops.

## Licence

The **code is MIT**. The **collected data under `data/` is not** — each file
keeps the terms of its source.

`data/cables.json` is **CC BY-NC-SA 3.0** (TeleGeography), which is why this
project stays non-commercial. For a commercial build, remove that file, the
`collect/cables.js` collector and the map's cable layer; the rest of the project
does not carry the restriction.

See [LICENSE](LICENSE) for the source-by-source breakdown.
