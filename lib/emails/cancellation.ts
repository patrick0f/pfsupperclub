import { escapeHtml } from './escape'

type CancellationEmailData = {
  confirmationNumber: string
  eventTitle: string
  eventDate: Date
  userEmail: string
}

export function cancellationEmail(data: CancellationEmailData): { subject: string; html: string } {
  const subject = `Reservation cancelled — ${data.eventTitle}`

  const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
  <h2>Your reservation has been cancelled.</h2>
  <p>Confirmation <strong>${escapeHtml(data.confirmationNumber)}</strong> for <strong>${escapeHtml(data.eventTitle)}</strong> on ${formatDate(data.eventDate)} has been cancelled.</p>

  <p>If you paid and would like a refund, please reply to this email or reach out directly — refunds are handled manually.</p>
</div>
`.trim()

  return { subject, html }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
