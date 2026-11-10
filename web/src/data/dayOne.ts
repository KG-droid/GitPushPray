import type { Persona, SiteId } from '../domain/types'

/**
 * Day 1 plan content. Desks, meeting points and times are synthetic demo data; in real use the
 * manager or buddy would confirm them. Travel facts are split by where they come from.
 */

export interface DayOneLogistics {
  arriveBy: string
  /** Who is waiting for the joiner, and where */
  meetWho: 'buddy' | 'manager'
  meetAt: string
  /** Desk label, or undefined for people with no desk (home-based) */
  desk?: string
  deskNextTo: 'buddy' | 'manager'
  deskNote?: string
}

export const dayOneLogistics: Record<string, DayOneLogistics> = {
  priya: { arriveBy: '09:00', meetWho: 'buddy', meetAt: 'Main reception, Wellington Place', desk: 'Floor 3, desk 3.14', deskNextTo: 'buddy' },
  rhys: { arriveBy: '08:30', meetWho: 'manager', meetAt: 'Contact centre reception', desk: 'Pod C, seat 12', deskNextTo: 'buddy', deskNote: 'Your shift starts with a cohort welcome, so you’ll sit in the training pod first.' },
  margaret: { arriveBy: '09:30', meetWho: 'manager', meetAt: 'Reception, Gresham Street', desk: 'Floor 5, desk 5.07', deskNextTo: 'manager' },
  jordan: { arriveBy: '08:45', meetWho: 'buddy', meetAt: 'The front door of the branch (staff entrance is round the side, your buddy will walk you in)', desk: 'Back office desk, beside the counter', deskNextTo: 'buddy' },
  aisha: { arriveBy: '09:00', meetWho: 'buddy', meetAt: 'Main reception, Wellington Place', desk: 'Graduate zone, floor 2', deskNextTo: 'buddy' },
  sam: { arriveBy: '09:30', meetWho: 'buddy', meetAt: 'Video call (link in your welcome email)', deskNextTo: 'buddy' },
  nia: { arriveBy: '09:00', meetWho: 'manager', meetAt: 'Main reception, Wellington Place', desk: 'Floor 4, desk 4.02', deskNextTo: 'manager' },
  tom: { arriveBy: '09:00', meetWho: 'buddy', meetAt: 'Main reception, Wellington Place', desk: 'Floor 3, desk 3.15', deskNextTo: 'buddy' },
  amara: { arriveBy: '09:00', meetWho: 'buddy', meetAt: 'Main reception, Wellington Place', desk: 'Floor 3, desk 3.16', deskNextTo: 'buddy' },
}

export interface DayOneItem {
  time: string
  title: string
  detail: string
}

/** A sensible default day. `{buddy}` and `{manager}` are replaced with first names. */
export function dayOneAgenda(persona: Persona, l: DayOneLogistics): DayOneItem[] {
  const meeter = l.meetWho === 'buddy' ? '{buddy}' : '{manager}'
  if (persona.workPattern === 'remote') {
    return [
      { time: l.arriveBy, title: 'Join the welcome call', detail: `${meeter} will be on the call to say hello and check your kit works.` },
      { time: '10:00', title: 'Log in and set up', detail: 'IT will talk you through your first sign-in and security set-up.' },
      { time: '11:30', title: 'Catch-up with {manager}', detail: 'What your first weeks look like and your first goals.' },
      { time: '12:30', title: 'Lunch away from the screen', detail: '{buddy} will suggest a virtual coffee later in the week.' },
      { time: '13:30', title: 'Meet the team', detail: 'A short video intro with the people you’ll work with.' },
      { time: '15:30', title: 'Mandatory learning', detail: 'Start your first modules at your own pace.' },
      { time: '16:30', title: 'End-of-day check-in', detail: '{buddy} asks how it went and what’s unclear.' },
    ]
  }
  return [
    { time: l.arriveBy, title: `${meeter} meets you`, detail: `Meet at: ${l.meetAt}. Bring photo ID for your building pass.` },
    { time: '09:30', title: 'Building pass and a quick tour', detail: 'Where to find the kitchen, quiet rooms, lockers and the nearest fire exit.' },
    { time: '10:00', title: 'Your desk and kit', detail: l.desk ? `Settle in at ${l.desk}, next to ${l.deskNextTo === 'buddy' ? '{buddy}' : '{manager}'}. Log in and set up with IT.` : 'Log in and set up with IT.' },
    { time: '11:00', title: 'Welcome chat with {manager}', detail: 'Your team, your role and what the first weeks look like.' },
    { time: '12:30', title: 'Lunch with {buddy}', detail: 'No agenda: a good time to ask the questions you’d rather not ask your manager.' },
    { time: '13:30', title: 'Meet the team', detail: 'Faces and names, with a fun fact each.' },
    { time: '15:00', title: 'Mandatory learning', detail: 'Start your first modules at your own pace.' },
    { time: '16:30', title: 'End-of-day check-in', detail: '{buddy} asks how it went and what’s unclear.' },
  ]
}

