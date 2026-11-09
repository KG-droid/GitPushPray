import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Your system access', () => {
  it('explains that access comes later while checks are still running', () => {
    renderApp('/journey/access')
    expect(screen.getByRole('heading', { name: 'Your system access' })).toBeInTheDocument()
    expect(screen.getByText(/once your checks have cleared/)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Access progress' })).not.toBeInTheDocument()
  })

  it('shows progress without naming the systems once the manager has asked', () => {
    renderApp('/journey/access', { personaId: 'jordan' })
    expect(screen.getByText('2 of 6 ready for Day 1')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Access ready' })).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Access progress' })
    expect(within(list).getByText('Being approved or set up')).toBeInTheDocument()
    expect(within(list).getByText('Expected by Wed 11 Nov.')).toBeInTheDocument()
    expect(screen.queryByText(/sg-branch-colleagues|Entra/)).not.toBeInTheDocument()
  })
})
