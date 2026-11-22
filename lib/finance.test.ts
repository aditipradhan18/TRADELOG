import { describe, expect, it } from 'vitest'
import { closedTrades, estimateProfit, netPnl, plannedRR, realizedR, summarize, type Trade } from './finance'

const base: Trade = {
  id: '1', instrument: 'XAUUSD', market: 'Metals', direction: 'short', status: 'closed',
  entry_at: '2026-11-13T08:11:00Z', exit_at: '2026-11-13T10:01:00Z', entry_price: 3894.38, exit_price: 3904.08,
  quantity: 0.01, profit: -9.7, stop_loss: 3903.89, target_price: 3882.61, session: 'London', reason: null, mistake: 'None',
}
const second: Trade = { ...base, id: '2', entry_price: 3894.7, exit_price: 3903.72, stop_loss: 3903.45, profit: -9.02 }

describe('finance', () => {
  it('uses the profit you typed', () => {
    expect(netPnl(base)).toBe(-9.7)
    expect(netPnl(second)).toBe(-9.02)
    expect(netPnl({ ...base, status: 'open', exit_price: null, profit: null })).toBeNull()
  })
  it('computes R from price distance to the stop', () => {
    expect(realizedR(base)!).toBeCloseTo(-1.02, 2)
    expect(realizedR(second)!).toBeCloseTo(-1.03, 2)
    expect(realizedR({ ...base, stop_loss: null })).toBeNull()
  })
  it('estimates profit per instrument type', () => {
    expect(estimateProfit('XAUUSD', 'short', 3894.38, 3904.08, 0.01)).toBe(-9.7)
    expect(estimateProfit('XAUUSD', 'short', 3894.7, 3903.72, 0.01)).toBe(-9.02)
    expect(estimateProfit('EURUSD', 'long', 1.1, 1.105, 1)).toBe(500)
    expect(estimateProfit('USDJPY', 'long', 150, 151, 1)).toBe(662.25)
    expect(estimateProfit('USDCAD', 'short', 1.36, 1.355, 0.5)).toBe(184.5)
    expect(estimateProfit('BTCUSD', 'long', 60000, 61000, 0.2)).toBe(200)
    expect(estimateProfit('GBPJPY', 'long', 190, 191, 1)).toBeNull()
    expect(estimateProfit('NAS100', 'long', 18000, 18100, 1)).toBeNull()
  })
  it('summarises both gold sells', () => {
    const s = summarize(closedTrades([base, second]), 10000)
    expect(s.net).toBe(-18.72)
    expect(s.winRate).toBe(0)
    expect(s.profitFactor).toBe(0)
    expect(s.expectancy).toBeCloseTo(-9.36, 2)
    expect(s.maxDrawdown).toBeCloseTo(18.72, 2)
    expect(s.avgR!).toBeCloseTo(-1.0254, 3)
  })
  it('keeps break-even trades separate', () => {
    const s = summarize(closedTrades([base, { ...second, profit: 0 }]), 1000)
    expect(s.breakEven).toBe(1)
    expect(s.losses).toBe(1)
  })
  it('plans reward-to-risk and rejects wrong-sided stops', () => {
    expect(plannedRR(base)!).toBeCloseTo(11.78 / 9.51, 2)
    expect(plannedRR({ ...base, stop_loss: 3880 })).toBeNull()
  })
})