export interface SiteTravel {
  site: string
  /** Facts taken from lloydsbankinggroup.com/careers/where-we-are */
  fromLbg: string[]
  /** Commonly known local transport, not taken from the LBG site: confirm before travelling */
  general: string[]
}

export const siteTravel: Partial<Record<SiteId, SiteTravel>> = {
  leeds: {
    site: 'Wellington Place, Leeds',
    fromLbg: [
      'Bike storage, plus shower facilities, changing rooms and drying rooms for people who cycle or walk in.',
      'Active travel lockers, and facilities for electric bikes and scooters.',
      'Spaces for motorbikes.',
    ],
    general: ['Wellington Place is a short walk from Leeds railway station (about 10 minutes).'],
  },
  london: {
    site: 'Gresham Street, London',
    fromLbg: [
      'All LBG’s London offices are close to multiple Tube stations.',
      'Cycle parking, secure underground bike storage, showers and lockers.',
    ],
    general: [
      'For Gresham Street, St Paul’s, Bank and Moorgate are the nearest stations. For Old Broad Street, Liverpool Street and Bank.',
    ],
  },
  birmingham: {
    site: 'Birmingham city centre',
    fromLbg: ['LBG’s Birmingham office is on Colmore Row. Your branch location is covered by your manager.'],
    general: ['New Street, Moor Street and Snow Hill stations are all close to the city centre.'],
  },
  bristol: {
    site: 'Harbourside, Bristol',
    fromLbg: ['LBG’s Bristol office is at Harbourside.'],
    general: ['Bristol Temple Meads is the main railway station for the city, with buses and a walk into the centre.'],
  },
  cardiff: {
    site: 'Cardiff contact centre',
    fromLbg: ['Cardiff isn’t listed on LBG’s “where we are” page, so there is no published travel information.'],
    general: ['Cardiff Central is the main railway station; ask your manager about parking and the best bus route.'],
  },
  remote: {
    site: 'Home-based',
    fromLbg: ['No travel needed on Day 1. If you’re invited to an office later, your manager will share the details.'],
    general: [],
  },
}

// ── Desk booking, journey planning and wayfinding: example data for the demo ──

export interface DeskOption {
  id: string
  label: string
  note: string
}

/** The desk already held next to the buddy or manager, plus two example alternatives. Only hybrid office workers book desks. */
export function deskOptions(persona: Persona, l: DayOneLogistics): DeskOption[] {
  if (persona.workPattern !== 'hybrid' || !l.desk) return []
  const floor = /^Floor \d+/.exec(l.desk)?.[0] ?? 'Same floor'
  return [
    { id: 'near', label: l.desk, note: `Next to ${l.deskNextTo === 'buddy' ? '{buddy}, your buddy' : '{manager}, your manager'}. Already held for you.` },
    { id: 'window', label: `${floor}, window desk W4`, note: 'Natural light, about a minute’s walk from your team.' },
    { id: 'quiet', label: `${floor}, quiet zone desk Q2`, note: 'A low-noise area with no calls, if busy spaces are tiring.' },
  ]
}

export interface TravelOption {
  id: string
  mode: string
  /** The last leg, from where this mode drops you to the front door */
  route: string
  /** Minutes for that last leg */
  minutes: number
  /** Where the minutes are counted from, e.g. "Leeds station" */
  from: string
  tip?: string
}

const train = (from: string, minutes: number, route: string, tip?: string): TravelOption => ({ id: 'train', mode: 'Train', from, minutes, route, tip })
const bus = (from: string, minutes: number, route: string, tip?: string): TravelOption => ({ id: 'bus', mode: 'Bus', from, minutes, route, tip })
const cycle = (minutes: number, route: string, tip?: string): TravelOption => ({ id: 'cycle', mode: 'Cycle', from: 'the bike store', minutes, route, tip })
const car = (from: string, minutes: number, route: string, tip?: string): TravelOption => ({ id: 'car', mode: 'Car', from, minutes, route, tip })

