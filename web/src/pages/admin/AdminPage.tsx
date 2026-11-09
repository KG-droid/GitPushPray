import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded'
import { requestInsights } from '../../assistant/client'
import type { Recommendation } from '../../assistant/protocol'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { formatShortDate } from '../../domain/dates'
import { handoversTo } from '../../domain/handover'
import { JOB_FAMILY_LABELS } from '../../domain/feedback'
import {
  MIN_COHORT,
  baselineRecommendations,
  buildSummary,
  byFamily,
  enpsStats,
  moodByMilestone,
  recentComments,
  themeStats,
  topicStats,
  weeklyEnps,
  type FamilyFilter,
} from '../../domain/insights'

/** Admin-only trends from joiner feedback and the assistant. Anonymous: themes and counts, never people or questions. */
export function AdminPage() {
  const { role, today } = useDemo()
  const [family, setFamily] = useState<FamilyFilter>('all')

  const feedback = repository.listFeedback()
  const logs = repository.listQuestionLogs()

  const data = useMemo(() => {
    const f = byFamily(feedback, family)
    const q = byFamily(logs, family)
    const scope = family === 'all' ? 'All roles' : JOB_FAMILY_LABELS[family]
    return {
      scope,
      f,
      q,
      enps: enpsStats(f),
      weekly: weeklyEnps(f),
      mood: moodByMilestone(f),
      topics: topicStats(q),
      themes: themeStats(f),
      missed: recentComments(f, 'missed'),
      better: recentComments(f, 'better'),
      summary: buildSummary(scope, f, q),
    }
    // The lists are rebuilt on every render, so key on their sizes (submissions only ever add)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family, feedback.length, logs.length])

  // Only the admin role sees this; everyone else goes back to their own view.
  if (role !== 'admin') return <Navigate to="/today" replace />

  // Questions joiners chose to send to HR Direct or the screening team. Each one names the joiner, because they asked for a reply.
  const personas = repository.listPersonas()
  const requests = handoversTo(
    personas.flatMap((p) => repository.listEvents(p.id)),
    ['hr', 'screening'],
    today,
  )

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="h4" component="h1">
          Joiner insights
        </Typography>
        <Typography color="text.secondary" variant="body2">
          What new joiners tell us and ask us, so we can fix the process for the next one.
        </Typography>
      </Box>

      <Section title="Waiting for a reply" subtitle="Questions joiners chose to send to HR Direct or the screening team, with the summary they approved.">
        {requests.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nothing waiting. When a joiner asks the assistant for a person, it lands here.
          </Typography>
        ) : (
          <Stack spacing={1.5} component="ul" aria-label="Requests for HR Direct and screening" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {requests.map((r) => {
              const p = personas.find((x) => x.id === r.personaId)
              return (
                <Box component="li" key={r.personaId + r.at}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.25, flexWrap: 'wrap', rowGap: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {p?.firstName} {p?.lastName}
                    </Typography>
                    <Chip size="small" label={r.route === 'hr' ? 'HR Direct' : 'Screening team'} />
                    <Typography variant="caption" color="text.secondary">
                      {p?.role} · {formatShortDate(r.at.slice(0, 10))}
                    </Typography>
                  </Stack>
                  <Typography variant="body2">{r.summary}</Typography>
                </Box>
              )
            })}
          </Stack>
        )}
      </Section>

      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }} role="group" aria-label="Filter by role">
        {(['all', ...Object.keys(JOB_FAMILY_LABELS)] as FamilyFilter[]).map((f) => (
          <Chip
            key={f}
            label={f === 'all' ? 'All roles' : JOB_FAMILY_LABELS[f]}
            color={f === family ? 'primary' : 'default'}
            variant={f === family ? 'filled' : 'outlined'}
            onClick={() => setFamily(f)}
            aria-pressed={f === family}
          />
        ))}
      </Stack>

      <Section title="eNPS" subtitle={`Would they recommend Lloyds as a place to work? Day 30 answers, ${data.scope.toLowerCase()}.`}>
        {data.enps.score === null ? (
          <NotEnough />
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end' }}>
              <Typography variant="h2" component="p" sx={{ lineHeight: 1 }} aria-label={`eNPS ${data.enps.score}`}>
                {data.enps.score > 0 ? '+' : ''}
                {data.enps.score}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
                from {data.enps.n} answers
              </Typography>
            </Stack>
            <SplitBar stats={data.enps} />
            <Sparkline points={data.weekly} />
          </Stack>
        )}
      </Section>

      <Section title="How it feels across the first month" subtitle="Average mood, 1 to 5, at each check-in.">
        {data.mood.every((m) => m.avg === null) ? (
          <NotEnough />
        ) : (
          <Stack spacing={1.25}>
            {data.mood.map((m) => (
              <Stack key={m.milestone} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: 64 }}>
                  {m.milestone}
                </Typography>
                <Bar value={m.avg === null ? 0 : m.avg / 5} label={m.avg === null ? 'Too few answers' : `${m.avg} out of 5`} />
                <Typography variant="body2" sx={{ width: 32, textAlign: 'right', fontWeight: 700 }}>
                  {m.avg ?? '–'}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Section>

      <Section title="What joiners ask the assistant" subtitle={`${data.q.length} questions, grouped by topic. Never who asked or what they wrote.`}>
        {data.topics.length === 0 ? (
          <NotEnough />
        ) : (
          <Stack spacing={1.75} component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {data.topics.slice(0, 8).map((t) => (
              <Box component="li" key={t.topic}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.count}
                  </Typography>
                </Stack>
                <Bar value={t.count / data.topics[0].count} label={`${t.count} questions`} />
                <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
                  {t.change === 'rising' && <Chip size="small" color="warning" icon={<TrendingUpRounded />} label="Rising" />}
                  {t.change === 'falling' && <Chip size="small" icon={<TrendingDownRounded />} label="Falling" />}
                  {t.handoverRate >= 0.3 && <Chip size="small" variant="outlined" label={`${Math.round(t.handoverRate * 100)}% needed a person`} />}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          “Rising” compares the latest two weeks with the two before. “Needed a person” shows where the policies don’t answer the question.
        </Typography>
      </Section>

      <Section title="What joiners tell us" subtitle="Themes in the free-text answers.">
        {data.themes.length === 0 ? (
          <NotEnough />
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {data.themes.map((t) => (
                <Chip key={t.theme} label={`${t.label} · ${t.count}`} />
              ))}
            </Stack>
            <Comments title="What did we miss?" items={data.missed} />
            <Comments title="What could we do better?" items={data.better} />
          </Stack>
        )}
      </Section>

      <Recommendations key={data.scope} summary={data.summary} />

      <Typography variant="caption" color="text.secondary" sx={{ pb: 2 }}>
        Privacy: this view has no names and no question text. Any group with fewer than {MIN_COHORT} responses is hidden. Sample history is
        synthetic; new check-ins and assistant questions from this browser are added to it.
      </Typography>
    </Stack>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card component="section" aria-label={title}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

function NotEnough() {
  return (
    <Typography variant="body2" color="text.secondary">
      Not enough responses yet to show this without risking someone being identified (minimum {MIN_COHORT}).
    </Typography>
  )
}

/** Horizontal bar, 0 to 1. The label is for screen readers; the number sits next to it. */
function Bar({ value, label }: { value: number; label: string }) {
  return (
    <Box role="img" aria-label={label} sx={{ flex: 1, height: 10, bgcolor: 'action.hover', borderRadius: 5, overflow: 'hidden' }}>
      <Box sx={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 5 }} />
    </Box>
  )
}

function SplitBar({ stats }: { stats: ReturnType<typeof enpsStats> }) {
  const parts = [
    { key: 'Promoters', n: stats.promoters, color: 'primary.main' },
    { key: 'Passives', n: stats.passives, color: 'text.disabled' },
    { key: 'Detractors', n: stats.detractors, color: 'error.main' },
  ]
  return (
    <Box>
      <Stack
        direction="row"
        role="img"
        aria-label={parts.map((p) => `${p.n} ${p.key.toLowerCase()}`).join(', ')}
        sx={{ height: 12, borderRadius: 6, overflow: 'hidden', gap: '2px' }}
      >
        {parts.map((p) => (
          <Box key={p.key} sx={{ flex: p.n, bgcolor: p.color, minWidth: p.n ? 4 : 0 }} />
        ))}
      </Stack>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 0.75 }}>
        {parts.map((p) => (
          <Stack key={p.key} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color }} />
            <Typography variant="caption">
              {p.key} {p.n}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

/** Weekly eNPS as a small line. Weeks with too few answers are skipped. */
function Sparkline({ points }: { points: ReturnType<typeof weeklyEnps> }) {
  const shown = points.filter((p) => p.score !== null) as { weekStart: string; score: number; n: number }[]
  if (shown.length < 2) return null
  const w = 320
  const h = 70
  const pad = 6
  const lo = Math.min(...shown.map((p) => p.score), 0)
  const hi = Math.max(...shown.map((p) => p.score), 0)
  const x = (i: number) => pad + (i / (shown.length - 1)) * (w - pad * 2)
  const y = (s: number) => pad + (1 - (s - lo) / Math.max(1, hi - lo)) * (h - pad * 2)
  const first = shown[0]
  const last = shown.at(-1)!
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        Weekly trend
      </Typography>
      <Box
        component="svg"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`Weekly eNPS moved from ${first.score} in the week of ${formatShortDate(first.weekStart)} to ${last.score} in the week of ${formatShortDate(last.weekStart)}`}
        sx={{ width: '100%', display: 'block', color: 'primary.main' }}
      >
        <line x1={pad} x2={w - pad} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="3 3" />
        <polyline fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" points={shown.map((p, i) => `${x(i)},${y(p.score)}`).join(' ')} />
        {shown.map((p, i) => (
          <circle key={p.weekStart} cx={x(i)} cy={y(p.score)} r={3.5} fill="currentColor" />
        ))}
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {formatShortDate(first.weekStart)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatShortDate(last.weekStart)}
        </Typography>
      </Stack>
    </Box>
  )
}

function Comments({ title, items }: { title: string; items: ReturnType<typeof recentComments> }) {
  if (!items.length) return null
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {items.map((c) => (
          <Box key={c.id} sx={{ pl: 1.5, borderLeft: 3, borderColor: 'secondary.main' }}>
            <Typography variant="body2">“{c.text}”</Typography>
            <Typography variant="caption" color="text.secondary">
              {JOB_FAMILY_LABELS[c.jobFamily]} · {formatShortDate(c.at.slice(0, 10))}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

function Recommendations({ summary }: { summary: ReturnType<typeof buildSummary> }) {
  const baseline = useMemo(() => baselineRecommendations(summary), [summary])
  const [ai, setAi] = useState<{ items: Recommendation[]; mode: 'live' | 'offline' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const generate = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const res = await requestInsights({ summary })
      setAi({ items: res.recommendations, mode: res.mode })
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const items = ai?.items ?? baseline

  return (
    <Section title="Suggested changes" subtitle={`For ${summary.scope === 'All roles' ? 'all new joiners' : `${summary.scope.toLowerCase()} joiners`}, from the numbers above.`}>
      <Stack spacing={2}>
        <Stack spacing={1.5} component="ol" sx={{ m: 0, pl: 2.5 }}>
          {items.map((r) => (
            <Box component="li" key={r.title}>
              <Typography variant="subtitle2">{r.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {r.detail}
              </Typography>
            </Box>
          ))}
        </Stack>

        {failed && <Alert severity="warning">Couldn’t reach the AI service. These are the built-in suggestions.</Alert>}

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button variant="contained" color="secondary" startIcon={busy ? <CircularProgress size={16} /> : <AutoAwesomeRounded />} disabled={busy} onClick={() => void generate()}>
            {ai ? 'Write them again' : 'Write with Claude'}
          </Button>
          {ai && <Chip size="small" color={ai.mode === 'live' ? 'secondary' : 'default'} label={ai.mode === 'live' ? 'Live AI' : 'Built-in rules'} />}
          {!ai && <Chip size="small" label="Built-in rules" />}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Claude only sees the counts and themes on this page, nothing else.
        </Typography>
      </Stack>
    </Section>
  )
}
