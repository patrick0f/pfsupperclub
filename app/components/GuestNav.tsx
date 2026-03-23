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
    <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <Link href="/home" className="text-sm font-medium text-gray-900">
        PF Supper Club
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
