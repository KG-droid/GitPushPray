import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Day 1 plan', () => {
  it('shows the meeting point, a desk next to the buddy and sourced travel info', () => {
    renderApp('/journey/day-one')

    expect(screen.getByRole('heading', { name: 'Your Day 1 plan' })).toBeInTheDocument()
    expect(screen.getByText('Main reception, Wellington Place')).toBeInTheDocument()
    expect(screen.getByText(/Floor 3, desk 3\.14, booked next to Chloe \(your buddy\)/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Day 1 agenda' })).toBeInTheDocument()
    expect(screen.getByText(/Bike storage/)).toBeInTheDocument()
  })

  it('needs no desk or travel for a home-based joiner', () => {
    renderApp('/journey/day-one', { personaId: 'sam' })
    expect(screen.getByText(/no desk is needed/)).toBeInTheDocument()
    expect(screen.getByText(/No travel needed on Day 1/)).toBeInTheDocument()
  })

  it('lets the joiner swap desk, plan the journey and see the way to the desk', async () => {
    const user = userEvent.setup()
    renderApp('/journey/day-one')

    await user.click(screen.getByRole('radio', { name: /quiet zone desk Q2/ }))
    await user.click(screen.getByRole('button', { name: 'Book this desk' }))
    expect(screen.getByText(/Floor 3, quiet zone desk Q2, booked by you/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Train' }))
    expect(within(screen.getByRole('region', { name: 'Your journey' })).getByText('Be at Leeds station by 08:45')).toBeInTheDocument()

    const way = screen.getByRole('list', { name: 'From the door to your desk' })
    expect(within(way).getByText(/Take the lift to floor 3/)).toBeInTheDocument()
    expect(within(way).getByText(/Your desk is quiet zone desk Q2/)).toBeInTheDocument()
  })

  it('offers no desk booking to branch colleagues, but still shows the way in', () => {
    renderApp('/journey/day-one', { personaId: 'jordan' })
    expect(screen.queryByRole('radiogroup', { name: 'Desk for Day 1' })).not.toBeInTheDocument()
    expect(screen.getByText(/Sign the visitor book/)).toBeInTheDocument()
  })
})
