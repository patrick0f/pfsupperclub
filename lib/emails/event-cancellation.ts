import { escapeHtml } from './escape'

type EventCancellationEmailData = {
  eventTitle: string
  eventDate: Date
}

export function eventCancellationEmail(data: EventCancellationEmailData): { subject: string; html: string } {
  const subject = `Event cancelled — ${data.eventTitle}`

  const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
  <h2>Unfortunately, ${escapeHtml(data.eventTitle)} has been cancelled.</h2>
  <p>We're sorry for the inconvenience. The event scheduled for ${formatDate(data.eventDate)} will not be taking place.</p>

  <p>If you paid, please reply to this email to request a refund — all refunds are handled manually.</p>

  <p>We hope to see you at a future event.</p>
</div>
`.trim()

  return { subject, html }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
