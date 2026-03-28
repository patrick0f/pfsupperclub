'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function GuestNav() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg">
      <Link
        href="/home"
        className="font-display text-sm tracking-[0.2em] uppercase text-fg"
      >
        PF Supper Club
      </Link>
      <div className="flex items-center gap-6">
        <Link
          href="/profile"
          className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors"
        >
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors p-0 leading-none"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
