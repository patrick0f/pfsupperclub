import { escapeHtml } from './escape'

type EventCancellationEmailData = {
  eventTitle: string
  eventDate: Date
}

export function eventCancellationEmail(data: EventCancellationEmailData): { subject: string; html: string } {
  const subject = `Event cancelled — ${data.eventTitle}`

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
  <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 12px;">Unfortunately, ${escapeHtml(data.eventTitle)} has been cancelled.</h2>
  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">We're sorry for the inconvenience. The event scheduled for ${formatDate(data.eventDate)} will not be taking place.</p>

  <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-bottom: 24px;">
    <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">If you paid, please reply to this email to request a refund — all refunds are handled manually.</p>
  </div>

  <p style="color: #888; font-size: 13px; margin: 0;">We hope to see you at a future event.</p>
</div>
`.trim()

  return { subject, html }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
