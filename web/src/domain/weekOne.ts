import { weekOneItems, type WeekOneItem } from '../data/weekOne'
import { addDays } from './dates'
import type { JourneyView } from './journey'
import type { JobFamily } from './types'

export const WEEK_ONE_STEP = 'mgr-plan-week-one'

export interface PlannedItem extends WeekOneItem {
  /** ISO date of the working day */
  date: string
}

export const recommendedIds = (family: JobFamily): string[] => weekOneItems[family].filter((i) => i.recommended).map((i) => i.id)

/** The plan step stores the chosen sessions as one comma-separated string of ids. */
export const parsePlan = (value: string | undefined): string[] => (value ? value.split(',').filter(Boolean) : [])
export const joinPlan = (ids: string[]): string => ids.join(',')

/** The nth working day (1 is the start date itself), skipping weekends. */
export function workingDay(start: string, n: number): string {
  let date = start
  for (let left = n - 1; left > 0; ) {
    date = addDays(date, 1)
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
    if (dow !== 0 && dow !== 6) left--
  }
  return date
}

/**
 * What the manager has planned for the joiner's first week, in date order. Undefined until the manager has done it.
 * A plan marked done with no choices recorded (for example in the demo's seed data) means the recommended sessions.
 */
export function plannedWeekOne(journey: JourneyView): PlannedItem[] | undefined {
  const step = journey.steps.find((s) => s.id === WEEK_ONE_STEP)
  if (!step || step.state !== 'done') return undefined
  const family = journey.persona.jobFamily
  const ids = step.value === undefined ? recommendedIds(family) : parsePlan(step.value)
  return weekOneItems[family]
    .filter((i) => ids.includes(i.id))
    .map((i) => ({ ...i, date: workingDay(journey.startDate, i.day) }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
}
