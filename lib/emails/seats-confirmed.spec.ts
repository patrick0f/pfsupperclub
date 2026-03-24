import { seatsConfirmedEmail } from './seats-confirmed'

const EVENT_TITLE = 'Spring Dinner'
const EVENT_DATE = new Date('2026-04-15T19:00:00Z')
const BASE_DATA = {
  eventTitle: EVENT_TITLE,
  eventDate: EVENT_DATE,
  eventLocation: '123 Main St',
  primaryGuestName: 'Jane Smith',
  seats: [{ seatNumber: 3 }, { seatNumber: 7 }],
}

describe('seatsConfirmedEmail', () => {
  test('subject contains event title and date', () => {
    const { subject } = seatsConfirmedEmail(BASE_DATA)
    expect(subject).toContain(EVENT_TITLE)
    expect(subject).toContain('2026')
  })

  test('html contains guest name', () => {
    const { html } = seatsConfirmedEmail(BASE_DATA)
    expect(html).toContain('Jane Smith')
  })

  test('html contains seat numbers', () => {
    const { html } = seatsConfirmedEmail(BASE_DATA)
    expect(html).toContain('#3')
    expect(html).toContain('#7')
  })

  test('html contains event location', () => {
    const { html } = seatsConfirmedEmail(BASE_DATA)
    expect(html).toContain('123 Main St')
  })

  test('html mentions seating changes are final', () => {
    const { html } = seatsConfirmedEmail(BASE_DATA)
    expect(html.toLowerCase()).toContain('final')
  })

  test('html escapes injection in guest name', () => {
    const { html } = seatsConfirmedEmail({ ...BASE_DATA, primaryGuestName: '<script>alert(1)</script>' })
    expect(html).not.toContain('<script>')
  })
})
