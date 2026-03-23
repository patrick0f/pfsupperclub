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
  })

  function handleReserve() {
    router.push(`/booking/info?partySize=${partySize}&eventId=${event.id}`)
  }

  return (
    <div
      className="w-full max-w-lg rounded-xl overflow-hidden shadow-md"
      style={event.themeBgColor ? { backgroundColor: event.themeBgColor } : undefined}
    >
      {event.themeHeaderImageUrl && (
        <div className="relative h-48 w-full">
          <Image src={event.themeHeaderImageUrl} alt={event.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{event.title}</h2>
          <p className="text-sm mt-1 opacity-75">{formattedDate} · {formattedTime}</p>
          <p className="text-sm opacity-75">{event.location}</p>
        </div>
        <p className="text-sm">{event.description}</p>
        {event.menuImageUrl && (
          <div className="relative h-64 w-full rounded overflow-hidden">
            <Image src={event.menuImageUrl} alt="Menu" fill className="object-cover" />
          </div>
        )}
        <p className="text-sm font-medium">{formattedPrice} per person</p>
        {event.seatsRemaining === 0 ? (
          <p className="text-sm font-medium text-red-600">Sold out</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="party-size" className="text-sm">Party size:</label>
              <select
                id="party-size"
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleReserve}
              className="rounded px-5 py-2 text-sm font-medium text-white"
              style={event.themeAccentColor ? { backgroundColor: event.themeAccentColor } : { backgroundColor: '#000' }}
            >
              Reserve
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
