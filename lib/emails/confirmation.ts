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
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
  <h2>You're confirmed, ${escapeHtml(data.primaryGuestName)}.</h2>
  <p>Your reservation for <strong>${escapeHtml(data.eventTitle)}</strong> is set.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr><td style="padding: 8px 0; color: #666;">Date</td><td>${formatDateTime(data.eventDate)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Location</td><td>${escapeHtml(data.eventLocation)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Party size</td><td>${data.partySize}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Amount paid</td><td>${formatCents(data.totalAmount)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Confirmation</td><td><strong>${escapeHtml(data.confirmationNumber)}</strong></td></tr>
  </table>

  <h3 style="margin-top: 32px;">Cancellation policy</h3>
  <p style="color: #555;">${escapeHtml(data.cancellationPolicyText)}</p>

  <p style="margin-top: 32px;">
    <a href="${escapeHtml(data.manageUrl)}" style="color: #222;">Manage your reservation →</a>
  </p>
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
