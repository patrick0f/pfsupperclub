import Image from 'next/image'
import Link from 'next/link'

type Guest = { name: string; isPrimary: boolean; allergies: string | null }
type Props = {
  reservation: {
    confirmationNumber: string
    partySize: number
    guests: Guest[]
  }
  event: {
    title: string
    date: Date
    location: string
    menuImageUrl: string | null
    cancellationPolicyText: string
  }
  email: string
}

export default function ReservationView({ reservation, event, email }: Props) {
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const manageUrl = `/reservation/manage?confirmationNumber=${reservation.confirmationNumber}&email=${encodeURIComponent(email)}`

  const details = [
    { label: 'Date & time', value: `${formattedDate} · ${formattedTime}` },
    { label: 'Location', value: event.location },
    { label: 'Party size', value: String(reservation.partySize) },
    { label: 'Confirmation', value: reservation.confirmationNumber },
  ]

  return (
    <div className="w-full max-w-lg flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl text-fg">{event.title}</h1>
        <p className="text-xs tracking-widest uppercase text-fg-muted">You&apos;re confirmed</p>
      </div>

      <div className="flex flex-col">
        {details.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 py-4 border-t border-border">
            <p className="text-xs tracking-widest uppercase text-fg-muted">{label}</p>
            <p className="text-sm text-fg">{value}</p>
          </div>
        ))}

        <div className="flex flex-col gap-2 py-4 border-t border-border">
          <p className="text-xs tracking-widest uppercase text-fg-muted">Guests</p>
          {reservation.guests.map((g, i) => (
            <div key={i} className="text-sm text-fg">
              {g.name}
              {g.isPrimary && <span className="text-fg-muted"> (you)</span>}
              {g.allergies && <span className="text-fg-muted"> — {g.allergies}</span>}
            </div>
          ))}
        </div>
      </div>

      {event.menuImageUrl && (
        <div className="flex flex-col gap-3">
          <p className="text-xs tracking-widest uppercase text-fg-muted">Menu</p>
          <Image src={event.menuImageUrl} alt="Menu" width={0} height={0} sizes="100vw" className="w-full h-auto" />
        </div>
      )}

      <Link
        href={manageUrl}
        className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors underline underline-offset-4"
      >
        Manage reservation
      </Link>
    </div>
  )
}
