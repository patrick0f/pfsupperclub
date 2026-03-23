import { createHmac, timingSafeEqual } from 'crypto'

const MAX_AGE_SECONDS = 96 * 60 * 60 // 96 hours

function sign(confirmationNumber: string, email: string, timestamp: number): string {
  return createHmac('sha256', process.env.IRON_SESSION_PASSWORD!)
    .update(`${confirmationNumber}:${email}:${timestamp}`)
    .digest('hex')
}

export function signSeatToken(
  confirmationNumber: string,
  email: string,
  _timestampOverride?: number
): string {
  const timestamp = _timestampOverride ?? Math.floor(Date.now() / 1000)
  const hmac = sign(confirmationNumber, email, timestamp)
  return `${timestamp}.${hmac}`
}

export function verifySeatToken(
  token: string,
  confirmationNumber: string,
  email: string
): boolean {
  try {
    const dotIndex = token.indexOf('.')
    if (dotIndex === -1) return false
    const timestampStr = token.slice(0, dotIndex)
    const hmac = token.slice(dotIndex + 1)
    if (!hmac) return false

    const timestamp = parseInt(timestampStr, 10)
    if (isNaN(timestamp)) return false

    const now = Math.floor(Date.now() / 1000)
    if (now - timestamp > MAX_AGE_SECONDS) return false

    const expected = sign(confirmationNumber, email, timestamp)
    return timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
