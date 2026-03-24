import { cancellationEmail } from './cancellation'

const EVENT_TITLE = 'Spring Dinner'
const EVENT_DATE = new Date('2026-04-15T19:00:00Z')
const BASE_DATA = {
  confirmationNumber: 'PF-AB12CD',
  eventTitle: EVENT_TITLE,
  eventDate: EVENT_DATE,
  userEmail: 'jane@example.com',
}

describe('cancellationEmail', () => {
  test('subject contains event title', () => {
    const { subject } = cancellationEmail(BASE_DATA)
    expect(subject).toContain(EVENT_TITLE)
  })

  test('html contains confirmation number', () => {
    const { html } = cancellationEmail(BASE_DATA)
    expect(html).toContain('PF-AB12CD')
  })

  test('html contains event title', () => {
    const { html } = cancellationEmail(BASE_DATA)
    expect(html).toContain(EVENT_TITLE)
  })

  test('html mentions refund', () => {
    const { html } = cancellationEmail(BASE_DATA)
    expect(html.toLowerCase()).toContain('refund')
  })

  test('html escapes injection in event title', () => {
    const { html } = cancellationEmail({ ...BASE_DATA, eventTitle: '<b>hack</b>' })
    expect(html).not.toContain('<b>hack</b>')
  })
})
