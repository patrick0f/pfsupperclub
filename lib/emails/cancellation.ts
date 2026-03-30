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
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
  <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 12px;">Your reservation has been cancelled.</h2>
  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Confirmation <strong>${escapeHtml(data.confirmationNumber)}</strong> for <strong>${escapeHtml(data.eventTitle)}</strong> on ${formatDate(data.eventDate)} has been cancelled.</p>

  <div style="border-top: 1px solid #e5e5e5; padding-top: 20px;">
    <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">If you paid and would like a refund, please reply to this email or reach out directly — refunds are handled manually.</p>
  </div>
</div>
`.trim()

  return { subject, html }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
