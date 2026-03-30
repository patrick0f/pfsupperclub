import { escapeHtml } from './escape'

type ConfirmationEmailData = {
  confirmationNumber: string
  eventTitle: string
  eventDate: Date
  eventLocation: string
  partySize: number
  totalAmount: number
  primaryGuestName: string
  cancellationPolicyText: string
  manageUrl: string
}

export function confirmationEmail(data: ConfirmationEmailData): { subject: string; html: string } {
  const subject = `You're in — ${data.eventTitle}, ${formatDate(data.eventDate)}`

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
  <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 8px;">You're confirmed, ${escapeHtml(data.primaryGuestName)}.</h2>
  <p style="color: #555; font-size: 15px; margin: 0 0 32px; line-height: 1.5;">Your reservation for <strong>${escapeHtml(data.eventTitle)}</strong> is set.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Date</td><td style="padding: 12px 0; font-size: 15px;">${formatDateTime(data.eventDate)}</td></tr>
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Location</td><td style="padding: 12px 0; font-size: 15px;">${escapeHtml(data.eventLocation)}</td></tr>
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Party size</td><td style="padding: 12px 0; font-size: 15px;">${data.partySize}</td></tr>
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Amount paid</td><td style="padding: 12px 0; font-size: 15px;">${formatCents(data.totalAmount)}</td></tr>
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Confirmation</td><td style="padding: 12px 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">${escapeHtml(data.confirmationNumber)}</td></tr>
  </table>

  ${data.cancellationPolicyText ? `<div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-bottom: 32px;">
    <p style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin: 0 0 8px;">Cancellation policy</p>
    <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">${escapeHtml(data.cancellationPolicyText)}</p>
  </div>` : ''}

  <div style="border-top: 1px solid #e5e5e5; padding-top: 24px;">
    <a href="${escapeHtml(data.manageUrl)}" style="color: #1a1a1a; font-size: 14px; text-decoration: underline; text-underline-offset: 3px;">Manage your reservation →</a>
  </div>
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

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
