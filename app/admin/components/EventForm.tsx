'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { S3ImageUpload } from './S3ImageUpload'

type EventFormData = {
  title: string
  description: string
  date: string
  location: string
  pricePerSeat: number
  totalSeats: number
  menuImageUrl: string
  tableShape: 'rectangle' | 'round'
  cancellationPolicyText: string
  themeBgColor: string
  themeAccentColor: string
  themeHeaderImageUrl: string
}

type Props = {
  eventId?: string
  initial?: Partial<EventFormData>
}

const DEFAULTS: EventFormData = {
  title: '',
  description: '',
  date: '',
  location: '',
  pricePerSeat: 0,
  totalSeats: 10,
  menuImageUrl: '',
  tableShape: 'rectangle',
  cancellationPolicyText: '',
  themeBgColor: '#ffffff',
  themeAccentColor: '#000000',
  themeHeaderImageUrl: '',
}

export function EventForm({ eventId, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<EventFormData>({ ...DEFAULTS, ...initial })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field: keyof EventFormData, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const body = {
        ...form,
        pricePerSeat: Number(form.pricePerSeat),
        totalSeats: Number(form.totalSeats),
        menuImageUrl: form.menuImageUrl || null,
        themeHeaderImageUrl: form.themeHeaderImageUrl || null,
      }
      const res = await fetch(eventId ? `/api/admin/events/${eventId}` : '/api/admin/events', {
        method: eventId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save')
        return
      }
      router.push('/admin/events')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Title</label>
        <input id="title" type="text" value={form.title} onChange={e => update('title', e.target.value)} required />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" value={form.description} onChange={e => update('description', e.target.value)} />
      </div>
      <div>
        <label htmlFor="date">Date &amp; time</label>
        <input id="date" type="datetime-local" value={form.date} onChange={e => update('date', e.target.value)} required />
      </div>
      <div>
        <label htmlFor="location">Location</label>
        <input id="location" type="text" value={form.location} onChange={e => update('location', e.target.value)} required />
      </div>
      <div>
        <label htmlFor="pricePerSeat">Price per seat (cents)</label>
        <input id="pricePerSeat" type="number" min={0} value={form.pricePerSeat} onChange={e => update('pricePerSeat', e.target.value)} required />
      </div>
      <div>
        <label htmlFor="totalSeats">Total seats</label>
        <input id="totalSeats" type="number" min={1} value={form.totalSeats} onChange={e => update('totalSeats', e.target.value)} required />
      </div>
      <div>
        <label htmlFor="tableShape">Table shape</label>
        <select id="tableShape" value={form.tableShape} onChange={e => update('tableShape', e.target.value as 'rectangle' | 'round')}>
          <option value="rectangle">Rectangle</option>
          <option value="round">Round</option>
        </select>
      </div>
      <div>
        <label htmlFor="cancellationPolicyText">Cancellation policy</label>
        <textarea id="cancellationPolicyText" value={form.cancellationPolicyText} onChange={e => update('cancellationPolicyText', e.target.value)} />
      </div>
      <S3ImageUpload label="Menu image (PNG)" value={form.menuImageUrl} onChange={url => update('menuImageUrl', url)} />
      <div>
        <label htmlFor="themeBgColor">Background color</label>
        <input id="themeBgColor" type="color" value={form.themeBgColor} onChange={e => update('themeBgColor', e.target.value)} />
      </div>
      <div>
        <label htmlFor="themeAccentColor">Accent color</label>
        <input id="themeAccentColor" type="color" value={form.themeAccentColor} onChange={e => update('themeAccentColor', e.target.value)} />
      </div>
      <S3ImageUpload label="Header image" value={form.themeHeaderImageUrl} onChange={url => update('themeHeaderImageUrl', url)} />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
    </form>
  )
}
