import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { keyframes } from '@mui/material/styles'
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import DescriptionRounded from '@mui/icons-material/DescriptionRounded'
import RefreshRounded from '@mui/icons-material/RefreshRounded'
import SupportAgentRounded from '@mui/icons-material/SupportAgentRounded'
import type { HandoverRoute, JoinerContext } from '../../assistant/protocol'
import { useAssistant, type ChatMessage } from '../../assistant/useAssistant'
import { useDemo } from '../../demo/useDemo'
import { pinnedComposerSx } from '../../components/layout'

const blink = keyframes`50% { opacity: 0; }`

function suggestions(j: JoinerContext): string[] {
  const list = [
    j.workPattern === 'branch' ? 'What do I wear in branch?' : 'What should I wear on Day 1?',
    j.workPattern === 'hybrid' ? 'Can I work from home in my first week?' : 'Where will I be working?',
    'When will I get paid?',
    j.daysToStart > 0 ? (j.isSmcr ? 'Why is my regulatory reference taking so long?' : 'Why are my references taking so long?') : 'What training do I need to do?',
    'I’m a bit worried something might come up in my checks',
    'Who will be my buddy in the first few weeks?',
  ]
  return list
}

export function AskPage() {
  const { journey } = useDemo()
  const assistant = useAssistant(journey)
  const { messages, mode, busy, send, offerPerson, sendHandover, clear, joiner } = assistant
  const [draft, setDraft] = useState('')
  const [personMenu, setPersonMenu] = useState<HTMLElement | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const lastText = messages.at(-1)?.text.length ?? 0
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' })
  }, [messages.length, lastText])

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!draft.trim() || busy) return
    void send(draft)
    setDraft('')
  }

  return (
    <Stack spacing={2} sx={{ pt: 1, pb: 9 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1">
            Ask anything
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Answers from bank policies, any time. A person when you need one.
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', pt: 0.5 }}>
          {mode && (
            <Tooltip title={mode === 'live' ? 'Answers are generated live by Claude from the policy pack' : 'No connection to the AI service: showing built-in answers'}>
              <Chip size="small" label={mode === 'live' ? 'Live AI' : 'Offline mode'} color={mode === 'live' ? 'secondary' : 'default'} />
            </Tooltip>
          )}
          {messages.length > 0 && (
            <IconButton aria-label="New conversation" size="small" onClick={clear}>
              <RefreshRounded fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {messages.length === 0 && (
        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', border: 0 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
              <AutoAwesomeRounded />
              <Typography variant="h6">Hi {joiner.firstName}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.92 }}>
              I can answer questions about policies, your first weeks and your checks, and I’ll show you where each answer
              comes from. If I can’t help, I’ll find the right person and pass on your question so you don’t have to repeat it.
            </Typography>
          </CardContent>
        </Card>
      )}

      {messages.length === 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary">
            Try asking
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {suggestions(joiner).map((q) => (
              <Chip key={q} label={q} variant="outlined" onClick={() => void send(q)} sx={{ height: 'auto', py: 0.75, '& .MuiChip-label': { whiteSpace: 'normal' } }} />
            ))}
          </Stack>
        </Box>
      )}

      <Stack spacing={1.5} aria-live="polite">
        {messages.map((m) =>
          m.role === 'user' ? <UserBubble key={m.id} text={m.text} /> : <AssistantBubble key={m.id} message={m} joiner={joiner} onSendHandover={() => void sendHandover(m.id)} />,
        )}
        {/* scroll-margin keeps the newest message clear of the composer and tabs */}
        <Box ref={endRef} sx={{ scrollMarginBottom: 'calc(140px + env(safe-area-inset-bottom))' }} />
      </Stack>

      {/* Composer, pinned above the bottom tabs */}
      <Paper
        component="form"
        onSubmit={submit}
        elevation={0}
        sx={{
          ...pinnedComposerSx,
          px: 1.5,
          py: 1,
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: (t) => t.zIndex.appBar - 1,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
          <Tooltip title="Talk to a person">
            <IconButton aria-label="Talk to a person" onClick={(e) => setPersonMenu(e.currentTarget)}>
              <SupportAgentRounded />
            </IconButton>
          </Tooltip>
          <InputBase
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Ask a question…"
            multiline
            maxRows={4}
            inputProps={{ 'aria-label': 'Your question', maxLength: 2000 }}
            sx={{ flex: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 5, px: 2, py: 1 }}
          />
          <IconButton type="submit" aria-label="Send" disabled={!draft.trim() || busy} color="primary" sx={{ bgcolor: 'action.selected' }}>
            {busy ? <CircularProgress size={20} /> : <ArrowUpwardRounded />}
          </IconButton>
        </Stack>
        <Menu anchorEl={personMenu} open={!!personMenu} onClose={() => setPersonMenu(null)}>
          {(['buddy', 'manager', 'hr', 'screening'] as HandoverRoute[]).map((r) => (
            <MenuItem
              key={r}
              onClick={() => {
                setPersonMenu(null)
                offerPerson(r)
              }}
            >
              {routeInfo(r, joiner).name}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {routeInfo(r, joiner).what}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    </Stack>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <Box sx={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', px: 2, py: 1.25, borderRadius: '20px 20px 6px 20px' }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {text}
        </Typography>
      </Box>
    </Box>
  )
}

function AssistantBubble({
  message,
  joiner,
  onSendHandover,
}: {
  message: ChatMessage
  joiner: JoinerContext
  onSendHandover: () => void
}) {
  const [openQuote, setOpenQuote] = useState<string | null>(null)
  const thinking = message.streaming && !message.text

  return (
    <Stack spacing={1} sx={{ alignSelf: 'flex-start', maxWidth: '92%' }}>
      <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', px: 2, py: 1.25, borderRadius: '20px 20px 20px 6px' }}>
        {thinking ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <CircularProgress size={14} />
            <Typography variant="body2">Checking the policies…</Typography>
          </Stack>
        ) : (
          <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
            <RichText text={message.text} />
            {message.streaming && (
              <Box component="span" sx={{ animation: `${blink} 1s step-end infinite`, ml: 0.25 }}>
                ▍
              </Box>
            )}
          </Typography>
        )}
        {message.error && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
            {message.error}
          </Typography>
        )}
      </Box>

      {message.citations.length > 0 && (
        <Box>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {message.citations.map((c) => (
              <Chip
                key={c.title}
                size="small"
                icon={<DescriptionRounded />}
                label={c.title}
                variant={openQuote === c.title ? 'filled' : 'outlined'}
                onClick={() => setOpenQuote(openQuote === c.title ? null : c.title)}
              />
            ))}
          </Stack>
          {openQuote && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.75, pl: 1.25, borderLeft: 3, borderColor: 'secondary.main', fontStyle: 'italic' }}
            >
              “{message.citations.find((c) => c.title === openQuote)?.quote.trim()}”
            </Typography>
          )}
        </Box>
      )}

      {message.handover && !message.streaming && (
        <HandoverCard handover={message.handover} joiner={joiner} onSend={onSendHandover} />
      )}
    </Stack>
  )
}

function HandoverCard({
  handover,
  joiner,
  onSend,
}: {
  handover: NonNullable<ChatMessage['handover']>
  joiner: JoinerContext
  onSend: () => void
}) {
  const info = routeInfo(handover.route, joiner)

  return (
    <Card variant="outlined" sx={{ borderColor: 'secondary.main', borderWidth: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.25 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', width: 40, height: 40, fontSize: 15, fontWeight: 700 }}>
            {info.initials}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {info.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {info.what} · {info.replyBy}
            </Typography>
          </Box>
        </Stack>

        {handover.status === 'sent' ? (
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main', mb: 1 }}>
              <CheckCircleRounded fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Sent. {info.firstName} will reply {info.replyBy.toLowerCase()}.
              </Typography>
            </Stack>
            {handover.summary && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', bgcolor: 'action.hover', p: 1.25, borderRadius: 2 }}>
                <strong>What we passed on:</strong> {handover.summary}
              </Typography>
            )}
          </Box>
        ) : (
          <Button fullWidth variant="contained" color="secondary" onClick={onSend} disabled={handover.status === 'sending'}>
            {handover.status === 'sending' ? 'Writing a summary…' : `Send my question to ${info.firstName}`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function routeInfo(route: HandoverRoute, j: JoinerContext) {
  const initialsOf = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
  switch (route) {
    case 'buddy': {
      const name = j.buddyName ?? 'Your buddy'
      return { name, firstName: name.split(' ')[0], initials: initialsOf(name), what: 'Your buddy', replyBy: 'Usually within a few hours' }
    }
    case 'manager': {
      const name = j.managerName ?? 'Your manager'
      return { name, firstName: name.split(' ')[0], initials: initialsOf(name), what: 'Your manager', replyBy: 'By tomorrow' }
    }
    case 'screening':
      return { name: 'Screening team', firstName: 'The screening team', initials: 'ST', what: 'Confidential', replyBy: 'Within 1 working day' }
    case 'hr':
      return { name: 'HR Direct', firstName: 'HR Direct', initials: 'HR', what: 'People questions', replyBy: 'Within 1 working day' }
  }
}

/** Minimal formatting: **bold** only, since answers are short. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  )
}
