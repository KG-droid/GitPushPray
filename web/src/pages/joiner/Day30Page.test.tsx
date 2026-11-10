import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Day 30', () => {
  it('asks the two questions, then celebrates, and the answers reach the trend', async () => {
    const user = userEvent.setup()
    renderApp('/today', { personaId: 'aisha', today: '2026-11-10' })

    const sendBtn = screen.getByRole('button', { name: 'Send' })
    expect(sendBtn).toBeDisabled()
    await user.click(within(screen.getByRole('group', { name: /I know who to ask/ })).getByRole('button', { name: '5' }))
    expect(sendBtn).toBeDisabled()
    await user.click(within(screen.getByRole('group', { name: /I feel confident/ })).getByRole('button', { name: '5' }))
    await user.click(sendBtn)

    expect(await screen.findByRole('heading', { name: 'You made it to Day 30' })).toBeInTheDocument()
    // Aisha's confidence went 3 -> 5 across her four check-ins.
    expect(screen.getByText(/gone from 3 to 5/)).toBeInTheDocument()
  })
})
