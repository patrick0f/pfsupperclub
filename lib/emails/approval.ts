import { escapeHtml } from './escape'

type ApprovalEmailData = {
  baseUrl: string
}

export function approvalEmail(data: ApprovalEmailData): { subject: string; html: string } {
  const subject = `You're on the list — PF Supper Club`

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
  <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 12px;">You're on the list.</h2>
  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">You've been approved for PF Supper Club. Visit the link below to set up your profile and reserve your spot at an upcoming event.</p>

  <p style="margin: 0;">
    <a href="${escapeHtml(data.baseUrl)}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; text-decoration: none; font-size: 14px; letter-spacing: 0.3px;">Get started →</a>
  </p>
</div>
`.trim()

  return { subject, html }
}
