import { escapeHtml } from './escape'

type SeatSelectionEmailData = {
  confirmationNumber: string
  eventTitle: string
  eventDate: Date
  eventLocation: string
  partySize: number
  primaryGuestName: string
  seatSelectionUrl: string
}

export function seatSelectionEmail(data: SeatSelectionEmailData): { subject: string; html: string } {
  const subject = `Choose your seats — ${data.eventTitle}, ${formatDate(data.eventDate)}`

  const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
  <h2>Time to pick your seats, ${escapeHtml(data.primaryGuestName)}.</h2>
  <p><strong>${escapeHtml(data.eventTitle)}</strong> is coming up — use the link below to choose your ${data.partySize === 1 ? 'seat' : `${data.partySize} seats`}.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr><td style="padding: 8px 0; color: #666;">Date</td><td>${formatDateTime(data.eventDate)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Location</td><td>${escapeHtml(data.eventLocation)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Party size</td><td>${data.partySize}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Confirmation</td><td>${escapeHtml(data.confirmationNumber)}</td></tr>
  </table>

  <p style="margin: 32px 0;">
    <a href="${escapeHtml(data.seatSelectionUrl)}" style="background: #222; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Select your seats →</a>
  </p>

  <p style="color: #888; font-size: 14px;">Seat selection closes 24 hours before the event.</p>
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
