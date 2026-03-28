'use client'

import { useState } from 'react'

type Props = {
  admin: { id: string; name: string; email: string; phone: string | null }
}

const fieldClass =
  'w-full border-b border-border-strong bg-transparent py-2 text-sm text-fg placeholder:text-fg-muted focus:border-fg transition-colors outline-none'

const labelClass = 'text-xs tracking-widest uppercase text-fg-muted block mb-1'

export function AdminProfileForm({ admin }: Props) {
  const [name, setName] = useState(admin.name)
  const [phone, setPhone] = useState(admin.phone ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setError('')
    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone: phone || null,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    })
    if (res.ok) {
      setMessage('Saved')
      setCurrentPassword('')
      setNewPassword('')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Basic info */}
      <div className="flex flex-col gap-6">
        <div>
          <p className={labelClass}>Email</p>
          <p className="text-sm text-fg-muted py-2">{admin.email}</p>
        </div>
        <div>
          <label htmlFor="name" className={labelClass}>Name</label>
          <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone</label>
          <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" className={fieldClass} />
        </div>
      </div>

      {/* Change password */}
      <div className="flex flex-col gap-6 border-t border-border pt-8">
        <p className={labelClass}>Change password <span className="normal-case tracking-normal">(optional)</span></p>
        <div>
          <label htmlFor="currentPassword" className={labelClass}>Current password</label>
          <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="newPassword" className={labelClass}>New password</label>
          <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={fieldClass} />
        </div>
      </div>

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {message && <p className="text-xs tracking-widest uppercase text-accent">{message}</p>}

      <button
        type="submit"
        className="w-full bg-fg text-bg text-xs tracking-widest uppercase py-3 transition-opacity hover:opacity-70"
      >
        Save changes
      </button>
    </form>
  )
}
