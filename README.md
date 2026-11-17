# token-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/takhao666/token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/takhao666/token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar ranks every pre-token protocol in the sealed DefiLlama snapshot by what its launch would be worth, and shows how to farm each one. Model radar-2: the multiple is the median market-cap-to-TVL ratio of the live-token protocols in the same category, read from the snapshot itself — never a hardcoded constant — combined with seven-day growth and age with no token on record. The board covers all 40 watchlist protocols plus every other rankable pre-token protocol below the floor (198 rows), each with a thesis and a seven-step farm plan with costs and times. The dashboard is a static page that renders with no network: sortable, filterable, with a detail view per protocol and the methodology table.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input ../input/snapshot.json
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=hvn9m3q0&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
