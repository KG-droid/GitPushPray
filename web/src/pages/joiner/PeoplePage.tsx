import type { ReactNode } from 'react'
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import LockRounded from '@mui/icons-material/LockRounded'
import ChatBubbleRounded from '@mui/icons-material/ChatBubbleRounded'
import { useNavigate } from 'react-router-dom'
import { PersonAvatar } from '../../components/PersonAvatar'
import { managerIntro, introMessage, teammates } from '../../data/people'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import type { Person } from '../../domain/types'

/** "Meet before you meet": manager, buddy and team, unlocking as the journey progresses. */
export function PeoplePage() {
  const { journey, chats } = useDemo()
  const navigate = useNavigate()
  const { persona } = journey
  const step = (id: string) => journey.steps.find((s) => s.id === id)

  const manager = repository.getPerson(persona.managerId)
  const buddy = persona.buddyId ? repository.getPerson(persona.buddyId) : undefined
  const managerUnlocked = step('meet-manager')?.state !== 'locked'
  const buddyAssigned = step('mgr-assign-buddy')?.state === 'done'
  const teamStep = step('meet-team')
  const teamUnlocked = teamStep?.state !== 'locked'
  const team = teammates[persona.id] ?? []

  const lastMessage = (p: Person, isBuddy: boolean) =>
    chats[p.id]?.at(-1)?.text ?? (isBuddy ? introMessage(p.id, persona.firstName, true) : managerIntro(p.id, persona.firstName))

  return (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Box>
        <Typography variant="h4" component="h1">
          Your people
        </Typography>
        <Typography color="text.secondary">Get to know them before Day 1.</Typography>
      </Box>

      <Section title="Your manager">
        {manager && managerUnlocked ? (
          <PersonCard
            person={manager}
            preview={lastMessage(manager, false)}
            action={<Button variant="outlined" startIcon={<ChatBubbleRounded />} onClick={() => navigate(`/people/chat/${manager.id}`)}>Message {first(manager.name)}</Button>}
          />
        ) : (
          <LockedCard text={step('meet-manager')?.lockedHint ?? 'Your manager’s intro unlocks closer to your start date.'} />
        )}
      </Section>

      <Section title="Your buddy">
        {buddy && buddyAssigned ? (
          <PersonCard
            person={buddy}
            highlight
            preview={lastMessage(buddy, true)}
            action={
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ChatBubbleRounded />}
                onClick={() => navigate(`/people/chat/${buddy.id}`)}
              >
                {step('say-hello')?.state === 'available' ? `Say hello to ${first(buddy.name)}` : `Message ${first(buddy.name)}`}
              </Button>
            }
          />
        ) : (
          <LockedCard text="Your manager is matching you with a buddy: someone who joined recently and remembers what the first weeks feel like." />
        )}
      </Section>

      <Section title={teamUnlocked ? `Your team · ${persona.team}` : 'Your team'}>
        {teamUnlocked ? (
          <Box
            role="list"
            aria-label="Your team"
            sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mx: -2, px: 2, scrollSnapType: 'x mandatory', scrollPaddingInline: 16, '&::-webkit-scrollbar': { display: 'none' } }}
          >
            {team.map((t) => (
              <Card key={t.id} role="listitem" sx={{ minWidth: 168, maxWidth: 168, scrollSnapAlign: 'start', flexShrink: 0 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <PersonAvatar name={t.name} size={44} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1.25, lineHeight: 1.25 }}>
                    {t.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {t.role}
                  </Typography>
                  {t.funFact && (
                    <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.4 }}>
                      ✨ {t.funFact}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <LockedCard text={teamStep?.lockedHint ?? 'Your team unlocks closer to your start date.'} avatars={team.length || 3} />
        )}
      </Section>
    </Stack>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" aria-label={title}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      {children}
    </Box>
  )
}

function PersonCard({
  person,
  preview,
  action,
  highlight = false,
}: {
  person: Person
  preview: string
  action: ReactNode
  highlight?: boolean
}) {
  return (
    <Card sx={highlight ? { borderColor: 'secondary.main', borderWidth: 2 } : undefined}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1.5 }}>
          <PersonAvatar name={person.name} size={56} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.25 }}>
              {person.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {person.role}
            </Typography>
          </Box>
        </Stack>
        {person.bio && (
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {person.bio}
          </Typography>
        )}
        {person.askMeAbout && person.askMeAbout.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              Ask me about
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
              {person.askMeAbout.map((a) => (
                <Chip key={a} size="small" label={a} />
              ))}
            </Stack>
          </Box>
        )}
        {person.funFact && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            ✨ {person.funFact}
          </Typography>
        )}
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 3, p: 1.5, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Latest message
          </Typography>
          <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {preview}
          </Typography>
        </Box>
        {action}
      </CardContent>
    </Card>
  )
}

function LockedCard({ text, avatars = 1 }: { text: string; avatars?: number }) {
  return (
    <Card sx={{ borderStyle: 'dashed' }}>
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2.5 }}>
        <Box sx={{ display: 'flex' }}>
          {Array.from({ length: Math.min(avatars, 4) }).map((_, i) => (
            <Box key={i} sx={{ ml: i ? -1.5 : 0, border: 2, borderColor: 'background.paper', borderRadius: '50%' }}>
              <PersonAvatar name="?" size={40} muted />
            </Box>
          ))}
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', color: 'text.secondary', flex: 1 }}>
          <LockRounded fontSize="small" sx={{ mt: 0.25 }} />
          <Typography variant="body2">{text}</Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

const first = (name: string) => name.split(' ')[0]
