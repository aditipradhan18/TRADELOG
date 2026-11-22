'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useData } from './DataProvider'
import type { TradeImage } from '@/lib/finance'

/** Signed URLs for a set of private screenshots, fetched in one request. */
function useUrls(images: TradeImage[]) {
  const { sb } = useData()
  const [urls, setUrls] = useState<Record<string, string>>({})
  const key = images.map((i) => i.id).join()
  useEffect(() => {
    if (!images.length) return
    let live = true
    sb.storage.from('trade-images').createSignedUrls(images.map((i) => i.storage_path), 3600).then(({ data }) => {
      if (!live) return
      const m: Record<string, string> = {}
      data?.forEach((d, i) => { if (d.signedUrl) m[images[i].id] = d.signedUrl })
      setUrls(m)
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sb])
  return urls
}

function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={onClose} role="dialog" aria-label="Screenshot">
      <img src={src} alt="Trade screenshot" className="max-h-full max-w-full" />
    </div>
  )
}

const tile = 'h-24 w-full border border-line object-cover transition group-hover:border-accent'

export function Thumbs({ images, onRemove }: { images: TradeImage[]; onRemove?: (id: string) => void }) {
  const urls = useUrls(images)
  const [open, setOpen] = useState<string | null>(null)
  if (!images.length) return null
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
        {images.map((i) => (
          <div key={i.id} className="group relative">
            {urls[i.id] ? <button type="button" onClick={() => setOpen(urls[i.id])} className="block w-full"><img src={urls[i.id]} alt={i.category} className={tile} /></button> : <div className="h-24 border border-line bg-el" />}
            <span className="absolute bottom-1 left-1 bg-bg/90 px-1.5 py-0.5 text-[10px] text-mute">{i.category}</span>
            {onRemove && <button type="button" aria-label="Remove image" onClick={() => onRemove(i.id)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center bg-bg/90 text-mute hover:text-ink"><X size={14} /></button>}
          </div>
        ))}
      </div>
      <Lightbox src={open} onClose={() => setOpen(null)} />
    </>
  )
}

/** Small inline strip for table rows: up to three thumbnails and a +N counter. */
export function MiniThumbs({ images }: { images: TradeImage[] }) {
  const urls = useUrls(images)
  const [open, setOpen] = useState<string | null>(null)
  if (!images.length) return <span className="text-mute">—</span>
  return (
    <span className="inline-flex items-center gap-1">
      {images.slice(0, 3).map((i) => urls[i.id]
        ? <button key={i.id} type="button" onClick={() => setOpen(urls[i.id])}><img src={urls[i.id]} alt={i.category} className="h-8 w-8 border border-line object-cover hover:border-accent" /></button>
        : <span key={i.id} className="h-8 w-8 border border-line bg-el" />)}
      {images.length > 3 && <span className="text-[11px] text-mute">+{images.length - 3}</span>}
      <Lightbox src={open} onClose={() => setOpen(null)} />
    </span>
  )
}

/** Grid of screenshots from many trades, each labelled (e.g. "XAUUSD · -$9.70"). */
export function Gallery({ items }: { items: { img: TradeImage; label: string }[] }) {
  const urls = useUrls(items.map((x) => x.img))
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
        {items.map(({ img, label }) => (
          <div key={img.id} className="group relative">
            {urls[img.id] ? <button type="button" onClick={() => setOpen(urls[img.id])} className="block w-full"><img src={urls[img.id]} alt={img.category} className={tile} /></button> : <div className="h-24 border border-line bg-el" />}
            <span className="absolute bottom-1 left-1 bg-bg/90 px-1.5 py-0.5 font-mono text-[10px] text-ink">{label}</span>
          </div>
        ))}
      </div>
      <Lightbox src={open} onClose={() => setOpen(null)} />
    </>
  )
}
