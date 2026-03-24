import { escapeHtml } from './escape'

type ApprovalEmailData = {
  baseUrl: string
}

export function approvalEmail(data: ApprovalEmailData): { subject: string; html: string } {
  const subject = `You're on the list — PF Supper Club`

  const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #222;">
  <h2>You're on the list.</h2>
  <p>You've been approved for PF Supper Club. Visit the link below to set up your profile and reserve your spot at an upcoming event.</p>

  <p style="margin: 32px 0;">
    <a href="${escapeHtml(data.baseUrl)}" style="background: #222; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Get started →</a>
  </p>
</div>
`.trim()

  return { subject, html }
}
