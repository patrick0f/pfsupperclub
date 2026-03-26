'use client'

import { useState } from 'react'

type Seat = {
  id: string
  seatNumber: number
  reservationId: string | null
  guestName?: string
}

type Reservation = {
  id: string
  confirmationNumber: string
  guestName: string
}

type Props = {
  eventId: string
  seats: Seat[]
  reservations: Reservation[]
  tableShape: 'rectangle' | 'round'
}

export function AdminSeatingView({ eventId, seats, reservations }: Props) {
  const [localSeats, setLocalSeats] = useState(seats)
  const [selected, setSelected] = useState<string | null>(null)
  const [blastStatus, setBlastStatus] = useState('')

  const assigned = localSeats.filter(s => s.reservationId).length
  const total = localSeats.length

  async function assignSeat(seatId: string, reservationId: string | null) {
    await fetch(`/api/admin/seats/${seatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId }),
    })
    setLocalSeats(prev =>
      prev.map(s => s.id === seatId ? { ...s, reservationId } : s)
    )
    setSelected(null)
  }

  async function sendBlast() {
    setBlastStatus('Sending…')
    const res = await fetch(`/api/admin/events/${eventId}/seats/confirm-all`, { method: 'POST' })
    const data = await res.json()
    setBlastStatus(`Sent: ${data.sent}, Failed: ${data.failed}`)
  }

  const unassigned = localSeats.filter(s => !s.reservationId).length

  return (
    <div>
      <p>{assigned} assigned / {total - assigned} available</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {localSeats.map(seat => (
          <div
            key={seat.id}
            onClick={() => setSelected(selected === seat.id ? null : seat.id)}
            style={{
              width: 60,
              height: 60,
              border: '2px solid',
              borderColor: seat.reservationId ? '#22c55e' : '#d1d5db',
              backgroundColor: seat.reservationId ? '#dcfce7' : '#f9fafb',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              borderRadius: 4,
            }}
          >
            <span>#{seat.seatNumber}</span>
            {seat.guestName && <span style={{ fontSize: 9 }}>{seat.guestName.split(' ')[0]}</span>}
          </div>
        ))}
      </div>

      {selected && (
        <div>
          <p>Assign seat #{localSeats.find(s => s.id === selected)?.seatNumber} to:</p>
          <button type="button" onClick={() => assignSeat(selected, null)}>Unassign</button>
          {reservations.map(r => (
            <button key={r.id} type="button" onClick={() => assignSeat(selected, r.id)}>
              {r.guestName} ({r.confirmationNumber})
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {unassigned > 0 && (
          <p>{unassigned} seat{unassigned > 1 ? 's' : ''} not yet assigned</p>
        )}
        <button type="button" onClick={sendBlast}>Send seating confirmation</button>
        {blastStatus && <p>{blastStatus}</p>}
      </div>
    </div>
  )
}
