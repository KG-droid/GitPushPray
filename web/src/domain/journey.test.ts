import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { buildJourney, evaluate } from './journey'
import { laptopOrder } from './laptop'
import type { JourneyEvent } from './types'

const persona = (id: string) => seedPersonas.find((p) => p.id === id)!

function journey(id: string, today: string, extra: Omit<JourneyEvent, 'id' | 'personaId'>[] = []) {
  const events = [
    ...seedEvents,
    ...extra.map((e, i) => ({ ...e, id: `t-${i}`, personaId: id })),
  ]
  return buildJourney({ persona: persona(id), events, today, steps: stepCatalogue, checks: checkCatalogue })
}

const step = (j: ReturnType<typeof journey>, id: string) => j.steps.find((s) => s.id === id)

describe('ID badge photo', () => {
  it('opens two weeks before the start date and becomes a next step', () => {
    // Priya starts 7 Dec, so the photo opens on 23 Nov.
    expect(step(journey('priya', '2026-11-22'), 'id-photo')?.state).toBe('locked')
    const open = journey('priya', '2026-11-23')
    expect(step(open, 'id-photo')?.state).toBe('available')
    // Only the badge photo is waiting once the earlier steps are done.
    const answered = journey('priya', '2026-11-23', [
      { type: 'step_completed', at: '2026-11-23T09:00:00Z', payload: { stepId: 'id-photo' } },
    ])
    expect(step(answered, 'id-photo')?.state).toBe('done')
    expect(answered.nextAction?.id).not.toBe('id-photo')
  })
})

describe('vetting checks', () => {
  it('progress with time, from not started to cleared', () => {
    const atOffer = journey('priya', '2026-10-19')
    expect(atOffer.checks.find((c) => c.id === 'references')?.status).toBe('not-started')

    const midway = journey('priya', '2026-11-09')
    expect(midway.checks.find((c) => c.id === 'identity')?.status).toBe('cleared')
    expect(midway.checks.find((c) => c.id === 'references')?.status).toBe('in-progress')
    expect(midway.vettingCleared).toBe(false)

    expect(journey('priya', '2026-11-20').vettingCleared).toBe(true)
  })

  it('only includes the regulatory reference for SM&CR roles', () => {
    expect(journey('margaret', '2026-11-09').checks.map((c) => c.id)).toContain('regulatory-reference')
    expect(journey('priya', '2026-11-09').checks.map((c) => c.id)).not.toContain('regulatory-reference')
  })

  it('a delayed check stays open until its new date, then clears', () => {
    const delay = {
      type: 'check_updated' as const,
      at: '2026-11-20T10:00:00Z',
      payload: { checkId: 'regulatory-reference', status: 'delayed', expectedClearOn: '2026-12-30', note: 'Previous firm has asked for more time.' },
    }
    const during = journey('margaret', '2026-12-01', [delay])
    expect(during.checks.find((c) => c.id === 'regulatory-reference')).toMatchObject({ status: 'delayed', expectedClearOn: '2026-12-30' })
    expect(during.notices[0]).toMatchObject({ kind: 'check-delayed', checkId: 'regulatory-reference' })

    const after = journey('margaret', '2026-12-30', [delay])
    expect(after.checks.find((c) => c.id === 'regulatory-reference')?.status).toBe('cleared')
  })
})

describe('personalisation ("not the same pack")', () => {
  it('gives the Leeds engineer a laptop choice and the Cardiff advisor a ready-made desk', () => {
    const priya = journey('priya', '2026-11-25')
    const rhys = journey('rhys', '2026-11-20')

    expect(step(priya, 'choose-kit')).toBeDefined()
    expect(step(priya, 'desk-ready')).toBeUndefined()
    expect(step(priya, 'site-guide-leeds')).toBeDefined()
    expect(step(priya, 'tools-engineering')).toBeDefined()

    expect(step(rhys, 'choose-kit')).toBeUndefined()
    expect(step(rhys, 'desk-ready')).toBeDefined()
    expect(step(rhys, 'shift-pattern')).toBeDefined()
    expect(step(rhys, 'site-guide-cardiff')).toBeDefined()
    expect(step(rhys, 'site-guide-leeds')).toBeUndefined()
  })

  it('gives remote joiners home delivery and no ID badge', () => {
    const sam = journey('sam', '2026-11-09')
    expect(step(sam, 'home-kit-address')).toBeDefined()
    expect(step(sam, 'mgr-request-badge')).toBeUndefined()
    expect(step(sam, 'tools-data')).toBeDefined()
  })
})

