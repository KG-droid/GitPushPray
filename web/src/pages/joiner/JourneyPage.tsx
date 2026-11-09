import { useState } from 'react'
import { Box, ButtonBase, Card, CardActionArea, CardContent, Chip, Collapse, Stack, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import ShieldRounded from '@mui/icons-material/ShieldRounded'
import { useNavigate } from 'react-router-dom'
import { IconTile } from '../../components/IconTile'
import { NoticeCard } from '../../components/NoticeCard'
import { StepRow } from '../../components/StepRow'
import { StepSheet } from '../../components/StepSheet'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { formatShortDate } from '../../domain/dates'
import { STAGES, type StageView } from '../../domain/journey'

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(17, 182, 122, 0.55); }
  70% { box-shadow: 0 0 0 10px rgba(17, 182, 122, 0); }
  100% { box-shadow: 0 0 0 0 rgba(17, 182, 122, 0); }
`

export function JourneyPage() {
  const { journey } = useDemo()
  const navigate = useNavigate()
  const [openStep, setOpenStep] = useState<string | null>(null)
  // Stages the user has toggled; the current stage is open unless they've closed it.
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const currentIndex = STAGES.findIndex((s) => s.id === journey.currentStage)
  const isOpen = (s: StageView) => toggled[s.id] ?? s.status === 'current'

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="h4" component="h1">
          Your journey
        </Typography>
        <Typography color="text.secondary">
          Stage {currentIndex + 1} of {STAGES.length} · {STAGES[currentIndex].title}
        </Typography>
      </Box>

      {journey.notices.map((n) => (
        <NoticeCard key={n.at + n.kind} notice={n} />
      ))}

      <Card>
        <CardActionArea onClick={() => navigate('/journey/checks')}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
            <IconTile icon={<ShieldRounded color="primary" />} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {journey.vettingCleared ? 'All checks cleared' : 'Track your checks'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {journey.vettingCleared
                  ? 'You’re good to go.'
                  : `${journey.checks.filter((c) => c.status === 'cleared').length} of ${journey.checks.length} cleared · all expected by ${formatShortDate(journey.vettingExpectedClearOn)}`}
              </Typography>
            </Box>
            <ChevronRightRounded color="action" />
          </CardContent>
        </CardActionArea>
      </Card>

      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }} aria-label="Journey stages">
        {journey.stages.map((stage, i) => (
          <StageItem
            key={stage.id}
            stage={stage}
            index={i}
            isLast={i === journey.stages.length - 1}
            open={isOpen(stage)}
            onToggle={() => setToggled((t) => ({ ...t, [stage.id]: !isOpen(stage) }))}
            onOpenStep={setOpenStep}
          />
        ))}
      </Box>

      <StepSheet stepId={openStep} onClose={() => setOpenStep(null)} />
    </Stack>
  )
}

function StageItem({
  stage,
  index,
  isLast,
  open,
  onToggle,
  onOpenStep,
}: {
  stage: StageView
  index: number
  isLast: boolean
  open: boolean
  onToggle: () => void
  onOpenStep: (id: string) => void
}) {
  const { journey } = useDemo()
  const mine = stage.steps.filter((s) => s.owner === 'joiner')
  const others = stage.steps.filter((s) => s.owner !== 'joiner')
  const actionable = stage.steps.filter((s) => s.kind !== 'content')
  const done = actionable.filter((s) => s.state === 'done').length
  const manager = repository.getPerson(journey.persona.managerId)
  const buddy = journey.persona.buddyId ? repository.getPerson(journey.persona.buddyId) : undefined
  const firstName = (name?: string) => name?.split(' ')[0]

  return (
    <Box component="li" sx={{ display: 'flex', gap: 2 }}>
      {/* Rail: node + connecting line */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
        <Box
          aria-hidden
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: 14,
            mt: 1.25,
            ...(stage.status === 'done' && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
            ...(stage.status === 'current' && {
              bgcolor: 'background.paper',
              border: 3,
              borderColor: 'secondary.main',
              color: 'secondary.main',
              animation: `${pulse} 2s infinite`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }),
            ...(stage.status === 'upcoming' && { border: 2, borderColor: 'divider', color: 'text.secondary' }),
          }}
        >
          {stage.status === 'done' ? <CheckRounded fontSize="small" /> : index + 1}
        </Box>
        {!isLast && (
          <Box
            sx={{
              flex: 1,
              width: 3,
              borderRadius: 2,
              minHeight: 24,
              bgcolor: stage.status === 'done' ? 'primary.main' : 'divider',
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 2 }}>
        <ButtonBase
          onClick={onToggle}
          aria-expanded={open}
          sx={{ width: '100%', textAlign: 'left', borderRadius: 3, py: 1, px: 0.5, justifyContent: 'flex-start', gap: 1 }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: stage.status === 'upcoming' ? 'text.secondary' : 'text.primary' }}>
              {stage.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stage.subtitle}
            </Typography>
          </Box>
          {stage.status === 'current' && <Chip size="small" color="secondary" label="You are here" />}
          {actionable.length > 0 && stage.status !== 'current' && (
            <Typography variant="caption" color="text.secondary">
              {done}/{actionable.length}
            </Typography>
          )}
          <ExpandMoreRounded sx={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', color: 'text.secondary' }} />
        </ButtonBase>

        <Collapse in={open} unmountOnExit>
          <Card sx={{ mt: 1 }}>
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              {mine.map((s) => (
                <StepRow key={s.id} step={s} today={journey.today} onOpen={() => onOpenStep(s.id)} />
              ))}
              {others.length > 0 && (
                <>
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 1, pt: mine.length ? 1.5 : 0.5 }}>
                    Your team is getting ready
                  </Typography>
                  {others.map((s) => (
                    <StepRow
                      key={s.id}
                      team
                      today={journey.today}
                      step={{
                        ...s,
                        title: `${firstName(s.owner === 'manager' ? manager?.name : buddy?.name) ?? 'Your team'}: ${s.title.charAt(0).toLowerCase()}${s.title.slice(1)}`,
                      }}
                    />
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </Collapse>
      </Box>
    </Box>
  )
}
