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
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
  <h2>See you tomorrow, ${escapeHtml(data.primaryGuestName)}.</h2>
  <p>Just a reminder that <strong>${escapeHtml(data.eventTitle)}</strong> is tomorrow.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr><td style="padding: 8px 0; color: #666;">Date</td><td>${formatDateTime(data.eventDate)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Location</td><td>${escapeHtml(data.eventLocation)}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Party size</td><td>${data.partySize}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Confirmation</td><td>${escapeHtml(data.confirmationNumber)}</td></tr>
  </table>

  <p style="color: #888; font-size: 14px; margin-top: 24px;">If you have any last-minute questions, reply to this email.</p>
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
