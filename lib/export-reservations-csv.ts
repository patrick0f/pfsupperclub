type ReservationRow = {
  confirmationNumber: string
  primaryGuestName: string
  email: string
  partySize: number
  totalAmount: number
  paymentStatus: string
  reservationStatus: string
  seatsSelected: boolean
  seats: number[]
  createdAt: Date
}

function quote(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"'
}

const HEADERS = [
  'confirmationNumber',
  'primaryGuestName',
  'email',
  'partySize',
  'totalAmountCents',
  'paymentStatus',
  'reservationStatus',
  'seatsSelected',
  'seats',
  'createdAt',
]

export function exportReservationsCsv(reservations: ReservationRow[]): string {
  const rows = reservations.map(r => [
    quote(r.confirmationNumber),
    quote(r.primaryGuestName),
    quote(r.email),
    quote(String(r.partySize)),
    quote(String(r.totalAmount)),
    quote(r.paymentStatus),
    quote(r.reservationStatus),
    quote(String(r.seatsSelected)),
    quote(r.seats.join(';')),
    quote(r.createdAt.toISOString()),
  ].join(','))
  return [HEADERS.join(','), ...rows].join('\n')
}
