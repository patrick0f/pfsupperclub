'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import SeatingChart from '@/app/components/SeatingChart'
import GuestNav from '@/app/components/GuestNav'

type Seat = { id: string; seatNumber: number; isTaken: boolean }
type ReservationInfo = {
  partySize: number
  eventId: string
  tableShape: 'rectangle' | 'round'
  themeAccentColor: string | null
  eventDate: string
}

export default function SeatsPageWrapper() {
  return (
    <Suspense>
      <SeatsPage />
    </Suspense>
  )
}

function SeatsPage() {
  const searchParams = useSearchParams()
  const confirmationNumber = searchParams.get('confirmationNumber') ?? ''
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const [info, setInfo] = useState<ReservationInfo | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [locked, setLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadReservation() {
      try {
        const res = await fetch(
          `/api/reservations/manage?confirmationNumber=${confirmationNumber}&email=${encodeURIComponent(email)}`
        )
        if (!res.ok) return
        const data = await res.json()
        const eventDate = new Date(data.event.date)
        const lockCutoff = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000)
        setLocked(new Date() > lockCutoff)
        setInfo({
          partySize: data.partySize,
          eventId: data.eventId,
          tableShape: data.event.tableShape,
          themeAccentColor: data.event.themeAccentColor,
          eventDate: data.event.date,
        })
        if (data.seats?.length) {
          setSelectedIds(data.seats.map((s: { id: string }) => s.id))
        }
      } finally {
        setLoading(false)
      }
    }
    loadReservation()
  }, [confirmationNumber, email])

  const fetchSeats = useCallback(async () => {
    if (!info?.eventId) return
    const res = await fetch(`/api/events/${info.eventId}/seats`)
    if (res.ok) setSeats(await res.json())
  }, [info?.eventId])

  useEffect(() => {
    fetchSeats()
    const interval = setInterval(fetchSeats, 7500)
    return () => clearInterval(interval)
  }, [fetchSeats])

  function handleToggle(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (info && prev.length >= info.partySize) return prev
      return [...prev, id]
    })
  }

  async function handleConfirm() {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/seats/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationNumber, email, token, seatIds: selectedIds, note }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) await fetchSeats()
        setError(data.error ?? 'Something went wrong.')
        return
      }
      setSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></div>

  if (locked) {
    return (
      <>
        <GuestNav />
        <main className="flex min-h-screen items-center justify-center p-8">
          <p className="text-gray-600 text-center">Seat selection is now closed.</p>
        </main>
      </>
    )
  }

  if (success) {
    return (
      <>
        <GuestNav />
        <main className="flex min-h-screen items-center justify-center p-8">
          <p className="text-green-700 text-center font-medium">Your seats have been saved!</p>
        </main>
      </>
    )
  }

  return (
    <>
      <GuestNav />
      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Choose your seats</h1>
        {info && (
          <SeatingChart
            seats={seats}
            partySize={info.partySize}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            tableShape={info.tableShape}
            accentColor={info.themeAccentColor}
          />
        )}
        <div className="mt-6 flex flex-col gap-3">
          <textarea
            placeholder="Any seating notes? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="rounded border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={submitting || !info || selectedIds.length !== info.partySize}
            className="rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Confirm seats'}
          </button>
        </div>
      </main>
    </>
  )
}
