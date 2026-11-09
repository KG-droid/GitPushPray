import { screen } from '@testing-library/react'
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
})
