import { useState } from 'react'
import { Alert, Box, Card, CardContent, Checkbox, FormControlLabel, IconButton, LinearProgress, Stack, Typography } from '@mui/material'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ForumRounded from '@mui/icons-material/ForumRounded'
import ShieldRounded from '@mui/icons-material/ShieldRounded'
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded'
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded'
import TrendingFlatRounded from '@mui/icons-material/TrendingFlatRounded'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { IconTile } from '../../components/IconTile'
import { PersonAvatar } from '../../components/PersonAvatar'
import { StepRow } from '../../components/StepRow'
import { countdownLabel, formatShortDate } from '../../domain/dates'
import { firstWeekEssentials } from '../../domain/manager'
import { ManagerTaskSheet } from './ManagerTaskSheet'
import { StatusChip } from './StatusChip'
import { useManager } from './useManager'

/** M2–M4: what's left for one joiner, their progress (not their private detail), and the Day-30 signal. */
export function ManagerJoinerPage() {
  const { personaId = '' } = useParams()
  const navigate = useNavigate()
  const { views } = useManager()
  const [openTask, setOpenTask] = useState<string | null>(null)
  const [essentials, setEssentials] = useState<boolean[]>(() => firstWeekEssentials.map(() => false))

  const view = views.find((v) => v.journey.persona.id === personaId)
  if (!view) return <Navigate to="/manager" replace />
  const { journey } = view
  const p = journey.persona
  const started = journey.daysToStart <= 0

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <IconButton aria-label="Back to your joiners" edge="start" onClick={() => navigate('/manager')}>
          <ArrowBackRounded />
        </IconButton>
        <PersonAvatar name={`${p.firstName} ${p.lastName}`} size={48} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="h1" sx={{ lineHeight: 1.2 }}>
            {p.firstName} {p.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {p.role} · {started ? `Day ${-journey.daysToStart + 1}` : `${countdownLabel(journey.daysToStart)}, ${formatShortDate(journey.startDate)}`}
          </Typography>
          <Box sx={{ mt: 0.75 }}>
            <StatusChip status={view.status} />
          </Box>
        </Box>
      </Stack>

      {view.askedForYou.length > 0 && (
        <Card sx={{ borderColor: 'secondary.main', borderWidth: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <IconTile icon={<ForumRounded color="secondary" />} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {p.firstName} asked for you
                </Typography>
                {view.askedForYou.map((h) => (
                  <Typography key={h.at} variant="body2" sx={{ mt: 0.5 }}>
                    {h.summary}
                  </Typography>
                ))}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  They chose to send you this from the assistant. A quick reply, or a catch-up, is the best answer.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {view.startDateMoved && (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: '20px', bgcolor: 'background.paper' }}>
          Start date moved from {formatShortDate(view.startDateMoved.from)} to <strong>{formatShortDate(view.startDateMoved.to)}</strong>. Your
          task due dates have moved with it, and {p.firstName} has been told why.
        </Alert>
      )}

      {!started && journey.daysToStart <= 7 && (
        <Card sx={{ borderColor: 'secondary.main', borderWidth: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Before {p.firstName}’s first day
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Google found new joiners whose managers did these got up to speed about a month sooner.
            </Typography>
            {firstWeekEssentials.map((e, i) => (
              <FormControlLabel
                key={e}
                sx={{ display: 'flex', mr: 0 }}
                control={<Checkbox size="small" checked={essentials[i]} onChange={() => setEssentials((xs) => xs.map((x, j) => (j === i ? !x : x)))} />}
                label={<Typography variant="body2">{e}</Typography>}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Box>
        <Typography variant="overline" color="text.secondary">
          What’s left for you · {view.tasksDone}/{view.tasks.length} done
        </Typography>
        <Card>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            {view.tasks.map((t) => (
              <StepRow key={t.id} step={t} today={journey.today} onOpen={() => setOpenTask(t.id)} />
            ))}
          </CardContent>
        </Card>
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">
          {p.firstName}’s progress
        </Typography>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
              <IconTile icon={<ShieldRounded color="primary" />} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {view.vetting.cleared ? 'Checks cleared' : view.vetting.delayed ? 'Checks taking longer' : 'Checks in progress'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {view.vetting.cleared
                    ? 'Access and badge requests are unlocked.'
                    : `Expected by ${formatShortDate(view.vetting.expectedBy)}. The screening team will contact you if anything needs your input.`}
                </Typography>
              </Box>
            </Stack>

            <Typography variant="body2" sx={{ mb: 0.75 }}>
              {p.firstName} has done {view.joinerDone} of {view.joinerTotal} of their steps
            </Typography>
            <LinearProgress
              variant="determinate"
              value={view.joinerTotal ? (view.joinerDone / view.joinerTotal) * 100 : 0}
              sx={{ height: 8, borderRadius: 4, mb: 1.5 }}
              aria-label={`${p.firstName}'s progress`}
            />
            {view.sharedChoices.map((c) => (
              <Typography key={c.label} variant="body2">
                {c.label}: <strong>{c.value}</strong>
              </Typography>
            ))}
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, color: 'text.secondary', alignItems: 'flex-start' }}>
              <VisibilityOffRounded sx={{ fontSize: 16, mt: 0.25 }} />
              <Typography variant="caption">
                Private to {p.firstName}: check results, benefit choices, chats with their buddy and questions to the assistant, unless they choose to send you one.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {started && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Connected and confident
          </Typography>
          <Card>
            <CardContent>
              {view.pulse ? (
                <>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                    {view.pulse.trend === 'up' ? (
                      <TrendingUpRounded color="primary" />
                    ) : view.pulse.trend === 'down' ? (
                      <TrendingDownRounded color="warning" />
                    ) : (
                      <TrendingFlatRounded color="action" />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {view.pulse.trend === 'up' ? 'Growing in confidence' : view.pulse.trend === 'down' ? 'Might need some support' : 'Holding steady'}
                    </Typography>
                  </Stack>
                  <PulseBar label="Knows who to ask" value={view.pulse.knowWhoToAsk} />
                  <PulseBar label="Feels confident in their role" value={view.pulse.confident} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Average of {view.pulse.responses} check-ins. You see the trend, never individual answers.
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {p.firstName}’s first two-question check-in arrives after week two. You’ll see the trend here.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      <ManagerTaskSheet journey={journey} stepId={openTask} onClose={() => setOpenTask(null)} />
    </Stack>
  )
}

function PulseBar({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {value}/5
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={(value / 5) * 100} color="secondary" sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  )
}
