'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Guest = { isPrimary: boolean; name: string; allergies: string | null }
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

const HEADERS = ['Confirmation', 'Guest', 'Email', 'Party', 'Amount', 'Payment', 'Actions']

function AllergyPopover({ allergies }: { allergies: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setPos(null)
    }
    if (pos) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pos])

  function handleOpen() {
    if (pos) { setPos(null); return }
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="text-xs text-fg-muted hover:text-fg transition-colors"
      >
        Allergies
      </button>
      {pos && (
        <div
          ref={popoverRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-bg border border-border shadow-sm px-3 py-2 max-w-[220px]"
        >
          <p className="text-xs text-fg">{allergies}</p>
        </div>
      )}
    </>
  )
}

function GuestPopover({ guests }: { guests: Guest[] }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const additional = guests.filter(g => !g.isPrimary)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setPos(null)
    }
    if (pos) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pos])

  if (additional.length === 0) return null

  function handleOpen() {
    if (pos) { setPos(null); return }
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="text-xs text-fg-muted border border-border px-1.5 py-0.5 hover:border-border-strong transition-colors"
      >
        +{additional.length}
      </button>
      {pos && (
        <div
          ref={popoverRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-bg border border-border shadow-sm min-w-[160px] flex flex-col"
        >
          {guests.map((g, i) => (
            <div key={i} className="px-3 py-2 border-b border-border last:border-0">
              <p className="text-xs text-fg">{g.name}{g.isPrimary ? <span className="text-fg-muted"> (primary)</span> : null}</p>
              {g.allergies && <p className="text-xs text-fg-muted mt-0.5">{g.allergies}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function ReservationRows({
  reservations,
  onUpdateStatus,
  onResend,
  onRefund,
}: {
  reservations: Reservation[]
  onUpdateStatus: (id: string, status: string) => void
  onResend: (id: string) => void
  onRefund: (id: string) => void
}) {
  return (
    <>
      {reservations.map(r => {
        const primary = r.guests.find(g => g.isPrimary)
        const allergies = primary?.allergies
        return (
          <tr key={r.id} className="border-t border-border">
            <td className="px-4 py-3 text-xs font-body text-fg-muted">{r.confirmationNumber}</td>
            <td className="px-4 py-3 text-fg">
              <div className="flex items-center gap-2">
                <span>{primary?.name}</span>
                <GuestPopover guests={r.guests} />
              </div>
            </td>
            <td className="px-4 py-3 text-fg-muted">{r.user.email}</td>
            <td className="px-4 py-3 text-fg-muted">{r.partySize}</td>
            <td className="px-4 py-3 text-fg">${(r.totalAmount / 100).toFixed(0)}</td>
            <td className="px-4 py-3">
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${PAYMENT_STYLES[r.paymentStatus] ?? 'text-fg-muted'}`}>
                {r.paymentStatus}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                {allergies && (
                  <>
                    <AllergyPopover allergies={allergies} />
                    <span className="text-fg-muted text-xs">·</span>
                  </>
                )}
                {r.reservationStatus !== 'cancelled' && (
                  <button type="button" onClick={() => onResend(r.id)} className="text-xs text-fg-muted hover:text-fg transition-colors">
                    Resend reminder
                  </button>
                )}
                {r.reservationStatus === 'reserved' && (
                  <>
                    <span className="text-fg-muted text-xs">·</span>
                    <button type="button" onClick={() => onUpdateStatus(r.id, 'cancelled')} className="text-xs text-fg-muted hover:text-fg transition-colors">
                      Cancel
                    </button>
                  </>
                )}
                {r.paymentStatus === 'paid' && (
                  <>
                    <span className="text-fg-muted text-xs">·</span>
                    <button type="button" onClick={() => onRefund(r.id)} className="text-xs text-red-600 hover:opacity-70 transition-opacity">
                      Refund
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        )
      })}
    </>
  )
}

function Table({ reservations, onUpdateStatus, onResend, onRefund }: {
  reservations: Reservation[]
  onUpdateStatus: (id: string, status: string) => void
  onResend: (id: string) => void
  onRefund: (id: string) => void
}) {
  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="bg-bg-subtle">
            {HEADERS.map(h => (
              <th key={h} className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <ReservationRows reservations={reservations} onUpdateStatus={onUpdateStatus} onResend={onResend} onRefund={onRefund} />
        </tbody>
      </table>
    </div>
  )
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

  async function resend(id: string) {
    await fetch(`/api/admin/reservations/${id}/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'reminder' }),
    })
  }

  async function refund(id: string) {
    await fetch(`/api/admin/reservations/${id}/refund`, { method: 'POST' })
    router.refresh()
  }

  const active = reservations.filter(r => r.reservationStatus !== 'cancelled')
  const cancelled = reservations.filter(r => r.reservationStatus === 'cancelled')

  if (reservations.length === 0) {
    return <p className="text-sm text-fg-muted">No reservations yet.</p>
  }

  return (
    <div className="flex flex-col gap-10">
      {active.length > 0 && (
        <Table reservations={active} onUpdateStatus={updateStatus} onResend={resend} onRefund={refund} />
      )}
      {cancelled.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs tracking-widest uppercase text-fg-muted">Cancelled ({cancelled.length})</p>
          <Table reservations={cancelled} onUpdateStatus={updateStatus} onResend={resend} onRefund={refund} />
        </div>
      )}
    </div>
  )
}
