import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { buildJourney } from './journey'
import { journeyProgress } from './progress'

function progress(id: string, today: string) {
  const persona = seedPersonas.find((p) => p.id === id)!
  return journeyProgress(buildJourney({ persona, events: seedEvents, today, steps: stepCatalogue, checks: checkCatalogue }))
}

describe('journeyProgress', () => {
  const p = progress('priya', '2026-11-09')

  it('counts the joiner’s own steps and checks, and says when the last check is expected', () => {
    expect(p.stepsDone).toBeGreaterThan(0)
    expect(p.stepsTotal).toBeGreaterThan(p.stepsDone)
    expect(p.checks).toMatchObject({ cleared: 4, total: 5, expectedBy: '2026-11-17' })
  })

  it('lists what is waiting on the joiner, soonest first', () => {
    expect(p.todo[0]).toMatchObject({ title: 'Do you have any accessibility requirements?' })
    expect(p.todo.length).toBeLessThanOrEqual(6)
  })

  it('says why something is locked', () => {
    const laptop = p.locked.find((t) => t.title === 'Choose your laptop')
    expect(laptop?.unlocksWhen).toMatch(/Unlocks once/)
  })

  it('lists what their manager still has to do', () => {
    expect(p.team.some((t) => t.who === 'manager' && t.title === 'Set first 3-month goals')).toBe(true)
    expect(p.team.some((t) => t.title === 'Assign a buddy')).toBe(false) // already done
  })

  it('has no end date for the checks once they are all cleared', () => {
    expect(progress('aisha', '2026-11-10').checks.expectedBy).toBeUndefined()
  })

  it('carries no check results beyond how many are cleared', () => {
    expect(JSON.stringify(p)).not.toMatch(/delayed|in-progress|criminal|credit|DBS/i)
  })
})
