'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import GuestNav from '@/app/components/GuestNav'

type Guest = { id: string; name: string; allergies: string | null; isPrimary: boolean }
type ReservationData = {
  id: string
  confirmationNumber: string
  partySize: number
  totalAmount: number
  reservationStatus: string
  event: {
    id: string
    title: string
    date: string
    location: string
    themeAccentColor: string | null
    cancellationPolicyText: string
  }
  guests: Guest[]
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
  const [allergies, setAllergies] = useState('')
  const [savingAllergies, setSavingAllergies] = useState(false)
  const [allergiesSaved, setAllergiesSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/reservations/manage?confirmationNumber=${confirmationNumber}&email=${encodeURIComponent(email)}`
        )
        if (res.ok) {
          const json = await res.json()
          setData(json)
          const primary = json.guests?.find((g: Guest) => g.isPrimary)
          setAllergies(primary?.allergies ?? '')
        }
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

  async function handleSaveAllergies() {
    setSavingAllergies(true)
    setAllergiesSaved(false)
    try {
      await fetch(
        `/api/reservations/manage?confirmationNumber=${confirmationNumber}&email=${encodeURIComponent(email)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ allergies }),
        }
      )
      setAllergiesSaved(true)
    } finally {
      setSavingAllergies(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xs tracking-widest uppercase text-fg-muted">Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-fg-muted">Reservation not found.</p>
      </div>
    )
  }

  if (cancelled) {
    return (
      <>
        <GuestNav />
        <main className="max-w-sm mx-auto px-6 py-14">
          <p className="font-display text-2xl text-fg">Reservation cancelled.</p>
          <p className="text-sm text-fg-muted mt-2">
            Refunds are processed manually — you&apos;ll hear from us within a few days.
          </p>
        </main>
      </>
    )
  }

  const eventDate = new Date(data.event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const formattedAmount = (data.totalAmount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const details = [
    { label: 'Date & time', value: `${formattedDate} · ${formattedTime}` },
    { label: 'Location', value: data.event.location },
    { label: 'Party size', value: String(data.partySize) },
    { label: 'Amount paid', value: formattedAmount },
  ]

  return (
    <>
      <GuestNav />
      <main className="max-w-sm mx-auto px-6 py-14 flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl text-fg">{data.event.title}</h1>
          <p className="font-display text-lg tracking-wider text-fg-muted">{data.confirmationNumber}</p>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {details.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 py-4 border-t border-border">
              <p className="text-xs tracking-widest uppercase text-fg-muted">{label}</p>
              <p className="text-sm text-fg">{value}</p>
            </div>
          ))}

          {/* Guests */}
          <div className="flex flex-col gap-2 py-4 border-t border-border">
            <p className="text-xs tracking-widest uppercase text-fg-muted">Guests</p>
            {data.guests.map((g) => (
              <div key={g.id} className="text-sm text-fg">
                {g.name}{g.isPrimary ? <span className="text-fg-muted"> (you)</span> : null}
              </div>
            ))}
          </div>

          {/* Allergies */}
          {data.reservationStatus !== 'cancelled' && (
            <div className="flex flex-col gap-3 py-4 border-t border-border">
              <p className="text-xs tracking-widest uppercase text-fg-muted">Allergies or dietary restrictions</p>
              <input
                type="text"
                value={allergies}
                onChange={e => { setAllergies(e.target.value); setAllergiesSaved(false) }}
                placeholder="Any allergies or restrictions in your party? (optional)"
                className="w-full border-b border-border-strong bg-transparent py-2 text-sm text-fg placeholder:text-fg-muted focus:border-fg transition-colors outline-none"
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSaveAllergies}
                  disabled={savingAllergies}
                  className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors disabled:opacity-40"
                >
                  {savingAllergies ? 'Saving...' : 'Save'}
                </button>
                {allergiesSaved && <span className="text-xs text-accent">Saved</span>}
              </div>
            </div>
          )}
        </div>

        {/* Cancellation */}
        {data.reservationStatus !== 'cancelled' && (
          showCancelConfirm ? (
            <div className="flex flex-col gap-5">
              {data.event.cancellationPolicyText && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs tracking-widest uppercase text-fg-muted">Cancellation policy</p>
                  <div className="bg-bg-subtle p-4 text-xs leading-relaxed text-fg-muted">
                    {data.event.cancellationPolicyText}
                  </div>
                </div>
              )}
              <p className="text-xs text-fg-muted">
                Need to change your party size? Cancel this reservation and rebook.
              </p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 border border-border-strong text-fg text-xs tracking-widest uppercase py-3 transition-opacity hover:opacity-70"
                >
                  Keep it
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 bg-fg text-bg text-xs tracking-widest uppercase py-3 disabled:opacity-40 transition-opacity"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, cancel'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="border border-border-strong text-fg text-xs tracking-widest uppercase py-3 transition-opacity hover:opacity-70"
            >
              Cancel reservation
            </button>
          )
        )}
      </main>
    </>
  )
}
