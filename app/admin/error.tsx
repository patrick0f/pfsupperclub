'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-xs tracking-widest uppercase text-fg-muted">Something went wrong</p>
      <button
        onClick={reset}
        className="text-xs tracking-widest uppercase border border-border-strong px-4 py-2 hover:border-fg transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
