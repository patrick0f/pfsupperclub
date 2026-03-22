import type { PrismaClient } from '@/app/generated/prisma/client'

export async function generateSeatsForEvent(
  prisma: PrismaClient,
  eventId: string,
  totalSeats: number
): Promise<void> {
  const data = Array.from({ length: totalSeats }, (_, i) => ({
    eventId,
    seatNumber: i + 1,
  }))
  await prisma.seat.createMany({ data })
}
