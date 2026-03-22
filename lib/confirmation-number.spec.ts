import { describe, expect, test } from 'vitest'
import { generateConfirmationNumber } from './confirmation-number'

const AMBIGUOUS_CHARS = ['0', '1', 'I', 'O']
const SAMPLE_SIZE = 200
const UNIQUE_SAMPLE = 1000
const CONFIRMATION_PATTERN = /^PF-[A-Z2-9]{6}$/

describe('generateConfirmationNumber', () => {
  test('matches format PF-XXXXXX with 6 uppercase alphanumeric chars', () => {
    const result = generateConfirmationNumber()
    expect(result).toMatch(CONFIRMATION_PATTERN)
  })

  test('code segment is exactly 6 characters', () => {
    const result = generateConfirmationNumber()
    const code = result.replace('PF-', '')
    expect(code).toHaveLength(6)
  })

  test(`never contains ambiguous chars across ${SAMPLE_SIZE} samples`, () => {
    const samples = Array.from({ length: SAMPLE_SIZE }, () =>
      generateConfirmationNumber()
    )
    for (const sample of samples) {
      for (const char of AMBIGUOUS_CHARS) {
        expect(sample).not.toContain(char)
      }
    }
  })

  test(`${UNIQUE_SAMPLE} calls produce ${UNIQUE_SAMPLE} unique values`, () => {
    const values = new Set(
      Array.from({ length: UNIQUE_SAMPLE }, () => generateConfirmationNumber())
    )
    expect(values.size).toBe(UNIQUE_SAMPLE)
  })
})
