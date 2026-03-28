'use client'

import { useState } from 'react'

type Props = {
  label: string
  value: string
  onChange: (url: string) => void
}

export function S3ImageUpload({ label, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!res.ok) throw new Error('Upload failed')
      const { uploadUrl, s3Url } = await res.json()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      onChange(s3Url)
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs tracking-widest uppercase text-fg-muted">{label}</p>
      <label className="border border-dashed border-border-strong p-6 text-center text-xs text-fg-muted cursor-pointer hover:border-fg-muted transition-colors">
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} disabled={uploading} className="sr-only" />
        {uploading ? 'Uploading...' : 'Click to upload'}
      </label>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
      {value && (
        <img src={value} alt={label} className="max-w-[200px] border border-border" />
      )}
    </div>
  )
}
