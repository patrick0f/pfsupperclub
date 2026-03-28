'use client'

import { useRouter } from 'next/navigation'

type Guest = { isPrimary: boolean; name: string }
type Reservation = {
  id: string
  confirmationNumber: string
  partySize: number
  totalAmount: number
  paymentStatus: string
  reservationStatus: string
  guests: Guest[]
  user: { email: string }
}

const PAYMENT_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  paid: 'bg-accent text-accent-fg',
  refunded: 'bg-bg-subtle text-fg-muted',
  failed: 'bg-red-50 text-red-600 border border-red-200',
}

const RESERVATION_STYLES: Record<string, string> = {
  reserved: 'border border-border-strong text-fg-muted',
  cancelled: 'bg-bg-subtle text-fg-muted',
  no_show: 'bg-red-50 text-red-600 border border-red-200',
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

  if (reservations.length === 0) {
    return <p className="text-sm text-fg-muted">No reservations yet.</p>
  }

  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="bg-bg-subtle">
            {['Confirmation', 'Guest', 'Email', 'Party', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => {
            const primary = r.guests.find(g => g.isPrimary)
            return (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 text-xs font-body text-fg-muted">{r.confirmationNumber}</td>
                <td className="px-4 py-3 text-fg">{primary?.name}</td>
                <td className="px-4 py-3 text-fg-muted">{r.user.email}</td>
                <td className="px-4 py-3 text-fg-muted">{r.partySize}</td>
                <td className="px-4 py-3 text-fg">${(r.totalAmount / 100).toFixed(0)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${PAYMENT_STYLES[r.paymentStatus] ?? 'text-fg-muted'}`}>
                    {r.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${RESERVATION_STYLES[r.reservationStatus] ?? 'text-fg-muted'}`}>
                    {r.reservationStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button type="button" onClick={() => resend(r.id, 'confirmation')} className="text-xs text-fg-muted hover:text-fg transition-colors">
                      Resend confirm
                    </button>
                    <span className="text-fg-muted text-xs">·</span>
                    <button type="button" onClick={() => resend(r.id, 'reminder')} className="text-xs text-fg-muted hover:text-fg transition-colors">
                      Resend reminder
                    </button>
                    {r.reservationStatus === 'reserved' && (
                      <>
                        <span className="text-fg-muted text-xs">·</span>
                        <button type="button" onClick={() => updateStatus(r.id, 'no_show')} className="text-xs text-fg-muted hover:text-fg transition-colors">
                          No show
                        </button>
                        <span className="text-fg-muted text-xs">·</span>
                        <button type="button" onClick={() => updateStatus(r.id, 'cancelled')} className="text-xs text-fg-muted hover:text-fg transition-colors">
                          Cancel
                        </button>
                      </>
                    )}
                    {r.paymentStatus === 'paid' && (
                      <>
                        <span className="text-fg-muted text-xs">·</span>
                        <button type="button" onClick={() => refund(r.id)} className="text-xs text-red-600 hover:opacity-70 transition-opacity">
                          Refund
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
