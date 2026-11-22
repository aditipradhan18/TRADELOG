// @ts-nocheck
// Animated simulated candlestick chart with example entries and exits. Pure canvas, no dependencies.
export function startMarket(cv) {
  const ctx = cv.getContext('2d')
  if (!ctx) return () => {}
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const N = 40, T = 1100, RNG = 2.2, ACC = '#2563eb', UP = '#19b79b', DN = '#ef5350'
  const MONO = '"JetBrains Mono Variable","JetBrains Mono",ui-monospace,monospace'
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  let idx = 0, cs = [], mk = [], entry = 0, w = 0, h = 0, lo = 0, hi = 1, raf = 0
  const tick = (c) => { c.c = Math.max(1, c.c + (rnd() - 0.5) * RNG * 1.3); c.h = Math.max(c.h, c.c); c.l = Math.min(c.l, c.c) }
  const mkc = (o) => ({ o, h: o, l: o, c: o, v: 0.25 + rnd() * 0.75, i: idx++ })
  let p = 3890
  for (let k = 0; k < N; k++) { const c = mkc(p); for (let j = 0; j < 14; j++) tick(c); cs.push(c); p = c.c }
  let cur = cs[cs.length - 1], born = performance.now(), lastTick = born

  const next = () => {
    const c = mkc(cur.c)
    cs.push(c); if (cs.length > N + 4) cs.shift(); cur = c
    if (c.i % 16 === 4) { entry = c.o; mk.push({ i: c.i, t: 'b' }) }
    if (c.i % 16 === 11 && entry) { mk.push({ i: c.i, t: 's', r: (c.o - entry) / (RNG * 4) }); entry = 0 }
    mk = mk.filter((m) => m.i > c.i - N - 6)
  }

  const draw = (now) => {
    ctx.clearRect(0, 0, w, h)
    const L = 14, R = 84, TOP = 48, B = 30, cw = w - L - R, ch = h - TOP - B, slot = cw / N
    const vis = cs.slice(-N), tmin = Math.min(...vis.map((c) => c.l)), tmax = Math.max(...vis.map((c) => c.h)), pad = (tmax - tmin) * 0.14 + 0.5
    if (hi - lo < 1) { lo = tmin - pad; hi = tmax + pad } else { lo += (tmin - pad - lo) * 0.08; hi += (tmax + pad - hi) * 0.08 }
    const Y = (v) => Math.round(TOP + ((hi - v) / (hi - lo)) * ch * 0.82)
    const since = still ? T : now - born, sl = 1 - Math.min(1, since / 260)
    const X = (i) => Math.round(L + (i - (cur.i - N + 1)) * slot + slot / 2 + sl * slot)
    const bw = Math.max(3, Math.round(slot * 0.62)), vh = ch * 0.16
    ctx.textBaseline = 'middle'; ctx.lineWidth = 1

    ctx.strokeStyle = '#161616'; ctx.fillStyle = '#8d8d8d'; ctx.font = '11px ' + MONO; ctx.textAlign = 'left'
    for (let k = 0; k <= 4; k++) {
      const v = hi - ((hi - lo) * k) / 4, y = Y(v) + 0.5
      ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(w - R, y); ctx.stroke()
      ctx.fillText(v.toFixed(2), w - R + 8, y)
    }
    for (const c of cs) { if (c.i % 6) continue; const x = X(c.i) + 0.5; if (x < L || x > w - R) continue; ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(x, h - B); ctx.stroke() }

    for (const c of cs) {
      const x = X(c.i); if (x < L - slot || x > w - R + slot) continue
      const col = c.c >= c.o ? UP : DN, bx = x - Math.floor(bw / 2)
      ctx.fillStyle = col
      ctx.fillRect(x, Y(c.h), 1, Math.max(1, Y(c.l) - Y(c.h)))
      ctx.fillRect(bx, Math.min(Y(c.o), Y(c.c)), bw, Math.max(1, Math.abs(Y(c.o) - Y(c.c))))
      ctx.globalAlpha = 0.28; ctx.fillRect(bx, Math.round(h - B - c.v * vh), bw, Math.round(c.v * vh)); ctx.globalAlpha = 1
    }

    ctx.textAlign = 'center'; ctx.font = 'bold 10px ' + MONO
    for (const m of mk) {
      const c = cs.find((q) => q.i === m.i); if (!c) continue
      const x = X(m.i)
      if (m.t === 'b') {
        const y = Y(c.l) + 12
        ctx.fillStyle = UP; ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x - 5, y + 4); ctx.lineTo(x + 5, y + 4); ctx.fill()
        ctx.fillText('BUY', x, y + 15)
      } else {
        const y = Y(c.h) - 12, col = m.r >= 0 ? UP : DN
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.lineTo(x - 5, y - 4); ctx.lineTo(x + 5, y - 4); ctx.fill()
        ctx.fillText((m.r >= 0 ? '+' : '') + m.r.toFixed(1) + 'R', x, y - 14)
      }
    }

    const ly = Y(cur.c) + 0.5
    ctx.strokeStyle = ACC; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(L, ly); ctx.lineTo(w - R, ly); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = ACC; ctx.fillRect(w - R + 2, ly - 9, R - 6, 18)
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = 'bold 11px ' + MONO; ctx.fillText(cur.c.toFixed(2), w - R + 8, ly + 1)

    ctx.fillStyle = '#f4f4f4'; ctx.font = 'bold 12px ' + MONO; ctx.fillText('XAUUSD  ·  M5', L, 18)
    ctx.fillStyle = '#8d8d8d'; ctx.font = '11px ' + MONO
    ctx.fillText('O ' + cur.o.toFixed(2) + '   H ' + cur.h.toFixed(2) + '   L ' + cur.l.toFixed(2) + '   C ' + cur.c.toFixed(2), L, 36)
  }

  const fit = () => {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2)
    w = r.width; h = r.height; cv.width = Math.round(w * d); cv.height = Math.round(h * d)
    ctx.setTransform(d, 0, 0, d, 0, 0); draw(performance.now())
  }
  const ro = new ResizeObserver(fit)
  ro.observe(cv); fit()
  if (!still) {
    const loop = (t) => {
      if (t - born > T * 5) born = t - T
      while (t - born >= T) { born += T; next() }
      if (t - lastTick > 80) { tick(cur); lastTick = t }
      draw(t); raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
  }
  return () => { cancelAnimationFrame(raf); ro.disconnect() }
}
