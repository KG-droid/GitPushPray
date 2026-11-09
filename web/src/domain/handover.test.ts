import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { handoversTo } from './handover'
import { buildJourney } from './journey'
import { managerNudges, managerView } from './manager'
import { monthSummary } from './pulse'
import type { JourneyEvent } from './types'

const handover = (personaId: string, route: string, summary: string, at = '2026-11-09T10:00:00Z'): JourneyEvent => ({
  id: `h-${route}`,
  personaId,
  type: 'handover_sent',
  at,
  payload: { route, summary },
})

describe('handoversTo', () => {
  const events = [handover('priya', 'hr', 'Pay question'), handover('priya', 'manager', 'Week one plan'), handover('rhys', 'hr', 'Late', '2026-12-01T10:00:00Z')]

  it('keeps only the requested routes and nothing from the future', () => {
    const items = handoversTo(events, ['hr', 'screening'], '2026-11-09')
    expect(items.map((i) => i.summary)).toEqual(['Pay question'])
  })

  it('can be limited to one joiner', () => {
    expect(handoversTo(events, ['manager'], '2026-11-09', 'rhys')).toEqual([])
    expect(handoversTo(events, ['manager'], '2026-11-09', 'priya')).toHaveLength(1)
  })
})

describe('manager sees what was sent to them', () => {
  const persona = seedPersonas.find((p) => p.id === 'priya')!
  const build = (extra: JourneyEvent[]) => {
    const all = [...seedEvents, ...extra]
    return managerView(buildJourney({ persona, events: all, today: '2026-11-09', steps: stepCatalogue, checks: checkCatalogue }), all)
  }

  it('lists manager handovers first in the nudges, and ignores ones sent to other people', () => {
    const view = build([handover('priya', 'manager', 'Priya wants to know about week one'), handover('priya', 'hr', 'Pay question')])
    expect(view.askedForYou.map((h) => h.summary)).toEqual(['Priya wants to know about week one'])
    expect(managerNudges([view])[0]).toMatchObject({ kind: 'asked-for-you', name: 'Priya' })
  })
})

describe('monthSummary', () => {
  it('counts what a joiner has done and how their confidence moved', () => {
    const persona = seedPersonas.find((p) => p.id === 'aisha')!
    const journey = buildJourney({ persona, events: seedEvents, today: '2026-11-10', steps: stepCatalogue, checks: checkCatalogue })
    const m = monthSummary(journey, seedEvents)
    expect(m).toMatchObject({ day: 30, meetups: 5, pulses: 3 })
    expect(m.first?.confident).toBe(3)
    expect(m.last?.confident).toBe(4)
  })
})
