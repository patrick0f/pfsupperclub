'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Guest = { name: string; allergies: string }

type Props = {
  eventId: string
  partySize: number
  primaryName: string
  primaryPhone: string
  primaryEmail: string
}

export default function BookingForm({ eventId, partySize, primaryName, primaryPhone, primaryEmail }: Props) {
  const router = useRouter()
  const [name, setName] = useState(primaryName)
  const [phone, setPhone] = useState(primaryPhone)
  const [guests, setGuests] = useState<Guest[]>(
    Array.from({ length: partySize - 1 }, () => ({ name: '', allergies: '' }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateGuest(index: number, field: keyof Guest, value: string) {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)))
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
            { name, allergies: '', isPrimary: true },
            ...guests.map((g) => ({ name: g.name, allergies: g.allergies, isPrimary: false })),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-md">
      <div className="flex flex-col gap-3">
        <h2 className="font-medium">Your details</h2>
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        />
        <input
          placeholder="Phone number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
        />
        <input
          value={primaryEmail}
          disabled
          className="rounded border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500"
        />
      </div>

      {guests.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-medium">Additional guests</h2>
          {guests.map((guest, i) => (
            <div key={i} className="flex flex-col gap-2">
              <p className="text-sm text-gray-500">Guest {i + 2}</p>
              <input
                placeholder="Full name"
                value={guest.name}
                onChange={(e) => updateGuest(i, 'name', e.target.value)}
                required
                className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                placeholder="Allergies or dietary restrictions (optional)"
                value={guest.allergies}
                onChange={(e) => updateGuest(i, 'allergies', e.target.value)}
                className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <Link
          href="/home"
          className="flex-1 rounded border border-gray-300 px-4 py-2 text-center text-sm"
        >
          Back
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Continue to payment'}
        </button>
      </div>
    </form>
  )
}
