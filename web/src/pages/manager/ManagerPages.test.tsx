import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'
import { repository } from '../../data/repository'

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

  it('lets the manager set the laptop spec, suggesting developer for an engineer', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/amara', { role: 'manager' })

    await user.click(screen.getByText('Set their laptop spec'))
    const sheet = await screen.findByRole('dialog', { name: 'Set their laptop spec' })
    expect(within(sheet).getByRole('radio', { name: /Developer/ })).toHaveAttribute('aria-checked', 'true')
    await user.click(within(sheet).getByRole('radio', { name: /Standard/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Confirm spec' }))

    expect(await screen.findByText('Standard')).toBeInTheDocument()
  })

  it('lets the manager change the spec before the deadline, but not after', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/priya', { role: 'manager' })

    await user.click(screen.getByText('Set their laptop spec'))
    const sheet = await screen.findByRole('dialog', { name: 'Set their laptop spec' })
    await user.click(within(sheet).getByRole('button', { name: 'Change spec' }))
    expect(within(sheet).getByRole('radio', { name: /Developer/ })).toHaveAttribute('aria-checked', 'true')
    await user.click(within(sheet).getByRole('radio', { name: /Standard/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Save change' }))
    expect(await screen.findByText('Standard')).toBeInTheDocument()
  })

  it('closes spec changes once the laptop is being prepared', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/tom', { role: 'manager' }) // Tom starts 16 Nov, so changes closed after 2 Nov

    await user.click(screen.getByText('Set their laptop spec'))
    const sheet = await screen.findByRole('dialog', { name: 'Set their laptop spec' })
    expect(within(sheet).queryByRole('button', { name: 'Change spec' })).not.toBeInTheDocument()
    expect(within(sheet).getByText(/Changes closed after Mon 2 Nov/)).toBeInTheDocument()
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

describe('Manager access request', () => {
  it('shows team access, copies a teammate, and records the request', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/amara', { role: 'manager', today: '2026-12-20' })

    await user.click(screen.getByText('Request system access'))
    const sheet = await screen.findByRole('dialog', { name: 'Request system access' })
    expect(within(sheet).getByRole('table', { name: 'Team access matrix' })).toBeInTheDocument()
    expect(within(sheet).getByText(/Backstage: Service catalogue, editor/)).toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: 'Same as Hannah' }))
    expect(within(sheet).getByRole('button', { name: 'Request access (6)' })).toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: 'Request access (6)' }))

    await user.click(screen.getByText('Request system access'))
    expect(await screen.findByText('6 access items requested')).toBeInTheDocument()
  })
})

describe('Manager view: questions sent to the manager', () => {
  it('shows a joiner’s handover from the assistant at the top of the manager’s day', async () => {
    renderApp('/manager', { role: 'manager' })
    expect(screen.queryByText('Priya asked for you')).toBeNull()

    act(() => {
      repository.addEvent({
        personaId: 'priya',
        type: 'handover_sent',
        at: '2026-11-09T10:00:00Z',
        payload: { route: 'manager', summary: 'Priya would like to know what week one looks like.' },
      })
    })
    expect(await screen.findByText('Priya asked for you')).toBeInTheDocument()
    expect(screen.getByText(/what week one looks like/)).toBeInTheDocument()
  })
})

describe('Manager view: a joiner who has gone quiet', () => {
  it('nudges the manager, and one tap sends a hello that the joiner can read', async () => {
    const user = userEvent.setup()
    renderApp('/manager', { role: 'manager' })

    expect(screen.getByText('Priya has gone quiet')).toBeInTheDocument()
    await user.click(screen.getByText('Priya has gone quiet'))
    expect(screen.getByText(/may be at risk of not starting/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Send Priya a quick hello' }))
    expect(await screen.findByText(/You said hello to Priya/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send Priya a quick hello' })).toBeNull()
    expect(repository.listEvents('priya').some((e) => e.type === 'chat_message' && JSON.stringify(e.payload).includes('looking forward to having you'))).toBe(true)
  })
})
