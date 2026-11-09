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
