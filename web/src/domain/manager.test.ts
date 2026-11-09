import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { buildJourney } from './journey'
import { managerNudges, managerView } from './manager'
import type { JourneyEvent } from './types'

function view(id: string, today: string, extra: Omit<JourneyEvent, 'id' | 'personaId'>[] = []) {
  const persona = seedPersonas.find((p) => p.id === id)!
  const events = [...seedEvents, ...extra.map((e, i) => ({ ...e, id: `t${i}`, personaId: id }))]
  const journey = buildJourney({ persona, events, today, steps: stepCatalogue, checks: checkCatalogue })
  return managerView(journey, events)
}

describe('managerView', () => {
  it('lists only the manager’s own tasks, available ones first', () => {
    const v = view('priya', '2026-11-09')
    expect(v.tasks.every((t) => t.owner === 'manager')).toBe(true)
    expect(v.tasks[0].state).toBe('available')
    expect(v.tasks.find((t) => t.id === 'mgr-assign-buddy')?.state).toBe('done')
  })

  it('says a joiner is waiting on checks without exposing which check', () => {
    const v = view('priya', '2026-11-09')
    expect(v.status).toBe('waiting-on-checks')
    expect(v.vetting).toEqual({ cleared: false, expectedBy: '2026-11-17', delayed: false })
    expect(Object.keys(v.vetting)).not.toContain('checks')
  })

  it('flags tasks due within a week as needing the manager', () => {
    const v = view('tom', '2026-11-09') // starts 16 Nov, badge not requested yet
    expect(v.status).toBe('needs-you')
    expect(v.urgent.map((t) => t.id)).toContain('mgr-request-badge')
  })

  it('shares the laptop choice but keeps benefits private', () => {
    const v = view('margaret', '2026-11-09')
    expect(v.sharedChoices).toEqual([{ label: 'Laptop', value: 'Surface Laptop, Standard spec' }])
    expect(JSON.stringify(v.sharedChoices)).not.toMatch(/medical/i)
  })

  it('shows a pulse trend only once there are at least two check-ins', () => {
    expect(view('aisha', '2026-10-25').pulse).toBeUndefined() // one check-in so far
    const v = view('aisha', '2026-11-09')
    expect(v.pulse).toMatchObject({ responses: 3, trend: 'up' })
    expect(v.pulse?.knowWhoToAsk).toBeCloseTo(4.3, 1)
  })
})

describe('managerNudges', () => {
  it('nudges just before Day 1, with the date change first', () => {
    const tom = view('tom', '2026-11-09')
    const priyaMoved = view('priya', '2026-11-09', [
      { type: 'start_date_changed', at: '2026-11-09T09:00:00Z', payload: { to: '2026-12-21', reason: 'References' } },
    ])
    const nudges = managerNudges([tom, priyaMoved])
    expect(nudges[0]).toMatchObject({ kind: 'date-moved', personaId: 'priya', to: '2026-12-21' })
    expect(nudges.some((n) => n.kind === 'first-week' && n.personaId === 'tom')).toBe(true)
    expect(nudges.some((n) => n.kind === 'task-due' && n.personaId === 'tom')).toBe(true)
  })
})
