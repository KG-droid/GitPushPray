import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { bankPensionRate } from '../data/explore'
import { seedEvents, seedPersonas } from '../data/seed'
import { goalCascade, totalReward } from './explore'
import { buildJourney } from './journey'
import type { JourneyEvent } from './types'

function journey(id: string, today: string, extra: Omit<JourneyEvent, 'id' | 'personaId'>[] = []) {
  const persona = seedPersonas.find((p) => p.id === id)!
  const events = [...seedEvents, ...extra.map((e, i) => ({ ...e, id: `t${i}`, personaId: id }))]
  return buildJourney({ persona, events, today, steps: stepCatalogue, checks: checkCatalogue })
}

describe('goalCascade', () => {
  it('shows team goals under Group priorities before the manager sets goals', () => {
    const c = goalCascade(journey('priya', '2026-11-09'))
    expect(c.team).toBe('Payments Platform')
    expect(c.myGoals).toEqual([])
    expect(c.priorities.map((p) => p.id)).toEqual(['simple', 'greener-fairer'])
    expect(c.priorities[0].teamGoals).toHaveLength(2)
  })

  it('ladders each of the manager’s goals up to a team goal', () => {
    const c = goalCascade(
      journey('priya', '2026-11-09', [
        { type: 'step_completed', at: '2026-11-09T10:00:00Z', payload: { stepId: 'mgr-set-goals', by: 'manager', value: 'Goal A\nGoal B\nGoal C' } },
      ]),
    )
    expect(c.myGoals.map((g) => g.title)).toEqual(['Goal A', 'Goal B', 'Goal C'])
    const mine = c.priorities.flatMap((p) => p.teamGoals.flatMap((t) => t.mine))
    expect(mine.sort()).toEqual(['Goal A', 'Goal B', 'Goal C'])
    // Goal C supports the third team goal (fraud), under "greener, fairer"
    expect(c.priorities.find((p) => p.id === 'greener-fairer')?.teamGoals[0].mine).toEqual(['Goal C'])
  })
})

describe('pension and reward', () => {
  it('matches the policy: 6% gets the full 15%, capped, nothing at 0%', () => {
    expect(bankPensionRate(0)).toBe(0)
    expect(bankPensionRate(1)).toBe(5)
    expect(bankPensionRate(6)).toBe(15)
    expect(bankPensionRate(10)).toBe(15)
  })

  it('adds up the joiner’s total reward, ignoring benefits interest', () => {
    const r = totalReward(journey('margaret', '2026-11-09'), 6) // registered interest in private medical
    expect(r.salary).toBe(165_000)
    expect(r.parts.find((p) => p.id === 'pension')?.amount).toBe(24_750)
    expect(r.total).toBe(165_000 + 24_750 + 600)
    expect(r.monthly).toEqual({ you: 825, bank: 2063 })
  })
})
