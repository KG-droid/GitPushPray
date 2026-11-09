import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'
import { repository } from '../../data/repository'

describe('Day 1 plan', () => {
  it('shows the meeting point, a desk next to the buddy and sourced travel info', () => {
    renderApp('/journey/day-one')

    expect(screen.getByRole('heading', { name: 'Your Day 1 plan' })).toBeInTheDocument()
    expect(screen.getByText('Main reception, Wellington Place')).toBeInTheDocument()
    expect(screen.getByText(/Floor 3, desk 3\.14, booked next to Chloe \(your buddy\)/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Day 1 agenda' })).toBeInTheDocument()
    expect(screen.getByText(/Bike storage/)).toBeInTheDocument()
  })

  it('offers a calendar file and Teams messages to the buddy and manager', () => {
    renderApp('/journey/day-one')
    expect(screen.getByRole('button', { name: 'Add Day 1 to my calendar' })).toBeInTheDocument()
    const buddy = screen.getByRole('link', { name: 'Message Chloe on Teams' })
    expect(buddy).toHaveAttribute('href', expect.stringContaining('users=chloe.whitfield%40lbg-demo.example'))
    expect(buddy).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Message Daniel on Teams' })).toBeInTheDocument()
  })

  it('needs no desk or travel for a home-based joiner', () => {
    renderApp('/journey/day-one', { personaId: 'sam' })
    expect(screen.getByText(/no desk is needed/)).toBeInTheDocument()
    expect(screen.getByText(/No travel needed on Day 1/)).toBeInTheDocument()
  })
})

describe('First week on the Day 1 plan', () => {
  it('says the manager is planning it until they have', () => {
    renderApp('/journey/day-one')
    expect(screen.getByText(/Daniel is planning the rest of your first week/)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'First week plan' })).toBeNull()
  })

  it('shows what the manager planned, with the day and time', () => {
    renderApp('/journey/day-one', { personaId: 'tom', today: '2026-11-09' })
    const plan = screen.getByRole('list', { name: 'First week plan' })
    expect(plan).toHaveTextContent('Architecture walkthrough')
    expect(plan).toHaveTextContent('Tue 17 Nov')
    expect(screen.getByText(/Chosen for you by Daniel/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Day 1 and my first week to my calendar' })).toBeInTheDocument()
  })

  it('updates live when the manager plans it on another phone', async () => {
    renderApp('/journey/day-one')
    expect(screen.queryByRole('list', { name: 'First week plan' })).toBeNull()
    act(() => {
      repository.addEvent({
        personaId: 'priya',
        type: 'step_completed',
        at: '2026-11-09T10:00:00Z',
        payload: { stepId: 'mgr-plan-week-one', by: 'manager', value: 'tech-arch,tech-pair' },
      })
    })
    const plan = await screen.findByRole('list', { name: 'First week plan' })
    expect(plan).toHaveTextContent('Pair on a small change')
  })
})
