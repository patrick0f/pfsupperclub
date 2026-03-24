import { reminderEmail } from './reminder'

const EVENT_TITLE = 'Spring Dinner'
const EVENT_DATE = new Date('2026-04-15T19:00:00Z')
const BASE_DATA = {
  confirmationNumber: 'PF-AB12CD',
  eventTitle: EVENT_TITLE,
  eventDate: EVENT_DATE,
  eventLocation: '123 Main St',
  partySize: 2,
  primaryGuestName: 'Jane Smith',
  seats: [{ seatNumber: 3 }, { seatNumber: 7 }],
}

describe('reminderEmail', () => {
  test('subject contains event title', () => {
    const { subject } = reminderEmail(BASE_DATA)
    expect(subject).toContain(EVENT_TITLE)
  })

  test('html contains guest name', () => {
    const { html } = reminderEmail(BASE_DATA)
    expect(html).toContain('Jane Smith')
  })

  test('html contains seat numbers', () => {
    const { html } = reminderEmail(BASE_DATA)
    expect(html).toContain('#3')
    expect(html).toContain('#7')
  })

  test('html contains event location', () => {
    const { html } = reminderEmail(BASE_DATA)
    expect(html).toContain('123 Main St')
  })

  test('html contains confirmation number', () => {
    const { html } = reminderEmail(BASE_DATA)
    expect(html).toContain('PF-AB12CD')
  })

  test('html shows fallback when no seats assigned', () => {
    const { html } = reminderEmail({ ...BASE_DATA, seats: [] })
    expect(html).toContain('Seat assignments will be sent separately')
  })

  test('html escapes injection in guest name', () => {
    const { html } = reminderEmail({ ...BASE_DATA, primaryGuestName: '<script>alert(1)</script>' })
    expect(html).not.toContain('<script>')
  })
})
