import { Chip } from '@mui/material'
import type { JoinerStatus } from '../../domain/manager'

const meta: Record<JoinerStatus, { label: string; color: 'warning' | 'info' | 'primary' | 'secondary' }> = {
  'needs-you': { label: 'Needs you', color: 'warning' },
  'waiting-on-checks': { label: 'Waiting on checks', color: 'info' },
  'on-track': { label: 'On track', color: 'primary' },
  started: { label: 'Started', color: 'secondary' },
}

export function StatusChip({ status }: { status: JoinerStatus }) {
  const m = meta[status]
  return <Chip size="small" label={m.label} color={m.color} variant={status === 'needs-you' ? 'filled' : 'outlined'} />
}