/** Example last-leg journeys per site. Made up for the demo: not real timetables, routes or prices. */
export const travelOptions: Partial<Record<SiteId, TravelOption[]>> = {
  leeds: [
    train('Leeds station', 10, 'Leave by the south entrance, follow Whitehall Road and turn right into Wellington Place.', 'A railcard-style season ticket loan is in your benefits.'),
    bus('the Wellington Street stop', 4, 'Most city-centre buses stop on Wellington Street. Cross at the lights and walk through the square.'),
    cycle(3, 'Lock up in the secure bike store at the back of the building, then use the showers and lockers on the ground floor.', 'Bring your own lock for the locker on Day 1.'),
    car('the Whitehall Road car park', 8, 'There is no on-site parking for new joiners. Park at Whitehall Road and walk along the river path.', 'Example day rate: £12.'),
  ],
  london: [
    train('St Paul’s station', 6, 'Take exit 2, walk up St Martin’s Le Grand and turn right into Gresham Street.'),
    bus('the Cheapside stop', 5, 'Get off at Cheapside, walk north up Wood Street and the entrance is on the corner.'),
    cycle(3, 'Use the ramp to the secure underground bike store, then the lift up to reception.'),
  ],
  cardiff: [
    train('Cardiff Central', 15, 'Leave by the front entrance, cross Central Square and follow the signs towards the bay.'),
    bus('the stop outside the centre', 2, 'The stop is right outside. Shift buses run from the city centre every 20 minutes.'),
    car('the staff car park', 3, 'Use the visitor bay on Day 1. Your manager will sort a permit in your first week.'),
  ],
  birmingham: [
    train('New Street station', 8, 'Leave by the Stephenson Street exit and walk up towards Colmore Row.'),
    bus('the Colmore Row stop', 3, 'Most city buses stop on Colmore Row, a few doors from the branch.'),
    car('the Snow Hill car park', 6, 'There is no parking at the branch. Snow Hill is the nearest car park.', 'Example day rate: £9.'),
  ],
  bristol: [
    train('Temple Meads', 20, 'Walk along the harbour path, or take the harbour ferry to the Harbourside stop.'),
    bus('the Harbourside stop', 4, 'Buses from Temple Meads stop at Harbourside. Walk across the square to reception.'),
    cycle(2, 'Bike racks are by the main entrance, with lockers inside on the ground floor.'),
  ],
}

/** e.g. 09:00 minus 15 minutes = 08:45 */
export function minutesBefore(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (((h * 60 + m - minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export interface Wayfinding {
  /** From the front door to the desk, in order */
  steps: string[]
  /** Useful places near the desk */
  nearby: { place: string; where: string }[]
}

/** Example directions inside the building. `{buddy}` and `{manager}` are replaced with first names. */
export function wayfinding(persona: Persona, l: DayOneLogistics, desk?: string): Wayfinding | undefined {
  if (persona.workPattern === 'remote') return undefined
  const meeter = l.meetWho === 'buddy' ? '{buddy}' : '{manager}'
  const floor = /Floor (\d+)/.exec(desk ?? '')?.[1]
  if (persona.workPattern === 'branch') {
    return {
      steps: [
        `Meet ${meeter} at the front door. The staff entrance is round the side.`,
        'Sign the visitor book in the back office and collect your pass.',
        'Lockers are on the left as you go in: leave your coat and bag here.',
        `Your desk is in the back office, beside the counter${l.deskNextTo === 'buddy' ? ', next to {buddy}' : ''}.`,
      ],
      nearby: [
        { place: 'Kitchen and break room', where: 'Upstairs, first door on the right' },
        { place: 'Toilets', where: 'Upstairs, end of the corridor' },
        { place: 'First aid kit and fire exit', where: 'By the back office door' },
      ],
    }
  }
  return {
    steps: [
      `Go in by the main entrance. Reception is straight ahead, and ${meeter} will be waiting there.`,
      'Show your photo ID at reception to collect your building pass.',
      'Tap your pass at the gates. The lifts are just beyond them on the right.',
      floor ? `Take the lift to floor ${floor} and turn left out of the lift lobby.` : `${meeter} will walk you to your team’s area.`,
      desk ? `Your desk is ${desk.replace(/^Floor \d+, /, '')}. Desk numbers are on the end of each row.` : 'Your seat will be pointed out when you arrive.',
    ],
    nearby: [
      { place: 'Kitchen and free tea and coffee', where: 'Opposite the lifts on your floor' },
      { place: 'Toilets and accessible toilet', where: 'Either side of the lift lobby' },
      { place: 'Quiet room and prayer room', where: 'Floor 1, signposted from the lifts' },
      { place: 'Lockers', where: 'By the stairs on your floor' },
      { place: 'IT help desk', where: 'Ground floor, next to reception' },
    ],
  }
}
