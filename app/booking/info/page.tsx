import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import GuestNav from '@/app/components/GuestNav'
import BookingForm from './BookingForm'

export const dynamic = 'force-dynamic'

type SearchParams = { partySize?: string; eventId?: string }

export default async function BookingInfoPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getIronSession<AppSession>(await cookies(), sessionOptions)
  if (!session.user) redirect('/')

  const partySize = Number(searchParams.partySize)
  const eventId = searchParams.eventId

  if (!eventId || !partySize || partySize < 1) redirect('/home')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/')

  return (
    <>
      <GuestNav />
      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Guest information</h1>
        <BookingForm
          eventId={eventId}
          partySize={partySize}
          primaryName={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()}
          primaryPhone={user.phone ?? ''}
          primaryEmail={user.email}
        />
      </main>
    </>
  )
}
