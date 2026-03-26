'use client'

import { useRouter } from 'next/navigation'

type Seat = { seatNumber: number }
type Guest = { isPrimary: boolean; name: string }
type Reservation = {
  id: string
  confirmationNumber: string
  partySize: number
  totalAmount: number
  paymentStatus: string
  reservationStatus: string
  seatsSelected: boolean
  seatNote: string | null
  guests: Guest[]
  seats: Seat[]
  user: { email: string }
}

export function ReservationTable({ reservations }: { reservations: Reservation[] }) {
  const router = useRouter()

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationStatus: status }),
    })
    router.refresh()
  }

  async function resend(id: string, type: 'confirmation' | 'reminder') {
    await fetch(`/api/admin/reservations/${id}/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
  }

  async function refund(id: string) {
    await fetch(`/api/admin/reservations/${id}/refund`, { method: 'POST' })
    router.refresh()
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Confirmation</th>
          <th>Guest</th>
          <th>Email</th>
          <th>Party</th>
          <th>Amount</th>
          <th>Payment</th>
          <th>Status</th>
          <th>Seats</th>
          <th>Note</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reservations.map(r => {
          const primary = r.guests.find(g => g.isPrimary)
          return (
            <tr key={r.id}>
              <td>{r.confirmationNumber}</td>
              <td>{primary?.name}</td>
              <td>{r.user.email}</td>
              <td>{r.partySize}</td>
              <td>${(r.totalAmount / 100).toFixed(2)}</td>
              <td>{r.paymentStatus}</td>
              <td>{r.reservationStatus}</td>
              <td>{r.seats.map(s => `#${s.seatNumber}`).join(', ') || (r.seatsSelected ? '—' : 'Not selected')}</td>
              <td>{r.seatNote}</td>
              <td>
                <button type="button" onClick={() => resend(r.id, 'confirmation')}>Resend confirmation</button>
                <button type="button" onClick={() => resend(r.id, 'reminder')}>Resend reminder</button>
                {r.reservationStatus === 'reserved' && (
                  <button type="button" onClick={() => updateStatus(r.id, 'no_show')}>No show</button>
                )}
                {r.reservationStatus === 'reserved' && (
                  <button type="button" onClick={() => updateStatus(r.id, 'cancelled')}>Cancel</button>
                )}
                {r.paymentStatus === 'paid' && (
                  <button type="button" onClick={() => refund(r.id)}>Refund</button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
