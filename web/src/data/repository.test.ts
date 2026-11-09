import { describe, expect, it, vi } from 'vitest'
import { createMockRepository, memoryStorage } from './repository'

describe('mock repository', () => {
  it('persists added events and resets back to seed data', () => {
    const repo = createMockRepository(memoryStorage())
    const before = repo.listEvents('priya').length

    repo.addEvent({ personaId: 'priya', type: 'step_completed', at: '2026-11-09T12:00:00Z', payload: { stepId: 'choose-kit' } })
    expect(repo.listEvents('priya')).toHaveLength(before + 1)

    repo.reset()
    expect(repo.listEvents('priya')).toHaveLength(before)
  })

  it('resets one persona without touching the others', () => {
    const repo = createMockRepository(memoryStorage())
    const at = '2026-11-09T12:00:00Z'
    repo.addEvent({ personaId: 'priya', type: 'step_completed', at, payload: { stepId: 'choose-kit' } })
    repo.addEvent({ personaId: 'rhys', type: 'step_completed', at, payload: { stepId: 'say-hello' } })
    const rhysBefore = repo.listEvents('rhys').length

    repo.reset('priya')
    expect(repo.listEvents('priya').some((e) => e.at === at)).toBe(false)
    expect(repo.listEvents('rhys')).toHaveLength(rhysBefore)
  })

  it('notifies subscribers when events change', () => {
    const repo = createMockRepository(memoryStorage())
    const listener = vi.fn()
    const unsubscribe = repo.subscribe(listener)

    repo.addEvent({ personaId: 'priya', type: 'offer_accepted', at: '2026-11-09T12:00:00Z' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    repo.reset()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
