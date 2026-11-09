import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Box, Chip, IconButton, InputBase, Paper, Stack, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PersonAvatar } from '../../components/PersonAvatar'
import { icebreakers, introMessage, managerIntro } from '../../data/people'
import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'

const bounce = keyframes`0%, 80%, 100% { transform: translateY(0); opacity: .4 } 40% { transform: translateY(-4px); opacity: 1 }`

/** A chat thread with the joiner's manager or buddy. Replies are scripted for the demo. */
export function ChatPage() {
  const { personId = '' } = useParams()
  const navigate = useNavigate()
  const { journey, chats, sendChat, typingId } = useDemo()
  const { persona } = journey
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const isBuddy = personId === persona.buddyId
  const isManager = personId === persona.managerId
  const person = repository.getPerson(personId)
  const thread = chats[personId] ?? []
  const typing = typingId === personId

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' })
  }, [thread.length, typing])

  // Only the joiner's own manager and buddy can be messaged.
  if (!person || (!isBuddy && !isManager)) return <Navigate to="/people" replace />

  const intro = isBuddy ? introMessage(person.id, persona.firstName, true) : managerIntro(person.id, persona.firstName)
  const joinerHasWritten = thread.some((m) => m.from === 'joiner')

  const submit = (e?: FormEvent, text = draft) => {
    e?.preventDefault()
    if (!text.trim()) return
    sendChat(person.id, text)
    setDraft('')
  }

  return (
    <Stack spacing={2} sx={{ pt: 1, pb: 9 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <IconButton aria-label="Back to your people" edge="start" onClick={() => navigate('/people')}>
          <ArrowBackRounded />
        </IconButton>
        <PersonAvatar name={person.name} size={40} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {person.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isBuddy ? 'Your buddy' : 'Your manager'} · {person.role}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1} aria-live="polite" aria-label={`Conversation with ${person.name}`}>
        <Bubble from="them" text={intro} />
        {thread.map((m) => (
          <Bubble key={m.id} from={m.from} text={m.text} />
        ))}
        {typing && (
          <Box sx={{ alignSelf: 'flex-start', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '20px 20px 20px 6px', px: 2, py: 1.5 }} aria-label={`${person.name} is typing`}>
            <Stack direction="row" spacing={0.5}>
              {[0, 1, 2].map((i) => (
                <Box key={i} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'text.secondary', animation: `${bounce} 1.2s ${i * 0.15}s infinite` }} />
              ))}
            </Stack>
          </Box>
        )}
        <Box ref={endRef} sx={{ scrollMarginBottom: 'calc(140px + env(safe-area-inset-bottom))' }} />
      </Stack>

      {isBuddy && !joinerHasWritten && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Not sure what to say?
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {icebreakers.map((q) => (
              <Chip key={q} label={q} variant="outlined" onClick={() => submit(undefined, q)} />
            ))}
          </Stack>
        </Box>
      )}

      <Paper
        component="form"
        onSubmit={submit}
        elevation={0}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          mx: 'auto',
          maxWidth: 440,
          bottom: 'calc(56px + env(safe-area-inset-bottom))',
          px: 1.5,
          py: 1,
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: (t) => t.zIndex.appBar - 1,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
          <InputBase
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={`Message ${person.name.split(' ')[0]}…`}
            multiline
            maxRows={4}
            inputProps={{ 'aria-label': 'Your message', maxLength: 1000 }}
            sx={{ flex: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 5, px: 2, py: 1 }}
          />
          <IconButton type="submit" aria-label="Send message" disabled={!draft.trim()} color="primary" sx={{ bgcolor: 'action.selected' }}>
            <ArrowUpwardRounded />
          </IconButton>
        </Stack>
      </Paper>
    </Stack>
  )
}

function Bubble({ from, text }: { from: 'joiner' | 'them'; text: string }) {
  const mine = from === 'joiner'
  return (
    <Box
      sx={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        px: 2,
        py: 1.25,
        bgcolor: mine ? 'primary.main' : 'background.paper',
        color: mine ? 'primary.contrastText' : 'text.primary',
        border: mine ? 0 : 1,
        borderColor: 'divider',
        borderRadius: mine ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
      }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </Typography>
    </Box>
  )
}
