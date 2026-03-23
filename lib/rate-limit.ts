// In-memory rate limiter. Per-instance only — adequate for single-server deploys.
// For multi-instance/serverless, swap the store for a Redis-backed implementation.

type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false

  entry.count++
  return true
}