describe('unlocking ("earned, not withheld")', () => {
  it('keeps pay set-up locked until every check clears, with a reason', () => {
    const before = step(journey('priya', '2026-11-09'), 'pay-and-pension')
    expect(before?.state).toBe('locked')
    expect(before?.lockedHint).toMatch(/Unlocks on Day 1/)

    expect(step(journey('priya', '2026-12-08'), 'pay-and-pension')?.state).toBe('available')
  })

  it('unlocks the welcome pack when the manager sends it (chain reaction)', () => {
    expect(step(journey('amara', '2026-11-09'), 'welcome-pack')?.state).toBe('locked')

    const after = journey('amara', '2026-11-09', [
      { type: 'step_completed', at: '2026-11-09T11:00:00Z', payload: { stepId: 'mgr-send-welcome-pack', by: 'manager' } },
    ])
    expect(step(after, 'welcome-pack')?.state).toBe('available')
  })

  it('ignores events that are in the future relative to "today" (time travel)', () => {
    const j = journey('priya', '2026-11-01', [
      { type: 'step_completed', at: '2026-11-09T11:00:00Z', payload: { stepId: 'mgr-set-goals', by: 'manager' } },
    ])
    expect(step(j, 'mgr-set-goals')?.state).not.toBe('done')
  })

  it('keeps choices made live in the demo when the date jumps back', () => {
    const events: JourneyEvent[] = [
      ...seedEvents,
      {
        id: 'evt-1',
        personaId: 'priya',
        type: 'step_completed',
        at: '2026-11-09T11:00:00Z',
        payload: { stepId: 'mgr-set-device-spec', by: 'manager', value: 'developer|macbook-pro,hp-elitebook-g11|macbook-pro' },
      },
    ]
    const j = buildJourney({ persona: persona('priya'), events, today: '2026-11-01', steps: stepCatalogue, checks: checkCatalogue })
    expect(step(j, 'mgr-set-device-spec')?.state).toBe('done')
    expect(laptopOrder(j).recommended).toBe('macbook-pro')
  })

  it('lets a choice made after jumping back replace one made on a later date', () => {
    const spec = (id: string, at: string, value: string): JourneyEvent => ({
      id,
      personaId: 'priya',
      type: 'step_completed',
      at,
      payload: { stepId: 'mgr-set-device-spec', by: 'manager', value },
    })
    const events = [
      ...seedEvents,
      spec('evt-1000-a', '2026-11-09T11:00:00Z', 'standard'),
      // Made later in real time, but on an earlier demo date.
      spec('evt-2000-b', '2026-11-01T11:00:00Z', 'developer'),
    ]
    const j = buildJourney({ persona: persona('priya'), events, today: '2026-11-01', steps: stepCatalogue, checks: checkCatalogue })
    expect(laptopOrder(j).spec?.value).toBe('developer')
  })

  it('evaluates combined rules', () => {
    const ctx = { daysToStart: 5, isCleared: () => true, isDone: () => false, valueOf: () => undefined }
    expect(evaluate({ type: 'all', rules: [{ type: 'daysToStart', atMost: 7 }, { type: 'checksCleared', checks: 'all' }] }, ctx)).toBe(true)
    expect(evaluate({ type: 'any', rules: [{ type: 'stepDone', stepId: 'x' }, { type: 'daysSinceStart', atLeast: 0 }] }, ctx)).toBe(false)
  })
})

