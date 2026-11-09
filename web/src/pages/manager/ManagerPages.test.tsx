import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Manager view', () => {
  it('lists the manager’s joiners with their status and today’s nudges', () => {
    renderApp('/manager', { role: 'manager' })

    expect(screen.getByRole('heading', { name: /Hi Daniel/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Manager view, Daniel/ })).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Your joiners' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(within(list).getByText('Priya Shah')).toBeInTheDocument()
    expect(screen.getByText('Tom starts in 7 days')).toBeInTheDocument()
  })

  it('setting goals sends the joiner their welcome pack, with the goals in it', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/priya', { role: 'manager' })

    expect(screen.getByText(/Private to Priya/)).toBeInTheDocument()
    await user.click(screen.getByText('Set first 3-month goals'))
    const sheet = await screen.findByRole('dialog', { name: 'Set first 3-month goals' })
    const first = within(sheet).getByLabelText('Goal 1')
    await user.clear(first)
    await user.type(first, 'Ship the new refunds API')
    await user.click(within(sheet).getByRole('button', { name: /Set goals and send welcome pack/ }))

    expect(await screen.findByText(/set off 1 more thing for Priya/)).toBeInTheDocument()

    // Over on the joiner's side, the welcome pack is now unlocked and carries the goals.
    await user.click(await screen.findByRole('button', { name: /Manager view, Daniel/ }))
    await user.click(await screen.findByRole('button', { name: /Priya \(joiner\)/ }))
    await user.click(await screen.findByText('Your welcome pack has arrived'))
    const pack = await screen.findByRole('dialog', { name: 'Your welcome pack has arrived' })
    expect(within(pack).getByText('Ship the new refunds API')).toBeInTheDocument()
    expect(within(pack).getByText(/Your first 3 months, from Daniel/)).toBeInTheDocument()
  })
})
