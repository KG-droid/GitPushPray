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

    await user.click(screen.getByText('Do you have any accessibility requirements?'))
    const question = await screen.findByRole('dialog', { name: 'Do you have any accessibility requirements?' })
    await user.click(within(question).getByRole('radio', { name: /No, I don’t need any adjustments/ }))
    await user.click(within(question).getByRole('button', { name: 'Confirm choice' }))
    await user.click(within(question).getByRole('button', { name: 'Close' }))

    await user.click(screen.getByText('Choose your laptop'))
    const sheet = await screen.findByRole('dialog', { name: 'Choose your laptop' })
    await user.click(within(sheet).getByRole('radio', { name: /Surface Laptop/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Confirm choice' }))

    expect(await screen.findByText(/set off 1 more thing for your team/)).toBeInTheDocument()
    expect(screen.getByText('Surface Laptop')).toBeInTheDocument()
  })

  it('lets the joiner change their laptop before the deadline, sending it back for approval', async () => {
    const user = userEvent.setup()
    renderApp('/journey', { personaId: 'margaret' })

    await user.click(screen.getByText('Choose your laptop'))
    const sheet = await screen.findByRole('dialog', { name: 'Choose your laptop' })
    expect(within(sheet).getByText(/You can change this until Mon 21 Dec/)).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Change' }))
    expect(within(sheet).getByRole('button', { name: 'Save change' })).toBeDisabled() // nothing changed yet
    await user.click(within(sheet).getByRole('radio', { name: /HP EliteBook G11/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Save change' }))

    expect(await screen.findByText(/sent 1 thing back to your team to redo/)).toBeInTheDocument()
    expect(screen.getByText('HP EliteBook G11')).toBeInTheDocument()
  })

  it('closes laptop changes after the deadline, with a reason', async () => {
    const user = userEvent.setup()
    renderApp('/journey', { personaId: 'margaret', today: '2026-12-22' })

    await user.click(screen.getByText('Choose your laptop'))
    const sheet = await screen.findByRole('dialog', { name: 'Choose your laptop' })
    expect(within(sheet).queryByRole('button', { name: 'Change' })).not.toBeInTheDocument()
    expect(within(sheet).getByText(/Changes closed after Mon 21 Dec\. Your laptop is being prepared/)).toBeInTheDocument()
  })

  it('shows the manager’s progress alongside the joiner’s', async () => {
    const user = userEvent.setup()
    renderApp('/journey')

    await user.click(screen.getByRole('button', { name: /Your team gets ready/ }))
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

describe('Today and Journey stay short', () => {
  it('opens a choice in its own sheet instead of unfolding it on Today', async () => {
    const user = userEvent.setup()
    renderApp('/today')
    expect(screen.queryByRole('radio')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Choose now' }))
    const sheet = await screen.findByRole('dialog', { name: 'Do you have any accessibility requirements?' })
    expect(within(sheet).getByRole('radio', { name: /Yes, I’d like to talk it through/ })).toBeInTheDocument()
  })

  it('gives a locked step one short line, with the full reason when opened', async () => {
    const user = userEvent.setup()
    renderApp('/journey')
    // The headset and the phone step share the same short line.
    expect(screen.getAllByText('Unlocks after the accessibility question and your ID check.')).toHaveLength(2)
    expect(screen.queryByText(/your manager will agree your headset with you/)).toBeNull()
    await user.click(screen.getByText('Choose your headset'))
    const sheet = await screen.findByRole('dialog', { name: 'Choose your headset' })
    expect(within(sheet).getByText(/your manager will agree your headset with you/)).toBeInTheDocument()
  })
})
