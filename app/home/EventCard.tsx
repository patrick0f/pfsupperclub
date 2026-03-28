'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Event = {
  id: string
  title: string
  description: string
  date: string | Date
  location: string
  pricePerSeat: number
  menuImageUrl: string | null
  themeBgColor: string | null
  themeFgColor: string | null
  themeAccentColor: string | null
  themeHeaderImageUrl: string | null
  seatsRemaining: number
}

export default function EventCard({ event }: { event: Event }) {
  const router = useRouter()
  const maxParty = Math.min(4, event.seatsRemaining)
  const [partySize, setPartySize] = useState(Math.max(1, maxParty > 0 ? 1 : 0))

  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const formattedPrice = (event.pricePerSeat / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  function handleReserve() {
    router.push(`/booking/info?partySize=${partySize}&eventId=${event.id}`)
  }

  /*
    Full-page theming variant (uncomment to apply event colors to the entire page background):
    Pass these as style to the <main> in home/page.tsx instead of here:
    style={event.themeBgColor ? { '--bg': event.themeBgColor, '--bg-subtle': event.themeBgColor } as React.CSSProperties : undefined}
  */

  return (
    <div
      className="w-full max-w-lg overflow-hidden"
      style={{
        ...(event.themeBgColor ? { backgroundColor: event.themeBgColor } : {}),
        ...(event.themeFgColor ? { '--fg': event.themeFgColor, '--fg-muted': event.themeFgColor + 'aa' } as React.CSSProperties : {}),
      }}
    >
      {/* Header image */}
      {event.themeHeaderImageUrl && (
        <Image
          src={event.themeHeaderImageUrl}
          alt={event.title}
          width={0}
          height={0}
          sizes="100vw"
          className="w-full h-auto"
        />
      )}

      <div className="p-6 md:p-8 flex flex-col gap-6">
        {/* Title + meta */}
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-3xl md:text-4xl text-fg">{event.title}</h2>
          <p className="text-xs tracking-wider uppercase text-fg-muted">
            {formattedDate} · {formattedTime} · {event.location}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-fg-muted">{event.description}</p>

        {/* Menu image */}
        {event.menuImageUrl && (
          <Image src={event.menuImageUrl} alt="Menu" width={0} height={0} sizes="100vw" className="w-full h-auto" />
        )}

        {/* Price */}
        <p className="text-sm font-body font-medium text-fg">{formattedPrice} per person</p>

        {/* Booking section */}
        {event.seatsRemaining === 0 ? (
          <p className="text-xs tracking-widest uppercase text-fg-muted">Sold out</p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-fg-muted">{event.seatsRemaining} seat{event.seatsRemaining !== 1 ? 's' : ''} remaining</p>

            {/* Party size stepper */}
            <div className="flex items-center gap-4">
              <span className="text-xs tracking-widest uppercase text-fg-muted">Party size</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                  disabled={partySize <= 1}
                  className="w-7 h-7 flex items-center justify-center border border-border-strong text-fg-muted disabled:opacity-30 text-lg leading-none"
                >
                  −
                </button>
                <span className="font-display text-2xl w-6 text-center text-fg">{partySize}</span>
                <button
                  type="button"
                  onClick={() => setPartySize((n) => Math.min(maxParty, n + 1))}
                  disabled={partySize >= maxParty}
                  className="w-7 h-7 flex items-center justify-center border border-border-strong text-fg-muted disabled:opacity-30 text-lg leading-none"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleReserve}
              className="w-full py-3 text-xs tracking-widest uppercase text-accent-fg transition-opacity hover:opacity-80"
              style={{ backgroundColor: event.themeAccentColor ?? 'var(--accent)' }}
            >
              Reserve a seat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
