'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

type Stage =
  | 'email'
  | 'admin'
  | 'waitlisted'
  | 'unknown'

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
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-center text-gray-700">
          You&apos;re on the waitlist — we&apos;ll let you know when you&apos;re approved.
        </p>
      </main>
    )
  }

  if (stage === 'unknown') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-gray-700">
            You&apos;re not on the guest list yet. Want to be added?
          </p>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={loading}
            className="rounded bg-black px-6 py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add me'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-center">PF Supper Club</h1>

        {stage === 'email' && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {stage === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              disabled
              className="rounded border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="rounded border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
