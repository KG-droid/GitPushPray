import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { buildJourney } from './journey'
import { laptopLabel, laptopOrder, suggestedLaptopSpec } from './laptop'
import type { JourneyEvent } from './types'

function journey(id: string, today: string, events = seedEvents) {
  const persona = seedPersonas.find((p) => p.id === id)!
  return buildJourney({ persona, events, today, steps: stepCatalogue, checks: checkCatalogue })
}

let n = 0
function event(personaId: string, day: string, type: JourneyEvent['type'], payload: Record<string, unknown>): JourneyEvent {
  return { id: `test-${++n}`, personaId, type, at: `${day}T12:00:00Z`, payload }
}

const completed = (personaId: string, day: string, stepId: string, value: string) =>
  event(personaId, day, 'step_completed', { stepId, value })

describe('laptop spec and model', () => {
  it('offers only the bank’s approved devices', () => {
    const kit = journey('priya', '2026-11-09').steps.find((s) => s.id === 'choose-kit')
    expect(kit?.options?.map((o) => o.label)).toEqual([
      'Surface Pro',
      'Surface Laptop',
      'HP EliteBook G11',
      'Apple MacBook Pro',
    ])
  })

  it('keeps the laptop choice locked until the manager has set the spec', () => {
    const withoutSpec = seedEvents.filter((e) => !(e.personaId === 'priya' && e.payload?.stepId === 'mgr-set-device-spec'))
    const before = journey('priya', '2026-11-09', withoutSpec).steps.find((s) => s.id === 'choose-kit')
    expect(before?.state).toBe('locked')
    expect(before?.lockedHint).toMatch(/manager has set your laptop spec/)

    const after = journey('priya', '2026-11-09').steps.find((s) => s.id === 'choose-kit')
    expect(after?.state).toBe('available')
  })

  it('reads the spec the manager set and the model the joiner chose', () => {
    const order = laptopOrder(journey('tom', '2026-11-09'))
    expect(order.spec?.value).toBe('developer')
    expect(laptopLabel(order)).toBe('HP EliteBook G11, Developer spec')
    expect(laptopLabel(laptopOrder(journey('priya', '2026-11-09')))).toBeUndefined() // spec set, model not chosen yet
  })

  it('lets the joiner change their laptop up to the deadline, two weeks before Day 1', () => {
    // Margaret starts 4 Jan, so changes close after 21 Dec.
    const kit = (today: string) => journey('margaret', today).steps.find((s) => s.id === 'choose-kit')
    expect(kit('2026-11-09')).toMatchObject({ state: 'done', changeUntil: '2026-12-21', canChange: true })
    expect(kit('2026-12-21')?.canChange).toBe(true)
    expect(kit('2026-12-22')).toMatchObject({ state: 'done', canChange: false })
  })

  it('moves the deadline when the start date moves', () => {
    const slip = event('margaret', '2026-11-10', 'start_date_changed', { to: '2027-01-18', reason: 'References' })
    const kit = journey('margaret', '2026-12-28', [...seedEvents, slip]).steps.find((s) => s.id === 'choose-kit')
    expect(kit).toMatchObject({ changeUntil: '2027-01-04', canChange: true })
  })

  it('sends a changed laptop back to the manager to approve again', () => {
    const change = completed('margaret', '2026-11-09', 'choose-kit', 'hp-elitebook-g11')
    const j = journey('margaret', '2026-11-09', [...seedEvents, change])
    expect(laptopLabel(laptopOrder(j))).toBe('HP EliteBook G11, Standard spec')
    expect(j.steps.find((s) => s.id === 'mgr-request-device')?.state).toBe('available')
  })

  it('clears the laptop choice and its approval when the manager changes the spec', () => {
    const change = completed('margaret', '2026-11-09', 'mgr-set-device-spec', 'developer')
    const j = journey('margaret', '2026-11-09', [...seedEvents, change])
    expect(j.steps.find((s) => s.id === 'choose-kit')).toMatchObject({ state: 'available', value: undefined })
    expect(j.steps.find((s) => s.id === 'mgr-request-device')?.state).toBe('locked')

    // Picking again in the new spec puts the order back with the manager.
    const repick = completed('margaret', '2026-11-10', 'choose-kit', 'surface-pro')
    const again = journey('margaret', '2026-11-10', [...seedEvents, change, repick])
    expect(laptopLabel(laptopOrder(again))).toBe('Surface Pro, Developer spec')
    expect(again.steps.find((s) => s.id === 'mgr-request-device')?.state).toBe('available')
  })

  it('suggests the developer spec for engineering and data roles only', () => {
    expect(suggestedLaptopSpec('technology')).toBe('developer')
    expect(suggestedLaptopSpec('data')).toBe('developer')
    expect(suggestedLaptopSpec('risk')).toBe('standard')
    expect(suggestedLaptopSpec('graduate')).toBe('standard')
  })
})
