import { useState } from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ShieldRounded from '@mui/icons-material/ShieldRounded'
import { useNavigate } from 'react-router-dom'
import { IconTile } from '../../components/IconTile'
import { StepActions } from '../../components/StepActions'
import { StepSheet } from '../../components/StepSheet'
import { useDemo } from '../../demo/useDemo'
import { countdownLabel, daysUntil, formatShortDate } from '../../domain/dates'
import { NoticeCard } from '../../components/NoticeCard'
import { FeedbackPrompt } from '../../components/FeedbackPrompt'
import { GlossaryText } from '../../components/GlossaryText'
import { Day30Celebration } from '../../components/Day30Celebration'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function TodayPage() {
  const { journey } = useDemo()
  const navigate = useNavigate()
  const [openStep, setOpenStep] = useState<string | null>(null)
  const { persona, daysToStart, nextAction } = journey

  // Things someone else's action just unlocked (welcome pack, your buddy) come first.
  const unlockedContent = journey.steps
    .filter((s) => s.owner === 'joiner' && s.kind === 'content' && s.state === 'available')
    .sort((a, b) => Number(b.unlock.type === 'stepDone') - Number(a.unlock.type === 'stepDone'))
    .slice(0, 3)

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {greeting()}
        </Typography>
        <Typography variant="h4" component="h1">
          Hi {persona.firstName} 👋
        </Typography>
      </Box>

      {journey.notices.slice(0, 1).map((n) => (
        <NoticeCard key={n.at + n.kind} notice={n} />
      ))}

      <CountdownCard />

      {journey.steps.find((s) => s.id === 'day-30-checkin')?.state === 'done' && <Day30Celebration />}

      <FeedbackPrompt />

      <Box>
        <Typography variant="overline" color="text.secondary">
          Your next step
        </Typography>
        {nextAction ? (
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <IconTile name={nextAction.icon} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
                    {nextAction.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                    <GlossaryText text={nextAction.body} />
                  </Typography>
                  {/* key resets any half-made choice when the next action changes */}
                  <StepActions key={nextAction.id} step={nextAction} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <CheckCircleRounded color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">You’re all caught up</Typography>
                <Typography variant="body2" color="text.secondary">
                  Nothing needs you right now. We’ll let you know when something new unlocks.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {daysToStart > 0 && <VettingSummary onOpen={() => navigate('/journey/checks')} />}

      {unlockedContent.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Unlocked for you
          </Typography>
          <Stack spacing={1.25}>
            {unlockedContent.map((s) => (
              <Card key={s.id}>
                <CardActionArea onClick={() => setOpenStep(s.id)}>
                  <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1.75 }}>
                    <IconTile name={s.icon} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {s.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {s.body}
                      </Typography>
                    </Box>
                    <ChevronRightRounded color="action" />
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      <StepSheet stepId={openStep} onClose={() => setOpenStep(null)} />
    </Stack>
  )
}

function CountdownCard() {
  const { journey } = useDemo()
  const { persona, daysToStart, startDate } = journey
  const started = daysToStart <= 0
  const totalWait = Math.max(1, daysUntil(startDate, persona.offerAcceptedOn))
  const progress = started
    ? Math.min(100, ((-daysToStart + 1) / 30) * 100)
    : Math.min(100, Math.max(0, ((totalWait - daysToStart) / totalWait) * 100))
  const ringNumber = started ? -daysToStart + 1 : daysToStart
  const toDay30 = 30 - ringNumber

  return (
    <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3 }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={84}
            thickness={5}
            sx={{ color: 'rgba(255,255,255,0.2)', position: 'absolute' }}
          />
          <CircularProgress variant="determinate" value={progress} size={84} thickness={5} color="inherit" />
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <Box>
              {started && (
                <Typography variant="caption" sx={{ display: 'block', lineHeight: 1, opacity: 0.85 }}>
                  Day
                </Typography>
              )}
              <Typography variant="h5" component="span">
                {ringNumber}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box>
          <Typography variant="h6">
            {started
              ? toDay30 <= 0
                ? 'One month in!'
                : `${toDay30} day${toDay30 === 1 ? '' : 's'} to Day 30`
              : countdownLabel(daysToStart)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {started ? persona.team : `Starting ${formatShortDate(startDate)}`}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {persona.role} · {persona.location}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

function VettingSummary({ onOpen }: { onOpen: () => void }) {
  const { journey } = useDemo()
  const cleared = journey.checks.filter((c) => c.status === 'cleared').length
  const total = journey.checks.length
  const waitingOn = journey.checks.find((c) => c.status !== 'cleared')

  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        Your checks
      </Typography>
      <Card>
        <CardActionArea onClick={onOpen}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1.5 }}>
              <IconTile icon={<ShieldRounded color="primary" />} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {journey.vettingCleared ? 'All checks cleared 🎉' : `${cleared} of ${total} checks cleared`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {waitingOn
                    ? `${waitingOn.label}: expected around ${formatShortDate(waitingOn.expectedClearOn)}`
                    : 'You’re officially good to go.'}
                </Typography>
              </Box>
              <ChevronRightRounded color="action" />
            </Stack>
            <LinearProgress variant="determinate" value={(cleared / total) * 100} sx={{ height: 8, borderRadius: 4 }} />
            {waitingOn && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {waitingOn.noNewsCopy}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  )
}

