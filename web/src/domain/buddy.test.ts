import { describe, expect, it } from 'vitest'
import { checkCatalogue, stepCatalogue } from '../data/catalogue'
import { seedEvents, seedPersonas } from '../data/seed'
import { buddyView, meetupLevel } from './buddy'
import { buildJourney } from './journey'
import type { JourneyEvent } from './types'

function view(id: string, today: string, extra: Omit<JourneyEvent, 'id' | 'personaId'>[] = []) {
  const persona = seedPersonas.find((p) => p.id === id)!
  const events = [...seedEvents, ...extra.map((e, i) => ({ ...e, id: `t${i}`, personaId: id }))]
  return buddyView(buildJourney({ persona, events, today, steps: stepCatalogue, checks: checkCatalogue }), events)
}

const kinds = (v: ReturnType<typeof view>) => v.alerts.map((a) => a.kind)

describe('meetupLevel', () => {
  it('follows the Microsoft research bands', () => {
    expect(meetupLevel(0).label).toBe('Not met yet')
    expect(meetupLevel(1).label).toBe('Good start')
    expect(meetupLevel(3).label).toBe('Building a habit')
    expect(meetupLevel(6).label).toBe('Making a real difference')
    expect(meetupLevel(9)).toEqual({ label: 'Brilliant buddy' })
  })
})

describe('buddy alerts', () => {
  it('nudges the buddy to say hello when the joiner is close to starting and hasn’t', () => {
    expect(kinds(view('priya', '2026-11-09'))).not.toContain('no-hello') // 28 days to go: too early to nudge
    expect(kinds(view('rhys', '2026-11-09'))).toContain('no-hello') // 14 days to go, no hello yet
    expect(kinds(view('priya', '2026-11-25'))).toContain('no-hello') // 12 days to go, no hello yet
  })

  it('suggests a check-in on Day 3 and at the end of week one', () => {
    expect(kinds(view('priya', '2026-12-09'))).toContain('day-3')
    expect(kinds(view('priya', '2026-12-11'))).toContain('week-one-end')
  })

  it('flags a quiet spell after Day 1 without exposing anything private', () => {
    const v = view('aisha', '2026-11-09') // last meetup 27 Oct
    expect(v.meetups).toHaveLength(5)
    expect(v.alerts).toContainEqual({ kind: 'quiet', days: 13 })
    expect(JSON.stringify(v.alerts)).not.toMatch(/knowWhoToAsk|confident/)
  })

  it('shows questions the joiner chose to send to their buddy, first', () => {
    const v = view('priya', '2026-11-25', [
      { type: 'handover_sent', at: '2026-11-25T10:00:00Z', payload: { route: 'buddy', summary: 'Priya is nervous about her first stand-up.' } },
      { type: 'handover_sent', at: '2026-11-25T11:00:00Z', payload: { route: 'hr', summary: 'Pay question' } },
    ])
    expect(v.alerts[0]).toMatchObject({ kind: 'asked-for-you', summary: 'Priya is nervous about her first stand-up.' })
    expect(JSON.stringify(v.alerts)).not.toContain('Pay question')
  })

  it('tells the buddy when the start date moves', () => {
    const v = view('margaret', '2026-11-21', [
      { type: 'start_date_changed', at: '2026-11-20T10:00:00Z', payload: { to: '2027-01-18', reason: 'Reference' } },
    ])
    expect(v.alerts).toContainEqual({ kind: 'date-moved', to: '2027-01-18' })
  })

  it('flags a downward pulse trend as a nudge, not the answers', () => {
    const v = view('aisha', '2026-11-09', [
      { type: 'pulse_submitted', at: '2026-11-09T09:00:00Z', payload: { knowWhoToAsk: 2, confident: 1 } },
    ])
    expect(kinds(v)).toContain('pulse-down')
  })

  it('starts the graduation hand-over from Day 28', () => {
    expect(view('aisha', '2026-11-07').graduating).toBe(false) // Day 27
    expect(view('aisha', '2026-11-09').graduating).toBe(true) // Day 29
  })
})
