'use client'
import { useEffect, useRef } from 'react'

const RAMP = ' .:-=+*#%@'
const CW = 9
const CH = 15

/** Animated ASCII "price field": two drifting price paths drawn with characters on a canvas. No external scripts. */
export function AsciiField({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, last = 0, raf = 0

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const cols = Math.ceil(w / CW), rows = Math.ceil(h / CH)
      for (let c = 0; c < cols; c++) {
        const x = c / cols
        const r1 = (0.5 + 0.16 * Math.sin(x * 7 + t * 4e-4) + 0.09 * Math.sin(x * 17 - t * 7e-4) + 0.04 * Math.sin(x * 41 + t * 13e-4)) * rows
        const r2 = (0.64 + 0.1 * Math.sin(x * 5 - t * 3e-4 + 2) + 0.05 * Math.sin(x * 23 + t * 9e-4)) * rows
        for (let r = 0; r < rows; r++) {
          const a = Math.max(0, 1 - Math.abs(r - r1) / 2.2)
          const b = Math.max(0, 0.5 - Math.abs(r - r2) / 3)
          const v = Math.max(a, b)
          if (v < 0.03) {
            if (r > r1 && (c * 7 + r * 13) % 23 === 0) { ctx.fillStyle = 'rgba(34,197,240,.12)'; ctx.fillText('·', c * CW, r * CH) }
            continue
          }
          ctx.fillStyle = a >= b ? `rgba(34,197,240,${(0.15 + v * 0.75).toFixed(2)})` : `rgba(255,255,255,${(0.1 + v * 0.5).toFixed(2)})`
          ctx.fillText(RAMP[Math.min(9, Math.floor(v * 10))], c * CW, r * CH)
        }
      }
    }
    const fit = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width; h = r.height; cv.width = w * d; cv.height = h * d
      ctx.setTransform(d, 0, 0, d, 0, 0)
      ctx.font = '12px "JetBrains Mono Variable", ui-monospace, monospace'
      ctx.textBaseline = 'top'
      draw(last)
    }
    const ro = new ResizeObserver(fit)
    ro.observe(cv); fit()
    if (!still) {
      const loop = (t: number) => { if (t - last > 33) { last = t; draw(t) } raf = requestAnimationFrame(loop) }
      raf = requestAnimationFrame(loop)
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className={className} />
}
