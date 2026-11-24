# token-radar-01 — radar-4 variant

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/Bejoke/token-radar-01-radar4/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/Bejoke/token-radar-01-radar4/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token launch radar: all 198 rankable pre-token protocols ranked by implied launch value,
each with a seven-step farm plan. Built from scratch for make.fun's “Build the best token
launch radar” bounty, $1,325 in USDC. This is a fresh variant, parallel to the submitted
radar-2 entry — same snapshot, a different model, a different dashboard.

## The model (radar-4)

One function scores every protocol from the sealed DefiLlama snapshot — no name is ever
special-cased:

- **Category multiple** — the median market-cap-over-TVL of the live-token protocols in the
  same category, shrunk toward the global median with a prior of 3 peers:
  (n × category median + 3 × global median) / (n + 3), clamped to 0.05 – 1.00. A category
  with one or two peers does not fall off a cliff.
- **Sector momentum** — 1 + 0.30 × the median 7-day TVL change of the category's live-token
  peers, clamped to −30% … +30%.
- **Growth** — 1 + 0.55 × tanh(7-day TVL change / 60). Smooth and bounded, so a +4,448%
  week saturates instead of being clamped equal to a +100% week.
- **Maturity** — 0.55 + 0.45 × ln(1 + age in days) / ln(1 + 1460). Longer with no token is
  worth more, with diminishing returns; an unknown listing date counts as 180 days.
- **Breadth** — 1 + 0.05 × ln(chains), capped at 1.20.

implied value = TVL × category × sector × growth × maturity × breadth, rounded to whole dollars.

The board covers the snapshot's whole 40-protocol watchlist plus every other rankable
pre-token protocol below the floor (158 more). Bridges, liquid staking/restaking, CEX and
versioned pools are out — but unlike the submitted entry, this radar names them: the
“Not a launch” view lists all 144 excluded pre-token protocols with the reason each one
is out. Live-token protocols are shown separately for calibration and never ranked.

Every farm plan has seven steps: verify the site, the main action, a second qualifying
action, a day-7 checkpoint (verify the position shows on the protocol's own page, else
redo), the hold, the claim, and the exit plan. Gas is priced by the protocol's own chain
tier, and every plan reports a total budget and a hold time.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

Node 22 or later, standard library only. `main.ts` reads the sealed snapshot, writes
`board.json` (198 rows) and `data.js`, copies `dashboard/` and `screenshots/`, and writes
`dossier.json` with the vendored make.fun library. The run is deterministic: the same
snapshot always writes the same bytes.
