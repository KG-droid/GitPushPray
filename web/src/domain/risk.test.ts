import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { buildJourney } from './journey'
import { helloMessage, quietSignal } from './risk'
import type { JourneyEvent } from './types'

function signal(id: string, today: string, extra: Omit<JourneyEvent, 'id' | 'personaId'>[] = []) {
  const persona = seedPersonas.find((p) => p.id === id)!
  const events = [...seedEvents, ...extra.map((e, i) => ({ ...e, id: `x${i}`, personaId: id }))]
  return quietSignal(buildJourney({ persona, events, today, steps: stepCatalogue, checks: checkCatalogue }), events)
}

describe('quietSignal', () => {
  it('flags a joiner who has done nothing for two weeks as at risk', () => {
    // Priya last did something on 24 Oct.
    expect(signal('priya', '2026-11-09')).toMatchObject({ status: 'quiet', level: 'at-risk', quietDays: 16 })
  })

  it('only watches a joiner who has been quiet for a week', () => {
    expect(signal('amara', '2026-11-09')).toMatchObject({ status: 'quiet', level: 'watch', quietDays: 7 })
  })

  it('leaves alone anyone active in the last week', () => {
    expect(signal('rhys', '2026-11-09')).toBeUndefined()
    expect(signal('jordan', '2026-11-09')).toBeUndefined()
  })

  it('counts things the joiner did, not things their manager did for them', () => {
    // Daniel completed steps for Priya on 2 Nov, but she has done nothing since 24 Oct.
    expect(signal('priya', '2026-11-09')).toMatchObject({ quietDays: 16 })
    const active = signal('priya', '2026-11-09', [
      { type: 'step_completed', at: '2026-11-07T10:00:00Z', payload: { stepId: 'learning-picks', by: 'joiner' } },
    ])
    expect(active).toBeUndefined()
  })

  it('adds a moved start date to the reasons and raises a one-week silence to at risk', () => {
    const s = signal('amara', '2026-11-09', [{ type: 'start_date_changed', at: '2026-11-08T10:00:00Z', payload: { to: '2027-01-25', reason: 'x' } }])
    expect(s).toMatchObject({ status: 'quiet', level: 'at-risk' })
    expect(s?.status === 'quiet' && s.reasons.some((r) => /start date has moved/.test(r))).toBe(true)
  })

  it('stops nudging for a few days after the manager says hello', () => {
    const hello = { type: 'chat_message' as const, at: '2026-11-09T10:00:00Z', payload: { withId: 'mgr-daniel', from: 'them', text: 'Hi' } }
    expect(signal('priya', '2026-11-09', [hello])).toMatchObject({ status: 'contacted' })
    expect(signal('priya', '2026-11-20', [hello])).toMatchObject({ status: 'quiet' })
  })

  it('says nothing once the joiner has started', () => {
    expect(signal('aisha', '2026-11-10')).toBeUndefined()
  })
})

describe('helloMessage', () => {
  it('is warm and asks for nothing', () => {
    expect(helloMessage('Priya', 'Daniel', 'Mon 7 Dec')).toMatch(/Nothing you need to do/)
  })
})
