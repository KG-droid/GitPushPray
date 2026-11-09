import { addDays } from '../domain/dates'
import type { CheckInMilestone, FeedbackResponse, QuestionLog, QuestionTopic } from '../domain/feedback'
import type { JobFamily, SiteId } from '../domain/types'

/**
 * Synthetic history for the admin insights: eight weeks of fictional joiners, so trends have something
 * to show. Deterministic, so the demo and the tests always see the same numbers.
 */

/** The last day of the synthetic history. */
export const SEED_END = '2026-11-08'
const WEEKS = 8

interface Profile {
  sites: SiteId[]
  /** Joiners completing a Day 30 check-in over the eight weeks */
  joiners: number
  /** Chance a joiner answers 9-10 / 7-8 / 0-6 */
  mix: [number, number, number]
  /** Day 1 / Week 1 / Day 30 average mood, 1-5 */
  mood: [number, number, number]
  questions: number
  topics: Partial<Record<QuestionTopic, number>>
  /** Topics asked more often in the last two weeks */
  surge?: Partial<Record<QuestionTopic, number>>
  missed: string[]
  better: string[]
  notes: string[]
}

const profiles: Record<JobFamily, Profile> = {
  technology: {
    sites: ['leeds', 'leeds', 'remote'],
    joiners: 16,
    mix: [0.45, 0.3, 0.25],
    mood: [4.3, 3.8, 4.2],
    questions: 110,
    topics: { kit: 5, working: 3, start: 3, people: 2, training: 2, pay: 2, benefits: 1, checks: 2, other: 1 },
    surge: { kit: 4 },
    missed: [
      'My laptop arrived two days after I started and I had no access to anything on Day 1.',
      'I did not know which systems I would need access to before I started.',
      'Nobody told me about the engineering guild until week three.',
      'A checklist for setting up my dev environment would have saved a day.',
    ],
    better: [
      'Get access requests going before the start date, not on it.',
      'Share the team’s architecture overview a week before Day 1.',
      'Give new engineers a small first task with a clear owner.',
    ],
    notes: ['Laptop was late, otherwise good.', 'Buddy was brilliant.', 'Access took a few days to sort out.'],
  },
  'contact-centre': {
    sites: ['cardiff', 'cardiff', 'cardiff', 'birmingham'],
    joiners: 14,
    mix: [0.2, 0.3, 0.5],
    mood: [4.0, 3.2, 3.5],
    questions: 100,
    topics: { working: 5, pay: 4, training: 4, kit: 2, start: 3, benefits: 3, people: 1, wellbeing: 2, checks: 2, other: 1 },
    missed: [
      'I had no idea what my shift pattern would be until a few days before I started.',
      'Training was a lot of information with no time to practise on real calls.',
      'I was not told how and when I would be paid in the first month.',
      'Nobody explained how shift swaps work.',
    ],
    better: [
      'Tell us our shifts at least two weeks before Day 1.',
      'More time shadowing experienced advisors before taking calls.',
      'A simple guide to the first payslip.',
    ],
    notes: ['Too much to take in during week one.', 'Shifts were confusing.', 'My team leader was lovely.'],
  },
  risk: {
    sites: ['london', 'london', 'remote'],
    joiners: 10,
    mix: [0.25, 0.35, 0.4],
    mood: [3.9, 3.4, 3.8],
    questions: 120,
    topics: { checks: 6, start: 3, pay: 2, people: 3, training: 2, wellbeing: 2, benefits: 1, kit: 1, working: 2, other: 1 },
    surge: { checks: 4.5 },
    missed: [
      'The regulatory reference took weeks and I heard nothing during the wait.',
      'I did not know when the checks would finish so I could not tell my current employer when I was leaving.',
      'No one explained what the senior manager responsibilities involve before I joined.',
    ],
    better: [
      'Send a weekly update while checks are running, even if there is no news.',
      'Be clearer about what is normal for how long a reference takes.',
      'Give a named person to ask about my checks.',
    ],
    notes: ['The wait was stressful.', 'Not hearing anything for weeks was hard.', 'Once I started, great.'],
  },
  retail: {
    sites: ['birmingham', 'birmingham', 'bristol'],
    joiners: 9,
    mix: [0.35, 0.4, 0.25],
    mood: [4.1, 3.7, 4.0],
    questions: 70,
    topics: { dress: 4, working: 4, start: 3, training: 4, pay: 2, benefits: 2, people: 3, checks: 1, kit: 1, other: 1 },
    missed: [
      'I was not told what to wear on my first day in branch.',
      'I did not know who the regulars were or who to ask for help on the counter.',
      'The branch training modules were hard to find.',
    ],
    better: ['Send the dress code and a photo of the branch team beforehand.', 'Introduce new starters to the branch team on the first morning.'],
    notes: ['Everyone was welcoming.', 'Not sure where to find the training.', 'Dress code was unclear.'],
  },
  graduate: {
    sites: ['bristol', 'leeds', 'bristol'],
    joiners: 8,
    mix: [0.5, 0.3, 0.2],
    mood: [4.5, 4.0, 4.2],
    questions: 60,
    topics: { people: 4, training: 4, start: 3, working: 3, benefits: 2, pay: 2, wellbeing: 2, kit: 1, checks: 1, other: 1 },
    missed: [
      'I did not know how my rotations would be decided.',
      'I wanted to meet the other graduates before the start date.',
      'There was no one to ask about career paths in the first weeks.',
    ],
    better: ['A graduate group chat before Day 1.', 'Explain how rotations work early.'],
    notes: ['Loved meeting the other graduates.', 'Wanted to know more about rotations.', 'Great welcome.'],
  },
  data: {
    sites: ['remote', 'remote', 'leeds'],
    joiners: 7,
    mix: [0.3, 0.35, 0.35],
    mood: [4.0, 3.5, 3.9],
    questions: 50,
    topics: { kit: 4, people: 4, working: 3, training: 2, start: 2, pay: 2, benefits: 1, wellbeing: 2, checks: 1, other: 1 },
    missed: [
      'Working remotely, I did not meet anyone in person for the first fortnight.',
      'I did not have access to the data tools until the end of week one.',
      'I was not sure which team channels to join.',
    ],
    better: ['Pair remote joiners with a buddy and a virtual coffee in week one.', 'Get tool access done before Day 1.'],
    notes: ['A bit isolating at first.', 'Tools took a while.', 'Team was friendly.'],
  },
}

