import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { buildJourney } from './journey'
import { laptopLabel, laptopOrder, suggestedLaptopSpec } from './laptop'

function journey(id: string, today: string, events = seedEvents) {
  const persona = seedPersonas.find((p) => p.id === id)!
  return buildJourney({ persona, events, today, steps: stepCatalogue, checks: checkCatalogue })
}

describe('laptop spec and model', () => {
  it('offers only the bank’s own devices', () => {
    const kit = journey('priya', '2026-11-09').steps.find((s) => s.id === 'choose-kit')
    expect(kit?.options?.map((o) => o.label)).toEqual(['Surface Pro', 'Surface Laptop', 'HP EliteBook G11'])
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

  it('suggests the developer spec for engineering and data roles only', () => {
    expect(suggestedLaptopSpec('technology')).toBe('developer')
    expect(suggestedLaptopSpec('data')).toBe('developer')
    expect(suggestedLaptopSpec('risk')).toBe('standard')
    expect(suggestedLaptopSpec('graduate')).toBe('standard')
  })
})
