import { describe, expect, it } from 'vitest'
import { askAboutDraft } from './people'

describe('askAboutDraft', () => {
  it('turns a topic into a question addressed by first name', () => {
    expect(askAboutDraft('Daniel Okafor', 'Our architecture')).toBe('Hi Daniel! I’d love to hear about our architecture.')
  })

  it('keeps the capital on proper nouns and acronyms', () => {
    expect(askAboutDraft('Leo Grant', 'Bristol nights out')).toBe('Hi Leo! I’d love to hear about Bristol nights out.')
    expect(askAboutDraft('Nadia Rahman', 'SQL tricks')).toBe('Hi Nadia! I’d love to hear about SQL tricks.')
  })
})
