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
        body: JSON.stringify({ filename: file.name }),
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
    <div>
      <label>{label}</label>
      <input type="file" accept="image/png,image/jpeg" onChange={handleFile} disabled={uploading} />
      {uploading && <span>Uploading…</span>}
      {error && <span role="alert">{error}</span>}
      {value && <img src={value} alt={label} style={{ maxWidth: 200, marginTop: 8 }} />}
    </div>
  )
}
