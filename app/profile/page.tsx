import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import GuestNav from '@/app/components/GuestNav'
import ProfileForm from './ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getIronSession<AppSession>(await cookies(), sessionOptions)
  if (!session.user) redirect('/')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/')

  return (
    <>
      <GuestNav />
      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Profile</h1>
        <ProfileForm
          firstName={user.firstName ?? ''}
          lastName={user.lastName ?? ''}
          phone={user.phone ?? ''}
          email={user.email}
        />
      </main>
    </>
  )
}
