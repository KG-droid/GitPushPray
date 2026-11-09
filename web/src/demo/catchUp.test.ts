import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { buildJourney } from '../domain/journey'
import type { JourneyEvent } from '../domain/types'
import { planCatchUp } from './catchUp'

function run(personaId: string, today: string) {
  const persona = seedPersonas.find((p) => p.id === personaId)!
  const input = { persona, events: seedEvents, today, steps: stepCatalogue, checks: checkCatalogue }
  const plan = planCatchUp(input)
  const events: JourneyEvent[] = [
    ...seedEvents,
    ...plan.map((s, i) => ({
      id: `c${i}`,
      personaId,
      type: 'step_completed' as const,
      at: `${today}T12:00:00.${String(i).padStart(3, '0')}Z`,
      payload: { stepId: s.stepId, by: s.by, value: s.value },
    })),
  ]
  return { plan, after: buildJourney({ ...input, events }) }
}

describe('planCatchUp', () => {
  it('on Day 1 finishes everything from before Day 1, so the Day 1 plan can lead', () => {
    const { plan, after } = run('priya', '2026-12-07')
    expect(plan.length).toBeGreaterThan(5)
    const early = after.steps.filter((s) => ['offer', 'unlock', 'meet', 'manager-ready'].includes(s.stage) && s.kind !== 'content' && !s.exploreOnly)
    expect(early.filter((s) => s.state !== 'done')).toEqual([])
    expect(after.nextAction?.id).toBe('day-one-plan')
  })

  it('chooses a laptop before it is approved, so the approval stands', () => {
    const { plan, after } = run('priya', '2026-12-07')
    const ids = plan.map((p) => p.stepId)
    expect(ids.indexOf('choose-kit')).toBeLessThan(ids.lastIndexOf('mgr-request-device'))
    expect(after.steps.find((s) => s.id === 'mgr-request-device')?.state).toBe('done')
  })

  it('gives the welcome pack real goals for the role', () => {
    const { after } = run('priya', '2026-12-07')
    expect(after.steps.find((s) => s.id === 'mgr-set-goals')?.value).toMatch(/first change to production/)
    expect(after.steps.find((s) => s.id === 'welcome-pack')?.state).toBe('available')
  })

  it('leaves the check-ins and Day 30 review to do live', () => {
    const { plan } = run('priya', '2027-01-06')
    const ids = plan.map((p) => p.stepId)
    for (const id of ['pulse-two-weeks', 'day-30-checkin', 'mgr-day-30-review']) expect(ids).not.toContain(id)
  })

  it('only does what is due by the date it is given', () => {
    const early = run('priya', '2026-10-20').plan.map((p) => p.stepId)
    expect(early).not.toContain('mgr-request-access')
    expect(early).not.toContain('mandatory-training')
  })

  it('has nothing to do for a journey that is already caught up', () => {
    expect(run('aisha', '2026-11-10').plan).toEqual([])
  })
})

describe('planCatchUp and the first-week plan', () => {
  it('plans the recommended sessions for the role', () => {
    const { plan, after } = run('priya', '2026-12-07')
    expect(plan.find((p) => p.stepId === 'mgr-plan-week-one')?.value).toContain('tech-arch')
    expect(after.steps.find((s) => s.id === 'mgr-plan-week-one')?.state).toBe('done')
  })
})
