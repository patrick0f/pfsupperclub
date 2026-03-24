import { confirmationEmail } from './confirmation'

const EVENT_TITLE = 'Spring Dinner'
const EVENT_DATE = new Date('2026-04-15T19:00:00Z')
const BASE_DATA = {
  confirmationNumber: 'PF-AB12CD',
  eventTitle: EVENT_TITLE,
  eventDate: EVENT_DATE,
  eventLocation: '123 Main St',
  partySize: 2,
  totalAmount: 15000,
  primaryGuestName: 'Jane Smith',
  cancellationPolicyText: 'No refunds within 72 hours.',
  manageUrl: 'https://example.com/reservation/manage?confirmationNumber=PF-AB12CD&email=jane%40example.com',
}

describe('confirmationEmail', () => {
  test('subject contains event title and date', () => {
    const { subject } = confirmationEmail(BASE_DATA)
    expect(subject).toContain(EVENT_TITLE)
    expect(subject).toContain('2026')
  })

  test('html contains guest name', () => {
    const { html } = confirmationEmail(BASE_DATA)
    expect(html).toContain('Jane Smith')
  })

  test('html contains confirmation number', () => {
    const { html } = confirmationEmail(BASE_DATA)
    expect(html).toContain('PF-AB12CD')
  })

  test('html contains event location', () => {
    const { html } = confirmationEmail(BASE_DATA)
    expect(html).toContain('123 Main St')
  })

  test('html contains formatted amount', () => {
    const { html } = confirmationEmail(BASE_DATA)
    expect(html).toContain('$150.00')
  })

  test('html contains cancellation policy', () => {
    const { html } = confirmationEmail(BASE_DATA)
    expect(html).toContain('No refunds within 72 hours.')
  })

  test('html contains manage url (& escaped as &amp; in href)', () => {
    const { html } = confirmationEmail(BASE_DATA)
    expect(html).toContain(BASE_DATA.manageUrl.replace(/&/g, '&amp;'))
  })

  test('html escapes injection in guest name', () => {
    const { html } = confirmationEmail({ ...BASE_DATA, primaryGuestName: '<script>alert(1)</script>' })
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  test('html escapes injection in event title', () => {
    const { html } = confirmationEmail({ ...BASE_DATA, eventTitle: '<b>hack</b>' })
    expect(html).not.toContain('<b>hack</b>')
    expect(html).toContain('&lt;b&gt;hack&lt;/b&gt;')
  })
})
