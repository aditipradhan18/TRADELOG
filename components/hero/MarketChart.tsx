'use client'
import { useEffect, useRef } from 'react'
import { startMarket } from '@/lib/market'

export function MarketChart({ className = '', label }: { className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => (ref.current ? startMarket(ref.current) : undefined), [])
  return <canvas ref={ref} className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />
}

const strip = 'flex justify-between gap-3 overflow-hidden whitespace-nowrap px-[18px] py-[11px] font-mono text-[10px] font-medium uppercase tracking-[.1em] text-mute'

export default function MarketPanel() {
  return (
    <div className="relative flex min-w-0 flex-col border-line bg-black">
      {['-left-px -top-px border-l-2 border-t-2', '-right-px -top-px border-r-2 border-t-2', '-bottom-px -left-px border-b-2 border-l-2', '-bottom-px -right-px border-b-2 border-r-2'].map((c) => (
        <i key={c} className={`pointer-events-none absolute z-10 h-[22px] w-[22px] border-white/30 ${c}`} />
      ))}
      <div className={`${strip} border-b border-line`}><span>Market.Replay</span><span>XAUUSD · Simulated data</span></div>
      <MarketChart className="block min-h-[320px] w-full flex-1 lg:min-h-[400px]" label="Animated candlestick chart with example entries and exits (simulated data)" />
      <div className={`${strip} border-t border-line`}><span>▲ Entry &nbsp; ▼ Exit with R multiple</span><span>Illustrative only</span></div>
    </div>
  )
}
