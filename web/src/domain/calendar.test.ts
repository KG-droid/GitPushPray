import { describe, expect, it } from 'vitest'
import { atTime, dayOneEntries, toIcs } from './calendar'
import { teamsChatLink, teamsEmail } from './teams'

const agenda = [
  { time: '09:00', title: 'Chloe meets you', detail: 'Meet at: Main reception, Wellington Place. Bring photo ID; it, matters.' },
  { time: '16:30', title: 'End-of-day check-in', detail: 'Chloe asks how it went.' },
]

describe('Day 1 calendar', () => {
  it('runs each item until the next starts, and the last for half an hour', () => {
    const entries = dayOneEntries('2026-12-07', agenda, 'Leeds')
    expect(entries[0]).toMatchObject({ start: '2026-12-07T09:00', end: '2026-12-07T16:30' })
    expect(entries[1]).toMatchObject({ start: '2026-12-07T16:30', end: '2026-12-07T17:00' })
  })

  it('moves times across the hour', () => {
    expect(atTime('2026-12-07', '09:45', 30)).toBe('2026-12-07T10:15')
  })

  it('writes a valid .ics with escaped text and CRLF line endings', () => {
    const ics = toIcs(dayOneEntries('2026-12-07', agenda, 'Leeds, Wellington Place'), { name: 'Day 1', now: new Date('2026-11-09T12:00:00Z') })
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(ics).toContain('DTSTART:20261207T090000')
    expect(ics).toContain('DTEND:20261207T163000')
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded).toContain('LOCATION:Leeds\\, Wellington Place')
    expect(unfolded).toContain('it\\, matters')
    expect(ics).toContain('DTSTAMP:20261109T120000Z')
  })

  it('folds long lines to 75 bytes', () => {
    const ics = toIcs([{ start: '2026-12-07T09:00', end: '2026-12-07T10:00', title: 'x', description: 'word '.repeat(60) }], { name: 'Day 1' })
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    // Unfolding restores the text.
    expect(ics.replace(/\r\n /g, '')).toContain('DESCRIPTION:' + 'word '.repeat(60))
  })
})

describe('Teams links', () => {
  it('opens a chat with a message ready to send', () => {
    const url = new URL(teamsChatLink('Chloe Whitfield', 'Hi Chloe, looking forward to Monday!'))
    expect(url.origin + url.pathname).toBe('https://teams.microsoft.com/l/chat/0/0')
    expect(url.searchParams.get('users')).toBe('chloe.whitfield@lbg-demo.example')
    expect(url.searchParams.get('message')).toBe('Hi Chloe, looking forward to Monday!')
  })

  it('makes a plain address from a name', () => {
    expect(teamsEmail('Ffion O’Davies')).toBe('ffion.odavies@lbg-demo.example')
  })
})
