import { addDays } from '../domain/dates'
import { matchesAudience } from '../domain/journey'
import type { JourneyEvent, Owner, Person, Persona, StageId } from '../domain/types'
import { stepCatalogue } from './catalogue'

/** Synthetic seed data. Every person, name and detail here is fictional. */

export const seedPeople: Person[] = [
  // Recruiters
  { id: 'rec-sophie', name: 'Sophie Grant', role: 'Talent Acquisition Partner' },
  { id: 'rec-owen', name: 'Owen Price', role: 'Talent Acquisition Partner' },

  // Managers
  {
    id: 'mgr-daniel',
    name: 'Daniel Okafor',
    role: 'Engineering Manager, Payments Platform',
    bio: 'Leads a team of 8 engineers building the payments platform.',
    askMeAbout: ['Our architecture', 'Fell walking', 'Good coffee in Leeds'],
    funFact: 'Has run the Leeds half marathon dressed as a cash machine.',
  },
  {
    id: 'mgr-gareth',
    name: 'Gareth Morgan',
    role: 'Team Leader, Customer Service',
    bio: 'Has led the Cardiff mortgages team for 6 years and started as an advisor.',
    askMeAbout: ['Rugby', 'Handling tricky calls', 'The best café near the centre'],
  },
  {
    id: 'mgr-helen',
    name: 'Helen Achebe',
    role: 'Chief Risk Officer, Commercial Banking',
    bio: 'Leads commercial credit risk and sits on the risk committee.',
    askMeAbout: ['Regulation that actually helps', 'Sailing'],
  },
  {
    id: 'mgr-tariq',
    name: 'Tariq Hussain',
    role: 'Branch Manager, Birmingham New Street',
    bio: 'Runs a branch team of 12 and knows half the regulars by name.',
    askMeAbout: ['Community events', 'Birmingham food'],
  },
  {
    id: 'mgr-fiona',
    name: 'Fiona Campbell',
    role: 'Graduate Programme Lead',
    bio: 'Looks after this year’s 42 graduates across Bristol and Leeds.',
    askMeAbout: ['Rotations', 'Career paths', 'Climbing'],
  },
  {
    id: 'mgr-ben',
    name: 'Ben Adeyemi',
    role: 'Analytics Lead, Customer Insight',
    bio: 'Leads a fully remote team of 6 analysts across the UK.',
    askMeAbout: ['Python', 'Making remote work social'],
  },

  {
    id: 'mgr-ruth',
    name: 'Ruth Calloway',
    role: 'Head of Customer Insight',
    bio: 'Leads three analytics teams and hired Nia to bring a fresh pair of eyes to the fraud team.',
    askMeAbout: ['Growing first-time managers', 'Allotments'],
  },

  // Buddies
  {
    id: 'buddy-callum',
    name: 'Callum Brooks',
    role: 'Team Leader, Fraud Analytics',
    bio: 'Became a team leader two years ago and remembers the first month well.',
    askMeAbout: ['Running a good team meeting', 'Leeds cycle routes'],
  },
  {
    id: 'buddy-chloe',
    name: 'Chloe Whitfield',
    role: 'Senior Software Engineer',
    bio: 'Joined 18 months ago, so remembers what week one feels like.',
    askMeAbout: ['Getting set up', 'The engineering guild', 'Board games'],
  },
  {
    id: 'buddy-ffion',
    name: 'Ffion Davies',
    role: 'Customer Service Advisor',
    bio: 'Started on the same induction programme last year.',
    askMeAbout: ['Shift swaps', 'Where to park', 'Welsh lessons'],
  },
  {
    id: 'buddy-james',
    name: 'James Whitaker',
    role: 'Director, Retail Credit Risk',
    bio: 'A peer on the risk leadership team who joined from another bank last year.',
    askMeAbout: ['Committee rhythms', 'Who to know'],
  },
  {
    id: 'buddy-kerry',
    name: 'Kerry Walsh',
    role: 'Senior Customer Advisor',
    bio: 'Eight years in branch and the person everyone goes to with questions.',
    askMeAbout: ['Counter tips', 'Local customers'],
  },
  {
    id: 'buddy-leo',
    name: 'Leo Martins',
    role: 'Graduate, Year 2',
    bio: 'Did the same programme last year and is now on his second rotation.',
    askMeAbout: ['Picking rotations', 'Bristol nights out'],
  },
  {
    id: 'buddy-nadia',
    name: 'Nadia Rahman',
    role: 'Senior Data Analyst',
    bio: 'Fully remote for 3 years and an expert at not feeling remote.',
    askMeAbout: ['SQL tricks', 'Home office set-ups'],
  },
]

