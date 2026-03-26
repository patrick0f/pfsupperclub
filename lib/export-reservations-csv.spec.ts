import { describe, test, expect } from 'vitest'
import { exportReservationsCsv } from './export-reservations-csv'

const CREATED_AT = new Date('2026-04-01T12:00:00Z')

const BASE_ROW = {
  confirmationNumber: 'PF-AB12CD',
  primaryGuestName: 'Jane Smith',
  email: 'jane@example.com',
  partySize: 2,
  totalAmount: 20000,
  paymentStatus: 'paid',
  reservationStatus: 'reserved',
  createdAt: CREATED_AT,
}

describe('exportReservationsCsv', () => {
  test('returns only header row for empty input', () => {
    const csv = exportReservationsCsv([])
    expect(csv).toBe('confirmationNumber,primaryGuestName,email,partySize,totalAmountCents,paymentStatus,reservationStatus,createdAt')
  })

  test('header row matches expected columns', () => {
    const csv = exportReservationsCsv([BASE_ROW])
    const header = csv.split('\n')[0]
    expect(header).toBe('confirmationNumber,primaryGuestName,email,partySize,totalAmountCents,paymentStatus,reservationStatus,createdAt')
  })

  test('data row contains expected values', () => {
    const csv = exportReservationsCsv([BASE_ROW])
    const row = csv.split('\n')[1]
    expect(row).toContain('"PF-AB12CD"')
    expect(row).toContain('"Jane Smith"')
    expect(row).toContain('"jane@example.com"')
    expect(row).toContain('20000')
    expect(row).toContain(CREATED_AT.toISOString())
  })

  test('double-quotes in names are escaped as double-double-quotes', () => {
    const csv = exportReservationsCsv([{ ...BASE_ROW, primaryGuestName: 'Jane "J" Smith' }])
    expect(csv).toContain('"Jane ""J"" Smith"')
  })

  test('commas in names are safely quoted', () => {
    const csv = exportReservationsCsv([{ ...BASE_ROW, primaryGuestName: 'Smith, Jane' }])
    expect(csv).toContain('"Smith, Jane"')
    const row = csv.split('\n')[1]
    const fields = row.split('","')
    expect(fields[1]).toContain('Smith, Jane')
  })
})
