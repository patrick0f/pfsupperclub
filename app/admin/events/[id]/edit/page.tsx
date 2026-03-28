import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EventForm } from '../../../components/EventForm'

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event || event.status !== 'draft') notFound()

  return (
    <main className="max-w-lg mx-auto px-6 py-12 flex flex-col gap-8">
      <Link href="/admin/events" className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors">← Events</Link>
      <h1 className="font-display text-3xl text-fg">Edit Event</h1>
      <EventForm
        eventId={event.id}
        initial={{
          title: event.title,
          description: event.description,
          date: event.date.toISOString().slice(0, 16),
          location: event.location,
          pricePerSeat: event.pricePerSeat,
          totalSeats: event.totalSeats,
          menuImageUrl: event.menuImageUrl ?? '',
          cancellationPolicyText: event.cancellationPolicyText,
          themeBgColor: event.themeBgColor ?? '#ffffff',
          themeFgColor: event.themeFgColor ?? '#0a0a0a',
          themeAccentColor: event.themeAccentColor ?? '#000000',
          themeHeaderImageUrl: event.themeHeaderImageUrl ?? '',
        }}
      />
    </main>
  )
}
