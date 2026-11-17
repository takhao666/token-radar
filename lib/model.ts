// Token Radar's model, version radar-2: one snapshot of the protocol universe in, one ranked
// board out.
//
// The board covers every slug in the snapshot's watchlist (the floor, never a ceiling) and every
// other pre-token protocol the radar can defend: the early rows the radar exists to find. A protocol
// is pre-token when its index entry records no token (no market cap, no CoinGecko id, no symbol);
// the snapshot's live-token protocols are kept apart and shown as the market's own values, never
// mixed into the ranked board. A wrapped, staked or bridged product of a token that already trades
// is not a launch candidate either, so the board applies the watchlist's own exclusion rule to
// every row, not only to the watchlist: no exchange, no bridge, no liquid staking or restaking,
// no versioned pool, no name carrying wrapped, staked or staking, no exchange-prefixed name.
//
// Implied value follows only from the snapshot's own figures. The multiple is not a magic constant:
// it is the median market-cap-to-TVL ratio of the live-token protocols in the same category, read
// from this snapshot at run time (categories with fewer than four live comparables fall back to the
// global median), clamped to a sane band so one outlier cannot set the price:
//
//   multiple   = median(mcap_usd / tvl_usd) over live-token protocols in the category (n >= 4),
//                else the global median; clamped to [0.05, 1.0]
//   growth     = clamp(change_7d, -60, 120) per cent
//   growthMult = 1 + (growth / 100) x GROWTH_WEIGHT
//   maturity   = 0.6 + min(age_days, 1095) / 1095 x 0.4   (age_days unknown: 365)
//   implied    = max(1, round(tvl_usd x multiple x growthMult x maturity))
//
// No protocol name is ever special-cased: the same function scores every row.
//
// Each row also carries its own risk note, and the board ships two more views of the same figures:
// the week's biggest movers among the pre-token rows, and one standing line per category.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them and the sandbox may change them. */
export interface ModelConstants {
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  multiple_min: number;
  multiple_max: number;
  multiple_min_comparables: number;
}

export const MODEL: ModelConstants = {
  growth_weight: 0.5,
  growth_floor: -60,
  growth_cap: 120,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_days: 1095,
  unknown_age_days: 365,
  multiple_min: 0.05,
  multiple_max: 1.0,
  multiple_min_comparables: 4,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-2';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    category_multiple: number;
    comparables: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    age_days: number | null;
  };
  thesis: string;
  risk: string;
  confidence: 'high' | 'medium' | 'low';
  category_rank: number;
  farm_steps: string[];
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  category_multiple: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  thesis: string;
  risk: string;
  confidence: 'high' | 'medium' | 'low';
  category_rank: number;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** One category's derived multiple, for the methodology table. */
export interface CategoryMultiple {
  category: string;
  comparables: number;
  multiple: number;
}

/** One of the week's fastest movers among the pre-token rows. */
export interface Mover {
  slug: string;
  name: string;
  category: string | null;
  change_7d: number | null;
  tvl_usd: number;
  implied_value_usd: number;
}

/** The week's five fastest risers and five fastest fallers among the pre-token rows. */
export interface Movers {
  gainers: Mover[];
  losers: Mover[];
}

/** One category's standing on the board: its rows, its median multiple, its top row. */
export interface CategorySummary {
  category: string;
  rows: number;
  watchlist_rows: number;
  median_multiple: number;
  top_slug: string;
  top_name: string;
  top_implied_usd: number;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist: string[];
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  global_multiple: number;
  multiples: CategoryMultiple[];
  movers: Movers;
  categories: CategorySummary[];
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** The median of a sorted array of numbers. */
function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The derived multiples: the global median and one per category, from live-token protocols. */
export interface Multiples {
  global: number;
  byCategory: Map<string, { n: number; multiple: number }>;
}

export function computeMultiples(snapshot: Snapshot, model: ModelConstants = MODEL): Multiples {
  const byCat = new Map<string, number[]>();
  const all: number[] = [];
  for (const p of snapshot.protocols) {
    if (p.mcap_usd === null || p.gecko_id === null || p.symbol === null) continue;
    if (!p.mcap_usd || !p.tvl_usd || p.tvl_usd <= 0) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!Number.isFinite(ratio) || ratio <= 0) continue;
    all.push(ratio);
    const key = p.category ?? 'Other';
    const list = byCat.get(key) ?? [];
    list.push(ratio);
    byCat.set(key, list);
  }
  all.sort((a, b) => a - b);
  const globalRaw = median(all);
  const clamp = (v: number): number => Math.min(model.multiple_max, Math.max(model.multiple_min, v));
  const global = clamp(globalRaw);
  const byCategory = new Map<string, { n: number; multiple: number }>();
  for (const [cat, ratios] of byCat) {
    ratios.sort((a, b) => a - b);
    const multiple = ratios.length >= model.multiple_min_comparables ? clamp(median(ratios)) : global;
    byCategory.set(cat, { n: ratios.length, multiple });
  }
  return { global, byCategory };
}

