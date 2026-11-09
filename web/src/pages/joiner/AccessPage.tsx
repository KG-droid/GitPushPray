import { Alert, Box, Button, Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material'
import LooksOneRounded from '@mui/icons-material/LooksOneRounded'
import LooksTwoRounded from '@mui/icons-material/LooksTwoRounded'
import Looks3Rounded from '@mui/icons-material/Looks3Rounded'
import { useNavigate } from 'react-router-dom'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { accessProgress, requestedItems, summariseAccess } from '../../domain/access'
import { addDays, formatShortDate } from '../../domain/dates'
import { SubPageHeader } from '../explore/SubPageHeader'

const first = (name: string) => name.split(' ')[0]

/** Progress only: the joiner sees how much of their access is ready, not the systems behind it (their manager sees those). */
export function AccessPage() {
  const { journey } = useDemo()
  const navigate = useNavigate()
  const { persona } = journey
  const manager = repository.getPerson(persona.managerId)
  const managerName = manager ? first(manager.name) : 'Your manager'
  const request = journey.steps.find((s) => s.id === 'mgr-request-access')
  const requested = request?.state === 'done' && request.doneAt
  const started = journey.daysToStart <= 0

  const progress = requested ? accessProgress(requestedItems(persona.jobFamily, request.value), request.doneAt!, journey.today, journey.startDate) : []
  const summary = summariseAccess(progress)

  const how = [
    { icon: <LooksOneRounded color="primary" />, title: `${managerName} asks once`, body: 'One request based on your role and what your team already uses. You don’t fill in any forms.' },
    { icon: <LooksTwoRounded color="primary" />, title: 'Each owner approves their part', body: 'Every system is run by a different team. We split the request, send each part to its owner and track them all for you.' },
    { icon: <Looks3Rounded color="primary" />, title: 'You sign in once', body: 'On Day 1 you set up your work account with IT. That one sign-in opens everything that’s ready.' },
  ]

  // When the last in-progress item should be set up (training, if any, comes after and has its own row).
  const lastReadyOn = progress
    .filter((p) => p.status === 'with-approver' || p.status === 'setting-up')
    .map((p) => addDays(request!.doneAt!, p.route.readyDays))
    .reduce((max, d) => (d > max ? d : max), '')
  const rows = [
    { count: summary.ready, label: started ? 'Working now' : 'Ready for Day 1', note: 'Set up and waiting for your first sign-in.' },
    { count: summary.inProgress, label: 'Being approved or set up', note: lastReadyOn ? `Expected by ${formatShortDate(lastReadyOn)}.` : '' },
    { count: summary.afterTraining, label: 'Switches on after training', note: 'Some tools need a short course first. It’s booked into your first week.' },
  ]

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader
        title="Your system access"
        subtitle={requested ? `Requested by ${managerName} on ${formatShortDate(request.doneAt!)}` : persona.team}
        back="/journey"
      />

      {requested ? (
        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography variant="subtitle1" component="p" sx={{ fontWeight: 700 }}>
              {summary.ready} of {summary.total} {started ? 'working now' : 'ready for Day 1'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              {summary.ready === summary.total
                ? 'Everything is set up. There’s nothing you need to do.'
                : [
                    summary.inProgress ? `${summary.inProgress} still with ${summary.inProgress === 1 ? 'its owner' : 'their owners'}` : '',
                    summary.afterTraining ? `${summary.afterTraining} switch${summary.afterTraining === 1 ? 'es' : ''} on after training` : '',
                  ].filter(Boolean).join(', ') + '. There’s nothing you need to chase.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info" variant="outlined" sx={{ borderRadius: '20px', bgcolor: 'background.paper' }}>
          {request?.state === 'available'
            ? `Your checks have cleared, so ${managerName} can now request your access. You’ll see each system here as soon as that’s done.`
            : `Access can only be requested once your checks have cleared. ${managerName} will do it then, and you’ll see each system here.`}
        </Alert>
      )}

      {summary.late.length > 0 && (
        <Alert severity="warning" variant="outlined" sx={{ borderRadius: '20px', bgcolor: 'background.paper' }}>
          {summary.late.length === 1 ? '1 item may' : `${summary.late.length} items may`} not be ready on Day 1. {managerName} can see this too
          and will chase the owner, and your first days are planned around it.
        </Alert>
      )}

      {requested && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, mb: 1 }}>Progress</Typography>
            <LinearProgress
              variant="determinate"
              value={summary.total ? (summary.ready / summary.total) * 100 : 0}
              aria-label="Access ready"
              sx={{ height: 10, borderRadius: 5, mb: 1.5 }}
            />
            <Stack spacing={0.75} component="ul" aria-label="Access progress" sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {rows.filter((r) => r.count > 0).map((r) => (
                <Stack key={r.label} component="li" direction="row" spacing={1.5} sx={{ alignItems: 'baseline' }}>
                  <Typography variant="subtitle2" sx={{ minWidth: 20, fontWeight: 700 }}>{r.count}</Typography>
                  <Box>
                    <Typography variant="body2">{r.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.note}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>How it works</Typography>
          <Stack spacing={1.5}>
            {how.map((h) => (
              <Stack key={h.title} direction="row" spacing={1.5}>
                {h.icon}
                <Box>
                  <Typography variant="subtitle2" component="h3">{h.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{h.body}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {manager && (
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" component="h2">Something missing, or not working?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Tell {managerName}. Extra access goes through the same single request, so you never have to find the right team yourself.
            </Typography>
            <Button variant="outlined" onClick={() => navigate(`/people/chat/${manager.id}`)}>Message {managerName}</Button>
          </CardContent>
        </Card>
      )}

      <Typography variant="caption" color="text.secondary">
        Systems, owners and timings are illustrative for the demo. In real use each status would come from the system that owns it.
      </Typography>
    </Stack>
  )
}
