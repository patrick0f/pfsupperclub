import { escapeHtml } from './escape'

describe('escapeHtml', () => {
  test('escapes all five special characters', () => {
    expect(escapeHtml('a & b < c > d " e \' f')).toBe('a &amp; b &lt; c &gt; d &quot; e &#39; f')
  })

  test('leaves safe strings unchanged', () => {
    expect(escapeHtml('Hello Jane Smith')).toBe('Hello Jane Smith')
  })

  test('escapes script tag injection', () => {
    const result = escapeHtml('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })
})
