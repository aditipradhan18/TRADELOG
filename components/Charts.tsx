'use client'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fm } from '@/lib/format'

const axis = { stroke: '#8d8d8d', fontSize: 11, tickLine: false, axisLine: false } as const
const tip = { contentStyle: { background: '#171717', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 }, labelStyle: { color: '#8d8d8d' } }

export function EquityChart({ curve }: { curve: number[] }) {
  const data = curve.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1f1f1f" vertical={false} />
        <XAxis dataKey="i" hide />
        <YAxis orientation="right" tickFormatter={(v) => fm(v)} width={84} {...axis} />
        <Tooltip formatter={(v: number) => [fm(v), 'Cumulative P&L']} labelFormatter={(i) => `After ${i} trades`} {...tip} />
        <ReferenceLine y={0} stroke="#2563eb" strokeDasharray="2 4" opacity={0.6} />
        <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={2} fill="url(#eq)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DailyBars({ data }: { data: { day: string; v: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#1f1f1f" vertical={false} />
        <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(8)} {...axis} />
        <YAxis orientation="right" tickFormatter={(v) => fm(v)} width={84} {...axis} />
        <Tooltip formatter={(v: number) => [fm(v), 'P&L']} cursor={{ fill: 'rgba(255,255,255,.04)' }} {...tip} />
        <ReferenceLine y={0} stroke="#333" />
        <Bar dataKey="v" radius={[1, 1, 0, 0]} fill="#19b79b" shape={(props: unknown) => {
          const p = props as { x: number; y: number; width: number; height: number; v: number }
          return <rect x={p.x} y={p.height < 0 ? p.y + p.height : p.y} width={p.width} height={Math.abs(p.height)} rx={1} fill={p.v >= 0 ? '#19b79b' : '#ef5350'} />
        }} />
      </BarChart>
    </ResponsiveContainer>
  )
}
