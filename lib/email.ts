import { Resend } from 'resend'

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject,
    html,
  })
}
