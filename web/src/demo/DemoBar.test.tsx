import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('Demo bar', () => {
  it('is tucked away until asked for, and can be hidden again', async () => {
    const user = userEvent.setup()
    renderApp('/today')
    expect(screen.queryByRole('region', { name: 'Demo controls' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Show demo controls' }))
    expect(screen.getByRole('region', { name: 'Demo controls' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show demo controls' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Hide demo controls' }))
    expect(screen.queryByRole('region', { name: 'Demo controls' })).toBeNull()
  })
})
