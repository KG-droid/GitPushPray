import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { repository } from '../data/repository'
import { addDays, toIsoDate } from '../domain/dates'
import { buildJourney, type JourneyView } from '../domain/journey'
import { cannedReply } from '../data/people'
import { classifyTopic, cleanText, type FeedbackResponse } from '../domain/feedback'
import type {
  BuddyMeetupPayload,
  ChatMessagePayload,
  HandoverSentPayload,
  MeetupKind,
  CheckId,
  CheckUpdatedPayload,
  FeedbackSubmittedPayload,
  PulsePayload,
  Owner,
  StartDateChangedPayload,
  StepCompletedPayload,
} from '../domain/types'
import { DemoContext, type ChatEntry, type DemoContextValue, type DemoState } from './useDemo'

const STATE_KEY = 'lbg-joiner:demo:v1'
const DEFAULT_STATE: DemoState = { personaId: 'priya', todayOverride: null, role: 'joiner' }

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    return raw ? { ...DEFAULT_STATE, ...(JSON.parse(raw) as DemoState) } : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

// A counter that changes whenever the repository does, so React re-renders on new events.
let version = 0
repository.subscribe(() => {
  version++
})
const subscribe = (cb: () => void) => repository.subscribe(cb)
const getVersion = () => version

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(loadState)
  const [panelOpen, setPanelOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const eventsVersion = useSyncExternalStore(subscribe, getVersion)

  useEffect(() => localStorage.setItem(STATE_KEY, JSON.stringify(state)), [state])

  const today = state.todayOverride ?? toIsoDate(new Date())
  const persona = repository.getPersona(state.personaId) ?? repository.listPersonas()[0]

  /** Builds any persona's journey on the demo date; cached until events or the date change. */
  const journeyFor = useMemo(() => {
    const cache = new Map<string, JourneyView>()
    return (personaId: string): JourneyView => {
      const cached = cache.get(personaId)
      if (cached) return cached
      const p = repository.getPersona(personaId) ?? persona
      const built = buildJourney({
        persona: p,
        events: repository.listEvents(p.id),
        today,
        steps: repository.listSteps(),
        checks: repository.listChecks(),
      })
      cache.set(personaId, built)
      return built
    }
    // eventsVersion is the signal that events changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, today, eventsVersion])

  const journey = journeyFor(persona.id)

  /** Events are stamped on the demo "today" so they count immediately, whatever date we're pretending it is. */
  const stamp = useCallback(() => `${today}T${new Date().toISOString().slice(11)}`, [today])

  const chats = useMemo(() => {
    const byPerson: Record<string, ChatEntry[]> = {}
    for (const e of repository.listEvents(persona.id)) {
      if (e.type !== 'chat_message' || e.at.slice(0, 10) > today) continue
      const p = e.payload as unknown as ChatMessagePayload
      ;(byPerson[p.withId] ??= []).push({ id: e.id, from: p.from, text: p.text, at: e.at })
    }
    for (const list of Object.values(byPerson)) list.sort((a, b) => a.at.localeCompare(b.at))
    return byPerson
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona.id, today, eventsVersion])

  const [typingId, setTypingId] = useState<string | null>(null)

  const completeStep = useCallback(
    (stepId: string, opts?: { value?: string; by?: Owner; personaId?: string }) => {
      const by = opts?.by ?? 'joiner'
      const target = repository.getPersona(opts?.personaId ?? persona.id) ?? persona
      const before = journeyFor(target.id)
      const payload: StepCompletedPayload = { stepId, by, value: opts?.value }
      repository.addEvent({ personaId: target.id, type: 'step_completed', at: stamp(), payload: { ...payload } })

      // Tell the user what their action set off, so chain reactions are visible.
      const after = buildJourney({
        persona: target,
        events: repository.listEvents(target.id),
        today,
        steps: repository.listSteps(),
        checks: repository.listChecks(),
      })
      const wasLocked = new Set(before.steps.filter((s) => s.state === 'locked').map((s) => s.id))
      const unlocked = after.steps.filter((s) => wasLocked.has(s.id) && s.state !== 'locked')
      const forOthers = unlocked.filter((s) => s.owner !== by)
      const forSelf = unlocked.filter((s) => s.owner === by)
      const otherName = by === 'joiner' ? 'your team' : target.firstName
      // A changed choice can undo later steps (e.g. a new laptop needs approving again).
      const wasDone = new Set(before.steps.filter((s) => s.state === 'done').map((s) => s.id))
      const reopened = after.steps.filter((s) => wasDone.has(s.id) && s.state !== 'done' && s.id !== stepId)
      const sentBackTo = [
        ...new Set(reopened.map((s) => (s.owner === by ? 'you' : s.owner === 'joiner' ? target.firstName : 'your team'))),
      ].join(' and ')
      setToast(
        stepId === 'accessibility-needs' && opts?.value === 'yes'
          ? 'Thank you. Your manager will get in contact with you as soon as they are able.'
          : reopened.length
          ? `Change saved. That’s sent ${reopened.length} thing${reopened.length > 1 ? 's' : ''} back to ${sentBackTo} to redo.`
          : forOthers.length
          ? `Done! That’s set off ${forOthers.length} more thing${forOthers.length > 1 ? 's' : ''} for ${otherName}.`
          : forSelf.length
            ? `Done! You’ve unlocked “${forSelf[0].title}”.`
            : 'Done — nice one.',
      )
    },
    [journeyFor, persona, stamp, today],
  )

  const slipStartDate = useCallback(
    (days: number) => {
      const slowest = journey.checks.filter((c) => c.status !== 'cleared').at(-1)
      const reason = slowest
        ? `Your ${slowest.label.toLowerCase()} is taking longer than expected. This is common and not a sign of a problem.`
        : 'Your team’s plans have changed, so we’ve moved your start to make sure everything is ready for you.'
      if (slowest) {
        const check: CheckUpdatedPayload = {
          checkId: slowest.id,
          status: 'delayed',
          expectedClearOn: addDays(slowest.expectedClearOn, days),
          note: 'The other firm has asked for more time to reply.',
        }
        repository.addEvent({ personaId: persona.id, type: 'check_updated', at: stamp(), payload: { ...check } })
      }
      const move: StartDateChangedPayload = { to: addDays(journey.startDate, days), reason }
      repository.addEvent({ personaId: persona.id, type: 'start_date_changed', at: stamp(), payload: { ...move } })
    },
    [journey, persona.id, stamp],
  )

  const delayCheck = useCallback(
    (checkId: CheckId, days: number) => {
      const current = journey.checks.find((c) => c.id === checkId)
      if (!current) return
      const payload: CheckUpdatedPayload = {
        checkId,
        status: 'delayed',
        expectedClearOn: addDays(current.expectedClearOn > today ? current.expectedClearOn : today, days),
        note: 'Still waiting to hear back. We’ve chased and will update you as soon as we hear.',
      }
      repository.addEvent({ personaId: persona.id, type: 'check_updated', at: stamp(), payload: { ...payload } })
    },
    [journey, persona.id, stamp, today],
  )

  const sendChat = useCallback(
    (withId: string, text: string) => {
      const message = text.trim()
      if (!message) return
      const chat = (from: 'joiner' | 'them', body: string) => {
        const payload: ChatMessagePayload = { withId, from, text: body }
        repository.addEvent({ personaId: persona.id, type: 'chat_message', at: stamp(), payload: { ...payload } })
      }
      chat('joiner', message)

      // Saying hello to your buddy is a journey step: complete it, which also tells the user.
      const isBuddy = withId === persona.buddyId
      const hello = journey.steps.find((s) => s.id === 'say-hello')
      if (isBuddy && hello?.state === 'available') completeStep('say-hello')

      setTypingId(withId)
      window.setTimeout(() => {
        chat('them', cannedReply(message, persona.firstName, isBuddy))
        setTypingId(null)
      }, 1400)
    },
    [completeStep, journey.steps, persona, stamp],
  )

  const logMeetup = useCallback(
    (kind: MeetupKind) => {
      const payload: BuddyMeetupPayload = { kind }
      repository.addEvent({ personaId: persona.id, type: 'buddy_meetup', at: stamp(), payload: { ...payload } })
      const count = repository.listEvents(persona.id).filter((e) => e.type === 'buddy_meetup' && e.at.slice(0, 10) <= today).length
      setToast(`Logged. That’s ${count} meetup${count === 1 ? '' : 's'} with ${persona.firstName}.`)
    },
    [persona, stamp, today],
  )

  const recordHandover = useCallback(
    (route: HandoverSentPayload['route'], summary: string) => {
      const payload: HandoverSentPayload = { route, summary }
      repository.addEvent({ personaId: persona.id, type: 'handover_sent', at: stamp(), payload: { ...payload } })
    },
    [persona.id, stamp],
  )

  const submitPulse = useCallback(
    (stepId: string, answers: PulsePayload) => {
      repository.addEvent({ personaId: persona.id, type: 'pulse_submitted', at: stamp(), payload: { ...answers } })
      completeStep(stepId)
      if (stepId === 'day-30-checkin') setToast('One month in. Thank you for telling us how it’s really going.')
    },
    [completeStep, persona.id, stamp],
  )

  const answeredCheckIns = useMemo(
    () =>
      repository
        .listEvents(persona.id)
        .filter((e) => e.type === 'feedback_submitted' && e.at.slice(0, 10) <= today)
        .map((e) => (e.payload as unknown as FeedbackSubmittedPayload).milestone),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persona.id, today, eventsVersion],
  )

  const submitCheckIn = useCallback(
    (input: Pick<FeedbackResponse, 'milestone' | 'mood' | 'enps' | 'missed' | 'better' | 'note'>) => {
      if (answeredCheckIns.includes(input.milestone)) return
      // The answers go in the anonymous store; the joiner's own record only notes that they answered.
      repository.addFeedback({
        at: stamp(),
        milestone: input.milestone,
        jobFamily: persona.jobFamily,
        site: persona.site,
        mood: input.mood,
        enps: input.enps,
        missed: cleanText(input.missed),
        better: cleanText(input.better),
        note: cleanText(input.note),
      })
      const payload: FeedbackSubmittedPayload = { milestone: input.milestone }
      repository.addEvent({ personaId: persona.id, type: 'feedback_submitted', at: stamp(), payload: { ...payload } })
      setToast('Thank you. That goes straight to the team looking after new joiners.')
    },
    [answeredCheckIns, persona, stamp],
  )

  const logQuestion = useCallback(
    (question: string, outcome: { handedOver: boolean; cited: boolean }) => {
      repository.addQuestionLog({
        at: stamp(),
        jobFamily: persona.jobFamily,
        site: persona.site,
        topic: classifyTopic(question),
        ...outcome,
      })
    },
    [persona, stamp],
  )

  const value: DemoContextValue = {
    ...state,
    today,
    journey,
    setPersona: (personaId) => setState((s) => ({ ...s, personaId })),
    setToday: (todayOverride) => setState((s) => ({ ...s, todayOverride })),
    setRole: (role) => setState((s) => ({ ...s, role })),
    journeyFor,
    completeStep,
    slipStartDate,
    delayCheck,
    resetPersona: () => repository.reset(persona.id),
    panelOpen,
    setPanelOpen,
    toast,
    clearToast: () => setToast(null),
    chats,
    sendChat,
    typingId,
    logMeetup,
    recordHandover,
    submitPulse,
    answeredCheckIns,
    submitCheckIn,
    logQuestion,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
