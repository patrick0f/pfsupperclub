import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EventForm } from '../../../components/EventForm'

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event || event.status !== 'draft') notFound()

  return (
    <main>
      <h1>Edit event</h1>
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
          tableShape: event.tableShape,
          cancellationPolicyText: event.cancellationPolicyText,
          themeBgColor: event.themeBgColor ?? '#ffffff',
          themeAccentColor: event.themeAccentColor ?? '#000000',
          themeHeaderImageUrl: event.themeHeaderImageUrl ?? '',
        }}
      />
    </main>
  )
}
