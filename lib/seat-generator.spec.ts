import { describe, expect, test, vi } from 'vitest'
import { generateSeatsForEvent } from './seat-generator'

const EVENT_ID = 'event-abc-123'
const TOTAL_SEATS = 12

function makeMockPrisma() {
  return {
    seat: {
      createMany: vi.fn().mockResolvedValue({ count: TOTAL_SEATS }),
    },
  }
}

describe('generateSeatsForEvent', () => {
  test('calls createMany exactly once', async () => {
    const prisma = makeMockPrisma()
    await generateSeatsForEvent(prisma as never, EVENT_ID, TOTAL_SEATS)
    expect(prisma.seat.createMany).toHaveBeenCalledTimes(1)
  })

  test('creates exactly totalSeats rows', async () => {
    const prisma = makeMockPrisma()
    await generateSeatsForEvent(prisma as never, EVENT_ID, TOTAL_SEATS)
    const { data } = prisma.seat.createMany.mock.calls[0][0]
    expect(data).toHaveLength(TOTAL_SEATS)
  })

  test('seat numbers are 1-indexed sequential', async () => {
    const prisma = makeMockPrisma()
    await generateSeatsForEvent(prisma as never, EVENT_ID, TOTAL_SEATS)
    const { data } = prisma.seat.createMany.mock.calls[0][0]
    const seatNumbers = data.map((row: { seatNumber: number }) => row.seatNumber)
    expect(seatNumbers).toEqual(
      Array.from({ length: TOTAL_SEATS }, (_, i) => i + 1)
    )
  })

  test('all rows carry the provided eventId', async () => {
    const prisma = makeMockPrisma()
    await generateSeatsForEvent(prisma as never, EVENT_ID, TOTAL_SEATS)
    const { data } = prisma.seat.createMany.mock.calls[0][0]
    expect(data.every((row: { eventId: string }) => row.eventId === EVENT_ID)).toBe(true)
  })
})
