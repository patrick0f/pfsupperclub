'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  id: string
  status: string
}

export function EventActions({ id, status }: Props) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState<'cancel' | 'delete' | null>(null)

  async function postAction(action: 'publish' | 'unpublish' | 'cancel') {
    setError('')
    const res = await fetch(`/api/admin/events/${id}/${action}`, { method: 'POST' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed')
      return
    }
    setConfirming(null)
    router.refresh()
  }

  async function deleteEvent() {
    setError('')
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed')
      return
    }
    setConfirming(null)
    router.refresh()
  }

  if (confirming === 'cancel') {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-fg-muted">Cancel event and email guests?</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => postAction('cancel')} className="text-xs text-red-600 hover:opacity-70 transition-opacity">Yes, cancel</button>
          <span className="text-fg-muted text-xs">·</span>
          <button type="button" onClick={() => setConfirming(null)} className="text-xs text-fg-muted hover:text-fg transition-colors">No</button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  if (confirming === 'delete') {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-fg-muted">Delete this draft permanently?</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={deleteEvent} className="text-xs text-red-600 hover:opacity-70 transition-opacity">Yes, delete</button>
          <span className="text-fg-muted text-xs">·</span>
          <button type="button" onClick={() => setConfirming(null)} className="text-xs text-fg-muted hover:text-fg transition-colors">No</button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 flex-wrap">
        {status === 'draft' && (
          <>
            <Link href={`/admin/events/${id}/edit`} className="text-xs text-fg-muted hover:text-fg transition-colors">Edit</Link>
            <span className="text-fg-muted text-xs">·</span>
            <button type="button" onClick={() => postAction('publish')} className="text-xs text-accent hover:opacity-70 transition-opacity">Publish</button>
            <span className="text-fg-muted text-xs">·</span>
            <button type="button" onClick={() => setConfirming('delete')} className="text-xs text-red-600 hover:opacity-70 transition-opacity">Delete</button>
          </>
        )}
        {status === 'published' && (
          <>
            <button type="button" onClick={() => postAction('unpublish')} className="text-xs text-fg-muted hover:text-fg transition-colors">Unpublish</button>
            <span className="text-fg-muted text-xs">·</span>
            <button type="button" onClick={() => setConfirming('cancel')} className="text-xs text-red-600 hover:opacity-70 transition-opacity">Cancel</button>
            <span className="text-fg-muted text-xs">·</span>
            <Link href={`/admin/events/${id}/reservations`} className="text-xs text-fg-muted hover:text-fg transition-colors">Reservations</Link>
          </>
        )}
        {(status === 'cancelled' || status === 'completed') && (
          <Link href={`/admin/events/${id}/reservations`} className="text-xs text-fg-muted hover:text-fg transition-colors">Reservations</Link>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
