import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { repository } from '../data/repository'
import { useDemo } from '../demo/useDemo'
import type { JourneyView } from '../domain/journey'
import { STAGES } from '../domain/journey'
import { journeyProgress } from '../domain/progress'
import { requestHandover, streamAsk } from './client'
import type { ChatTurn, HandoverRoute, JoinerContext } from './protocol'

export interface Citation {
  title: string
  quote: string
}

export interface HandoverState {
  route: HandoverRoute
  status: 'suggested' | 'sending' | 'sent'
  summary?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  citations: Citation[]
  streaming?: boolean
  error?: string
  handover?: HandoverState
}

const storageKey = (personaId: string) => `lbg-joiner:chat:${personaId}:v1`

function load(personaId: string): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(storageKey(personaId))
    return raw ? (JSON.parse(raw) as ChatMessage[]).map((m) => ({ ...m, streaming: false })) : []
  } catch {
    return []
  }
}

export function joinerContext(journey: JourneyView): JoinerContext {
  const p = journey.persona
  return {
    firstName: p.firstName,
    role: p.role,
    jobFamily: p.jobFamily,
    location: p.location,
    workPattern: p.workPattern,
    isSmcr: p.isSmcr,
    startDate: journey.startDate,
    daysToStart: journey.daysToStart,
    currentStage: STAGES.find((s) => s.id === journey.currentStage)?.title ?? journey.currentStage,
    managerName: repository.getPerson(p.managerId)?.name,
    buddyName: p.buddyId ? repository.getPerson(p.buddyId)?.name : undefined,
    progress: journeyProgress(journey),
  }
}

let idCounter = 0
const nextId = () => `m${Date.now()}-${++idCounter}`

/** Chat state for the Ask tab, kept per persona for the browser session. */
export function useAssistant(journey: JourneyView) {
  const { recordHandover, logQuestion } = useDemo()
  const personaId = journey.persona.id
  const [messages, setMessages] = useState<ChatMessage[]>(() => load(personaId))
  const [mode, setMode] = useState<'live' | 'offline' | null>(null)
  const abort = useRef<AbortController | null>(null)
  const joiner = useMemo(() => joinerContext(journey), [journey])

  // Switching persona swaps the conversation.
  const [loadedFor, setLoadedFor] = useState(personaId)
  if (loadedFor !== personaId) {
    setLoadedFor(personaId)
    setMessages(load(personaId))
  }

  useEffect(() => {
    sessionStorage.setItem(storageKey(personaId), JSON.stringify(messages))
  }, [messages, personaId])

  useEffect(() => () => abort.current?.abort(), [])

  const update = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    setMessages((ms) => ms.map((m) => (m.id === id ? fn(m) : m)))

  const busy = messages.some((m) => m.streaming)

  const send = useCallback(
    async (question: string) => {
      const text = question.trim()
      if (!text || busy) return
      const history: ChatTurn[] = [
        ...messages.filter((m) => m.text && !m.error).map((m) => ({ role: m.role, content: m.text })),
        { role: 'user', content: text },
      ]
      const replyId = nextId()
      setMessages((ms) => [
        ...ms,
        { id: nextId(), role: 'user', text, citations: [] },
        { id: replyId, role: 'assistant', text: '', citations: [], streaming: true },
      ])

      abort.current = new AbortController()
      let handedOver = false
      let cited = false
      try {
        await streamAsk(
          { messages: history, joiner },
          (e) => {
            switch (e.type) {
              case 'mode':
                setMode(e.mode)
                break
              case 'text':
                update(replyId, (m) => ({ ...m, text: m.text + e.text }))
                break
              case 'citation':
                cited = true
                update(replyId, (m) =>
                  m.citations.some((c) => c.title === e.title) ? m : { ...m, citations: [...m.citations, { title: e.title, quote: e.quote }] },
                )
                break
              case 'handover':
                handedOver = true
                update(replyId, (m) => ({ ...m, handover: { route: e.route, status: 'suggested' } }))
                break
              case 'error':
                update(replyId, (m) => ({ ...m, error: e.message }))
                break
              case 'done':
                break
            }
          },
          abort.current.signal,
        )
      } catch {
        handedOver = true
        update(replyId, (m) => ({
          ...m,
          error: 'I couldn’t reach the assistant just now.',
          handover: m.handover ?? { route: 'hr', status: 'suggested' },
        }))
      } finally {
        update(replyId, (m) => ({ ...m, text: m.text.trimEnd(), streaming: false }))
        // For the admin trends: the topic and outcome only, never the question itself.
        logQuestion(text, { handedOver, cited })
      }
    },
    [busy, joiner, logQuestion, messages],
  )

  /** Offer a person even when the assistant didn't suggest one. */
  const offerPerson = useCallback((route: HandoverRoute) => {
    setMessages((ms) => [
      ...ms,
      {
        id: nextId(),
        role: 'assistant',
        text: 'Of course. Here’s who can help.',
        citations: [],
        handover: { route, status: 'suggested' },
      },
    ])
  }, [])

  const sendHandover = useCallback(
    async (messageId: string) => {
      const target = messages.find((m) => m.id === messageId)
      if (!target?.handover) return
      const route = target.handover.route
      update(messageId, (m) => ({ ...m, handover: { route, status: 'sending' } }))
      const history: ChatTurn[] = messages.filter((m) => m.text).map((m) => ({ role: m.role, content: m.text }))
      try {
        const res = await requestHandover({ messages: history, joiner, route })
        update(messageId, (m) => ({ ...m, handover: { route, status: 'sent', summary: res.summary } }))
        // Lets the buddy (or manager) see the question the joiner chose to send them.
        recordHandover(route, res.summary)
      } catch {
        const last = [...history].reverse().find((m) => m.role === 'user')?.content ?? ''
        update(messageId, (m) => ({
          ...m,
          handover: { route, status: 'sent', summary: `${joiner.firstName} asked: “${last}”.` },
        }))
      }
    },
    [joiner, messages, recordHandover],
  )

  const clear = useCallback(() => setMessages([]), [])

  return { messages, mode, busy, send, offerPerson, sendHandover, clear, joiner }
}
