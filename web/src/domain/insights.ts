import type { InsightsSummary, Recommendation } from '../assistant/protocol.ts'
import {
  MILESTONES,
  THEME_LABELS,
  TOPIC_LABELS,
  classifyThemes,
  type FeedbackResponse,
  type FeedbackTheme,
  type QuestionLog,
  type QuestionTopic,
} from './feedback.ts'
import type { JobFamily } from './types.ts'

/** Admin trends. Everything here works on anonymous records and hides groups too small to be anonymous. */

/** Groups smaller than this are never shown, so nobody can be picked out of a cut. */
export const MIN_COHORT = 3

const DAY = 86_400_000
const dayOf = (iso: string) => Date.parse(iso.slice(0, 10))

export type FamilyFilter = JobFamily | 'all'

export function byFamily<T extends { jobFamily: JobFamily }>(items: T[], family: FamilyFilter): T[] {
  return family === 'all' ? items : items.filter((i) => i.jobFamily === family)
}

// ---------------------------------------------------------------------------------------------
// eNPS

export interface EnpsStats {
  n: number
  /** -100 to 100, or null when there are too few answers to show */
  score: number | null
  promoters: number
  passives: number
  detractors: number
}

/** Promoters score 9-10, detractors 0-6. eNPS = % promoters minus % detractors. */
export function enpsStats(responses: FeedbackResponse[]): EnpsStats {
  const scores = responses.map((r) => r.enps).filter((s): s is number => typeof s === 'number')
  const promoters = scores.filter((s) => s >= 9).length
  const detractors = scores.filter((s) => s <= 6).length
  const n = scores.length
  return {
    n,
    score: n >= MIN_COHORT ? Math.round(((promoters - detractors) / n) * 100) : null,
    promoters,
    passives: n - promoters - detractors,
    detractors,
  }
}

export interface WeeklyPoint {
  /** ISO date of the Monday starting the week */
  weekStart: string
  n: number
  score: number | null
}

function weekStartOf(iso: string): string {
  const t = dayOf(iso)
  const dow = (new Date(t).getUTCDay() + 6) % 7 // Monday = 0
  return new Date(t - dow * DAY).toISOString().slice(0, 10)
}

/** eNPS per week, oldest first, for the most recent `weeks` weeks that have any answers. */
export function weeklyEnps(responses: FeedbackResponse[], weeks = 8): WeeklyPoint[] {
  const scored = responses.filter((r) => typeof r.enps === 'number')
  const buckets = new Map<string, FeedbackResponse[]>()
  for (const r of scored) {
    const k = weekStartOf(r.at)
    buckets.set(k, [...(buckets.get(k) ?? []), r])
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-weeks)
    .map(([weekStart, rs]) => {
      const s = enpsStats(rs)
      return { weekStart, n: s.n, score: s.score }
    })
}

// ---------------------------------------------------------------------------------------------
// Mood across the first month

export interface MoodPoint {
  milestone: string
  /** Average of 1-5, or null when there are too few answers */
  avg: number | null
  n: number
}

export function moodByMilestone(responses: FeedbackResponse[]): MoodPoint[] {
  return MILESTONES.map((m) => {
    const scores = responses.filter((r) => r.milestone === m.id && typeof r.mood === 'number').map((r) => r.mood as number)
    return {
      milestone: m.label,
      n: scores.length,
      avg: scores.length >= MIN_COHORT ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    }
  })
}

// ---------------------------------------------------------------------------------------------
// Assistant topics

export type TopicChange = 'rising' | 'falling' | 'steady'

export interface TopicStat {
  topic: QuestionTopic
  label: string
  count: number
  /** Questions in the latest two weeks, and the two weeks before. "Rising" is about share of all questions. */
  recent: number
  previous: number
  change: TopicChange
  /** 0 to 1: how often the answer needed a person */
  handoverRate: number
}

export function topicStats(logs: QuestionLog[]): TopicStat[] {
  if (!logs.length) return []
  const latest = Math.max(...logs.map((l) => dayOf(l.at)))
  const by = new Map<QuestionTopic, QuestionLog[]>()
  for (const l of logs) by.set(l.topic, [...(by.get(l.topic) ?? []), l])

  const age = (l: QuestionLog) => Math.floor((latest - dayOf(l.at)) / DAY)
  const totalRecent = logs.filter((l) => age(l) < 14).length
  const totalPrevious = logs.filter((l) => age(l) >= 14 && age(l) < 28).length

  return [...by.entries()]
    .filter(([, ls]) => ls.length >= MIN_COHORT)
    .map(([topic, ls]) => {
      const recent = ls.filter((l) => age(l) < 14).length
      const previous = ls.filter((l) => age(l) >= 14 && age(l) < 28).length
      // Compare share of all questions, so a busy fortnight (more joiners) doesn't make every topic "rise".
      const recentShare = totalRecent ? recent / totalRecent : 0
      const previousShare = totalPrevious ? previous / totalPrevious : 0
      const change: TopicChange =
        recent >= 5 && recentShare >= previousShare * 1.3 ? 'rising' : previous >= 5 && recentShare <= previousShare * 0.7 ? 'falling' : 'steady'
      return {
        topic,
        label: TOPIC_LABELS[topic],
        count: ls.length,
        recent,
        previous,
        change,
        handoverRate: ls.filter((l) => l.handedOver).length / ls.length,
      }
    })
    .sort((a, b) => b.count - a.count)
}

