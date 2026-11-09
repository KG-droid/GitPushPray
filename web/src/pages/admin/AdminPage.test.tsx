import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { repository } from '../../data/repository'
import { renderApp } from '../../test/renderApp'

describe('Joiner feedback', () => {
  it('prompts for the Day 30 check-in and stores it anonymously', async () => {
    const user = userEvent.setup()
    // Aisha: 29 days after her start, so Day 1, Week 1 and Day 30 are all open
    renderApp('/today', { personaId: 'aisha', today: '2027-01-20' })
    const before = repository.listFeedback().length
    await user.click(await screen.findByText('Looking back on your first month'))

    const form = await screen.findByRole('heading', { name: 'Looking back on your first month' })
    expect(form).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send feedback' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '9' }))
    await user.click(screen.getByRole('button', { name: 'Good' }))
    await user.type(screen.getByLabelText('What did we miss?'), 'A map of the building')
    await user.type(screen.getByLabelText('What could we do better?'), 'Tell us the shift pattern earlier')
    await user.click(screen.getByRole('button', { name: 'Send feedback' }))

    const added = repository.listFeedback().slice(before)
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ milestone: 'day-30', enps: 9, mood: 4, jobFamily: 'graduate' })
    expect(Object.keys(added[0])).not.toContain('personaId')
    // Day 1 and Week 1 are still open, so the next form is offered
    expect(await screen.findByRole('heading', { name: 'How was your first day?' })).toBeInTheDocument()
  })

  it('is open to everyone from Explore, but says when nothing is due yet', async () => {
    const user = userEvent.setup()
    renderApp('/explore', { personaId: 'priya', today: '2026-11-09' })
    await user.click(await screen.findByText('Your feedback'))
    expect(await screen.findByText(/Your Day 1 check-in opens on your first day/)).toBeInTheDocument()
  })
})

describe('Admin insights', () => {
  it('is for admins only', async () => {
    renderApp('/admin', { role: 'joiner' })
    expect(await screen.findByRole('heading', { name: /Hi Priya/ })).toBeInTheDocument()
    expect(screen.queryByText('Joiner insights')).not.toBeInTheDocument()
  })

  it('shows eNPS, assistant topics, themes and suggested changes, and can filter by role', async () => {
    const user = userEvent.setup()
    renderApp('/admin', { role: 'admin' })
    expect(await screen.findByRole('heading', { name: 'Joiner insights' })).toBeInTheDocument()
    expect(screen.getByText('Admin view')).toBeInTheDocument()

    const enps = screen.getByRole('region', { name: 'eNPS' })
    expect(within(enps).getByLabelText(/^eNPS -?\d+$/)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'What joiners ask the assistant' })).getAllByRole('listitem').length).toBeGreaterThan(3)
    expect(screen.getByRole('region', { name: 'What joiners tell us' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Risk and compliance' }))
    const suggestions = screen.getByRole('region', { name: 'Suggested changes' })
    expect(within(suggestions).getAllByText(/Background checks and references/).length).toBeGreaterThan(0)
    expect(within(suggestions).getByRole('button', { name: 'Write with Claude' })).toBeEnabled()
  })

  it('never shows names or question text', async () => {
    renderApp('/admin', { role: 'admin' })
    await screen.findByRole('heading', { name: 'Joiner insights' })
    expect(screen.getByText(/no names and no question text/)).toBeInTheDocument()
  })
})
