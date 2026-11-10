/** A calendar entry in the joiner's local time. `start` and `end` are "YYYY-MM-DDTHH:MM". */
export interface CalendarEntry {
  start: string
  end: string
  title: string
  description?: string
  location?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-12-07" + "09:30" shifted by a number of minutes, as "YYYY-MM-DDTHH:MM". */
export function atTime(date: string, time: string, plusMinutes = 0): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + plusMinutes
  return `${date}T${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

/** Each agenda item runs until the next one starts; the last one gets half an hour. */
export function dayOneEntries(
  date: string,
  agenda: { time: string; title: string; detail: string }[],
  location: string,
): CalendarEntry[] {
  return agenda.map((item, i) => ({
    start: atTime(date, item.time),
    end: i < agenda.length - 1 ? atTime(date, agenda[i + 1].time) : atTime(date, item.time, 30),
    title: item.title,
    description: item.detail,
    location,
  }))
}

const escapeText = (s: string) =>
  s
    .replace(/\\/g, '\\\\')
    .replace(/[;,]/g, (c) => '\\' + c)
    .replace(/\r?\n/g, '\\n')

/** Lines longer than 75 bytes are folded onto continuation lines that start with a space (RFC 5545). */
function fold(line: string): string[] {
  const out: string[] = []
  let current = ''
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74
    if (new TextEncoder().encode(current + ch).length > limit) {
      out.push(current)
      current = ch
    } else {
      current += ch
    }
  }
  out.push(current)
  return out.map((l, i) => (i === 0 ? l : ` ${l}`))
}

const local = (iso: string) => iso.replace(/[-:]/g, '') + '00'

/** An .ics file that Outlook, Google and Apple Calendar all open. Times are the joiner's local time. */
export function toIcs(entries: CalendarEntry[], { name, now = new Date() }: { name: string; now?: Date }): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LBG Joiner Companion//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${escapeText(name)}`]
  entries.forEach((e, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${stamp}-${i}@joiner-companion.demo`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${local(e.start)}`,
      `DTEND:${local(e.end)}`,
      `SUMMARY:${escapeText(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
      ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
      'END:VEVENT',
    )
  })
  lines.push('END:VCALENDAR')
  return lines.flatMap(fold).join('\r\n') + '\r\n'
}

/** Saves text as a file in the browser. */
export function downloadFile(filename: string, text: string, type = 'text/calendar;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
