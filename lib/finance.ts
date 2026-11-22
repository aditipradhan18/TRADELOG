import Decimal from 'decimal.js'

export type Direction = 'long' | 'short'
export interface TradeImage { id: string; storage_path: string; category: string; file_name: string | null }
export interface Trade {
  id: string
  instrument: string
  market: string
  direction: Direction
  status: 'open' | 'closed'
  entry_at: string
  exit_at: string | null
  entry_price: number
  exit_price: number | null
  quantity: number
  profit: number | null
  stop_loss: number | null
  target_price: number | null
  session: string | null
  reason: string | null
  mistake: string
  trade_images?: TradeImage[]
}

/** quote: 'usd' = profit of one price move is already in USD, 'base' = USD is the base currency (divide by the exit price), 'none' = depends on the broker, so no estimate. */
type Quote = 'usd' | 'base' | 'none'
const ins = (symbol: string, label: string, market: string, size: number, quote: Quote) => ({ symbol, label, market, size, quote })
export const INSTRUMENTS = [
  ins('XAUUSD', 'Gold (XAUUSD)', 'Metals', 100, 'usd'),
  ins('XAGUSD', 'Silver (XAGUSD)', 'Metals', 5000, 'usd'),
  ins('EURUSD', 'EURUSD', 'Forex', 100000, 'usd'), ins('GBPUSD', 'GBPUSD', 'Forex', 100000, 'usd'), ins('USDJPY', 'USDJPY', 'Forex', 100000, 'base'),
  ins('AUDUSD', 'AUDUSD', 'Forex', 100000, 'usd'), ins('USDCAD', 'USDCAD', 'Forex', 100000, 'base'), ins('USDCHF', 'USDCHF', 'Forex', 100000, 'base'),
  ins('NZDUSD', 'NZDUSD', 'Forex', 100000, 'usd'), ins('GBPJPY', 'GBPJPY', 'Forex', 100000, 'none'),
  ins('BTCUSD', 'Bitcoin (BTCUSD)', 'Crypto', 1, 'usd'), ins('ETHUSD', 'Ethereum (ETHUSD)', 'Crypto', 1, 'usd'), ins('SOLUSD', 'Solana (SOLUSD)', 'Crypto', 1, 'usd'), ins('XRPUSD', 'XRPUSD', 'Crypto', 1, 'usd'),
  ins('NAS100', 'Nasdaq 100 (NAS100)', 'Indices', 1, 'none'), ins('US30', 'Dow Jones (US30)', 'Indices', 1, 'none'), ins('SPX500', 'S&P 500 (SPX500)', 'Indices', 1, 'none'),
]
export const SESSIONS = ['Sydney', 'Asia', 'London', 'New York']
export const MISTAKES = ['None', 'Overtrading', 'Revenge trading', 'No stop loss', 'FOMO entries', 'Poor risk management', 'Early exits / late exits', 'No proper strategy']

const d = (n: number) => new Decimal(n)
const side = (t: Trade) => (t.direction === 'long' ? 1 : -1)

/** Net P&L is the profit you typed (the broker's figure). Open trades return null. */
export function netPnl(t: Trade): number | null {
  if (t.status !== 'closed' || t.exit_price == null || t.profit == null) return null
  return d(t.profit).toDecimalPlaces(2).toNumber()
}

/** Realized R = price move in your favour divided by the distance to the stop. Independent of lot size, contract size and currency. */
export function realizedR(t: Trade): number | null {
  if (netPnl(t) == null || t.stop_loss == null || t.exit_price == null) return null
  const dist = Math.abs(t.entry_price - t.stop_loss)
  return dist ? d(t.exit_price).minus(t.entry_price).times(side(t)).div(dist).toNumber() : null
}

/** Helper for the form: what the profit should roughly be from prices alone (before swaps and commission). Null where it depends on the broker. */
export function estimateProfit(symbol: string, dir: Direction, entry: number | null, exit: number | null, lots: number | null): number | null {
  const i = INSTRUMENTS.find((x) => x.symbol === symbol)
  if (!i || i.quote === 'none' || !entry || !exit || !lots || entry <= 0 || exit <= 0 || lots <= 0) return null
  const raw = d(exit).minus(entry).times(dir === 'long' ? 1 : -1).times(lots).times(i.size)
  return (i.quote === 'base' ? raw.div(exit) : raw).toDecimalPlaces(2).toNumber()
}

