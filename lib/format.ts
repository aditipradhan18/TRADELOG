export const fm = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const tone = (n: number) => (n > 0 ? 'text-profit' : n < 0 ? 'text-loss' : '')
export const fdate = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
export const pad = (n: number) => String(n).padStart(2, '0')
export const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const x = new Date(iso)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`
}
