'use client'

import { useState } from 'react'
import Image from 'next/image'
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
  cancellationPolicyText: string
  themeBgColor: string
  themeFgColor: string
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
  cancellationPolicyText: '',
  themeBgColor: '#ffffff',
  themeFgColor: '#0a0a0a',
  themeAccentColor: '#000000',
  themeHeaderImageUrl: '',
}

const fieldClass =
  'w-full border-b border-border-strong bg-transparent py-2 text-sm text-fg placeholder:text-fg-muted focus:border-fg transition-colors outline-none'

const labelClass = 'text-xs tracking-widest uppercase text-fg-muted block mb-1'

function EventPreviewModal({ form, onClose }: { form: EventFormData; onClose: () => void }) {
  const eventDate = form.date ? new Date(form.date) : null
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Date TBD'
  const formattedTime = eventDate
    ? eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : ''
  const formattedPrice = (form.pricePerSeat / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const cardStyle: React.CSSProperties = {
    backgroundColor: form.themeBgColor,
    ...(form.themeFgColor ? { '--fg': form.themeFgColor, '--fg-muted': form.themeFgColor + 'aa' } as React.CSSProperties : {}),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs tracking-widest uppercase text-white/70">Guest preview</p>
          <button type="button" onClick={onClose} className="text-xs tracking-widest uppercase text-white/70 hover:text-white transition-colors">Close</button>
        </div>
        <div className="overflow-hidden" style={cardStyle}>
          {form.themeHeaderImageUrl && (
            <Image src={form.themeHeaderImageUrl} alt={form.title} width={0} height={0} sizes="100vw" className="w-full h-auto" />
          )}
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl text-fg">{form.title || 'Event title'}</h2>
              <p className="text-xs tracking-wider uppercase text-fg-muted">
                {formattedDate}{formattedTime ? ` · ${formattedTime}` : ''}{form.location ? ` · ${form.location}` : ''}
              </p>
            </div>
            {form.description && <p className="text-sm leading-relaxed text-fg-muted">{form.description}</p>}
            {form.menuImageUrl && (
              <Image src={form.menuImageUrl} alt="Menu" width={0} height={0} sizes="100vw" className="w-full h-auto" />
            )}
            <p className="text-sm font-body font-medium text-fg">{formattedPrice} per person</p>
            <div className="flex flex-col gap-4">
              <p className="text-xs text-fg-muted">{form.totalSeats} seat{form.totalSeats !== 1 ? 's' : ''} remaining</p>
              <div className="flex items-center gap-4">
                <span className="text-xs tracking-widest uppercase text-fg-muted">Party size</span>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex items-center justify-center border border-border-strong text-fg-muted opacity-30 text-lg leading-none">−</div>
                  <span className="font-display text-2xl w-6 text-center text-fg">1</span>
                  <div className="w-7 h-7 flex items-center justify-center border border-border-strong text-fg-muted text-lg leading-none">+</div>
                </div>
              </div>
              <div
                className="w-full py-3 text-xs tracking-widest uppercase text-accent-fg text-center"
                style={{ backgroundColor: form.themeAccentColor ?? 'var(--accent)' }}
              >
                Reserve a seat
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EventForm({ eventId, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<EventFormData>({ ...DEFAULTS, ...initial })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)

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
    <>
      {previewing && <EventPreviewModal form={form} onClose={() => setPreviewing(false)} />}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="title" className={labelClass}>Title</label>
            <input id="title" type="text" value={form.title} onChange={e => update('title', e.target.value)} required className={fieldClass} placeholder="Event title" />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea id="description" value={form.description} onChange={e => update('description', e.target.value)} rows={4} className={`${fieldClass} resize-none`} placeholder="Describe the event..." />
          </div>
          <div>
            <label htmlFor="date" className={labelClass}>Date &amp; time</label>
            <input id="date" type="datetime-local" value={form.date} onChange={e => update('date', e.target.value)} required className={fieldClass} />
          </div>
          <div>
            <label htmlFor="location" className={labelClass}>Location</label>
            <input id="location" type="text" value={form.location} onChange={e => update('location', e.target.value)} required className={fieldClass} placeholder="Address or venue name" />
          </div>
          <div className="flex gap-6">
            <div className="flex-1">
              <label htmlFor="pricePerSeat" className={labelClass}>Price per seat</label>
              <input id="pricePerSeat" type="number" min={0} value={form.pricePerSeat / 100} onChange={e => update('pricePerSeat', Math.round(Number(e.target.value)) * 100)} required className={fieldClass} />
            </div>
            <div className="flex-1">
              <label htmlFor="totalSeats" className={labelClass}>Total seats</label>
              <input id="totalSeats" type="number" min={1} value={form.totalSeats} onChange={e => update('totalSeats', e.target.value)} required className={fieldClass} />
            </div>
          </div>
          <div>
            <label htmlFor="cancellationPolicyText" className={labelClass}>Cancellation policy</label>
            <textarea id="cancellationPolicyText" value={form.cancellationPolicyText} onChange={e => update('cancellationPolicyText', e.target.value)} rows={3} className={`${fieldClass} resize-none`} placeholder="Describe your cancellation policy..." />
          </div>
        </div>

        {/* Images */}
        <div className="flex flex-col gap-6">
          <S3ImageUpload label="Menu image" value={form.menuImageUrl} onChange={url => update('menuImageUrl', url)} />
          <S3ImageUpload label="Header image" value={form.themeHeaderImageUrl} onChange={url => update('themeHeaderImageUrl', url)} />
        </div>

        {/* Theme colors */}
        <div className="flex flex-col gap-3">
          <p className={labelClass}>Theme colors</p>
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-3">
              <label htmlFor="themeBgColor" className="text-xs text-fg-muted">Background</label>
              <input id="themeBgColor" type="color" value={form.themeBgColor} onChange={e => update('themeBgColor', e.target.value)} className="w-8 h-8 border border-border cursor-pointer" />
              <span className="text-xs text-fg-muted font-mono">{form.themeBgColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="themeFgColor" className="text-xs text-fg-muted">Text</label>
              <input id="themeFgColor" type="color" value={form.themeFgColor} onChange={e => update('themeFgColor', e.target.value)} className="w-8 h-8 border border-border cursor-pointer" />
              <span className="text-xs text-fg-muted font-mono">{form.themeFgColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="themeAccentColor" className="text-xs text-fg-muted">Accent</label>
              <input id="themeAccentColor" type="color" value={form.themeAccentColor} onChange={e => update('themeAccentColor', e.target.value)} className="w-8 h-8 border border-border cursor-pointer" />
              <span className="text-xs text-fg-muted font-mono">{form.themeAccentColor}</span>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPreviewing(true)}
            className="flex-1 border border-border-strong text-fg text-xs tracking-widest uppercase py-3 transition-opacity hover:opacity-70"
          >
            Preview
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-fg text-bg text-xs tracking-widest uppercase py-3 disabled:opacity-40 transition-opacity"
          >
            {saving ? 'Saving...' : 'Save event'}
          </button>
        </div>
      </form>
    </>
  )
}
