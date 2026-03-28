export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { UserTable } from '../components/UserTable'
import type { UserStatus } from '@/app/generated/prisma/enums'

type Props = { searchParams: { status?: string } }

const FILTERS = [
  { label: 'All', status: undefined },
  { label: 'Waitlisted', status: 'waitlisted' },
  { label: 'Approved', status: 'approved' },
  { label: 'Denied', status: 'denied' },
]

export default async function GuestsPage({ searchParams }: Props) {
  const status = searchParams.status as UserStatus | undefined
  const users = await prisma.user.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
      <h1 className="font-display text-3xl text-fg">Guests</h1>

      {/* Filter tabs */}
      <div className="flex items-center gap-6 border-b border-border">
        {FILTERS.map(({ label, status: s }) => {
          const href = s ? `/admin/guests?status=${s}` : '/admin/guests'
          const isActive = status === s
          return (
            <a
              key={label}
              href={href}
              className={`text-xs tracking-widest uppercase pb-3 border-b-2 transition-colors ${
                isActive
                  ? 'text-fg border-accent'
                  : 'text-fg-muted border-transparent hover:text-fg'
              }`}
            >
              {label}
            </a>
          )
        })}
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-fg-muted">No guests found.</p>
      ) : (
        <UserTable users={users} />
      )}
    </main>
  )
}
