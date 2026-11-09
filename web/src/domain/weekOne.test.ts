import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { weekOneItems } from '../data/weekOne'
import { buildJourney } from './journey'
import { joinPlan, parsePlan, plannedWeekOne, recommendedIds, WEEK_ONE_STEP, workingDay } from './weekOne'
import type { JourneyEvent } from './types'

function journey(id: string, today: string, extra: Omit<JourneyEvent, 'id' | 'personaId'>[] = []) {
  const persona = seedPersonas.find((p) => p.id === id)!
  const events = [...seedEvents, ...extra.map((e, i) => ({ ...e, id: `w${i}`, personaId: id }))]
  return buildJourney({ persona, events, today, steps: stepCatalogue, checks: checkCatalogue })
}

const planned = (ids: string[]) => ({
  type: 'step_completed' as const,
  at: '2026-11-09T10:00:00Z',
  payload: { stepId: WEEK_ONE_STEP, by: 'manager', value: joinPlan(ids) },
})

describe('workingDay', () => {
  it('counts the start date as day 1 and skips weekends', () => {
    expect(workingDay('2026-12-07', 1)).toBe('2026-12-07') // Monday
    expect(workingDay('2026-12-07', 5)).toBe('2026-12-11') // Friday
    expect(workingDay('2026-12-10', 4)).toBe('2026-12-15') // Thursday start: Fri, Mon, Tue
  })
})

describe('first-week plan', () => {
  it('has nothing until the manager plans it', () => {
    expect(plannedWeekOne(journey('priya', '2026-11-09'))).toBeUndefined()
  })

  it('lists the chosen sessions in date order, on real working days', () => {
    const items = plannedWeekOne(journey('priya', '2026-11-09', [planned(['tech-ship', 'tech-arch', 'tech-pair'])]))!
    expect(items.map((i) => [i.id, i.date, i.time])).toEqual([
      ['tech-arch', '2026-12-08', '10:00'],
      ['tech-pair', '2026-12-08', '14:00'],
      ['tech-ship', '2026-12-10', '11:00'],
    ])
  })

  it('uses the recommended sessions for a plan recorded without choices', () => {
    // Tom's plan is in the seed data with no choices recorded.
    const items = plannedWeekOne(journey('tom', '2026-11-09'))!
    expect(items.map((i) => i.id).sort()).toEqual(recommendedIds('technology').sort())
  })

  it('offers sessions that fit the role, with something recommended for each', () => {
    for (const [family, items] of Object.entries(weekOneItems)) {
      expect(items.some((i) => i.recommended), family).toBe(true)
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
    }
  })

  it('round-trips the stored value', () => {
    expect(parsePlan(joinPlan(['a', 'b']))).toEqual(['a', 'b'])
    expect(parsePlan(undefined)).toEqual([])
  })
})