const standardChecks = (refsDays: number) => ({
  identity: { startDay: 0, days: 2 },
  'right-to-work': { startDay: 0, days: 3 },
  'criminal-record': { startDay: 2, days: 12 },
  credit: { startDay: 2, days: 5 },
  references: { startDay: 3, days: refsDays },
})

export const seedPersonas: Persona[] = [
  {
    id: 'priya',
    firstName: 'Priya',
    lastName: 'Shah',
    role: 'Software Engineer',
    team: 'Payments Platform',
    jobFamily: 'technology',
    site: 'leeds',
    location: 'Leeds, Wellington Place',
    workPattern: 'hybrid',
    offerAcceptedOn: '2026-10-19',
    startDate: '2026-12-07',
    software: ['GitHub', 'Azure DevOps', 'VS Code'],
    isSmcr: false,
    managerId: 'mgr-daniel',
    buddyId: 'buddy-chloe',
    recruiterId: 'rec-sophie',
    checkPlan: standardChecks(26),
    tagline: 'Engineer in Leeds, references still out',
  },
  {
    id: 'rhys',
    firstName: 'Rhys',
    lastName: 'Evans',
    role: 'Customer Service Advisor',
    team: 'Mortgages Customer Service',
    jobFamily: 'contact-centre',
    site: 'cardiff',
    location: 'Cardiff contact centre',
    workPattern: 'shift',
    offerAcceptedOn: '2026-10-26',
    startDate: '2026-11-23',
    software: ['Telephony', 'Customer Hub'],
    isSmcr: false,
    managerId: 'mgr-gareth',
    buddyId: 'buddy-ffion',
    recruiterId: 'rec-owen',
    checkPlan: {
      identity: { startDay: 0, days: 1 },
      'right-to-work': { startDay: 0, days: 2 },
      'criminal-record': { startDay: 1, days: 10 },
      credit: { startDay: 1, days: 3 },
      references: { startDay: 2, days: 14 },
    },
    tagline: 'Contact centre in Cardiff, cohort start',
  },
  {
    id: 'margaret',
    firstName: 'Margaret',
    lastName: 'Ellison',
    role: 'Head of Credit Risk',
    team: 'Commercial Banking Risk',
    jobFamily: 'risk',
    site: 'london',
    location: 'London, Gresham Street',
    workPattern: 'hybrid',
    offerAcceptedOn: '2026-09-28',
    startDate: '2027-01-04',
    software: ['Risk Workbench', 'Power BI'],
    isSmcr: true,
    managerId: 'mgr-helen',
    buddyId: 'buddy-james',
    recruiterId: 'rec-sophie',
    checkPlan: {
      ...standardChecks(28),
      'regulatory-reference': { startDay: 5, days: 56 },
    },
    tagline: 'SM&CR senior hire in London, long vetting',
  },
  {
    id: 'jordan',
    firstName: 'Jordan',
    lastName: 'Clarke',
    role: 'Customer Advisor',
    team: 'Birmingham New Street branch',
    jobFamily: 'retail',
    site: 'birmingham',
    location: 'Birmingham New Street branch',
    workPattern: 'branch',
    offerAcceptedOn: '2026-10-12',
    startDate: '2026-11-16',
    software: ['Branch Counter'],
    isSmcr: false,
    managerId: 'mgr-tariq',
    buddyId: 'buddy-kerry',
    recruiterId: 'rec-owen',
    checkPlan: standardChecks(20),
    tagline: 'Branch colleague in Birmingham, starts next week',
  },
  {
    id: 'aisha',
    firstName: 'Aisha',
    lastName: 'Okoye',
    role: 'Graduate, Technology Programme',
    team: 'Graduate cohort 2026',
    jobFamily: 'graduate',
    site: 'bristol',
    location: 'Bristol hub',
    workPattern: 'hybrid',
    offerAcceptedOn: '2026-06-15',
    startDate: '2026-10-12',
    software: ['VS Code'],
    isSmcr: false,
    managerId: 'mgr-fiona',
    buddyId: 'buddy-leo',
    recruiterId: 'rec-owen',
    checkPlan: standardChecks(21),
    tagline: 'Graduate in Bristol, nearly at Day 30',
  },
  {
    id: 'sam',
    firstName: 'Sam',
    lastName: 'Taylor',
    role: 'Data Analyst',
    team: 'Customer Insight',
    jobFamily: 'data',
    site: 'remote',
    location: 'Home-based (Manchester contract)',
    workPattern: 'remote',
    offerAcceptedOn: '2026-10-28',
    startDate: '2026-12-01',
    software: ['Databricks', 'Power BI'],
    isSmcr: false,
    managerId: 'mgr-ben',
    buddyId: 'buddy-nadia',
    recruiterId: 'rec-sophie',
    checkPlan: {
      identity: { startDay: 0, days: 2 },
      'right-to-work': { startDay: 0, days: 2 },
      'criminal-record': { startDay: 1, days: 12 },
      credit: { startDay: 1, days: 4 },
      references: { startDay: 2, days: 20 },
    },
    tagline: 'Remote analyst, kit delivered to home',
  },
  {
    id: 'nia',
    firstName: 'Nia',
    lastName: 'Bennett',
    role: 'Team Leader, Fraud Analytics',
    team: 'Customer Insight',
    jobFamily: 'data',
    site: 'leeds',
    location: 'Leeds, Wellington Place',
    workPattern: 'hybrid',
    offerAcceptedOn: '2026-10-21',
    startDate: '2026-12-14',
    software: ['Power BI'],
    isSmcr: false,
    isPeopleManager: true,
    managerId: 'mgr-ruth',
    buddyId: 'buddy-callum',
    recruiterId: 'rec-owen',
    checkPlan: standardChecks(22),
    tagline: 'First-time team leader in Leeds',
  },
  // Daniel's other joiners, so his list isn't a single row.
  {
    id: 'tom',
    firstName: 'Tom',
    lastName: 'Fletcher',
    role: 'Junior Software Engineer',
    team: 'Payments Platform',
    jobFamily: 'technology',
    site: 'leeds',
    location: 'Leeds, Wellington Place',
    workPattern: 'hybrid',
    offerAcceptedOn: '2026-10-05',
    startDate: '2026-11-16',
    software: ['GitHub', 'Azure DevOps', 'VS Code'],
    isSmcr: false,
    managerId: 'mgr-daniel',
    buddyId: 'buddy-chloe',
    recruiterId: 'rec-sophie',
    checkPlan: standardChecks(18),
    tagline: 'Starts next week',
  },
  {
    id: 'amara',
    firstName: 'Amara',
    lastName: 'Nwosu',
    role: 'Senior Software Engineer',
    team: 'Payments Platform',
    jobFamily: 'technology',
    site: 'leeds',
    location: 'Leeds, Wellington Place',
    workPattern: 'hybrid',
    offerAcceptedOn: '2026-11-02',
    startDate: '2027-01-11',
    software: ['GitHub', 'Azure DevOps'],
    isSmcr: false,
    managerId: 'mgr-daniel',
    recruiterId: 'rec-sophie',
    checkPlan: standardChecks(24),
    tagline: 'Just accepted her offer',
  },
]

