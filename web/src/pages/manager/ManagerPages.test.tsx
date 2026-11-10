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

  it('lets the manager narrow the laptops on offer and recommend one', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/amara', { role: 'manager' })

    await user.click(screen.getByText('Set their laptop spec'))
    const sheet = await screen.findByRole('dialog', { name: 'Set their laptop spec' })
    const offered = within(sheet).getByRole('group', { name: 'Laptops they can choose' })
    expect(within(offered).getAllByRole('checkbox', { name: /./ })).toHaveLength(4)
    await user.click(within(offered).getByRole('checkbox', { name: /Surface Pro/ }))
    await user.click(within(offered).getByRole('checkbox', { name: /Surface Laptop/ }))

    const recommended = within(sheet).getByRole('radiogroup', { name: 'Recommended laptop' })
    expect(within(recommended).queryByRole('radio', { name: /Surface Pro/ })).not.toBeInTheDocument()
    await user.click(within(recommended).getByRole('radio', { name: /Apple MacBook Pro/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Confirm spec' }))

    expect(await screen.findByText(/set off 1 more thing for Amara/)).toBeInTheDocument()
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

  it('sends a new joiner’s welcome pack from the list, once the laptops they’re allowed are chosen', async () => {
    const user = userEvent.setup()
    renderApp('/manager', { role: 'manager', personaId: 'amara' })

    // Only Amara is still waiting for hers.
    const list = screen.getByRole('list', { name: 'Your joiners' })
    expect(within(list).getAllByRole('button', { name: 'Send welcome pack' })).toHaveLength(1)
    await user.click(within(list).getByRole('button', { name: 'Send welcome pack' }))

    const sheet = await screen.findByRole('dialog', { name: 'Send their welcome pack' })
    expect(within(sheet).getByText(/First choose which laptops Amara is allowed/)).toBeInTheDocument()
    const offered = within(sheet).getByRole('group', { name: 'Laptops they can choose' })
    await user.click(within(offered).getByRole('checkbox', { name: /Surface Pro/ }))
    await user.click(within(offered).getByRole('checkbox', { name: /Surface Laptop/ }))
    await user.click(within(within(sheet).getByRole('radiogroup', { name: 'Recommended laptop' })).getByRole('radio', { name: /Apple MacBook Pro/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Send welcome pack' }))

    // Sent, with the laptop options saved alongside it.
    expect(screen.queryByRole('button', { name: 'Send welcome pack' })).not.toBeInTheDocument()
    const sent = (stepId: string) => repository.listEvents('amara').find((e) => e.payload?.stepId === stepId)
    expect(sent('mgr-send-welcome-pack')).toBeDefined()
    expect(sent('mgr-set-device-spec')?.payload?.value).toBe('developer|hp-elitebook-g11,macbook-pro|macbook-pro')

    // Amara's pack has arrived, and tells her which laptops she can choose from.
    await user.click(await screen.findByRole('button', { name: /Manager view, Daniel/ }))
    await user.click(await screen.findByRole('button', { name: /Amara \(joiner\)/ }))
    await user.click(await screen.findByText('Your welcome pack has arrived'))
    const pack = await screen.findByRole('dialog', { name: 'Your welcome pack has arrived' })
    expect(within(pack).getByText(/Laptops you can choose from, picked by Daniel/)).toBeInTheDocument()
    expect(within(pack).getByText(/Apple MacBook Pro.*Daniel recommends this one/)).toBeInTheDocument()
    expect(within(pack).queryByText(/Surface Pro/)).not.toBeInTheDocument()
  })

  it('shows the laptops already chosen when the pack is sent from the joiner’s page', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/amara', { role: 'manager' })

    // The laptop options were set on their own first, so the pack is ready to go.
    await user.click(screen.getByText('Set their laptop spec'))
    await user.click(within(await screen.findByRole('dialog', { name: 'Set their laptop spec' })).getByRole('button', { name: 'Confirm spec' }))

    expect(await screen.findByText(/Start here: Amara’s welcome pack/)).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Send welcome pack' }))
    const sheet = await screen.findByRole('dialog', { name: 'Send their welcome pack' })
    expect(within(sheet).queryByText(/First choose which laptops/)).not.toBeInTheDocument()
    expect(within(within(sheet).getByRole('region', { name: 'Laptops in the pack' })).getAllByRole('listitem')).toHaveLength(4)
    await user.click(within(sheet).getByRole('button', { name: 'Send welcome pack' }))

    expect(await screen.findByText(/set off 1 more thing for Amara/)).toBeInTheDocument()
    expect(screen.queryByText(/Start here: Amara’s welcome pack/)).not.toBeInTheDocument()
  })

  it('adds the goals the manager sets to the joiner’s welcome pack', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/priya', { role: 'manager' })

    expect(screen.getByText(/Private to Priya/)).toBeInTheDocument()
    await user.click(screen.getByText('Set first 3-month goals'))
    const sheet = await screen.findByRole('dialog', { name: 'Set first 3-month goals' })
    const first = within(sheet).getByLabelText('Goal 1')
    await user.clear(first)
    await user.type(first, 'Ship the new refunds API')
    await user.click(within(sheet).getByRole('button', { name: /Add goals to their welcome pack/ }))

    // Over on the joiner's side, the welcome pack Daniel already sent now carries the goals.
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

    // Two quiet joiners share one card, which opens the one who has been quiet longest.
    await user.click(screen.getByText('Priya and Amara have gone quiet'))
    expect(screen.getByText(/may be at risk of not starting/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Send Priya a quick hello' }))
    expect(await screen.findByText(/You said hello to Priya/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send Priya a quick hello' })).toBeNull()
    expect(repository.listEvents('priya').some((e) => e.type === 'chat_message' && JSON.stringify(e.payload).includes('looking forward to having you'))).toBe(true)
  })
})

describe('Manager view: planning the first week', () => {
  it('lets the manager pick sessions, and shows them as done afterwards', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/priya', { role: 'manager' })

    await user.click(screen.getByText('Plan their first week'))
    const sheet = await screen.findByRole('dialog', { name: 'Plan their first week' })
    // The sessions that suit an engineer are ticked to begin with.
    expect(within(sheet).getByRole('checkbox', { name: /Architecture walkthrough/ })).toBeChecked()
    expect(within(sheet).getByRole('checkbox', { name: /Engineering guild lunch/ })).not.toBeChecked()

    await user.click(within(sheet).getByRole('checkbox', { name: /Engineering guild lunch/ }))
    await user.click(within(sheet).getByRole('button', { name: 'Add to Priya’s first week' }))

    expect(repository.listEvents('priya').some((e) => JSON.stringify(e.payload ?? {}).includes('mgr-plan-week-one') && JSON.stringify(e.payload ?? {}).includes('tech-guild'))).toBe(true)
  })
})
