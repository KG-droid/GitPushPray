import type { GlossaryTerm } from '../data/glossary'

export type Segment = { text: string } | { text: string; term: GlossaryTerm }

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Splits text into plain pieces and the first mention of each known term, so those mentions can be made tappable.
 * Only whole words match, and a term is marked once per text so a paragraph isn't covered in underlines.
 */
export function splitGlossary(text: string, terms: GlossaryTerm[]): Segment[] {
  const byForm = new Map<string, GlossaryTerm>()
  for (const t of terms) for (const form of [t.term, ...(t.aliases ?? [])]) byForm.set(form.toLowerCase(), t)
  // Longest first, so "Basic DBS" wins over "DBS".
  const forms = [...byForm.keys()].sort((a, b) => b.length - a.length)
  if (!forms.length) return [{ text }]

  const pattern = new RegExp(`(?<![\\w&])(${forms.map(escape).join('|')})(?![\\w&])`, 'gi')
  const seen = new Set<string>()
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(pattern)) {
    const term = byForm.get(m[0].toLowerCase())
    if (!term || seen.has(term.id)) continue
    seen.add(term.id)
    if (m.index > last) out.push({ text: text.slice(last, m.index) })
    out.push({ text: m[0], term })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

/** Terms whose name or explanation contains the search text, in alphabetical order. */
export function searchGlossary(terms: GlossaryTerm[], query: string): GlossaryTerm[] {
  const q = query.trim().toLowerCase()
  return terms
    .filter((t) => !q || [t.term, ...(t.aliases ?? []), t.meaning].some((s) => s.toLowerCase().includes(q)))
    .sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }))
}