// ---------------------------------------------------------------------------------------------
// Feedback themes

export interface ThemeStat {
  theme: FeedbackTheme
  label: string
  count: number
}

export function themeStats(responses: FeedbackResponse[]): ThemeStat[] {
  const counts = new Map<FeedbackTheme, number>()
  for (const r of responses) {
    const text = [r.missed, r.better, r.note].filter(Boolean).join(' ')
    for (const t of new Set(classifyThemes(text))) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_COHORT)
    .map(([theme, count]) => ({ theme, label: THEME_LABELS[theme], count }))
    .sort((a, b) => b.count - a.count)
}

export interface Comment {
  id: string
  at: string
  jobFamily: JobFamily
  question: 'missed' | 'better'
  text: string
}

/** Newest first. Only the two open questions, only when enough people have answered to hide behind. */
export function recentComments(responses: FeedbackResponse[], question: 'missed' | 'better', limit = 4): Comment[] {
  if (responses.filter((r) => r.enps !== undefined).length < MIN_COHORT) return []
  return responses
    .filter((r) => r[question])
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)
    .map((r) => ({ id: r.id, at: r.at, jobFamily: r.jobFamily, question, text: r[question] as string }))
}

// ---------------------------------------------------------------------------------------------
// Summary and recommendations

export function buildSummary(scope: string, responses: FeedbackResponse[], logs: QuestionLog[]): InsightsSummary {
  const enps = enpsStats(responses)
  return {
    scope,
    responses: responses.length,
    questions: logs.length,
    enps,
    mood: moodByMilestone(responses).map(({ milestone, avg }) => ({ milestone, avg })),
    topics: topicStats(logs)
      .slice(0, 6)
      .map((t) => ({ topic: t.label, count: t.count, change: t.change, handoverRate: Math.round(t.handoverRate * 100) / 100 })),
    themes: themeStats(responses)
      .slice(0, 5)
      .map((t) => ({ theme: t.label, count: t.count })),
  }
}

/** Rules of thumb that work without AI, and are what the AI is asked to improve on. */
export function baselineRecommendations(s: InsightsSummary): Recommendation[] {
  const out: Recommendation[] = []
  const who = s.scope === 'All roles' ? 'new joiners' : `new joiners in ${s.scope.toLowerCase()}`

  const rising = s.topics.find((t) => t.change === 'rising')
  if (rising) {
    out.push({
      title: `Answer “${rising.topic}” before they ask`,
      detail: `Questions on this are rising for ${who}. Put the answer in the journey (or the welcome pack) at the point it starts to matter, and brief managers and buddies on it.`,
    })
  }

  const gap = s.topics.find((t) => t.handoverRate >= 0.4 && t.count >= 10)
  if (gap) {
    out.push({
      title: `Close the policy gap on “${gap.topic}”`,
      detail: `${Math.round(gap.handoverRate * 100)}% of these questions needed a person. Add or clarify a policy so the assistant can answer them, and save HR and managers the repeat questions.`,
    })
  }

  const [first, second, third] = s.mood
  if (first?.avg != null && second?.avg != null && second.avg <= first.avg - 0.3) {
    out.push({
      title: 'Week one is where it dips',
      detail: `Mood falls from ${first.avg} on Day 1 to ${second.avg} in week one for ${who}. Add a buddy or manager touchpoint on day three, and check what a first week is meant to feel like.`,
    })
  } else if (second?.avg != null && third?.avg != null && third.avg <= second.avg - 0.3) {
    out.push({
      title: 'Settling in slips after week one',
      detail: `Mood falls from ${second.avg} to ${third.avg} by Day 30. Plan a two-week check-in with the manager and make sure goals are set early.`,
    })
  }

  if (s.enps.score !== null && s.enps.score < 30) {
    out.push({
      title: 'eNPS is below where we want it',
      detail: `eNPS is ${s.enps.score} with ${s.enps.detractors} detractor${s.enps.detractors === 1 ? '' : 's'} out of ${s.enps.n}. Read the “what did we miss” answers for ${who} first, and follow up with detractors.`,
    })
  }

  const wait = s.themes.find((t) => t.theme === THEME_LABELS.waiting || t.theme === THEME_LABELS.communication)
  if (wait) {
    out.push({
      title: 'Break the silence while they wait',
      detail: `“${wait.theme}” comes up in ${wait.count} answers. Send a short update every week between offer and Day 1, even if the update is “no news yet”.`,
    })
  }

  if (!out.length) {
    out.push({
      title: 'Keep going, and keep listening',
      detail: `Nothing stands out for ${who} yet. Keep collecting check-ins, and look again once there are more responses.`,
    })
  }
  return out.slice(0, 5)
}