export const seedEvents: JourneyEvent[] = buildSeedEvents()

function buildSeedEvents(): JourneyEvent[] {
  const events: JourneyEvent[] = []
  let n = 0
  const add = (personaId: string, at: string, type: JourneyEvent['type'], payload?: Record<string, unknown>) =>
    events.push({ id: `seed-${++n}`, personaId, type, at: `${at}T09:00:00Z`, payload })
  const done = (personaId: string, at: string, stepId: string, by: Owner = 'joiner', value?: string) =>
    add(personaId, at, 'step_completed', { stepId, by, value })

  for (const p of seedPersonas) {
    add(p.id, p.offerAcceptedOn, 'offer_accepted')
    done(p.id, p.offerAcceptedOn, 'welcome-from-recruiter')
    done(p.id, p.offerAcceptedOn, 'share-documents')
    done(p.id, p.offerAcceptedOn, 'how-vetting-works')
    // Everyone has answered the accessibility question except Priya, so the demo can start from it.
    if (p.id !== 'priya') done(p.id, p.offerAcceptedOn, 'accessibility-needs', 'joiner', 'no')
  }

  // Welcome packs have gone to everyone whose manager has had what they need to send one. Sam, Nia and Amara
  // need a laptop and nobody has chosen their options yet, so their managers still have the pack to send.
  for (const [personaId, at] of [
    ['priya', '2026-11-02'],
    ['rhys', '2026-10-27'],
    ['margaret', '2026-10-20'],
    ['jordan', '2026-10-13'],
    ['tom', '2026-10-10'],
  ] as const) {
    done(personaId, at, 'mgr-send-welcome-pack', 'manager')
  }

  // Priya: buddy assigned, has picked a learning bite. Goals and laptop options not set yet, so Reset leaves them for the manager.
  done('priya', '2026-11-02', 'mgr-assign-buddy', 'manager')
  done('priya', '2026-10-24', 'learning-picks', 'joiner', 'banking-101')

  // Rhys: buddy assigned, benefits picked.
  done('rhys', '2026-11-03', 'mgr-assign-buddy', 'manager')
  done('rhys', '2026-11-04', 'choose-benefits', 'joiner', 'cycle-to-work')

  // Margaret: buddy assigned, kit chosen and approved.
  done('margaret', '2026-10-20', 'mgr-assign-buddy', 'manager')
  done('margaret', '2026-10-20', 'mgr-set-device-spec', 'manager', 'standard')
  done('margaret', '2026-10-21', 'choose-kit', 'joiner', 'surface-laptop')
  done('margaret', '2026-10-22', 'mgr-request-device', 'manager')
  done('margaret', '2026-10-25', 'choose-benefits', 'joiner', 'private-medical')

  // Jordan: starts next week, most things done.
  for (const [stepId, by, at, value] of [
    ['mgr-assign-buddy', 'manager', '2026-10-27'],
    ['choose-benefits', 'joiner', '2026-10-20', 'travel-loan'],
    ['learning-picks', 'joiner', '2026-11-06', 'banking-101'],
    ['mgr-request-access', 'manager', '2026-11-06'],
    ['id-photo', 'joiner', '2026-11-04'],
    ['mgr-request-badge', 'manager', '2026-11-06'],
    ['mgr-plan-week-one', 'manager', '2026-11-06'],
    ['say-hello', 'joiner', '2026-10-29'],
  ] as const) {
    done('jordan', at, stepId, by, value)
  }

  // Aisha: on Day 29 — everything up to week one is done and she gave a two-week pulse.
  const aisha = seedPersonas.find((p) => p.id === 'aisha')!
  const earlyStages: StageId[] = ['unlock', 'meet', 'manager-ready', 'week-one']
  for (const s of stepCatalogue) {
    if (!earlyStages.includes(s.stage) || !matchesAudience(aisha, s.audience) || s.kind === 'content') continue
    const at = s.stage === 'week-one' ? addDays(aisha.startDate, 4) : addDays(aisha.startDate, -10)
    done('aisha', at, s.id, s.owner, s.options?.[0]?.value)
  }
  done('aisha', addDays(aisha.startDate, 12), 'pulse-two-weeks')
  add('aisha', addDays(aisha.startDate, 12), 'pulse_submitted', { knowWhoToAsk: 4, confident: 3 })
  add('aisha', addDays(aisha.startDate, 19), 'pulse_submitted', { knowWhoToAsk: 4, confident: 4 })
  add('aisha', addDays(aisha.startDate, 26), 'pulse_submitted', { knowWhoToAsk: 5, confident: 4 })
  // Leo has met Aisha five times, but not for a while: the buddy view nudges him.
  for (const [offset, kind] of [[-8, 'call'], [1, 'lunch'], [3, 'coffee'], [8, 'walk'], [15, 'coffee']] as const) {
    add('aisha', addDays(aisha.startDate, offset), 'buddy_meetup', { kind })
  }

  // Tom: starts next week; nearly everything done, but Daniel still has to request his badge.
  for (const [stepId, by, at, value] of [
    ['mgr-assign-buddy', 'manager', '2026-10-20'],
    ['mgr-set-device-spec', 'manager', '2026-10-10', 'developer'],
    ['choose-kit', 'joiner', '2026-10-12', 'hp-elitebook-g11'],
    ['mgr-request-device', 'manager', '2026-10-13'],
    ['choose-benefits', 'joiner', '2026-10-14', 'cycle-to-work'],
    ['mgr-set-goals', 'manager', '2026-11-02'],
    ['mgr-request-access', 'manager', '2026-11-03'],
    ['mgr-plan-week-one', 'manager', '2026-11-03'],
    ['learning-picks', 'joiner', '2026-11-03', 'banking-101'],
    ['say-hello', 'joiner', '2026-10-21'],
    ['id-photo', 'joiner', '2026-11-02'],
  ] as const) {
    done('tom', at, stepId, by, value)
  }

  return events
}
