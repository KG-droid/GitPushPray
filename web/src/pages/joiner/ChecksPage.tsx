import { Alert, Box, Button, Card, CardContent, Chip, IconButton, Stack, Typography } from '@mui/material'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import HourglassTopRounded from '@mui/icons-material/HourglassTopRounded'
import LightbulbRounded from '@mui/icons-material/LightbulbRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import PriorityHighRounded from '@mui/icons-material/PriorityHighRounded'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import CelebrationRounded from '@mui/icons-material/CelebrationRounded'
import { useNavigate } from 'react-router-dom'
import { useDemo } from '../../demo/useDemo'
import { daysUntil, formatShortDate } from '../../domain/dates'
import type { CheckView } from '../../domain/journey'
import type { CheckStatus } from '../../domain/types'
import { IdPhotoCard } from './IdPhotoCard'

const statusMeta: Record<CheckStatus, { label: string; color: 'default' | 'primary' | 'warning' | 'info' }> = {
  'not-started': { label: 'Not started', color: 'default' },
  'in-progress': { label: 'In progress', color: 'info' },
  'waiting-on-you': { label: 'Needs you', color: 'warning' },
  delayed: { label: 'Taking longer', color: 'warning' },
  cleared: { label: 'Cleared', color: 'primary' },
}

/** Parcel-tracking style view of pre-employment checks. Shows where each check is, never the results. */
export function ChecksPage() {
  const { journey } = useDemo()
  const navigate = useNavigate()
  const { checks, vettingCleared, vettingExpectedClearOn, today } = journey
  const cleared = checks.filter((c) => c.status === 'cleared').length
  const daysLeft = daysUntil(vettingExpectedClearOn, today)

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <IconButton aria-label="Back to journey" onClick={() => navigate('/journey')} edge="start">
          <ArrowBackRounded />
        </IconButton>
        <Typography variant="h5" component="h1">
          Your checks
        </Typography>
      </Stack>

      <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="overline" sx={{ opacity: 0.8 }}>
            {cleared} of {checks.length} cleared
          </Typography>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            {vettingCleared ? 'You’re all cleared 🎉' : `Expected by ${formatShortDate(vettingExpectedClearOn)}`}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {vettingCleared
              ? 'Everything is done. Pay set-up, system access and your ID badge are now unlocked.'
              : `About ${daysLeft} day${daysLeft === 1 ? '' : 's'} to go. Every bank colleague goes through these. It’s not about you — it’s the rules we follow to keep customers safe.`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mt: 2 }}>
            {checks.map((c) => (
              <Box
                key={c.id}
                sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: c.status === 'cleared' ? 'common.white' : 'rgba(255,255,255,0.25)' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }} aria-label="Checks">
        {checks.map((c) => (
          <CheckItem key={c.id} check={c} today={today} />
        ))}
        <Box component="li" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Node status={vettingCleared ? 'cleared' : 'not-started'} final />
          <Typography sx={{ fontWeight: 700, color: vettingCleared ? 'primary.main' : 'text.secondary' }}>
            {vettingCleared ? 'Cleared — welcome to the bank!' : 'All clear: your pay, access and badge unlock'}
          </Typography>
        </Box>
      </Box>

      <IdPhotoCard />

      <Alert icon={<LockRounded />} severity="success" variant="outlined" sx={{ borderRadius: '20px', bgcolor: 'background.paper' }}>
        We only show where each check is, never what it found. Results are seen by the screening team only.
      </Alert>

      <Button variant="outlined" onClick={() => navigate('/ask')}>
        Got a question about your checks?
      </Button>
    </Stack>
  )
}

function CheckItem({ check, today }: { check: CheckView; today: string }) {
  const meta = statusMeta[check.status]
  const open = check.status !== 'cleared'
  const daysLeft = daysUntil(check.expectedClearOn, today)

  return (
    <Box component="li" sx={{ display: 'flex', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
        <Node status={check.status} />
        <Box sx={{ flex: 1, width: 3, minHeight: 16, borderRadius: 2, bgcolor: check.status === 'cleared' ? 'primary.main' : 'divider' }} />
      </Box>
      <Box sx={{ flex: 1, pb: 2.5, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
          <Typography sx={{ fontWeight: 700 }}>{check.label}</Typography>
          <Chip size="small" label={meta.label} color={meta.color} variant={check.status === 'cleared' ? 'filled' : 'outlined'} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {check.explainer}
        </Typography>

        {open && (
          <Card variant="outlined" sx={{ mt: 1.25 }}>
            <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
                <ScheduleRounded fontSize="small" color="action" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {check.status === 'not-started'
                    ? `Starts soon · expected ${formatShortDate(check.expectedClearOn)}`
                    : `Expected around ${formatShortDate(check.expectedClearOn)}${daysLeft > 0 ? ` (${daysLeft} days)` : ''}`}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {check.status === 'delayed' && check.note ? `${check.note} ` : ''}
                {check.noNewsCopy}
              </Typography>
              {check.whatYouCanDo && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.25, alignItems: 'flex-start' }}>
                  <LightbulbRounded fontSize="small" color="secondary" />
                  <Typography variant="body2">
                    <strong>You can help:</strong> {check.whatYouCanDo}
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

function Node({ status, final = false }: { status: CheckStatus; final?: boolean }) {
  const Icon = final
    ? CelebrationRounded
    : status === 'cleared'
      ? CheckRounded
      : status === 'delayed' || status === 'waiting-on-you'
        ? PriorityHighRounded
        : HourglassTopRounded
  const filled = status === 'cleared'
  const warn = status === 'delayed' || status === 'waiting-on-you'
  return (
    <Box
      aria-hidden
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        bgcolor: filled ? 'primary.main' : 'background.paper',
        color: filled ? 'primary.contrastText' : warn ? 'warning.main' : status === 'in-progress' ? 'info.main' : 'text.disabled',
        border: filled ? 0 : 2,
        borderColor: warn ? 'warning.main' : status === 'in-progress' ? 'info.main' : 'divider',
      }}
    >
      <Icon sx={{ fontSize: 18 }} />
    </Box>
  )
}
