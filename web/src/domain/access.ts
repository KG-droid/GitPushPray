import { accessItems, accessProfiles, accessRoutes, SYSTEM_ORDER, teamKeyForFamily, teammateAccess, TRAINING_DONE_DAY, trainingGates } from '../data/access'
import type { AccessItem, AccessProfile, AccessRoute, AccessSystem } from '../data/access'
import { addDays, daysUntil } from './dates'
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

/** What was asked for. Older requests with no stored picks fall back to the first role profile. */
export function requestedItems(family: JobFamily, value: string | undefined): AccessItem[] {
  const ids = parseAccess(value)
  const picked = ids.length ? ids : (accessProfiles[family][0]?.itemIds ?? [])
  return accessItems[family].filter((i) => picked.includes(i.id))
}

export type AccessStatus = 'with-approver' | 'setting-up' | 'after-training' | 'ready'

export interface AccessProgress {
  item: AccessItem
  route: AccessRoute
  status: AccessStatus
  /** ISO date it is expected to work (or did) */
  readyOn: string
  /** Course to finish first, for access that training switches on */
  training?: string
  /** Still not set up, and not expected until after Day 1 */
  lateForDayOne: boolean
}

/**
 * Where each requested item has got to with its own owner. In this demo, progress is simulated from
 * each route's usual lead time; in real use each status would come from the owning system.
 */
export function accessProgress(items: AccessItem[], requestedOn: string, today: string, startDate: string): AccessProgress[] {
  const elapsed = daysUntil(today, requestedOn)
  return items.map((item) => {
    const route = accessRoutes[item.system]
    const training = trainingGates[item.id]
    const setUpOn = addDays(requestedOn, route.readyDays)
    const trainedOn = addDays(startDate, TRAINING_DONE_DAY)
    const readyOn = training && trainedOn > setUpOn ? trainedOn : setUpOn
    const status: AccessStatus =
      elapsed < route.approveDays ? 'with-approver' : elapsed < route.readyDays ? 'setting-up' : today < readyOn ? 'after-training' : 'ready'
    return { item, route, status, readyOn, training, lateForDayOne: (status === 'with-approver' || status === 'setting-up') && setUpOn > startDate }
  })
}

export interface AccessSummary {
  total: number
  ready: number
  /** Still with an owner to approve or set up */
  inProgress: number
  afterTraining: number
  late: AccessProgress[]
}

export function summariseAccess(progress: AccessProgress[]): AccessSummary {
  const count = (s: AccessStatus) => progress.filter((p) => p.status === s).length
  return {
    total: progress.length,
    ready: count('ready'),
    inProgress: count('with-approver') + count('setting-up'),
    afterTraining: count('after-training'),
    late: progress.filter((p) => p.lateForDayOne),
  }
}

export function progressBySystem(progress: AccessProgress[]): { system: AccessSystem; route: AccessRoute; items: AccessProgress[] }[] {
  return SYSTEM_ORDER.map((system) => ({ system, route: accessRoutes[system], items: progress.filter((p) => p.item.system === system) })).filter((g) => g.items.length)
}
