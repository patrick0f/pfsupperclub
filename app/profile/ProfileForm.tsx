'use client'

import { useState } from 'react'

type Props = {
  firstName: string
  lastName: string
  phone: string
  email: string
}

export default function ProfileForm({ firstName, lastName, phone, email }: Props) {
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [ph, setPh] = useState(phone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: first, lastName: last, phone: ph }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
      <div>
        <label className="text-sm text-gray-500">Email</label>
        <p className="text-sm mt-0.5">{email}</p>
      </div>
      <input
        placeholder="First name"
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        required
        className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
      />
      <input
        placeholder="Last name"
        value={last}
        onChange={(e) => setLast(e.target.value)}
        required
        className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
      />
      <input
        placeholder="Phone number"
        type="tel"
        value={ph}
        onChange={(e) => setPh(e.target.value)}
        required
        className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-green-600 text-sm">Saved.</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