/** How often each topic needs a person rather than a policy answer. */
const NEEDS_PERSON: Partial<Record<QuestionTopic, number>> = { pay: 0.45, wellbeing: 0.65, checks: 0.4, other: 0.55, benefits: 0.2 }

/** Small deterministic random numbers (mulberry32). */
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickWeighted<T extends string>(rand: () => number, weights: Partial<Record<T, number>>): T {
  const entries = Object.entries(weights) as [T, number][]
  let r = rand() * entries.reduce((s, [, w]) => s + w, 0)
  for (const [k, w] of entries) {
    r -= w
    if (r < 0) return k
  }
  return entries[0][0]
}

const pick = <T,>(rand: () => number, xs: T[]): T => xs[Math.floor(rand() * xs.length)]

/** Spreads records over the eight weeks, evenly, so a topic only rises when its own weight does. */
function dayInWindow(rand: () => number): string {
  const offset = Math.floor(rand() * WEEKS * 7)
  return addDays(SEED_END, -offset)
}

const time = (rand: () => number) => `${String(8 + Math.floor(rand() * 10)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}:00Z`

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

function build(): { feedback: FeedbackResponse[]; questions: QuestionLog[] } {
  const feedback: FeedbackResponse[] = []
  const questions: QuestionLog[] = []
  let f = 0
  let q = 0

  Object.entries(profiles).forEach(([family, p], index) => {
    const jobFamily = family as JobFamily
    const rand = rng(1000 + index * 77)

    for (let i = 0; i < p.joiners; i++) {
      const site = pick(rand, p.sites)
      const day30 = dayInWindow(rand)
      const r = rand()
      const enps = r < p.mix[0] ? 9 + Math.round(rand()) : r < p.mix[0] + p.mix[1] ? 7 + Math.round(rand()) : Math.floor(rand() * 7)
      feedback.push({
        id: `seed-fb-${++f}`,
        at: `${day30}T${time(rand)}`,
        milestone: 'day-30',
        jobFamily,
        site,
        enps,
        mood: clamp(Math.round(p.mood[2] + (rand() - 0.5) * 1.6), 1, 5),
        missed: rand() < 0.7 ? pick(rand, p.missed) : undefined,
        better: rand() < 0.7 ? pick(rand, p.better) : undefined,
      })

      // The same sort of joiner also did the quicker check-ins, earlier in their month.
      ;(['day-1', 'week-1'] as CheckInMilestone[]).forEach((milestone, k) => {
        const lag = k === 0 ? 29 : 25
        const at = addDays(day30, -lag)
        if (at > SEED_END) return
        feedback.push({
          id: `seed-fb-${++f}`,
          at: `${at}T${time(rand)}`,
          milestone,
          jobFamily,
          site,
          mood: clamp(Math.round(p.mood[k] + (rand() - 0.5) * 1.6), 1, 5),
          note: rand() < 0.5 ? pick(rand, p.notes) : undefined,
        })
      })
    }

    for (let i = 0; i < p.questions; i++) {
      const at = dayInWindow(rand)
      const recent = at > addDays(SEED_END, -14)
      const weights: Partial<Record<QuestionTopic, number>> = { ...p.topics }
      if (recent) for (const [t, m] of Object.entries(p.surge ?? {})) weights[t as QuestionTopic] = (weights[t as QuestionTopic] ?? 1) * (m as number)
      const topic = pickWeighted(rand, weights)
      const needsPerson = NEEDS_PERSON[topic] ?? 0.1
      const handedOver = rand() < needsPerson
      questions.push({
        id: `seed-q-${++q}`,
        at: `${at}T${time(rand)}`,
        jobFamily,
        site: pick(rand, p.sites),
        topic,
        handedOver,
        cited: !handedOver || rand() < 0.3,
      })
    }
  })

  return { feedback, questions }
}

const built = build()
export const seedFeedback: FeedbackResponse[] = built.feedback
export const seedQuestionLogs: QuestionLog[] = built.questions
