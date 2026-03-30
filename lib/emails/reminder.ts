import { escapeHtml } from './escape'

type ReminderEmailData = {
  confirmationNumber: string
  eventTitle: string
  eventDate: Date
  eventLocation: string
  partySize: number
  primaryGuestName: string
}

export function reminderEmail(data: ReminderEmailData): { subject: string; html: string } {
  const subject = `See you tomorrow — ${data.eventTitle}`

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
  <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 8px;">See you tomorrow, ${escapeHtml(data.primaryGuestName)}.</h2>
  <p style="color: #555; font-size: 15px; margin: 0 0 32px; line-height: 1.5;">Just a reminder that <strong>${escapeHtml(data.eventTitle)}</strong> is tomorrow.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 0 0 32px;">
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Date</td><td style="padding: 12px 0; font-size: 15px;">${formatDateTime(data.eventDate)}</td></tr>
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Location</td><td style="padding: 12px 0; font-size: 15px;">${escapeHtml(data.eventLocation)}</td></tr>
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Party size</td><td style="padding: 12px 0; font-size: 15px;">${data.partySize}</td></tr>
    <tr><td style="padding: 12px 24px 12px 0; color: #888; font-size: 14px; white-space: nowrap; vertical-align: top;">Confirmation</td><td style="padding: 12px 0; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">${escapeHtml(data.confirmationNumber)}</td></tr>
  </table>

  <div style="border-top: 1px solid #e5e5e5; padding-top: 20px;">
    <p style="color: #888; font-size: 13px; margin: 0; line-height: 1.5;">If you have any last-minute questions, reply to this email.</p>
  </div>
</div>
`.trim()

  return { subject, html }
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })
}
