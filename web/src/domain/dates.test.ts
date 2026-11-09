import { describe, expect, it } from 'vitest'
import { countdownLabel, daysUntil } from './dates'

describe('daysUntil', () => {
  it('counts whole calendar days', () => {
    expect(daysUntil('2026-12-07', '2026-11-09')).toBe(28)
  })

  it('is unaffected by the clocks changing', () => {
    expect(daysUntil('2026-03-30', '2026-03-28')).toBe(2)
  })

  it('goes negative after the date', () => {
    expect(daysUntil('2026-11-09', '2026-11-12')).toBe(-3)
  })
})

describe('countdownLabel', () => {
  it.each([
    [5, '5 days to go'],
    [1, 'Tomorrow'],
    [0, "It's Day 1!"],
    [-4, 'Day 5'],
  ])('%i → %s', (days, label) => {
    expect(countdownLabel(days)).toBe(label)
  })
})
