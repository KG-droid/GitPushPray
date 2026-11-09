import { Box, ButtonBase, Typography } from '@mui/material'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import { formatShortDate } from '../domain/dates'
import type { StepView } from '../domain/journey'
import { IconTile } from './IconTile'

/** One line in a stage: icon, title, and what state it's in. */
export function StepRow({
  step,
  onOpen,
  today,
  team = false,
}: {
  step: StepView
  onOpen?: () => void
  today: string
  /** Someone else's step, shown read-only to the joiner */
  team?: boolean
}) {
  const overdue = step.state === 'available' && step.dueDate && step.dueDate < today
  const secondary = team
    ? step.state === 'done'
      ? 'Done'
      : step.state === 'locked'
        ? step.teamHint ?? step.lockedHint ?? 'Not started yet'
        : `On their list${step.dueDate ? ` · by ${formatShortDate(step.dueDate)}` : ''}`
    : step.state === 'done'
      ? step.options?.find((o) => o.value === step.value)?.label ?? (step.kind === 'content' ? 'Read' : 'Done')
      : step.state === 'locked'
        ? step.lockedHint ?? 'Unlocks later'
        : step.dueDate
          ? `${overdue ? 'Was due' : 'By'} ${formatShortDate(step.dueDate)}`
          : step.kind === 'content'
            ? 'New for you'
            : 'Ready for you'

  return (
    <ButtonBase
      onClick={onOpen}
      disabled={!onOpen}
      sx={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 3,
        p: 1,
        gap: 1.5,
        display: 'flex',
        justifyContent: 'flex-start',
        '&:hover': { bgcolor: onOpen ? 'action.hover' : undefined },
      }}
    >
      <IconTile name={step.icon} muted={step.state !== 'available'} size={40} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: step.state === 'locked' ? 'text.secondary' : 'text.primary',
            textDecoration: step.state === 'done' && step.kind !== 'content' ? 'line-through' : undefined,
            textDecorationColor: 'rgba(0,0,0,0.3)',
          }}
        >
          {step.title}
        </Typography>
        <Typography variant="caption" sx={{ color: overdue ? 'warning.main' : 'text.secondary', display: 'block' }}>
          {secondary}
        </Typography>
      </Box>
      {step.state === 'done' ? (
        <CheckCircleRounded color="primary" fontSize="small" aria-label="Done" />
      ) : step.state === 'locked' ? (
        <LockRounded color="disabled" fontSize="small" aria-label="Locked" />
      ) : team ? null : (
        <ChevronRightRounded color="action" />
      )}
    </ButtonBase>
  )
}
