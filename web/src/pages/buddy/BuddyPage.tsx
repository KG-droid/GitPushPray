import { Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import CelebrationRounded from '@mui/icons-material/CelebrationRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import EventRepeatRounded from '@mui/icons-material/EventRepeatRounded'
import ForumRounded from '@mui/icons-material/ForumRounded'
import HourglassBottomRounded from '@mui/icons-material/HourglassBottomRounded'
import MoodBadRounded from '@mui/icons-material/MoodBadRounded'
import WavingHandRounded from '@mui/icons-material/WavingHandRounded'
import { useState, type ReactNode } from 'react'
import { IconTile } from '../../components/IconTile'
import { PersonAvatar } from '../../components/PersonAvatar'
import { StepRow } from '../../components/StepRow'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { formatShortDate } from '../../domain/dates'
import { buddyView, type BuddyAlert } from '../../domain/buddy'
import type { MeetupKind } from '../../domain/types'

const MEETUP_TARGET = 8
const meetupLabels: Record<MeetupKind, string> = { coffee: '☕ Coffee', call: '📞 Call', lunch: '🥪 Lunch', walk: '🚶 Walk' }

/** B1–B3: the buddy's companion — who they're looking after, when to step in, and how often they've met. */
export function BuddyPage() {
  const { journey, logMeetup, completeStep } = useDemo()
  const [introsDone, setIntrosDone] = useState(false)
  const { persona } = journey
  const buddy = persona.buddyId ? repository.getPerson(persona.buddyId) : undefined
  const assigned = journey.steps.find((s) => s.id === 'mgr-assign-buddy')?.state === 'done'

  if (!buddy || !assigned) {
    return (
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Typography variant="h4" component="h1">
          Buddy view
        </Typography>
        <Card sx={{ borderStyle: 'dashed' }}>
          <CardContent>
            <Typography>
              {persona.firstName}’s manager hasn’t matched them with a buddy yet. Once they do, their buddy will see {persona.firstName} here.
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    )
  }

  const view = buddyView(journey, repository.listEvents(persona.id))
  const started = journey.daysToStart <= 0
  const fullName = `${persona.firstName} ${persona.lastName}`
  const reasons = matchReasons(buddy.bio, buddy.askMeAbout, persona.location)

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {buddy.role}
        </Typography>
        <Typography variant="h4" component="h1">
          Hi {buddy.name.split(' ')[0]} 👋
        </Typography>
        <Typography color="text.secondary">You’re {persona.firstName}’s buddy. Thank you!</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1.5 }}>
            <PersonAvatar name={fullName} size={56} />
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                {fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {persona.role} · {persona.location}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {started ? `Day ${-journey.daysToStart + 1}` : `Starts ${formatShortDate(journey.startDate)} (${journey.daysToStart} days)`}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Why you were matched
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
            {reasons.map((r) => (
              <Chip key={r} size="small" label={r} />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {view.graduating && (
        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
              <CelebrationRounded />
              <Typography variant="h6">{persona.firstName} is nearly at Day 30</Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.92, mb: 2 }}>
              Time to widen their circle: introduce {persona.firstName} to two people outside the team, then hand over to the wider team.
              You’re still their go-to for a coffee.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              disabled={introsDone}
              startIcon={introsDone ? <CheckRounded /> : undefined}
              onClick={() => setIntrosDone(true)}
            >
              {introsDone ? 'Introductions made' : 'I’ve made the introductions'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Box>
        <Typography variant="overline" color="text.secondary">
          Time to step in
        </Typography>
        {view.alerts.length ? (
          <Stack spacing={1.25} aria-label="Step-in alerts" role="list">
            {view.alerts.map((a, i) => (
              <AlertCard key={i} alert={a} name={persona.firstName} />
            ))}
          </Stack>
        ) : (
          <Card>
            <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <CheckRounded color="primary" />
              <Typography variant="body2">Nothing needs you right now. {persona.firstName} seems to be settling in.</Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary">
          Your meetups
        </Typography>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', mb: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                <CircularProgress variant="determinate" value={100} size={76} thickness={5} sx={{ color: 'action.hover', position: 'absolute' }} />
                <CircularProgress
                  variant="determinate"
                  value={Math.min(100, (view.meetups.length / MEETUP_TARGET) * 100)}
                  size={76}
                  thickness={5}
                  color="secondary"
                  aria-label={`${view.meetups.length} meetups`}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                  <Typography variant="h5" component="span">
                    {view.meetups.length}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {view.meetupLevel.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="p">
                  Microsoft found 97% of new joiners who met their buddy more than 8 times in 90 days said it helped them get productive
                  quickly, compared with 56% after a single meeting.
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Log a meetup
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {(Object.keys(meetupLabels) as MeetupKind[]).map((k) => (
                <Chip key={k} label={meetupLabels[k]} onClick={() => logMeetup(k)} variant="outlined" />
              ))}
            </Stack>
            {view.meetups.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                Recent:{' '}
                {view.meetups
                  .slice(-3)
                  .reverse()
                  .map((m) => `${meetupLabels[m.kind].split(' ')[1]} ${formatShortDate(m.at)}`)
                  .join(' · ')}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {view.tasks.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Your buddy checklist
          </Typography>
          <Card>
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              {view.tasks.map((t) => (
                <StepRow
                  key={t.id}
                  step={t}
                  today={journey.today}
                  onOpen={t.state === 'available' ? () => completeStep(t.id, { by: 'buddy' }) : undefined}
                />
              ))}
            </CardContent>
          </Card>
        </Box>
      )}

      <Box>
        <Typography variant="overline" color="text.secondary">
          What you can see
        </Typography>
        <Card>
          <CardContent>
            <Visibility yes>Their name, role, start date and where they are in their journey</Visibility>
            <Visibility yes>Nudges when it’s a good moment to check in</Visibility>
            <Visibility yes>Questions {persona.firstName} chose to send to you</Visibility>
            <Visibility>Their checks, pay, benefits or goals</Visibility>
            <Visibility>Their answers to check-ins, or what they ask the assistant</Visibility>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}

function AlertCard({ alert, name }: { alert: BuddyAlert; name: string }) {
  const content: { icon: ReactNode; title: string; body: string; highlight?: boolean } = (() => {
    switch (alert.kind) {
      case 'asked-for-you':
        return { icon: <ForumRounded color="secondary" />, title: `${name} asked for you`, body: alert.summary, highlight: true }
      case 'date-moved':
        return {
          icon: <EventRepeatRounded color="info" />,
          title: `${name}’s start moved to ${formatShortDate(alert.to)}`,
          body: 'Waiting longer can be unsettling. A quick “no worries, see you soon” message goes a long way.',
        }
      case 'no-hello':
        return {
          icon: <WavingHandRounded color="primary" />,
          title: `${name} starts in ${alert.daysToStart} days`,
          body: 'They haven’t said hello yet. Why not message first? New joiners often wait to be invited.',
        }
      case 'day-3':
        return { icon: <WavingHandRounded color="primary" />, title: 'It’s Day 3', body: 'Day 3 is when the excitement wears off and the questions start. Drop by.' }
      case 'week-one-end':
        return { icon: <CheckRounded color="primary" />, title: 'End of week one', body: `Ask ${name} how the week went, and what surprised them.` }
      case 'quiet':
        return {
          icon: <HourglassBottomRounded color="warning" />,
          title: `No meetup for ${alert.days} days`,
          body: `Might be worth a coffee. A regular catch-up is what makes buddies work.`,
        }
      case 'pulse-down':
        return {
          icon: <MoodBadRounded color="warning" />,
          title: `${name} might need some support`,
          body: 'Their recent check-ins are trending down. You won’t see their answers, but a friendly chat could help.',
        }
    }
  })()

  return (
    <Card role="listitem" sx={content.highlight ? { borderColor: 'secondary.main', borderWidth: 2 } : undefined}>
      <CardContent sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start', py: 1.75, '&:last-child': { pb: 1.75 } }}>
        <IconTile icon={content.icon} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {content.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {content.body}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

function Visibility({ yes = false, children }: { yes?: boolean; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', mb: 0.75 }}>
      {yes ? <CheckRounded fontSize="small" color="primary" /> : <CloseRounded fontSize="small" color="disabled" />}
      <Typography variant="body2" color={yes ? 'text.primary' : 'text.secondary'}>
        {children}
      </Typography>
    </Stack>
  )
}

function matchReasons(bio: string | undefined, interests: string[] | undefined, location: string): string[] {
  const reasons = [`Same location: ${location.split(',')[0]}`]
  if (bio && /joined|did the same|started on the same|last year|months ago/i.test(bio)) reasons.push('Joined recently, remembers week one')
  if (interests?.length) reasons.push(`Can help with: ${interests[0].toLowerCase()}`)
  return reasons
}
