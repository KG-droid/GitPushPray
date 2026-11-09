import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Explore tab', () => {
  it('is the middle tab and groups You, benefits and culture', async () => {
    const user = userEvent.setup()
    renderApp('/today')
    const tabs = screen.getAllByRole('button').filter((b) => b.classList.contains('MuiBottomNavigationAction-root'))
    expect(tabs.map((t) => t.textContent)).toEqual(['Today', 'Journey', 'Explore', 'People', 'Ask'])

    await user.click(screen.getByRole('button', { name: 'Explore' }))
    for (const name of ['You', 'Your benefits', 'Lloyds culture']) expect(screen.getByRole('region', { name })).toBeInTheDocument()
    expect(screen.getByText(/Daniel is setting your first goals/)).toBeInTheDocument()
  })

  it('moves the benefit choice here: the journey step signposts to Benefits', async () => {
    const user = userEvent.setup()
    renderApp('/journey')

    await user.click(screen.getByText('Pick your flexible benefit'))
    const sheet = await screen.findByRole('dialog', { name: 'Pick your flexible benefit' })
    await user.click(within(sheet).getByRole('button', { name: 'Choose in Benefits' }))

    expect(await screen.findByRole('heading', { name: 'Benefits and reward' })).toBeInTheDocument()
    const choices = screen.getByRole('region', { name: 'Your choices' })
    await user.click(within(choices).getByRole('radio', { name: /Cycle to work/ }))
    await user.click(within(choices).getByRole('button', { name: 'Confirm choice' }))
    expect(await within(choices).findByText(/You chose: Cycle to work/)).toBeInTheDocument()
    // The reward summary picks the choice up.
    expect(within(screen.getByRole('list', { name: 'Total reward breakdown' })).getByText('£350')).toBeInTheDocument()
  })

  it('lets a cleared joiner set up pay with their chosen pension', async () => {
    const user = userEvent.setup()
    renderApp('/explore/benefits', { personaId: 'rhys', today: '2026-11-20' })
    await user.click(screen.getByRole('button', { name: 'Set up pay with a 6% pension' }))
    expect(await screen.findByText('Pay and pension set up at 6%')).toBeInTheDocument()
  })

  it('keeps pay set-up locked until checks clear, but the calculator still works', () => {
    renderApp('/explore/benefits')
    expect(screen.getByText(/only ask for bank details once we know you’re joining/)).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('opens a values deep dive with behaviours and a colleague story', async () => {
    const user = userEvent.setup()
    renderApp('/explore/values')
    await user.click(screen.getByText('Be bold'))
    expect(await screen.findByText('What it looks like')).toBeInTheDocument()
    expect(screen.getByText(/We trialled it with 2,000 customers/)).toBeInTheDocument()
    await user.click(screen.getByText('Sustainable'))
    expect(await screen.findByRole('heading', { name: 'Sustainable' })).toBeInTheDocument()
  })

  it('shows the reporting line up to the Group CEO, with the team locked until 2 weeks before', () => {
    renderApp('/explore/organisation')
    const line = screen.getByRole('list', { name: 'Your reporting line' })
    const names = within(line).getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    expect(names).toEqual([
      'Alex Morgan, Group Chief Executive',
      'Ruth Kaplan, Chief Technology Officer',
      'Imogen Shaw, Director, Payments Engineering',
      'Daniel Okafor, Engineering Manager, Payments Platform',
      'Priya Shah, Software Engineer',
    ])
    expect(screen.getByText(/Unlocks 2 weeks before you start/)).toBeInTheDocument()
  })

  it('ladders the manager’s goals up to the purpose', async () => {
    const user = userEvent.setup()
    renderApp('/manager/joiner/priya', { role: 'manager' })
    await user.click(screen.getByText('Set first 3-month goals'))
    const sheet = await screen.findByRole('dialog', { name: 'Set first 3-month goals' })
    await user.click(within(sheet).getByRole('button', { name: /Set goals and send welcome pack/ }))

    // Same session, joiner side: the goals appear in the cascade.
    await user.click(await screen.findByRole('button', { name: /Manager view, Daniel/ }))
    await user.click(await screen.findByRole('button', { name: /Priya \(joiner\)/ }))
    await user.click(await screen.findByRole('button', { name: 'Explore' }))
    await user.click(screen.getByText('My goals'))
    const priorities = await screen.findByRole('list', { name: 'Group priorities' })
    expect(within(priorities).getAllByText('Your goal')).toHaveLength(3)
    expect(within(priorities).getByText('Ship your first change to production by the end of week 2')).toBeInTheDocument()
  })
})

describe('Accessibility and inclusion', () => {
  it('asks the adjustments question and opens the equipment step on Yes', async () => {
    const user = userEvent.setup()
    renderApp('/explore')
    await user.click(screen.getByText('Accessibility and inclusion'))
    expect(await screen.findByText(/Do you need any adjustments or additional support to help you be at your best when you start\?/)).toBeInTheDocument()
    expect(screen.getByText('Screen reader (JAWS or NVDA)')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Yes, I’d like to ask for support' }))
    expect(await screen.findByRole('dialog', { name: 'Choose your equipment and assistive technology' })).toBeInTheDocument()
  })

  it('is gentle when someone is not ready', async () => {
    const user = userEvent.setup()
    renderApp('/explore/accessibility')
    await user.click(screen.getByRole('button', { name: 'Not right now' }))
    expect(screen.getByText(/ask at any time/)).toBeInTheDocument()
  })
})
