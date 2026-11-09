import type { JobFamily, SiteId } from './types.ts'

/** Joiner feedback and the anonymised assistant log that feed the admin insights. All data is synthetic. */

export type CheckInMilestone = 'day-1' | 'week-1' | 'day-30'

export interface MilestoneInfo {
  id: CheckInMilestone
  label: string
  title: string
  /** Opens this many days after Day 1 (Day 1 itself is 0) */
  opensAfterDays: number
}

export const MILESTONES: MilestoneInfo[] = [
  { id: 'day-1', label: 'Day 1', title: 'How was your first day?', opensAfterDays: 0 },
  { id: 'week-1', label: 'Week 1', title: 'How was your first week?', opensAfterDays: 4 },
  { id: 'day-30', label: 'Day 30', title: 'Looking back on your first month', opensAfterDays: 27 },
]

/**
 * Stored without any link to the person. Admins only ever see role family and site, never a name,
 * and the assistant log keeps a topic, not the question.
 */
export interface FeedbackResponse {
  id: string
  /** ISO timestamp */
  at: string
  milestone: CheckInMilestone
  jobFamily: JobFamily
  site: SiteId
  /** 1 to 5, "how is it going" (Day 1 and Week 1 check-ins) */
  mood?: number
  /** 0 to 10, "how likely are you to recommend Lloyds as a place to work" (Day 30) */
  enps?: number
  /** "What did we miss?" */
  missed?: string
  /** "What could we do better?" */
  better?: string
  /** One-line note on the quick check-ins */
  note?: string
}

export interface QuestionLog {
  id: string
  at: string
  jobFamily: JobFamily
  site: SiteId
  topic: QuestionTopic
  /** The assistant suggested, or the joiner needed, a person */
  handedOver: boolean
  /** The answer cited a policy */
  cited: boolean
}

export const JOB_FAMILY_LABELS: Record<JobFamily, string> = {
  technology: 'Technology',
  'contact-centre': 'Contact centre',
  risk: 'Risk and compliance',
  retail: 'Branch and retail',
  graduate: 'Graduates',
  data: 'Data and analytics',
}

export const TEXT_LIMIT = 600

/** Check-ins that are open and not yet answered, in order. `daysSinceStart` is 0 on Day 1 and negative before it. */
export function dueCheckIns(daysSinceStart: number, answered: readonly CheckInMilestone[]): MilestoneInfo[] {
  return MILESTONES.filter((m) => daysSinceStart >= m.opensAfterDays && !answered.includes(m.id))
}

/** The milestone for the next check-in that isn't open yet, if any. */
export function nextCheckIn(daysSinceStart: number, answered: readonly CheckInMilestone[]): MilestoneInfo | undefined {
  return MILESTONES.find((m) => daysSinceStart < m.opensAfterDays && !answered.includes(m.id))
}

export function cleanText(text: string | undefined): string | undefined {
  const t = text?.replace(/\s+/g, ' ').trim().slice(0, TEXT_LIMIT)
  return t || undefined
}

// ---------------------------------------------------------------------------------------------
// Topics: what joiners ask the assistant

export type QuestionTopic =
  | 'checks'
  | 'pay'
  | 'benefits'
  | 'kit'
  | 'dress'
  | 'working'
  | 'start'
  | 'training'
  | 'wellbeing'
  | 'people'
  | 'other'

export const TOPIC_LABELS: Record<QuestionTopic, string> = {
  checks: 'Background checks and references',
  pay: 'Pay and pension',
  benefits: 'Benefits and leave',
  kit: 'Laptop, kit and access',
  dress: 'Dress code',
  working: 'Where and when I work',
  start: 'Start date and Day 1',
  training: 'Training and learning',
  wellbeing: 'Wellbeing and adjustments',
  people: 'My manager, buddy and team',
  other: 'Something else',
}

// Order matters: the first match wins, so specific topics sit above general ones.
const TOPIC_RULES: [QuestionTopic, RegExp][] = [
  ['checks', /\b(checks?|vetting|references?|credit|criminal|dbs|right to work|screening|background)\b/i],
  ['pay', /\b(pay|paid|salary|payslip|pension|bonus|tax|wage)\b/i],
  ['benefits', /\b(benefits?|holiday|leave|annual leave|healthcare|bike|cycle|discount|sick)\b/i],
  ['kit', /\b(laptop|equipment|kit|device|phone|monitor|access|login|log in|password|software|badge|pass)\b/i],
  ['dress', /\b(wear|dress|uniform|clothes|suit|smart)\b/i],
  ['working', /\b(home|hybrid|office|shift|remote|hours|parking|desk|commute|travel|where will i)\b/i],
  ['wellbeing', /\b(worried|worry|anxious|nervous|stress|health|disab|adjust|struggl|overwhelm|mental|lonely)\b/i],
  ['training', /\b(training|course|learn|mandatory|certif|exam|induction)\b/i],
  ['start', /\b(start date|first day|day 1|day one|first week|arrive|arrival|when do i start|when should i)\b/i],
  ['people', /\b(manager|buddy|team|colleague|who)\b/i],
]

export function classifyTopic(question: string): QuestionTopic {
  return TOPIC_RULES.find(([, re]) => re.test(question))?.[0] ?? 'other'
}

// ---------------------------------------------------------------------------------------------
// Themes: what joiners tell us in their own words

export type FeedbackTheme = 'communication' | 'waiting' | 'kit' | 'people' | 'clarity' | 'wellbeing' | 'training' | 'welcome'

export const THEME_LABELS: Record<FeedbackTheme, string> = {
  communication: 'Hearing from us',
  waiting: 'Waiting and delays',
  kit: 'Laptop and access',
  people: 'Meeting people',
  clarity: 'Knowing what to do',
  wellbeing: 'Feeling settled',
  training: 'Training and learning',
  welcome: 'Feeling welcome',
}

const THEME_RULES: [FeedbackTheme, RegExp][] = [
  ['communication', /\b(update|updates|communicat\w*|heard|silence|chase\w*|told|tell|inform\w*|email|emails|radio)\b/i],
  ['waiting', /\b(wait\w*|delay\w*|slow|long|gap|limbo|weeks?)\b/i],
  ['kit', /\b(laptop|access|equipment|login|logins|system|systems|badge|software|kit|set ?up)\b/i],
  ['people', /\b(buddy|manager|team|met|meet|introduc\w*|colleague\w*|people|lonely|alone)\b/i],
  ['clarity', /\b(clear|unclear|confus\w*|where|find|know|knew|instructions?|policy|policies|expect\w*|what to do)\b/i],
  ['wellbeing', /\b(anxious|nervous|overwhelm\w*|worried|stress\w*|settle\w*|belong\w*)\b/i],
  ['training', /\b(training|course|courses|learn\w*|induction|shadow\w*)\b/i],
  ['welcome', /\b(welcom\w*|friendly|kind|lovely|great|brilliant|supportive)\b/i],
]

export function classifyThemes(text: string): FeedbackTheme[] {
  return THEME_RULES.filter(([, re]) => re.test(text)).map(([t]) => t)
}
