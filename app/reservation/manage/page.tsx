'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GuestNav from '@/app/components/GuestNav'

type Guest = { id: string; name: string; allergies: string | null; isPrimary: boolean }
type Seat = { id: string; seatNumber: number }
type ReservationData = {
  id: string
  confirmationNumber: string
  partySize: number
  totalAmount: number
  reservationStatus: string
  seatsSelected: boolean
  seatNote: string | null
  event: {
    id: string
    title: string
    date: string
    location: string
    tableShape: string
    themeAccentColor: string | null
    cancellationPolicyText: string
  }
  guests: Guest[]
  seats: Seat[]
  seatToken: string
}

export default function ManageReservationWrapper() {
  return (
    <Suspense>
      <ManageReservationPage />
    </Suspense>
  )
}

function ManageReservationPage() {
  const searchParams = useSearchParams()
  const confirmationNumber = searchParams.get('confirmationNumber') ?? ''
  const email = searchParams.get('email') ?? ''

  const [data, setData] = useState<ReservationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/reservations/manage?confirmationNumber=${confirmationNumber}&email=${encodeURIComponent(email)}`
        )
        if (res.ok) setData(await res.json())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [confirmationNumber, email])

  async function handleCancel() {
    if (!data) return
    setCancelling(true)
    setError('')
    try {
      const res = await fetch(
        `/api/reservations/${data.id}/cancel?confirmationNumber=${confirmationNumber}&email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      )
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); return }
      setCancelled(true)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if (!data) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Reservation not found.</p></div>

  if (cancelled) {
    return (
      <>
        <GuestNav />
        <main className="max-w-lg mx-auto px-6 py-10">
          <p className="text-gray-700">Your reservation has been cancelled.</p>
        </main>
      </>
    )
  }

  const eventDate = new Date(data.event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formattedAmount = (data.totalAmount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  const seatUrl = `/seats?confirmationNumber=${confirmationNumber}&email=${encodeURIComponent(email)}&token=${data.seatToken}`

  return (
    <>
      <GuestNav />
      <main className="max-w-lg mx-auto px-6 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{data.event.title}</h1>
          <p className="text-sm text-gray-500">{formattedDate} · {formattedTime}</p>
          <p className="text-sm text-gray-500">{data.event.location}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Confirmation</span>
            <span className="font-mono font-medium">{data.confirmationNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Party size</span>
            <span>{data.partySize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount paid</span>
            <span>{formattedAmount}</span>
          </div>
          {data.seats.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Seats</span>
              <span>{data.seats.map((s) => s.seatNumber).join(', ')}</span>
            </div>
          )}
          {data.seatNote && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Note</span>
              <span className="text-right">{data.seatNote}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <h2 className="font-medium">Guests</h2>
          {data.guests.map((g) => (
            <div key={g.id}>
              <span>{g.name}{g.isPrimary ? ' (primary)' : ''}</span>
              {g.allergies && <span className="text-gray-500"> — {g.allergies}</span>}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Link href={seatUrl} className="rounded border border-gray-300 px-4 py-2 text-sm text-center">
            {data.seatsSelected ? 'Change seats' : 'Select seats'}
          </Link>

          {data.reservationStatus !== 'cancelled' && (
            showCancelConfirm ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">{data.event.cancellationPolicyText}</p>
                <p className="text-sm font-medium">Need to change your party size? Cancel this reservation and rebook.</p>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowCancelConfirm(false)} className="flex-1 rounded border border-gray-300 px-4 py-2 text-sm">
                    Keep reservation
                  </button>
                  <button onClick={handleCancel} disabled={cancelling} className="flex-1 rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                    {cancelling ? 'Cancelling...' : 'Yes, cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCancelConfirm(true)} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600">
                Cancel reservation
              </button>
            )
          )}
        </div>
      </main>
    </>
  )
}
