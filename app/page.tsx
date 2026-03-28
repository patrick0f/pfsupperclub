'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

type Stage = 'email' | 'admin' | 'waitlisted' | 'unknown'

const inputClass =
  'w-full border-b border-border-strong bg-transparent py-2 text-sm text-fg placeholder:text-fg-muted focus:border-fg transition-colors outline-none'

const primaryBtnClass =
  'w-full bg-fg text-bg text-xs tracking-widest uppercase py-3 disabled:opacity-40 transition-opacity'

export default function LandingPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.status === 'admin') {
        setStage('admin')
      } else if (data.status === 'approved' || data.status === 'profile_incomplete') {
        router.push('/home')
      } else if (data.status === 'waitlisted') {
        setStage('waitlisted')
      } else {
        setStage('unknown')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.ok) {
        router.push('/admin')
      } else {
        setError('Invalid password.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    setError('')
    setLoading(true)
    try {
      await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, join: true }),
      })
      setStage('waitlisted')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (stage === 'waitlisted') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-3">
        <h1 className="font-display text-4xl md:text-5xl text-fg">PF Supper Club</h1>
        <p className="font-display text-base italic text-fg-muted mt-2">
          You&apos;re on the list — we&apos;ll be in touch soon.
        </p>
        <button
          onClick={() => { setStage('email'); setEmail('') }}
          className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors mt-4"
        >
          ← Back
        </button>
      </main>
    )
  }

  if (stage === 'unknown') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-xs flex flex-col gap-6 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-fg">PF Supper Club</h1>
          <p className="text-sm text-fg-muted">
            You&apos;re not on the guest list yet. Want to request an invitation?
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button onClick={handleJoin} disabled={loading} className={primaryBtnClass}>
            {loading ? 'Requesting...' : 'Request invitation'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-xs flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-fg">PF Supper Club</h1>
          <p className="text-xs tracking-widest uppercase text-fg-muted">
            An invitation-only dining experience
          </p>
        </div>

        {stage === 'email' && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className={primaryBtnClass}>
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {stage === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="flex flex-col gap-6">
            <input
              type="email"
              value={email}
              disabled
              className="w-full border-b border-border bg-transparent py-2 text-sm text-fg-muted"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className={inputClass}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className={primaryBtnClass}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
