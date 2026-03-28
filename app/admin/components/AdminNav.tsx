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
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg">
      <span className="font-display text-sm tracking-[0.2em] uppercase text-fg">PF Supper Club</span>
      <div className="flex items-center gap-6">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`text-xs tracking-widest uppercase transition-colors pb-0.5 ${
                isActive
                  ? 'text-fg border-b-2 border-accent'
                  : 'text-fg-muted hover:text-fg border-b-2 border-transparent'
              }`}
            >
              {label}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors p-0 pb-0.5 leading-none border-b-2 border-transparent"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