/** The multiple one protocol's category gets under the derived table. */
export function multipleFor(p: SnapshotProtocol, multiples: Multiples): { multiple: number; comparables: number } {
  const entry = multiples.byCategory.get(p.category ?? 'Other');
  if (entry !== undefined && entry.n >= MODEL.multiple_min_comparables) return { multiple: entry.multiple, comparables: entry.n };
  return { multiple: multiples.global, comparables: entry !== undefined ? entry.n : 0 };
}

/** The three multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  multiples: Multiples,
  model: ModelConstants = MODEL,
): { implied: number; multiple: number; comparables: number; growthPct: number; growthMult: number; maturityMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const { multiple: rawMultiple, comparables } = multipleFor(protocol, multiples);
  // The multiple is rounded to 4 decimals before it prices anything, so the dashboard's own
  // recompute from the stored multiple lands on the same number board.json carries.
  const multiple = round4(rawMultiple);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const base = protocol.tvl_usd * multiple;
  const implied = Math.max(1, Math.round(base * growthMult * maturityMult));
  return { implied, multiple, comparables, growthPct, growthMult, maturityMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Categories the watchlist's own rule leaves out: a product of a token that already trades. */
const EXCLUDED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** Exchange names a protocol name must not begin with. */
const EXCHANGE_PREFIXES = ['Binance', 'Coinbase', 'Bybit', 'Kraken', 'Bitget', 'OKX', 'Bitfinex', 'Gemini'];

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Whether a name carries a whole word wrapped, staked or staking, or begins with an exchange name. */
function isWrappedOrStaked(p: SnapshotProtocol): boolean {
  const words = p.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 0);
  if (words.includes('wrapped') || words.includes('staked') || words.includes('staking')) return true;
  return EXCHANGE_PREFIXES.some((e) => p.name.startsWith(e));
}

