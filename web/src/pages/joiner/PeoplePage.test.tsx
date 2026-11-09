import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('People tab', () => {
  it('introduces the manager and buddy, and keeps the team locked until 2 weeks before', () => {
    renderApp('/people') // Priya, 28 days to go

    expect(screen.getByText('Daniel Okafor')).toBeInTheDocument()
    expect(screen.getByText('Chloe Whitfield')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Say hello to Chloe/ })).toBeInTheDocument()

    const team = screen.getByRole('region', { name: 'Your team' })
    expect(within(team).getByText(/Unlocks 2 weeks before you start/)).toBeInTheDocument()
  })

  it('shows the team once it unlocks', () => {
    renderApp('/people', { personaId: 'rhys' }) // 14 days to go
    const team = screen.getByRole('list', { name: 'Your team' })
    expect(within(team).getAllByRole('listitem')).toHaveLength(3)
    expect(within(team).getByText('Bethan Rees')).toBeInTheDocument()
  })

  it('opens the chat with an "Ask me about" question ready to send', async () => {
    const user = userEvent.setup()
    renderApp('/people')

    await user.click(screen.getByRole('button', { name: 'Ask Daniel about Our architecture' }))

    expect(screen.getByText('Daniel Okafor')).toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: 'Your message' })
    expect(input).toHaveValue('Hi Daniel! I’d love to hear about our architecture.')
    expect(input).toHaveFocus()
    // Nothing is sent until the joiner presses send.
    const thread = screen.getByLabelText('Conversation with Daniel Okafor')
    expect(within(thread).queryByText(/our architecture/)).not.toBeInTheDocument()
  })

  it('explains the wait when no buddy has been assigned yet', () => {
    renderApp('/people', { personaId: 'sam' })
    expect(screen.getByText(/Your manager is matching you with a buddy/)).toBeInTheDocument()
    expect(screen.queryByText('Nadia Rahman')).not.toBeInTheDocument()
  })
})

describe('Buddy chat', () => {
  it('fills in an icebreaker, sends it, completes "say hello" and gets a reply', async () => {
    const user = userEvent.setup()
    renderApp('/people/chat/buddy-chloe')

    expect(screen.getByText(/I’m Chloe, your buddy/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fancy a virtual coffee before I start?' }))
    expect(screen.getByRole('textbox', { name: 'Your message' })).toHaveValue('Fancy a virtual coffee before I start?')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    expect(await screen.findByText(/nice one/)).toBeInTheDocument()
    expect(await screen.findByText(/Thursday at 11/, {}, { timeout: 3000 })).toBeInTheDocument()
    // Icebreakers disappear once the joiner has written something.
    expect(screen.queryByText('Not sure what to say?')).not.toBeInTheDocument()
  })

  it('only lets the joiner message their own manager and buddy', () => {
    renderApp('/people/chat/mgr-helen') // Helen is Margaret's manager, not Priya's
    expect(screen.getByRole('heading', { name: 'Your people' })).toBeInTheDocument()
  })
})
