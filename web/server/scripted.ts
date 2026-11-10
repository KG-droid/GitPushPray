import type { ChatTurn, HandoverRoute, JoinerContext } from '../src/assistant/protocol.ts'
import { formatShortDate } from '../src/domain/dates.ts'
import { policies } from './policies.ts'

/**
 * Offline answers for the questions most likely to come up in a demo. Used when there's no API key
 * or the API can't be reached. Citations quote the real synthetic policy text.
 */
export interface ScriptedAnswer {
  text: string
  citations: { title: string; quote: string }[]
  route?: HandoverRoute
}

/** First sentence of a numbered policy section, for use as a citation quote. */
export function section(policyId: string, n: number): { title: string; quote: string } {
  const policy = policies.find((p) => p.id === policyId)
  if (!policy) throw new Error(`Unknown policy ${policyId}`)
  const match = policy.text.match(new RegExp(`(?:^|\\n)${n}\\. [^\\n]*\\n([^\\n]+)`))
  const body = match?.[1] ?? ''
  const quote = body.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? body
  return { title: policy.title, quote }
}

interface Rule {
  test: RegExp
  /** Returning nothing means "this rule doesn't apply after all": the next matching rule gets a go */
  answer: (j: JoinerContext, question: string) => ScriptedAnswer | undefined
}

const STOP = new Set(['why', 'when', 'what', 'how', 'where', 'isnt', 'cant', 'cannot', 'does', 'have', 'with', 'that', 'this', 'there', 'been', 'still', 'long', 'will', 'from', 'about', 'status'])

