import { useState } from 'react'
import { Box, ButtonBase, Card, CardContent, Chip, Drawer, IconButton, Stack, Typography } from '@mui/material'
import CloseRounded from '@mui/icons-material/CloseRounded'
import LockRounded from '@mui/icons-material/LockRounded'
import { PersonAvatar } from '../../components/PersonAvatar'
import { leaders, reportingLine } from '../../data/explore'
import { teammates } from '../../data/people'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import type { Person } from '../../domain/types'
import { SubPageHeader } from './SubPageHeader'

/** My Organisation: the reporting line from the Group CEO down to the joiner, with their team beside them. */
export function OrganisationPage() {
  const { journey } = useDemo()
  const { persona } = journey
  const [open, setOpen] = useState<Person | null>(null)

  const chain = (reportingLine[persona.id] ?? ['ceo']).map((k) => leaders[k])
  const manager = repository.getPerson(persona.managerId)
  const buddy = persona.buddyId && journey.steps.find((s) => s.id === 'mgr-assign-buddy')?.state === 'done' ? repository.getPerson(persona.buddyId) : undefined
  const teamStep = journey.steps.find((s) => s.id === 'meet-team')
  const teamUnlocked = teamStep?.state !== 'locked'
  const team = teammates[persona.id] ?? []
  const you: Person = { id: 'you', name: `${persona.firstName} ${persona.lastName}`, role: persona.role, bio: `${persona.team} · ${persona.location}` }

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <SubPageHeader title="My organisation" subtitle={persona.team} />

      <Box component="ol" aria-label="Your reporting line" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {[...chain, ...(manager ? [manager] : [])].map((p, i) => (
          <Box component="li" key={p.id}>
            <OrgNode person={p} caption={i === chain.length ? 'Your manager' : undefined} onOpen={() => setOpen(p)} />
            <Connector />
          </Box>
        ))}
        <Box component="li">
          <OrgNode person={you} caption="You" highlight onOpen={() => setOpen(you)} />
        </Box>
      </Box>

      {buddy && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Your buddy
          </Typography>
          <OrgNode person={buddy} caption="Buddy" onOpen={() => setOpen(buddy)} />
        </Box>
      )}

      <Box>
        <Typography variant="overline" color="text.secondary">
          Your team{teamUnlocked && manager ? `, reporting to ${manager.name.split(' ')[0]}` : ''}
        </Typography>
        {teamUnlocked ? (
          <Stack spacing={1} role="list" aria-label="Your team">
            {team.map((t) => (
              <Box role="listitem" key={t.id}>
                <OrgNode person={t} onOpen={() => setOpen(t)} compact />
              </Box>
            ))}
          </Stack>
        ) : (
          <Card sx={{ borderStyle: 'dashed' }}>
            <CardContent sx={{ display: 'flex', gap: 1, color: 'text.secondary' }}>
              <LockRounded fontSize="small" />
              <Typography variant="body2">{teamStep?.lockedHint ?? 'Your team unlocks closer to your start date.'}</Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary">
        Everyone shown here is fictional, for this demo.
      </Typography>

      <Drawer
        anchor="bottom"
        open={!!open}
        onClose={() => setOpen(null)}
        slotProps={{ paper: { sx: { maxWidth: 440, mx: 'auto', borderTopLeftRadius: 24, borderTopRightRadius: 24 } } }}
      >
        {open && (
          <Box sx={{ p: 3, pb: 'calc(24px + env(safe-area-inset-bottom))' }} role="dialog" aria-label={open.name}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
              <PersonAvatar name={open.name} size={56} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{open.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {open.role}
                </Typography>
              </Box>
              <IconButton aria-label="Close" onClick={() => setOpen(null)}>
                <CloseRounded />
              </IconButton>
            </Stack>
            {open.bio && <Typography sx={{ mb: 1.5 }}>{open.bio}</Typography>}
            {open.funFact && <Typography color="text.secondary">✨ {open.funFact}</Typography>}
            {open.askMeAbout && (
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
                {open.askMeAbout.map((a) => (
                  <Chip key={a} size="small" label={a} />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Drawer>
    </Stack>
  )
}

function OrgNode({ person, caption, onOpen, highlight = false, compact = false }: { person: Person; caption?: string; onOpen: () => void; highlight?: boolean; compact?: boolean }) {
  return (
    <ButtonBase
      onClick={onOpen}
      aria-label={`${person.name}, ${person.role}`}
      sx={{
        width: '100%',
        textAlign: 'left',
        justifyContent: 'flex-start',
        gap: 1.5,
        p: compact ? 1.25 : 1.5,
        borderRadius: '16px',
        border: highlight ? 2 : 1,
        borderColor: highlight ? 'primary.main' : 'divider',
        bgcolor: highlight ? 'action.selected' : 'background.paper',
      }}
    >
      <PersonAvatar name={person.name} size={compact ? 36 : 44} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
          {person.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {person.role}
        </Typography>
      </Box>
      {caption && <Chip size="small" label={caption} color={highlight ? 'primary' : 'default'} />}
    </ButtonBase>
  )
}

function Connector() {
  return <Box aria-hidden sx={{ width: 2, height: 16, bgcolor: 'divider', ml: '37px' }} />
}
