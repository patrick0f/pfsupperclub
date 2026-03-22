const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export function generateConfirmationNumber(): string {
  const chars = Array.from(
    { length: CODE_LENGTH },
    () => CHARSET[Math.floor(Math.random() * CHARSET.length)]
  )
  return `PF-${chars.join('')}`
}
