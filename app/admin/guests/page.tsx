import { prisma } from '@/lib/prisma'
import { UserTable } from '../components/UserTable'
import type { UserStatus } from '@/app/generated/prisma/enums'

type Props = { searchParams: { status?: string } }

export default async function GuestsPage({ searchParams }: Props) {
  const status = searchParams.status as UserStatus | undefined
  const users = await prisma.user.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main>
      <h1>Guests</h1>
      <div>
        <a href="/admin/guests">All</a>
        <a href="/admin/guests?status=waitlisted">Waitlisted</a>
        <a href="/admin/guests?status=approved">Approved</a>
        <a href="/admin/guests?status=denied">Denied</a>
      </div>
      <UserTable users={users} />
    </main>
  )
}
