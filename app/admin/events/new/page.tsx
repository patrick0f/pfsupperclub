import Link from 'next/link'
import { EventForm } from '../../components/EventForm'

export default function NewEventPage() {
  return (
    <main className="max-w-lg mx-auto px-6 py-12 flex flex-col gap-8">
      <Link href="/admin/events" className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors">← Events</Link>
      <h1 className="font-display text-3xl text-fg">New Event</h1>
      <EventForm />
    </main>
  )
}
