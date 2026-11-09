import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Your system access', () => {
  it('explains that access comes later while checks are still running', () => {
    renderApp('/journey/access')
    expect(screen.getByRole('heading', { name: 'Your system access' })).toBeInTheDocument()
    expect(screen.getByText(/once your checks have cleared/)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Access by system' })).not.toBeInTheDocument()
  })

  it('tracks each system with its own owner once the manager has asked', () => {
    renderApp('/journey/access', { personaId: 'jordan' })
    expect(screen.getByText('2 of 6 ready for Day 1')).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Access by system' })
    expect(within(list).getByText(/Automatic · Identity team/)).toBeInTheDocument()
    expect(within(list).getByText(/Approved by · Application owner/)).toBeInTheDocument()
    expect(within(list).getAllByText('Being set up')).toHaveLength(4)
    expect(within(list).getByText(/Expected .*, after cash-handling training/)).toBeInTheDocument()
  })
})
