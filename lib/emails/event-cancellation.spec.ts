import { eventCancellationEmail } from './event-cancellation'

const EVENT_TITLE = 'Spring Dinner'
const EVENT_DATE = new Date('2026-04-15T19:00:00Z')

describe('eventCancellationEmail', () => {
  test('subject contains event title', () => {
    const { subject } = eventCancellationEmail({ eventTitle: EVENT_TITLE, eventDate: EVENT_DATE })
    expect(subject).toContain(EVENT_TITLE)
  })

  test('html contains event title', () => {
    const { html } = eventCancellationEmail({ eventTitle: EVENT_TITLE, eventDate: EVENT_DATE })
    expect(html).toContain(EVENT_TITLE)
  })

  test('html mentions refund', () => {
    const { html } = eventCancellationEmail({ eventTitle: EVENT_TITLE, eventDate: EVENT_DATE })
    expect(html.toLowerCase()).toContain('refund')
  })

  test('html contains formatted date', () => {
    const { html } = eventCancellationEmail({ eventTitle: EVENT_TITLE, eventDate: EVENT_DATE })
    expect(html).toContain('2026')
  })

  test('html escapes injection in event title', () => {
    const { html } = eventCancellationEmail({ eventTitle: '<b>hack</b>', eventDate: EVENT_DATE })
    expect(html).not.toContain('<b>hack</b>')
  })
})
