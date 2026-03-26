'use client'

import { useState } from 'react'

type Props = {
  admin: { id: string; name: string; email: string; phone: string | null }
}

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
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <input type="email" value={admin.email} disabled />
      </div>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="phone">Phone</label>
        <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <fieldset>
        <legend>Change password (optional)</legend>
        <div>
          <label htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {message && <p>{message}</p>}
      <button type="submit">Save</button>
    </form>
  )
}
