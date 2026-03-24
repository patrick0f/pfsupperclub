import { seatSelectionEmail } from './seat-selection'

const EVENT_TITLE = 'Spring Dinner'
const EVENT_DATE = new Date('2026-04-15T19:00:00Z')
const SEAT_URL = 'https://example.com/seats?confirmationNumber=PF-AB12CD&email=jane%40example.com&token=abc.xyz'
const BASE_DATA = {
  confirmationNumber: 'PF-AB12CD',
  eventTitle: EVENT_TITLE,
  eventDate: EVENT_DATE,
  eventLocation: '123 Main St',
  partySize: 2,
  primaryGuestName: 'Jane Smith',
  seatSelectionUrl: SEAT_URL,
}

describe('seatSelectionEmail', () => {
  test('subject contains event title and date', () => {
    const { subject } = seatSelectionEmail(BASE_DATA)
    expect(subject).toContain(EVENT_TITLE)
    expect(subject).toContain('2026')
  })

  test('html contains guest name', () => {
    const { html } = seatSelectionEmail(BASE_DATA)
    expect(html).toContain('Jane Smith')
  })

  test('html contains seat selection url (& escaped as &amp; in href)', () => {
    const { html } = seatSelectionEmail(BASE_DATA)
    expect(html).toContain(SEAT_URL.replace(/&/g, '&amp;'))
  })

  test('html contains confirmation number', () => {
    const { html } = seatSelectionEmail(BASE_DATA)
    expect(html).toContain('PF-AB12CD')
  })

  test('html contains event location', () => {
    const { html } = seatSelectionEmail(BASE_DATA)
    expect(html).toContain('123 Main St')
  })

  test('html uses singular "seat" when partySize is 1', () => {
    const { html } = seatSelectionEmail({ ...BASE_DATA, partySize: 1 })
    expect(html).toContain('your seat')
    expect(html).not.toContain('your 1 seats')
  })

  test('html escapes injection in guest name', () => {
    const { html } = seatSelectionEmail({ ...BASE_DATA, primaryGuestName: '<img src=x onerror=alert(1)>' })
    expect(html).not.toContain('<img')
  })
})
