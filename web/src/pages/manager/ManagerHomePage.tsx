import { Box, Card, CardActionArea, CardContent, LinearProgress, Stack, Typography } from '@mui/material'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import EventRepeatRounded from '@mui/icons-material/EventRepeatRounded'
import RocketLaunchRounded from '@mui/icons-material/RocketLaunchRounded'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import { useNavigate } from 'react-router-dom'
import { IconTile } from '../../components/IconTile'
import { cardGridSx } from '../../components/layout'
import { PersonAvatar } from '../../components/PersonAvatar'
import { countdownLabel, formatShortDate } from '../../domain/dates'
import type { Nudge } from '../../domain/manager'
import { StatusChip } from './StatusChip'
import { useManager } from './useManager'

/** M1: the hiring manager's companion — what needs them, and how each joiner is doing. */
export function ManagerHomePage() {
  const { manager, views, nudges } = useManager()
  const navigate = useNavigate()
  const needYou = views.reduce((n, v) => n + v.urgent.length, 0)

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {manager?.role}
        </Typography>
        <Typography variant="h4" component="h1">
          Hi {manager?.name.split(' ')[0]} 👋
        </Typography>
        <Typography color="text.secondary">
          {views.length} joiner{views.length === 1 ? '' : 's'} ·{' '}
          {needYou ? `${needYou} thing${needYou === 1 ? '' : 's'} need${needYou === 1 ? 's' : ''} you this week` : 'nothing urgent this week'}
        </Typography>
      </Box>

      {nudges.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            For you today
          </Typography>
          <Box sx={cardGridSx}>
            {nudges.slice(0, 4).map((n, i) => (
              <NudgeCard key={i} nudge={n} onOpen={() => navigate(`/manager/joiner/${n.personaId}`)} />
            ))}
          </Box>
        </Box>
      )}

      <Box>
        <Typography variant="overline" color="text.secondary">
          Your joiners
        </Typography>
        <Box sx={cardGridSx} role="list" aria-label="Your joiners">
          {views.map((v) => {
            const p = v.journey.persona
            return (
              <Card key={p.id} role="listitem">
                <CardActionArea onClick={() => navigate(`/manager/joiner/${p.id}`)}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
                      <PersonAvatar name={`${p.firstName} ${p.lastName}`} size={44} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {p.firstName} {p.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {v.journey.daysToStart > 0 ? `${countdownLabel(v.journey.daysToStart)} (${formatShortDate(v.journey.startDate)})` : `Day ${-v.journey.daysToStart + 1}`}
                        </Typography>
                      </Box>
                      <ChevronRightRounded color="action" />
                    </Stack>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                      <StatusChip status={v.status} />
                      <LinearProgress
                        variant="determinate"
                        value={v.tasks.length ? (v.tasksDone / v.tasks.length) * 100 : 100}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        aria-label="Your tasks done"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {v.tasksDone}/{v.tasks.length} tasks
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            )
          })}
        </Box>
      </Box>
    </Stack>
  )
}

function NudgeCard({ nudge, onOpen }: { nudge: Nudge; onOpen: () => void }) {
  const content =
    nudge.kind === 'first-week'
      ? {
          icon: <RocketLaunchRounded color="secondary" />,
          title: `${nudge.name} starts ${nudge.daysToStart === 1 ? 'tomorrow' : `in ${nudge.daysToStart} days`}`,
          body: 'Five things make the biggest difference in the first week. Takes 10 minutes.',
        }
      : nudge.kind === 'date-moved'
        ? {
            icon: <EventRepeatRounded color="info" />,
            title: `${nudge.name}’s start moved to ${formatShortDate(nudge.to)}`,
            body: 'We’ve moved your tasks to match and told them why. A quick message from you helps.',
          }
        : {
            icon: <ScheduleRounded color={nudge.overdue ? 'warning' : 'primary'} />,
            title: `${nudge.task.title} for ${nudge.name}`,
            body: `${nudge.overdue ? 'Was due' : 'Due'} ${formatShortDate(nudge.task.dueDate!)}${nudge.task.minutes ? ` · ${nudge.task.minutes} min` : ''}`,
          }

  return (
    <Card sx={nudge.kind === 'first-week' ? { borderColor: 'secondary.main', borderWidth: 2 } : undefined}>
      <CardActionArea onClick={onOpen}>
        <CardContent sx={{ display: 'flex', gap: 1.75, alignItems: 'center', py: 1.75 }}>
          <IconTile icon={content.icon} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {content.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {content.body}
            </Typography>
          </Box>
          <ChevronRightRounded color="action" />
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