/** Answers about the joiner's own journey from the progress the app sends: what's left, and why something is locked. */
function aboutMyJourney(j: JoinerContext, question: string): ScriptedAnswer | undefined {
  const p = j.progress
  if (!p) return undefined
  const due = (d?: string) => (d ? `, by ${formatShortDate(d)}` : '')

  if (/\b(what['’]?s (left|next|outstanding)|what (do|should|can) i (need to )?(do|be doing)|to-?do|before i start|this week)\b/i.test(question)) {
    const checks = `${p.checks.cleared} of ${p.checks.total} checks are cleared${p.checks.expectedBy ? `, with the last expected around ${formatShortDate(p.checks.expectedBy)}` : ''}`
    const todo = p.todo.length
      ? `Next for you: ${p.todo.slice(0, 3).map((t) => `${t.title}${due(t.due)}`).join('; ')}.`
      : 'Nothing needs you right now.'
    const team = p.team.length ? ` Your team still has ${p.team.length === 1 ? 'one thing' : `${p.team.length} things`} to do for you, like “${p.team[0].title}”.` : ''
    return { text: `You’ve done ${p.stepsDone} of ${p.stepsTotal} of your steps, and ${checks}. ${todo}${team}`, citations: [] }
  }

  // "Why can't I choose my laptop yet?" Find the step the question is about.
  const words = question.toLowerCase().match(/[a-z]{4,}/g)?.filter((w) => !STOP.has(w)) ?? []
  const mentions = (title: string) => words.some((w) => title.toLowerCase().includes(w.replace(/s$/, '')))
  const locked = p.locked.find((t) => mentions(t.title))
  if (locked) return { text: `“${locked.title}” isn’t available yet. ${locked.unlocksWhen}`, citations: [] }
  const team = p.team.find((t) => mentions(t.title))
  if (team) return { text: `“${team.title}” is on ${team.who === 'manager' ? (j.managerName?.split(' ')[0] ?? 'your manager') : (j.buddyName?.split(' ')[0] ?? 'your buddy')}’s list${due(team.due)}. You don’t need to do anything.`, citations: [] }
  const todo = p.todo.find((t) => mentions(t.title))
  if (todo) return { text: `That’s one for you: “${todo.title}”${due(todo.due)}. You can do it from the Today tab.`, citations: [] }
  return undefined
}

const rules: Rule[] = [
  // Things we must never answer come first.
  {
    test: /\b(manager|colleague|someone else|other people|everyone)['’]?s?\b.*\b(salary|pay|paid|earn|bonus)|\b(salary|pay|earn)\b.*\b(of|for) (my|the) (manager|team|colleague)/i,
    answer: () => ({
      text: 'I can’t share anything about other colleagues’ pay. It’s confidential, for them just as yours is for you. If you have a question about your own package, HR Direct can help.',
      citations: [section('benefits-pay', 6)],
      route: 'hr',
    }),
  },
  {
    test: /\b(worried|worry|nervous|scared|concern(ed)?)\b.*\b(check|vetting|dbs|credit|reference|criminal|record)|\b(check|vetting|dbs|credit|reference)\b.*\b(fail|problem|issue|come up|worried)/i,
    answer: () => ({
      text: 'That’s a really common worry, and it’s fine to ask. If a check finds something that needs a conversation, the screening team will talk to you directly and in confidence, and many things are resolved simply. I’ll connect you with them so you can talk it through privately.',
      citations: [section('screening', 5)],
      route: 'screening',
    }),
  },
  {
    test: /\b(nervous|anxious|scared|overwhelmed|worried)\b/i,
    answer: (j) => ({
      text: `Feeling nervous before a new job is completely normal. ${j.buddyName ? `${j.buddyName.split(' ')[0]}, your buddy,` : 'Your buddy'} remembers exactly what it was like, so let me connect you for a chat.`,
      citations: [],
      route: 'buddy',
    }),
  },
  // Questions about their own journey come after the things we must never answer, before the general policy answers.
  {
    test: /\b(what['’]?s (left|next|outstanding)|what (do|should|can) i (need to )?(do|be doing)|to-?do|before i start|this week)\b|\b(why|when|how long|where)\b.*\b(laptop|kit|headset|device|badge|pass|access|goals|welcome pack|pay|pension|benefits?|locked|unlock|available|ordered)\b/i,
    answer: aboutMyJourney,
  },
  {
    test: /\b(work(ing)? from home|wfh|remote|hybrid|office days?|in the office)\b/i,
    answer: (j) =>
      j.workPattern === 'remote'
        ? {
            text: 'Your contract is home-based, so you’ll work from home and come to a monthly in-person team day. You also get a home-working allowance of £30 a month through payroll.',
            citations: [section('hybrid-working', 4)],
          }
        : j.workPattern === 'hybrid'
          ? {
              text: 'In your first two weeks we ask you to be in the office at least three days a week to meet your team and buddy. Your manager will confirm which days. After your first month, it’s at least two days a week in the office.',
              citations: [section('hybrid-working', 2), section('hybrid-working', 3)],
            }
          : {
              text: `Your role is site-based, so you’ll work from ${j.location}. Any home-working days are agreed locally with your manager.`,
              citations: [section('hybrid-working', 1)],
            },
  },
  {
    test: /\b(wear|dress|clothes|uniform|jeans|trainers|suit)\b/i,
    answer: (j) =>
      j.workPattern === 'branch'
        ? {
            text: 'Branch colleagues wear the provided uniform. You’ll be measured for it in your first week; until it arrives, wear smart office clothes in dark colours.',
            citations: [section('dress-code', 3)],
          }
        : {
            text: 'Smart casual is normal in our offices, and jeans and trainers are fine. Dress more formally if you’re meeting customers, regulators or external partners.',
            citations: [section('dress-code', 2)],
          },
  },
  {
    test: /\b(expense|claim|mileage|train ticket|travel|hotel|receipt)\b/i,
    answer: () => ({
      text: 'Your normal commute isn’t claimable, but travel to a different office for work is. Book through the travel portal, then claim within 60 days with a photo of each receipt in the expenses app.',
      citations: [section('expenses', 2), section('expenses', 5)],
    }),
  },
  {
    test: /\b(holiday|annual leave|leave|time off|day off|booked a trip)\b/i,
    answer: () => ({
      text: 'Full-time colleagues get 28 days of annual leave plus bank holidays, pro rata in the year you join. If you booked a holiday before accepting your offer, just tell your manager or recruiter. We’ll honour it.',
      citations: [section('leave', 1), section('leave', 3)],
    }),
  },
  {
    test: /\b(sick|ill|unwell)\b/i,
    answer: () => ({
      text: 'If you’re unwell, tell your manager by 10am on your first day off. You don’t need a fit note for absences of 7 calendar days or fewer.',
      citations: [section('leave', 5)],
    }),
  },
  {
    test: /\b(laptop|password|phone|device|computer|chatgpt|ai tool|software)\b/i,
    answer: () => ({
      text: 'You’ll set up your password and multi-factor authentication on Day 1 with your manager or the IT welcome desk, and your software will be ready for you. Bank data should only be accessed on bank devices or an enrolled phone.',
      citations: [section('it-acceptable-use', 3), section('it-acceptable-use', 2)],
    }),
  },
  {
    test: /\b(training|module|course|mandatory|compliance)\b/i,
    answer: () => ({
      text: 'Everyone completes five short mandatory modules in their first 30 days, about 90 minutes in total. Your manager will protect time in your diary, and you don’t need to do them before you start.',
      citations: [section('mandatory-training', 1), section('mandatory-training', 2)],
    }),
  },
  {
    test: /\b(paid|payday|pay day|salary|pension|benefit|bonus)\b/i,
    answer: () => ({
      text: 'Salaries are paid monthly on the 20th. If you start after the 10th, your first pay may come in the following month. You’re enrolled in the pension scheme, and if you contribute 6% the bank adds 15%.',
      citations: [section('benefits-pay', 1), section('benefits-pay', 3)],
    }),
  },
  {
    test: /\b(check|vetting|dbs|reference|screening|start date|how long)\b/i,
    answer: (j) => ({
      text: `Most checks clear within 2 weeks, but references depend on other employers replying and often take 2 to 4 weeks${j.isSmcr ? '. Regulatory references can take up to 6 weeks' : ''}. Your Journey tab shows where each one is up to, and we’ll always tell you if your start date needs to move.`,
      citations: [section('screening', 3), section('screening', 6)],
    }),
  },
]

export function scriptedAnswer(question: string, joiner: JoinerContext): ScriptedAnswer {
  for (const rule of rules) {
    const answer = rule.test.test(question) ? rule.answer(joiner, question) : undefined
    if (answer) return answer
  }
  return {
    text: 'I’m not sure about that one, and I’d rather not guess. Let me connect you with HR Direct, who can give you a proper answer.',
    citations: [],
    route: 'hr',
  }
}

export function scriptedSummary(messages: ChatTurn[], joiner: JoinerContext, route: HandoverRoute): string {
  const lastQuestion = [...messages].reverse().find((m) => m.role === 'user')?.content ?? 'a question'
  const who = { screening: 'the screening team', hr: 'HR', manager: 'their manager', buddy: 'their buddy' }[route]
  return `${joiner.firstName} (${joiner.role}, ${joiner.location}) asked: “${lastQuestion.trim()}”. The assistant suggested speaking to ${who} for a personal answer.`
}
