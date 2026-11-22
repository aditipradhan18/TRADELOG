'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useData } from './DataProvider'
import type { TradeImage } from '@/lib/finance'

export function Thumbs({ images, onRemove }: { images: TradeImage[]; onRemove?: (id: string) => void }) {
  const { sb } = useData()
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [open, setOpen] = useState<string | null>(null)
  const key = images.map((i) => i.id).join()

  useEffect(() => {
    if (!images.length) return
    sb.storage.from('trade-images').createSignedUrls(images.map((i) => i.storage_path), 3600).then(({ data }) => {
      const m: Record<string, string> = {}
      data?.forEach((d, i) => { if (d.signedUrl) m[images[i].id] = d.signedUrl })
      setUrls(m)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sb])

  if (!images.length) return null
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
        {images.map((i) => (
          <div key={i.id} className="group relative">
            {urls[i.id]
              ? <button type="button" onClick={() => setOpen(urls[i.id])} className="block w-full"><img src={urls[i.id]} alt={i.category} className="h-24 w-full rounded-lg border border-line object-cover transition group-hover:border-accent" /></button>
              : <div className="h-24 rounded-lg border border-line bg-el" />}
            <span className="absolute bottom-1 left-1 rounded bg-bg/90 px-1.5 py-0.5 text-[10px] text-mute">{i.category}</span>
            {onRemove && <button type="button" aria-label="Remove image" onClick={() => onRemove(i.id)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded bg-bg/90 text-mute hover:text-ink"><X size={14} /></button>}
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setOpen(null)} role="dialog" aria-label="Screenshot">
          <img src={open} alt="Trade screenshot" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </>
  )
}
