import { accessItems, accessProfiles, SYSTEM_ORDER, teamKeyForFamily, teammateAccess } from '../data/access'
import type { AccessItem, AccessProfile, AccessSystem } from '../data/access'
import { teammates } from '../data/people'
import type { JobFamily, Person } from './types'

/** The access step stores its picks as one comma-separated string of item ids. */
export function parseAccess(value: string | undefined): string[] {
  return value ? value.split(',').filter(Boolean) : []
}

export function joinAccess(ids: string[]): string {
  return ids.join(',')
}

export function itemsFor(family: JobFamily): AccessItem[] {
  return accessItems[family]
}

export function profilesFor(family: JobFamily): AccessProfile[] {
  return accessProfiles[family]
}

export interface TeamMemberAccess {
  person: Person
  /** Only items in this joiner's catalogue, so unrelated entries never show */
  itemIds: string[]
}

export function teamAccess(family: JobFamily): TeamMemberAccess[] {
  const valid = new Set(accessItems[family].map((i) => i.id))
  return (teammates[teamKeyForFamily[family]] ?? []).map((person) => ({
    person,
    itemIds: (teammateAccess[person.id] ?? []).filter((id) => valid.has(id)),
  }))
}

/** How many teammates have each item, e.g. { 'gh-org': 3 } */
export function holderCounts(team: TeamMemberAccess[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const m of team) for (const id of m.itemIds) counts[id] = (counts[id] ?? 0) + 1
  return counts
}

export function groupBySystem(items: AccessItem[]): { system: AccessSystem; items: AccessItem[] }[] {
  return SYSTEM_ORDER.map((system) => ({ system, items: items.filter((i) => i.system === system) })).filter((g) => g.items.length)
}