describe('when plans change', () => {
  const slip = {
    type: 'start_date_changed' as const,
    at: '2026-11-20T10:00:00Z',
    payload: { to: '2027-01-18', reason: 'Your regulatory reference is taking longer than expected.' },
  }

  it('moves the start date and every due date with it', () => {
    const before = journey('margaret', '2026-11-21')
    const after = journey('margaret', '2026-11-21', [slip])

    expect(before.startDate).toBe('2027-01-04')
    expect(after.startDate).toBe('2027-01-18')
    expect(after.daysToStart - before.daysToStart).toBe(14)
    expect(step(after, 'mgr-set-goals')?.dueDate).toBe('2027-01-11')
  })

  it('explains the change in a notice', () => {
    const after = journey('margaret', '2026-11-21', [slip])
    expect(after.notices[0]).toMatchObject({ kind: 'start-date-moved', from: '2027-01-04', to: '2027-01-18' })
  })
})

describe('next action and stages', () => {
  it('suggests one joiner task, not content', () => {
    const next = journey('priya', '2026-11-09').nextAction
    expect(next?.owner).toBe('joiner')
    expect(next?.kind).not.toBe('content')
    expect(next?.id).toBe('accessibility-needs')
  })

  it('marks early stages done and Day 30 current for a joiner on Day 29', () => {
    const aisha = journey('aisha', '2026-11-09')
    expect(aisha.daysToStart).toBe(-28)
    expect(aisha.stages.find((s) => s.id === 'offer')?.status).toBe('done')
    expect(aisha.stages.find((s) => s.id === 'week-one')?.status).toBe('done')
    expect(aisha.currentStage).toBe('day-30')
    expect(aisha.nextAction?.id).toBe('day-30-checkin')
  })
})

describe('new line manager journey', () => {
  it('only a new line manager gets the people-manager steps', () => {
    const pmSteps = stepCatalogue.filter((s) => s.audience?.peopleManager).map((s) => s.id)
    expect(pmSteps.length).toBeGreaterThan(0)
    const nia = journey('nia', '2026-11-09').steps.map((s) => s.id)
    const priya = journey('priya', '2026-11-09').steps.map((s) => s.id)
    for (const id of pmSteps) {
      expect(nia).toContain(id)
      expect(priya).not.toContain(id)
    }
  })

  it('unlocks team-facing steps as Day 1 approaches and approver access once vetted', () => {
    const early = journey('nia', '2026-11-09')
    expect(step(early, 'pm-intro-team')?.state).toBe('locked')
    expect(step(early, 'pm-approver-access')?.state).toBe('locked')

    const late = journey('nia', '2026-12-05')
    expect(step(late, 'pm-intro-team')?.state).toBe('available')
    expect(step(late, 'pm-approver-access')).toMatchObject({ state: 'available', owner: 'manager' })
    expect(step(late, 'pm-first-one-to-ones')?.state).toBe('locked')
    expect(step(journey('nia', '2026-12-14'), 'pm-first-one-to-ones')?.state).toBe('available')
  })
})

describe('next action once the joiner has started', () => {
  it('before Day 1 it is the earliest unfinished step', () => {
    expect(journey('priya', '2026-11-09').nextAction?.id).toBe('accessibility-needs')
  })

  it('on Day 1 it is the Day 1 plan, even with older steps still open', () => {
    expect(journey('priya', '2026-12-07').nextAction?.id).toBe('day-one-plan')
  })

  it('after Day 1 it is something from the first weeks, not a leftover from before starting', () => {
    const next = journey('priya', '2026-12-08').nextAction
    expect(next?.stage).toBe('week-one')
    expect(next?.id).not.toBe('day-one-plan')
  })

  it('falls back to a leftover from before Day 1 when nothing else is waiting', () => {
    const j = journey('aisha', '2026-10-13') // day 2 of a graduate whose earlier steps are all done
    expect(j.nextAction?.stage).not.toBe('offer')
  })
})
