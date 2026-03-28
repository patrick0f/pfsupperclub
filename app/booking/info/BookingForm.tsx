'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = {
  eventId: string
  partySize: number
  primaryName: string
  primaryPhone: string
  primaryEmail: string
}

const inputClass =
  'w-full border-b border-border-strong bg-transparent py-2 text-sm text-fg placeholder:text-fg-muted focus:border-fg transition-colors outline-none'

export default function BookingForm({ eventId, partySize, primaryName, primaryPhone, primaryEmail }: Props) {
  const router = useRouter()
  const [name, setName] = useState(primaryName)
  const [phone, setPhone] = useState(primaryPhone)
  const [guestNames, setGuestNames] = useState<string[]>(
    Array.from({ length: partySize - 1 }, () => '')
  )
  const [allergies, setAllergies] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateGuestName(index: number, value: string) {
    setGuestNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          partySize,
          guests: [
            { name, allergies, isPrimary: true },
            ...guestNames.map((n) => ({ name: n, allergies: '', isPrimary: false })),
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      router.push(data.url)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10 w-full">
      {/* Your details */}
      <div className="flex flex-col gap-6">
        <h2 className="font-display text-xl text-fg">Your details</h2>
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
        />
        <input
          placeholder="Phone number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className={inputClass}
        />
        <input
          value={primaryEmail}
          disabled
          className="w-full border-b border-border bg-transparent py-2 text-sm text-fg-muted"
        />
      </div>

      {/* Additional guests */}
      {guestNames.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-xl text-fg">Additional guests</h2>
          {guestNames.map((guestName, i) => (
            <div key={i} className="flex flex-col gap-5 border-t border-border pt-5">
              <p className="text-xs tracking-widest uppercase text-fg-muted">Guest {i + 2}</p>
              <input
                placeholder="Full name"
                value={guestName}
                onChange={(e) => updateGuestName(i, e.target.value)}
                required
                className={inputClass}
              />
            </div>
          ))}
        </div>
      )}

      {/* Shared allergies */}
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <label className="text-xs tracking-widest uppercase text-fg-muted">
          Allergies or dietary restrictions
        </label>
        <input
          placeholder="Any allergies or restrictions in your party? (optional)"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Link
          href="/home"
          className="flex-1 border border-border-strong text-fg text-xs tracking-widest uppercase py-3 text-center transition-opacity hover:opacity-70"
        >
          Back
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-fg text-bg text-xs tracking-widest uppercase py-3 disabled:opacity-40 transition-opacity"
        >
          {loading ? 'Processing...' : 'Continue to payment'}
        </button>
      </div>
    </form>
  )
}
