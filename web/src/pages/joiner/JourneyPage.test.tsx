import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Journey tab', () => {
  it('shows where the joiner is and why things are locked', async () => {
    renderApp('/journey')

    expect(screen.getByText(/Stage 2 of 6/)).toBeInTheDocument()
    const stages = screen.getByRole('list', { name: 'Journey stages' })
    expect(within(stages).getByText('You are here')).toBeInTheDocument()
    expect(screen.getByText('Set up your pay and pension')).toBeInTheDocument()
    expect(screen.getByText(/only ask for bank details once we know you’re joining/)).toBeInTheDocument()
  })

  it('lets the joiner make a choice from the step sheet and tells them what it set off', async () => {
    const user = userEvent.setup()
    renderApp('/journey')

    await user.click(screen.getByText('Choose your laptop'))
    const sheet = await screen.findByRole('dialog', { name: 'Choose your laptop' })
    await user.click(within(sheet).getByRole('radio', { name: /Surface Laptop/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Confirm choice' }))

    expect(await screen.findByText(/set off 1 more thing for your team/)).toBeInTheDocument()
    expect(screen.getByText('Surface Laptop')).toBeInTheDocument()
  })

  it('shows the manager’s progress alongside the joiner’s', async () => {
    const user = userEvent.setup()
    renderApp('/journey')

    await user.click(screen.getByRole('button', { name: /Manager ready/ }))
    expect(await screen.findByText('Daniel: assign a buddy')).toBeInTheDocument()
    expect(screen.getByText('Daniel: set first 3-month goals')).toBeInTheDocument()
  })
})

describe('Checks tracker', () => {
  it('shows each check’s status honestly without results', () => {
    renderApp('/journey/checks')

    expect(screen.getByText('4 of 5 cleared')).toBeInTheDocument()
    const refs = screen.getByText('Employment references').closest('li')!
    expect(within(refs as HTMLElement).getByText('In progress')).toBeInTheDocument()
    expect(within(refs as HTMLElement).getByText(/You can help:/)).toBeInTheDocument()
    expect(screen.getByText(/never what it found/)).toBeInTheDocument()
  })

  it('includes the regulatory reference for an SM&CR hire', () => {
    renderApp('/journey/checks', { personaId: 'margaret' })
    expect(screen.getByText('Regulatory reference')).toBeInTheDocument()
  })
})
