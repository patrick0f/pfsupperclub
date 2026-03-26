'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/guests', label: 'Guests' },
  { href: '/admin/profile', label: 'Profile' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav>
      {NAV_LINKS.map(({ href, label }) => (
        <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
      <button type="button" onClick={() => signOut({ callbackUrl: '/admin/login' })}>
        Sign out
      </button>
    </nav>
  )
}
