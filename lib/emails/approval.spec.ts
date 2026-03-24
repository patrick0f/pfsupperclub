import { approvalEmail } from './approval'

describe('approvalEmail', () => {
  test('subject mentions the list', () => {
    const { subject } = approvalEmail({ baseUrl: 'https://example.com' })
    expect(subject.toLowerCase()).toContain('list')
  })

  test('html contains base url', () => {
    const { html } = approvalEmail({ baseUrl: 'https://example.com' })
    expect(html).toContain('https://example.com')
  })

  test('html mentions approval', () => {
    const { html } = approvalEmail({ baseUrl: 'https://example.com' })
    expect(html.toLowerCase()).toContain('approved')
  })

  test('html escapes injection in baseUrl', () => {
    const { html } = approvalEmail({ baseUrl: 'https://example.com/"onmouseover="alert(1)' })
    expect(html).not.toContain('"onmouseover="')
  })
})
