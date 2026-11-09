import { describe, expect, it } from 'vitest'
import { seedFeedback, seedQuestionLogs } from '../data/insightsSeed'
import {
  JOB_FAMILY_LABELS,
  MILESTONES,
  classifyThemes,
  classifyTopic,
  dueCheckIns,
  nextCheckIn,
  type FeedbackResponse,
  type QuestionLog,
} from './feedback'
import { MIN_COHORT, baselineRecommendations, buildSummary, byFamily, enpsStats, recentComments, themeStats, topicStats, weeklyEnps } from './insights'
import type { JobFamily } from './types'

const fb = (enps: number | undefined, over: Partial<FeedbackResponse> = {}): FeedbackResponse => ({
  id: `f${Math.random()}`,
  at: '2026-11-02T10:00:00Z',
  milestone: 'day-30',
  jobFamily: 'technology',
  site: 'leeds',
  enps,
  ...over,
})

const q = (at: string, topic: QuestionLog['topic'], handedOver = false): QuestionLog => ({
  id: `q${Math.random()}`,
  at: `${at}T10:00:00Z`,
  jobFamily: 'technology',
  site: 'leeds',
  topic,
  handedOver,
  cited: !handedOver,
})

describe('check-in timing', () => {
  it('opens Day 1, Week 1 and Day 30 check-ins on the right days', () => {
    expect(dueCheckIns(-3, []).length).toBe(0)
    expect(dueCheckIns(0, []).map((m) => m.id)).toEqual(['day-1'])
    expect(dueCheckIns(4, []).map((m) => m.id)).toEqual(['day-1', 'week-1'])
    expect(dueCheckIns(27, ['day-1']).map((m) => m.id)).toEqual(['week-1', 'day-30'])
    expect(dueCheckIns(30, MILESTONES.map((m) => m.id))).toEqual([])
  })
  it('knows what is next', () => {
    expect(nextCheckIn(0, ['day-1'])?.id).toBe('week-1')
    expect(nextCheckIn(30, [])).toBeUndefined()
  })
})

describe('classification', () => {
  it('puts assistant questions into topics, without keeping the text', () => {
    expect(classifyTopic('Why are my references taking so long?')).toBe('checks')
    expect(classifyTopic('When will I get paid?')).toBe('pay')
    expect(classifyTopic('What’s my manager’s salary?')).toBe('pay')
    expect(classifyTopic('What do I wear in branch?')).toBe('dress')
    expect(classifyTopic('Can I work from home in my first week?')).toBe('working')
    expect(classifyTopic('banana')).toBe('other')
  })
  it('finds themes in open feedback', () => {
    expect(classifyThemes('My laptop arrived late and I had no access')).toContain('kit')
    expect(classifyThemes('I heard nothing for weeks')).toEqual(expect.arrayContaining(['communication', 'waiting']))
  })
})

describe('eNPS', () => {
  it('is % promoters minus % detractors', () => {
    const s = enpsStats([10, 9, 9, 8, 7, 3].map((n) => fb(n)))
    expect(s).toMatchObject({ n: 6, promoters: 3, passives: 2, detractors: 1, score: 33 })
  })
  it('hides the score for groups too small to be anonymous', () => {
    expect(enpsStats([fb(10), fb(2)]).score).toBeNull()
    expect(enpsStats([fb(10), fb(2), fb(9)]).score).not.toBeNull()
  })
  it('ignores check-ins without an eNPS answer', () => {
    expect(enpsStats([fb(undefined, { milestone: 'day-1', mood: 4 })]).n).toBe(0)
  })
  it('buckets weekly trend by week and hides small weeks', () => {
    const rs = [10, 9, 3, 9].map((n) => fb(n, { at: '2026-11-03T09:00:00Z' })).concat([fb(2, { at: '2026-10-27T09:00:00Z' })])
    const w = weeklyEnps(rs)
    expect(w.map((p) => p.weekStart)).toEqual(['2026-10-26', '2026-11-02'])
    expect(w[0].score).toBeNull()
    expect(w[1].score).toBe(50)
  })
})

describe('topics', () => {
  it('flags rising topics and how often a person was needed', () => {
    const logs = [
      ...Array.from({ length: 8 }, () => q('2026-11-05', 'checks', true)),
      ...Array.from({ length: 2 }, () => q('2026-10-10', 'checks')),
      ...Array.from({ length: 6 }, () => q('2026-10-10', 'pay')),
      ...Array.from({ length: 6 }, () => q('2026-11-05', 'pay')),
      q('2026-11-05', 'dress'),
    ]
    const stats = topicStats(logs)
    expect(stats.map((t) => t.topic)).toEqual(['pay', 'checks'])
    expect(stats[1]).toMatchObject({ change: 'rising', handoverRate: 8 / 10 })
    expect(stats[0].change).not.toBe('rising')
  })
})

describe('comments and themes', () => {
  it('shows nothing until enough people have answered', () => {
    expect(recentComments([fb(5, { missed: 'x' })], 'missed')).toEqual([])
    expect(themeStats([fb(5, { missed: 'laptop' }), fb(5, { missed: 'laptop' })])).toEqual([])
  })
})

describe('recommendations', () => {
  it('turns a rising, unanswered topic into a suggested change', () => {
    const logs = [
      ...Array.from({ length: 12 }, () => q('2026-11-05', 'checks', true)),
      ...Array.from({ length: 4 }, () => q('2026-10-10', 'checks', true)),
    ]
    const recs = baselineRecommendations(buildSummary('Risk and compliance', [], logs))
    expect(recs.some((r) => r.title.includes('Background checks'))).toBe(true)
    expect(recs.length).toBeLessThanOrEqual(5)
  })
  it('always says something', () => {
    expect(baselineRecommendations(buildSummary('All roles', [], [])).length).toBe(1)
  })
})

describe('synthetic history', () => {
  it('has enough in every role to show, and is anonymous', () => {
    for (const family of Object.keys(JOB_FAMILY_LABELS) as JobFamily[]) {
      expect(enpsStats(byFamily(seedFeedback, family)).score).not.toBeNull()
      expect(topicStats(byFamily(seedQuestionLogs, family)).length).toBeGreaterThan(3)
    }
    expect(MIN_COHORT).toBeGreaterThanOrEqual(3)
    for (const l of seedQuestionLogs) expect(Object.keys(l).sort()).toEqual(['at', 'cited', 'handedOver', 'id', 'jobFamily', 'site', 'topic'])
  })
  it('tells a story: checks questions are rising for risk roles', () => {
    const risk = topicStats(byFamily(seedQuestionLogs, 'risk')).find((t) => t.topic === 'checks')
    expect(risk?.change).toBe('rising')
  })
})
