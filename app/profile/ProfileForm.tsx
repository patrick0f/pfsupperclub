'use client'

import { useState } from 'react'

type Props = {
  firstName: string
  lastName: string
  phone: string
  email: string
}

const inputClass =
  'w-full border-b border-border-strong bg-transparent py-2 text-sm text-fg placeholder:text-fg-muted focus:border-fg transition-colors outline-none'

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1">
        <p className="text-xs tracking-widest uppercase text-fg-muted">Email</p>
        <p className="text-sm text-fg">{email}</p>
      </div>
      <input
        placeholder="First name"
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        required
        className={inputClass}
      />
      <input
        placeholder="Last name"
        value={last}
        onChange={(e) => setLast(e.target.value)}
        required
        className={inputClass}
      />
      <input
        placeholder="Phone number"
        type="tel"
        value={ph}
        onChange={(e) => setPh(e.target.value)}
        required
        className={inputClass}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs tracking-widest uppercase text-accent">Saved</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-fg text-bg text-xs tracking-widest uppercase py-3 disabled:opacity-40 transition-opacity"
      >
        {loading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
