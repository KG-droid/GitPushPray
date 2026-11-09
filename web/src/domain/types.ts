/** Core domain model. All data in this app is synthetic. */

export type JobFamily = 'technology' | 'contact-centre' | 'risk' | 'retail' | 'graduate' | 'data'

export type SiteId = 'leeds' | 'cardiff' | 'london' | 'birmingham' | 'bristol' | 'remote'

export type WorkPattern = 'hybrid' | 'shift' | 'branch' | 'remote'

export type StageId = 'offer' | 'unlock' | 'meet' | 'manager-ready' | 'week-one' | 'day-30'

export type CheckId =
  | 'identity'
  | 'right-to-work'
  | 'criminal-record'
  | 'credit'
  | 'references'
  | 'regulatory-reference'

export type CheckStatus = 'not-started' | 'in-progress' | 'waiting-on-you' | 'delayed' | 'cleared'

export type Owner = 'joiner' | 'manager' | 'buddy'

export interface Person {
  id: string
  name: string
  role: string
  bio?: string
  askMeAbout?: string[]
  funFact?: string
}

/** When each check starts and how long it normally takes, in days after the offer was accepted. */
export type CheckPlan = Partial<Record<CheckId, { startDay: number; days: number }>>

export interface Persona {
  id: string
  firstName: string
  lastName: string
  role: string
  team: string
  jobFamily: JobFamily
  site: SiteId
  /** Human-readable location, e.g. "Leeds, Wellington Place" */
  location: string
  workPattern: WorkPattern
  /** ISO date the joiner was originally due to start, e.g. 2026-12-07 */
  startDate: string
  /** ISO date the unconditional offer was accepted */
  offerAcceptedOn: string
  software: string[]
  isSmcr: boolean
  /** Joining to lead a team for the first time at the bank (or for the first time at all) */
  isPeopleManager?: boolean
  managerId: string
  buddyId?: string
  recruiterId: string
  checkPlan: CheckPlan
  /** One-line summary for the demo persona switcher */
  tagline: string
  /** Background joiners that only appear in a manager's list, not in the demo persona switcher */
  hiddenFromSwitcher?: boolean
}

/** Everything that happens in a journey is an event; unlocks are rules over events, checks and dates. */
export type JourneyEventType =
  | 'offer_accepted'
  | 'step_completed'
  | 'check_updated'
  | 'start_date_changed'
  | 'pulse_submitted'
  | 'chat_message'
  | 'buddy_meetup'
  | 'handover_sent'
  | 'feedback_submitted'

export interface JourneyEvent {
  id: string
  personaId: string
  type: JourneyEventType
  /** ISO timestamp */
  at: string
  payload?: Record<string, unknown>
}

export interface StepCompletedPayload {
  stepId: string
  /** For choices, the option picked */
  value?: string
  by?: Owner
}

export interface CheckUpdatedPayload {
  checkId: CheckId
  status: CheckStatus
  /** New expected clear date (ISO) if it has moved */
  expectedClearOn?: string
  note?: string
}

export interface StartDateChangedPayload {
  to: string
  reason: string
}

export interface ChatMessagePayload {
  /** The person the joiner is talking to */
  withId: string
  from: 'joiner' | 'them'
  text: string
}

export type MeetupKind = 'coffee' | 'call' | 'lunch' | 'walk'

export interface BuddyMeetupPayload {
  kind: MeetupKind
}

export interface HandoverSentPayload {
  route: 'screening' | 'hr' | 'manager' | 'buddy'
  summary: string
}

export interface FeedbackSubmittedPayload {
  milestone: 'day-1' | 'week-1' | 'day-30'
}

export interface PulsePayload {
  knowWhoToAsk: number
  confident: number
}

/** Who a step or piece of content is for. Omitted fields mean "everyone". */
export interface Audience {
  jobFamilies?: JobFamily[]
  sites?: SiteId[]
  workPatterns?: WorkPattern[]
  software?: string[]
  smcr?: boolean
  peopleManager?: boolean
}

export type UnlockRule =
  | { type: 'always' }
  | { type: 'checksCleared'; checks: CheckId[] | 'all' }
  | { type: 'stepDone'; stepId: string }
  | { type: 'daysToStart'; atMost: number }
  | { type: 'daysSinceStart'; atLeast: number }
  | { type: 'all'; rules: UnlockRule[] }
  | { type: 'any'; rules: UnlockRule[] }

export type StepKind = 'task' | 'choice' | 'content'

export interface ChoiceOption {
  value: string
  label: string
  detail?: string
  /** Heading to list this option under, for long lists */
  group?: string
}

export interface StepDefinition {
  id: string
  stage: StageId
  owner: Owner
  kind: StepKind
  title: string
  body: string
  icon: string
  audience?: Audience
  unlock: UnlockRule
  /** Plain-English reason shown while locked, so content feels earned rather than withheld */
  lockedHint?: string
  /** Wording for the joiner when this is someone else's locked step */
  teamHint?: string
  /** The step is done on its own screen; journey views link there instead of showing the form */
  href?: string
  hrefLabel?: string
  /** Due date relative to the (current) start date. -14 = two weeks before Day 1 */
  dueOffsetDays?: number
  minutes?: number
  options?: ChoiceOption[]
  /** A choice where several options can be picked (stored comma-separated in the step value) */
  multiple?: boolean
  /** Steps that undo this one when they are (re)done later, e.g. changing the laptop clears its approval */
  resetBy?: string[]
  /** Once done, this can still be changed until this many days from the (current) start date */
  changeUntilOffsetDays?: number
  /** Shown once the change window has closed */
  changeClosedHint?: string
}

export interface CheckDefinition {
  id: CheckId
  label: string
  explainer: string
  whatYouCanDo?: string
  /** Shown when the check is taking a while, to keep progress honest */
  noNewsCopy: string
}