/** Planned reward-to-risk from stop and target. Null if either is missing or on the wrong side of entry. */
export function plannedRR(t: Pick<Trade, 'direction' | 'entry_price' | 'stop_loss' | 'target_price'>): number | null {
  const { entry_price: e, stop_loss: s, target_price: g } = t
  if (s == null || g == null) return null
  const ok = t.direction === 'long' ? s < e && g > e : s > e && g < e
  return ok ? Math.abs(g - e) / Math.abs(e - s) : null
}

export function exitHit(t: Trade): 'SL' | 'TP' | null {
  if (t.exit_price == null) return null
  const long = t.direction === 'long'
  if (t.stop_loss != null && (long ? t.exit_price <= t.stop_loss : t.exit_price >= t.stop_loss)) return 'SL'
  if (t.target_price != null && (long ? t.exit_price >= t.target_price : t.exit_price <= t.target_price)) return 'TP'
  return null
}

export const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA')

export interface Closed { t: Trade; net: number; r: number | null; day: string }

export function closedTrades(trades: Trade[]): Closed[] {
  const out: Closed[] = []
  for (const t of trades) {
    const net = netPnl(t)
    if (net != null) out.push({ t, net, r: realizedR(t), day: dayKey(t.exit_at ?? t.entry_at) })
  }
  return out.sort((a, b) => ((a.t.exit_at ?? '') < (b.t.exit_at ?? '') ? -1 : 1))
}

export function summarize(list: Closed[], startingBalance: number) {
  const wins = list.filter((x) => x.net > 0)
  const losses = list.filter((x) => x.net < 0)
  const grossWin = wins.reduce((a, x) => a + x.net, 0)
  const grossLoss = losses.reduce((a, x) => a + x.net, 0)
  const net = Math.round(list.reduce((a, x) => a + x.net, 0) * 100) / 100

  let eq = 0, peak = 0, dd = 0
  const curve = [0]
  for (const x of list) { eq += x.net; curve.push(eq); peak = Math.max(peak, eq); dd = Math.max(dd, peak - eq) }

  const daily: Record<string, number> = {}
  list.forEach((x) => { daily[x.day] = (daily[x.day] ?? 0) + x.net })
  const days = Object.values(daily)
  let sharpe: number | null = null, sortino: number | null = null
  if (days.length > 1) {
    const m = days.reduce((a, b) => a + b, 0) / days.length
    const sd = Math.sqrt(days.reduce((a, b) => a + (b - m) ** 2, 0) / (days.length - 1))
    const down = Math.sqrt(days.reduce((a, b) => a + Math.min(0, b) ** 2, 0) / days.length)
    sharpe = sd ? (m / sd) * Math.sqrt(252) : null
    sortino = down ? (m / down) * Math.sqrt(252) : null
  }
  const withR = list.filter((x) => x.r != null)

  return {
    count: list.length, wins: wins.length, losses: losses.length, breakEven: list.length - wins.length - losses.length, net, curve, daily,
    gross: list.reduce((a, x) => a + x.net, 0),
    winRate: list.length ? (wins.length / list.length) * 100 : 0,
    profitFactor: grossLoss ? grossWin / Math.abs(grossLoss) : grossWin ? Infinity : 0,
    expectancy: list.length ? net / list.length : 0,
    maxDrawdown: dd,
    drawdownPct: startingBalance + peak ? (dd / (startingBalance + peak)) * 100 : 0,
    avgR: withR.length ? withR.reduce((a, x) => a + (x.r ?? 0), 0) / withR.length : null,
    rCount: withR.length,
    best: list.length ? Math.max(...list.map((x) => x.net)) : 0,
    worst: list.length ? Math.min(...list.map((x) => x.net)) : 0,
    recovery: dd ? net / dd : 0,
    sharpe, sortino,
    balance: startingBalance + net,
  }
}
