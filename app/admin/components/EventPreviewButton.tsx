'use client'

import { useState } from 'react'
import Image from 'next/image'

type EventPreview = {
  title: string
  description: string
  date: Date
  location: string
  pricePerSeat: number
  totalSeats: number
  menuImageUrl: string | null
  themeBgColor: string | null
  themeFgColor: string | null
  themeAccentColor: string | null
  themeHeaderImageUrl: string | null
}

function PreviewModal({ event, onClose }: { event: EventPreview; onClose: () => void }) {
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formattedPrice = (event.pricePerSeat / 100).toLocaleString('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  })

  const cardStyle: React.CSSProperties = {
    backgroundColor: event.themeBgColor ?? undefined,
    ...(event.themeFgColor ? { '--fg': event.themeFgColor, '--fg-muted': event.themeFgColor + 'aa' } as React.CSSProperties : {}),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs tracking-widest uppercase text-white/70">Guest preview</p>
          <button type="button" onClick={onClose} className="text-xs tracking-widest uppercase text-white/70 hover:text-white transition-colors">Close</button>
        </div>
        <div style={cardStyle}>
          {event.themeHeaderImageUrl && (
            <Image src={event.themeHeaderImageUrl} alt={event.title} width={0} height={0} sizes="100vw" className="w-full h-auto" />
          )}
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl text-fg">{event.title}</h2>
              <p className="text-xs tracking-wider uppercase text-fg-muted">
                {formattedDate} · {formattedTime} · {event.location}
              </p>
            </div>
            {event.description && <p className="text-sm leading-relaxed text-fg-muted">{event.description}</p>}
            {event.menuImageUrl && (
              <Image src={event.menuImageUrl} alt="Menu" width={0} height={0} sizes="100vw" className="w-full h-auto" />
            )}
            <p className="text-sm font-medium text-fg">{formattedPrice} per person</p>
            <div className="flex flex-col gap-4">
              <p className="text-xs text-fg-muted">{event.totalSeats} seats remaining</p>
              <div className="flex items-center gap-4">
                <span className="text-xs tracking-widest uppercase text-fg-muted">Party size</span>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex items-center justify-center border border-border-strong text-fg-muted opacity-30 text-lg leading-none">−</div>
                  <span className="font-display text-2xl w-6 text-center text-fg">1</span>
                  <div className="w-7 h-7 flex items-center justify-center border border-border-strong text-fg-muted text-lg leading-none">+</div>
                </div>
              </div>
              <div
                className="w-full py-3 text-xs tracking-widest uppercase text-accent-fg text-center"
                style={{ backgroundColor: event.themeAccentColor ?? 'var(--accent)' }}
              >
                Reserve a seat
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EventPreviewButton({ event }: { event: EventPreview }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {open && <PreviewModal event={event} onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-fg hover:text-accent transition-colors text-left"
      >
        {event.title}
      </button>
    </>
  )
}
