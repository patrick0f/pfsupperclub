import { escapeHtml } from './escape'

type SeatsConfirmedSeat = { seatNumber: number }

type SeatsConfirmedEmailData = {
  eventTitle: string
  eventDate: Date
  eventLocation: string
  primaryGuestName: string
  seats: SeatsConfirmedSeat[]
}

export function seatsConfirmedEmail(data: SeatsConfirmedEmailData): { subject: string; html: string } {
  const subject = `Your seats are set — ${data.eventTitle}, ${formatDate(data.eventDate)}`

  const seatList = data.seats.map(s => `#${s.seatNumber}`).join(', ')

  const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
  <h2>Your seats are confirmed, ${escapeHtml(data.primaryGuestName)}.</h2>
  <p>Here are your assigned seats for <strong>${escapeHtml(data.eventTitle)}</strong>.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr><td style="padding: 8px 0; color: #666;">Date</td><td>${formatDateTime(data.eventDate)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Location</td><td>${escapeHtml(data.eventLocation)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">${data.seats.length === 1 ? 'Seat' : 'Seats'}</td><td><strong>${escapeHtml(seatList)}</strong></td></tr>
  </table>

  <p style="color: #888; font-size: 14px;">If this seating arrangement poses an issue, please let us know — seating changes are final the day before the event.</p>
</div>
`.trim()

  return { subject, html }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })
}
