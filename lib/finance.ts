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
  contract_size: number
  stop_loss: number | null
  target_price: number | null
  session: string | null
  reason: string | null
  mistake: string
  trade_images?: TradeImage[]
}

export const INSTRUMENTS = [
  { symbol: 'XAUUSD', label: 'Gold (XAUUSD)', market: 'Metals', size: 100 },
  { symbol: 'XAGUSD', label: 'Silver (XAGUSD)', market: 'Metals', size: 5000 },
  ...['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'GBPJPY'].map((s) => ({ symbol: s, label: s, market: 'Forex', size: 100000 })),
  { symbol: 'BTCUSD', label: 'Bitcoin (BTCUSD)', market: 'Crypto', size: 1 },
  { symbol: 'ETHUSD', label: 'Ethereum (ETHUSD)', market: 'Crypto', size: 1 },
  { symbol: 'SOLUSD', label: 'Solana (SOLUSD)', market: 'Crypto', size: 1 },
  { symbol: 'XRPUSD', label: 'XRPUSD', market: 'Crypto', size: 1 },
  { symbol: 'NAS100', label: 'Nasdaq 100 (NAS100)', market: 'Indices', size: 1 },
  { symbol: 'US30', label: 'Dow Jones (US30)', market: 'Indices', size: 1 },
  { symbol: 'SPX500', label: 'S&P 500 (SPX500)', market: 'Indices', size: 1 },
]
export const SESSIONS = ['Sydney', 'Asia', 'London', 'New York']
export const MISTAKES = ['None', 'Overtrading', 'Revenge trading', 'No stop loss', 'FOMO entries', 'Poor risk management', 'Early exits / late exits', 'No proper strategy']

const d = (n: number) => new Decimal(n)
const side = (t: Trade) => (t.direction === 'long' ? 1 : -1)

/** Net P&L of a closed trade in account currency (no fees in this version). Open trades return null. */
export function netPnl(t: Trade): number | null {
  if (t.status !== 'closed' || t.exit_price == null) return null
  return d(t.exit_price).minus(t.entry_price).times(side(t)).times(t.quantity).times(t.contract_size).toDecimalPlaces(2).toNumber()
}

/** Realized result divided by the amount risked at the stop loss. */
export function realizedR(t: Trade): number | null {
  const n = netPnl(t)
  if (n == null || t.stop_loss == null) return null
  const risk = d(t.entry_price).minus(t.stop_loss).abs().times(t.quantity).times(t.contract_size)
  return risk.isZero() ? null : d(n).div(risk).toNumber()
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
    count: list.length, wins: wins.length, losses: losses.length, net, curve, daily,
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
