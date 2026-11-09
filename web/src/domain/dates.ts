const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Whole calendar days from `today` to `target` (both ISO dates). Negative once the date has passed. */
export function daysUntil(target: string, today: string): number {
  const t = Date.UTC(...ymd(target))
  const n = Date.UTC(...ymd(today))
  return Math.round((t - n) / MS_PER_DAY)
}

/** Friendly countdown copy for the Day-1 ring. */
export function countdownLabel(days: number): string {
  if (days > 1) return `${days} days to go`
  if (days === 1) return 'Tomorrow'
  if (days === 0) return "It's Day 1!"
  return `Day ${-days + 1}`
}

/** ISO date `days` after `iso` (negative for before). */
export function addDays(iso: string, days: number): string {
  const d = new Date(Date.UTC(...ymd(iso)) + days * MS_PER_DAY)
  return d.toISOString().slice(0, 10)
}

/** Local calendar date as ISO (YYYY-MM-DD). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** e.g. "Mon 7 Dec" */
export function formatShortDate(iso: string): string {
  return new Date(Date.UTC(...ymd(iso))).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function ymd(iso: string): [number, number, number] {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return [y, m - 1, d]
}
