import { describe, expect, it } from 'vitest'
import { closedTrades, netPnl, plannedRR, realizedR, summarize, type Trade } from './finance'

const base: Trade = {
  id: '1', instrument: 'XAUUSD', market: 'Metals', direction: 'short', status: 'closed',
  entry_at: '2026-11-13T08:11:00Z', exit_at: '2026-11-13T10:01:00Z', entry_price: 3894.38, exit_price: 3904.08,
  quantity: 0.01, contract_size: 100, stop_loss: 3903.89, target_price: 3882.61, session: 'London', reason: null, mistake: 'None',
}
const second: Trade = { ...base, id: '2', entry_price: 3894.7, exit_price: 3903.72, stop_loss: 3903.45 }

describe('finance', () => {
  it('matches the TradeHawk gold sells', () => {
    expect(netPnl(base)).toBe(-9.7)
    expect(netPnl(second)).toBe(-9.02)
    expect(realizedR(base)!).toBeCloseTo(-1.02, 2)
    expect(realizedR(second)!).toBeCloseTo(-1.03, 2)
  })
  it('handles a long trade', () => {
    expect(netPnl({ ...base, direction: 'long', entry_price: 450, exit_price: 455, quantity: 2 })).toBe(1000)
  })
  it('ignores open trades', () => {
    expect(netPnl({ ...base, status: 'open', exit_price: null })).toBeNull()
  })
  it('summarises both gold sells', () => {
    const s = summarize(closedTrades([base, second]), 10000)
    expect(s.net).toBe(-18.72)
    expect(s.winRate).toBe(0)
    expect(s.profitFactor).toBe(0)
    expect(s.expectancy).toBeCloseTo(-9.36, 2)
    expect(s.maxDrawdown).toBeCloseTo(18.72, 2)
  })
  it('plans reward-to-risk and rejects wrong-sided stops', () => {
    expect(plannedRR(base)!).toBeCloseTo(11.78 / 9.51, 2)
    expect(plannedRR({ ...base, stop_loss: 3880 })).toBeNull()
  })
})
