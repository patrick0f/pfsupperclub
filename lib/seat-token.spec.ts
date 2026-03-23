import { describe, expect, test, beforeAll } from 'vitest'
import { signSeatToken, verifySeatToken } from './seat-token'

const CONFIRMATION_NUMBER = 'PF-ABC123'
const EMAIL = 'guest@example.com'
const NOW = Math.floor(Date.now() / 1000)
const EXPIRED_TIMESTAMP = NOW - 97 * 60 * 60 // 97 hours ago — past 96h max age

beforeAll(() => {
  process.env.IRON_SESSION_PASSWORD = 'test-iron-session-password-32-chars!!'
})

describe('signSeatToken + verifySeatToken', () => {
  test('valid token verifies as true', () => {
    const token = signSeatToken(CONFIRMATION_NUMBER, EMAIL)
    expect(verifySeatToken(token, CONFIRMATION_NUMBER, EMAIL)).toBe(true)
  })

  test('tampered signature verifies as false', () => {
    const token = signSeatToken(CONFIRMATION_NUMBER, EMAIL)
    const tampered = token.slice(0, -4) + '0000'
    expect(verifySeatToken(tampered, CONFIRMATION_NUMBER, EMAIL)).toBe(false)
  })

  test('token for different email verifies as false', () => {
    const token = signSeatToken(CONFIRMATION_NUMBER, EMAIL)
    expect(verifySeatToken(token, CONFIRMATION_NUMBER, 'other@example.com')).toBe(false)
  })

  test('token for different confirmation number verifies as false', () => {
    const token = signSeatToken(CONFIRMATION_NUMBER, EMAIL)
    expect(verifySeatToken(token, 'PF-XXXXXX', EMAIL)).toBe(false)
  })

  test('expired token verifies as false', () => {
    const token = signSeatToken(CONFIRMATION_NUMBER, EMAIL, EXPIRED_TIMESTAMP)
    expect(verifySeatToken(token, CONFIRMATION_NUMBER, EMAIL)).toBe(false)
  })

  test('token without timestamp separator verifies as false', () => {
    expect(verifySeatToken('notavalidtoken', CONFIRMATION_NUMBER, EMAIL)).toBe(false)
  })
})
