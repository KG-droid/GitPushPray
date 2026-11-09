import { describe, expect, it } from 'vitest'
import { accessItems, accessProfiles } from '../data/access'
import { groupBySystem, holderCounts, itemsFor, joinAccess, parseAccess, teamAccess } from './access'
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