/** Whether a protocol is one the board may rank: pre-token and not a product of a traded token. */
export function isRankable(p: SnapshotProtocol): boolean {
  return (
    isPreToken(p) &&
    (p.category === null || !EXCLUDED_CATEGORIES.has(p.category)) &&
    !VERSIONED.test(p.name) &&
    !isWrappedOrStaked(p)
  );
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** How much of the record a row's figures rest on. */
export function confidenceFor(p: SnapshotProtocol): 'high' | 'medium' | 'low' {
  const hasGrowth = p.change_7d !== null;
  const hasAge = p.listed_at !== null;
  if (hasGrowth && hasAge) return 'high';
  if (hasGrowth || hasAge) return 'medium';
  return 'low';
}

/** What could go wrong farming this protocol, from its own figures alone. */
export function riskFor(p: SnapshotProtocol, age: number | null, growthPct: number, comparables: number): string {
  const flags: string[] = [];
  if (growthPct <= -20) flags.push(`TVL fell ${Math.abs(growthPct).toFixed(0)}% in 7 days, so the position may keep shrinking while you hold it`);
  if (age === null) flags.push('no listing date on record, so the age behind the maturity score is a guess');
  else if (age < 90) flags.push(`only ${age} days on record, so the track record is thin`);
  if (comparables < MODEL.multiple_min_comparables) flags.push('fewer live comparables in its category, so the multiple is the global fallback');
  if (p.tvl_usd < 100_000_000) flags.push('under $100M of TVL, so one large wallet leaving moves the pool');
  if (flags.length === 0) return 'The main risk is the launch itself: a protocol may run for years and never issue a token.';
  return `Watch out: ${flags.join('; ')}.`;
}

/** One line saying why this protocol is worth farming, from its own figures alone. */
export function thesisFor(p: SnapshotProtocol, categoryRank: number, age: number | null, growthPct: number): string {
  const tvl =
    p.tvl_usd >= 1e9 ? `$${(p.tvl_usd / 1e9).toFixed(2)}B of TVL` : p.tvl_usd >= 1e6 ? `$${(p.tvl_usd / 1e6).toFixed(1)}M of TVL` : `$${Math.round(p.tvl_usd / 1e3)}K of TVL`;
  const cat = p.category ?? 'protocol';
  const growth = growthPct > 0 ? `growing +${growthPct.toFixed(1)}% in 7 days` : growthPct < 0 ? `down ${growthPct.toFixed(1)}% in 7 days` : 'flat over 7 days';
  const ageText = age === null ? 'with no listing date on record' : age >= 365 ? `running ${(age / 365).toFixed(1)} years with no token on record` : `running ${age} days with no token on record`;
  return `#${categoryRank} ${cat} by implied value: ${tvl}, ${growth}, ${ageText}.`;
}

/** The headline sentence's figures: how many watchlist slugs, how many rows, how many live protocols. */
export interface BoardSummary {
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const multiples = computeMultiples(snapshot, model);
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries (it cannot, but the
  // board's coverage is the gate's row and is never gambled on a missing record).
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every rankable pre-token protocol below the watchlist floor. No cap: the board
  // exists to find them all, and the gate's ceiling is 4,000 rows.
  const early = snapshot.protocols
    .filter((p) => !chosen.has(p.slug) && isRankable(p))
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  for (const p of early) chosen.set(p.slug, p);

  const scored = [...chosen.values()].map((p) => {
    const v = impliedValue(p, snapshot.as_of, multiples, model);
    return { p, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));

  // Rank inside each category, for the thesis line.
  const catCount = new Map<string, number>();
  const catRank = new Map<string, number>();
  for (const s of scored) {
    const key = s.p.category ?? 'Other';
    catCount.set(key, (catCount.get(key) ?? 0) + 1);
    if (!catRank.has(s.p.slug)) catRank.set(s.p.slug, catCount.get(key)!);
  }

  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      category_multiple: round4(s.multiple),
      comparables: s.comparables,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      age_days: s.age,
    },
    thesis: thesisFor(s.p, catRank.get(s.p.slug) ?? 0, s.age, s.growthPct),
    risk: riskFor(s.p, s.age, s.growthPct, s.comparables),
    confidence: confidenceFor(s.p),
    category_rank: catRank.get(s.p.slug) ?? 0,
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's main action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  if (c.includes('restak')) return `Restake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('staking')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The category's second qualifying action: the weekly repeat that keeps the wallet active. */
function repeatFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('dex') || c.includes('yield')) return `Swap $25 through ${name} on ${chain} once a week so the wallet shows trading volume, not only a deposit.`;
  if (c.includes('lend') || c.includes('cdp')) return `Borrow about a quarter of the supplied value from ${name} and repay it the same week, so the wallet shows borrowing as well as supplying.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Close the hedge and open one fresh small position each week, keeping the margin in ${name} the whole time.`;
  if (c.includes('prediction')) return `Settle one market and place one new position on ${name} each week.`;
  if (c.includes('curator') || c.includes('allocator')) return `Move a small part of the vault shares between ${name} vaults once, so the wallet shows more than a single deposit.`;
  if (c.includes('rwa')) return `Claim the yield the position earned and redeposit it through ${name} once a month.`;
  if (c.includes('insurance')) return `Renew or top up the cover on ${name} once, so the policy stays active across snapshots.`;
  return `Make one more qualifying action each week on ${name}, such as a deposit, a swap or a vote.`;
}

/**
 * A protocol's farm plan: seven steps, each an action with a cost and a time. The plan is derived
 * from the protocol's own record (category, chains, TVL, age), never from a hand-written list of
 * names. The first step is safety, the second is the position, the third is the weekly repeat, the
 * rest are the hold, the claim and the log.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const action = actionFor(p, capital, chain);
  const repeat = repeatFor(p, capital, chain);
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: action,
      cost: `$${capital} of capital and about $${capital >= 150 ? 8 : 4} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: repeat,
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.`,
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** The five fastest risers and five fastest fallers, by seven-day change. */
export function moversOf(board: BoardRow[]): Movers {
  const withChange = board.filter((r) => r.change_7d !== null);
  const toMover = (r: BoardRow): Mover => ({
    slug: r.slug,
    name: r.name,
    category: r.category,
    change_7d: r.change_7d,
    tvl_usd: r.tvl_usd,
    implied_value_usd: r.implied_value_usd,
  });
  const gainers = withChange
    .slice()
    .sort((a, b) => (b.change_7d ?? 0) - (a.change_7d ?? 0))
    .slice(0, 5)
    .map(toMover);
  const losers = withChange
    .slice()
    .sort((a, b) => (a.change_7d ?? 0) - (b.change_7d ?? 0))
    .slice(0, 5)
    .map(toMover);
  return { gainers, losers };
}

/** A per-category standing table, built from the ranked board and the derived multiples. */
export function categorySummaries(board: BoardRow[], multiples: Multiples, watchlist: string[]): CategorySummary[] {
  const byCat = new Map<string, BoardRow[]>();
  for (const r of board) {
    const key = r.category ?? 'Other';
    const list = byCat.get(key) ?? [];
    list.push(r);
    byCat.set(key, list);
  }
  const out: CategorySummary[] = [];
  for (const [category, rows] of byCat) {
    const top = rows[0]!;
    const entry = multiples.byCategory.get(category);
    out.push({
      category,
      rows: rows.length,
      watchlist_rows: rows.filter((r) => watchlist.includes(r.slug)).length,
      median_multiple: round4(entry !== undefined ? entry.multiple : multiples.global),
      top_slug: top.slug,
      top_name: top.name,
      top_implied_usd: top.implied_value_usd,
    });
  }
  out.sort((a, b) => b.rows - a.rows || (a.category < b.category ? -1 : 1));
  return out;
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    category_multiple: row.model.category_multiple,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    thesis: row.thesis,
    risk: row.risk,
    confidence: row.confidence,
    category_rank: row.category_rank,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const multiples = computeMultiples(snapshot, model);
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const multiplesTable: CategoryMultiple[] = [...multiples.byCategory.entries()]
    .map(([category, v]) => ({ category, comparables: v.n, multiple: round4(v.multiple) }))
    .sort((a, b) => b.comparables - a.comparables || (a.category < b.category ? -1 : 1));
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist: snapshot.watchlist,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    global_multiple: round4(multiples.global),
    multiples: multiplesTable,
    movers: moversOf(board),
    categories: categorySummaries(board, multiples, snapshot.watchlist),
    rows: board.map(radarRow),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
