import { describe, expect, it } from 'vitest'
import { glossary } from '../data/glossary'
import { searchGlossary, splitGlossary } from './glossary'

const marked = (text: string) => splitGlossary(text, glossary).filter((s) => 'term' in s).map((s) => s.text)

describe('splitGlossary', () => {
  it('marks known terms and keeps the text around them intact', () => {
    const segments = splitGlossary('Contact HR Direct about your pension.', glossary)
    expect(segments.map((s) => s.text).join('')).toBe('Contact HR Direct about your pension.')
    expect(marked('Contact HR Direct about your pension.')).toEqual(['HR Direct', 'pension'])
  })

  it('prefers the longer match and matches whole words only', () => {
    expect(marked('You have a Basic DBS check.')).toEqual(['Basic DBS'])
    expect(marked('Pensions and a guildhall')).toEqual([])
  })

  it('handles terms with symbols, and any capitalisation', () => {
    expect(marked('Your role is covered by SM&CR, so it needs a regulatory reference.')).toEqual(['SM&CR', 'regulatory reference'])
    expect(marked('Because of the Senior Managers & Certification Regime')).toEqual(['Senior Managers & Certification Regime'])
    expect(marked('Ask hr direct')).toEqual(['hr direct'])
  })

  it('marks each term once per text', () => {
    expect(marked('Your buddy will meet you. Ask your buddy anything.')).toEqual(['buddy'])
  })

  it('returns plain text when nothing matches', () => {
    expect(splitGlossary('Nothing special here.', glossary)).toEqual([{ text: 'Nothing special here.' }])
  })
})

describe('searchGlossary', () => {
  it('finds a term by its name, an alias or its explanation, in alphabetical order', () => {
    expect(searchGlossary(glossary, 'dbs').map((t) => t.id)).toContain('dbs')
    expect(searchGlossary(glossary, 'right-to-work').map((t) => t.id)).toEqual(['rtw'])
    expect(searchGlossary(glossary, 'regulat').map((t) => t.id)).toEqual(expect.arrayContaining(['fca', 'pra']))
    const all = searchGlossary(glossary, '').map((t) => t.term.toLowerCase())
    expect(all).toEqual([...all].sort((a, b) => a.localeCompare(b, 'en')))
  })

  it('has an explanation for every term, and no duplicate ids', () => {
    expect(glossary.every((t) => t.meaning.length > 20)).toBe(true)
    expect(new Set(glossary.map((t) => t.id)).size).toBe(glossary.length)
  })
})
