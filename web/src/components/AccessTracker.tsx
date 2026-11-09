import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { progressBySystem } from '../domain/access'
import type { AccessProgress, AccessStatus } from '../domain/access'
import { formatShortDate } from '../domain/dates'

const statusChip: Record<AccessStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' }> = {
  'with-approver': { label: 'With approver', color: 'default' },
  'setting-up': { label: 'Being set up', color: 'info' },
  'after-training': { label: 'After training', color: 'warning' },
  ready: { label: 'Ready', color: 'success' },
}

function detail(p: AccessProgress): string | undefined {
  if (p.status === 'ready') return undefined
  if (p.status === 'after-training') return `Switches on after ${p.training}, around ${formatShortDate(p.readyOn)}`
  return `Expected ${formatShortDate(p.readyOn)}${p.training ? `, after ${p.training}` : ''}`
}

/** Every requested item grouped by the system that owns it, with who approves and where it has got to. */
export function AccessTracker({ progress, dense = false }: { progress: AccessProgress[]; dense?: boolean }) {
  return (
    <Stack spacing={dense ? 1 : 1.5} component="ul" aria-label="Access by system" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {progressBySystem(progress).map((g) => (
        <Card component="li" key={g.system} variant={dense ? 'outlined' : undefined}>
          <CardContent sx={{ p: dense ? 1.5 : 2, '&:last-child': { pb: dense ? 1.5 : 2 } }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700 }}>{g.system}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                {g.route.automatic ? 'Automatic' : 'Approved by'} · {g.route.owner}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.25, mb: 1 }}>{g.route.how}</Typography>
            <Stack spacing={1}>
              {g.items.map((p) => (
                <Stack key={p.item.id} direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2">{p.item.label}</Typography>
                    {detail(p) && (
                      <Typography variant="caption" color={p.lateForDayOne ? 'warning.main' : 'text.secondary'} component="div">
                        {detail(p)}{p.lateForDayOne ? ' (after Day 1)' : ''}
                      </Typography>
                    )}
                  </Box>
                  <Chip size="small" label={statusChip[p.status].label} color={statusChip[p.status].color} variant={p.status === 'ready' ? 'filled' : 'outlined'} sx={{ flexShrink: 0 }} />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}
