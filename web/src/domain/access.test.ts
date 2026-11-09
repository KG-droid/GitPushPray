import { describe, expect, it } from 'vitest'
import { accessItems, accessProfiles } from '../data/access'
import { accessProgress, groupBySystem, holderCounts, itemsFor, joinAccess, parseAccess, requestedItems, summariseAccess, teamAccess } from './access'
import type { JobFamily } from './types'

const families = Object.keys(accessItems) as JobFamily[]

describe('access data', () => {
  it('only references items that exist, in every profile and for every teammate', () => {
    for (const family of families) {
      const ids = new Set(itemsFor(family).map((i) => i.id))
      for (const p of accessProfiles[family]) for (const id of p.itemIds) expect(ids.has(id), `${family}/${p.id}/${id}`).toBe(true)
      expect(teamAccess(family).length).toBeGreaterThan(0)
    }
  })

  it('round-trips picks and counts who has what', () => {
    expect(parseAccess(joinAccess(['a', 'b']))).toEqual(['a', 'b'])
    expect(parseAccess(undefined)).toEqual([])
    const counts = holderCounts(teamAccess('technology'))
    expect(counts['gh-org']).toBe(3)
    expect(counts['jira-pay']).toBe(4)
  })

  it('covers the tech systems for engineers', () => {
    const systems = groupBySystem(itemsFor('technology')).map((g) => g.system)
    expect(systems).toEqual(['GitHub', 'Backstage', 'Jira', 'Confluence', 'Entra groups', 'Teams groups', 'Other access'])
  })
})

describe('access progress', () => {
  const items = requestedItems('retail', undefined)
  const at = (today: string) => accessProgress(items, '2026-11-06', today, '2026-11-16')
  const status = (today: string, id: string) => at(today).find((p) => p.item.id === id)?.status

  it('falls back to the role profile when a request stored no picks', () => {
    expect(items.map((i) => i.id)).toEqual(['ent-branch', 'tm-branch', 'sp-branch', 'counter', 'customer-hub', 'rota'])
    expect(requestedItems('technology', 'gh-org,ado').map((i) => i.id)).toEqual(['gh-org', 'ado'])
  })

  it('moves each system at its own owner’s pace', () => {
    expect(status('2026-11-06', 'ent-branch')).toBe('ready')
    expect(status('2026-11-06', 'tm-branch')).toBe('with-approver')
    expect(status('2026-11-07', 'tm-branch')).toBe('ready')
    expect(status('2026-11-07', 'rota')).toBe('with-approver')
    expect(status('2026-11-09', 'rota')).toBe('setting-up')
    expect(status('2026-11-11', 'rota')).toBe('ready')
  })

  it('holds training-gated access until the course is done in week one', () => {
    expect(status('2026-11-11', 'counter')).toBe('after-training')
    expect(status('2026-11-20', 'counter')).toBe('ready')
    expect(summariseAccess(at('2026-11-11'))).toMatchObject({ total: 6, ready: 4, inProgress: 0, afterTraining: 2, late: [] })
  })

  it('flags items that will not be set up by Day 1', () => {
    const late = summariseAccess(accessProgress(items, '2026-11-13', '2026-11-14', '2026-11-16')).late
    expect(late.map((p) => p.item.id)).toEqual(['sp-branch', 'counter', 'customer-hub', 'rota'])
  })
})
