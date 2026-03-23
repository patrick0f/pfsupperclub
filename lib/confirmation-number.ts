import { randomBytes } from 'crypto'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 chars — 256 % 32 === 0, no modulo bias
const CODE_LENGTH = 6

export function generateConfirmationNumber(): string {
  const bytes = randomBytes(CODE_LENGTH)
  const chars = Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length])
  return `PF-${chars.join('')}`
}
