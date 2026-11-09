import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Buddy view', () => {
  it('shows who the buddy is looking after, what they can see, and a nudge to step in', () => {
    renderApp('/buddy', { personaId: 'aisha', role: 'buddy' })

    expect(screen.getByRole('heading', { name: /Hi Leo/ })).toBeInTheDocument()
    expect(screen.getByText('Aisha Okoye')).toBeInTheDocument()
    expect(screen.getByText('No meetup for 13 days')).toBeInTheDocument()
    expect(screen.getByText(/Aisha is nearly at Day 30/)).toBeInTheDocument()
    expect(screen.getByText(/Their answers to check-ins, or what they ask the assistant/)).toBeInTheDocument()
  })

  it('logs a meetup and moves the tracker on', async () => {
    const user = userEvent.setup()
    renderApp('/buddy', { personaId: 'aisha', role: 'buddy' })

    expect(screen.getByLabelText('5 meetups')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '☕ Coffee' }))
    expect(await screen.findByText(/That’s 6 meetups with Aisha/)).toBeInTheDocument()
    expect(screen.getByLabelText('6 meetups')).toBeInTheDocument()
    const alerts = screen.queryByRole('list', { name: 'Step-in alerts' })
    expect(alerts ? within(alerts).queryByText(/No meetup for/) : null).toBeNull()
  })

  it('explains when no buddy has been matched yet', () => {
    renderApp('/buddy', { personaId: 'sam', role: 'buddy' })
    expect(screen.getByText(/hasn’t matched them with a buddy yet/)).toBeInTheDocument()
  })
})
