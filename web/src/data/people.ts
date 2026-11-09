import type { Person } from '../domain/types'

/** Synthetic teammates and chat copy. Every person here is fictional. */

export const teammates: Record<string, Person[]> = {
  priya: [
    { id: 'tm-priya-1', name: 'Marcus Lee', role: 'Senior Engineer', funFact: 'Keeps bees on his allotment.' },
    { id: 'tm-priya-2', name: 'Hannah Brooks', role: 'Product Owner', funFact: 'Has visited every Premier League ground.' },
    { id: 'tm-priya-3', name: 'Sanjay Patel', role: 'QA Engineer', funFact: 'Plays bass in a covers band.' },
    { id: 'tm-priya-4', name: 'Ella Novak', role: 'Platform Engineer', funFact: 'Learning Japanese for a trip next spring.' },
  ],
  rhys: [
    { id: 'tm-rhys-1', name: 'Bethan Rees', role: 'Customer Service Advisor', funFact: 'Sings in a male voice choir, the only woman in it.' },
    { id: 'tm-rhys-2', name: 'Tom Hughes', role: 'Quality Coach', funFact: 'Has a rescue greyhound called Biscuit.' },
    { id: 'tm-rhys-3', name: 'Aled Jones', role: 'Customer Service Advisor', funFact: 'Runs the team’s fantasy rugby league.' },
  ],
  margaret: [
    { id: 'tm-margaret-1', name: 'Oliver Grant', role: 'Senior Credit Risk Manager', funFact: 'Ex-county cricketer.' },
    { id: 'tm-margaret-2', name: 'Priyanka Iyer', role: 'Risk Analytics Lead', funFact: 'Bakes a cake for every team birthday.' },
    { id: 'tm-margaret-3', name: 'David Chen', role: 'Head of Risk Policy', funFact: 'Restores vintage bikes.' },
  ],
  jordan: [
    { id: 'tm-jordan-1', name: 'Sarah Mills', role: 'Customer Advisor', funFact: 'Knows every regular’s dog by name.' },
    { id: 'tm-jordan-2', name: 'Imran Shah', role: 'Mortgage Adviser', funFact: 'Grew up two streets from the branch.' },
    { id: 'tm-jordan-3', name: 'Lucy Carter', role: 'Assistant Branch Manager', funFact: 'Volunteers at the local food bank.' },
  ],
  aisha: [
    { id: 'tm-aisha-1', name: 'Noah Williams', role: 'Graduate, Technology', funFact: 'Built a robot that waters his plants.' },
    { id: 'tm-aisha-2', name: 'Grace Okafor', role: 'Graduate, Data', funFact: 'Does stand-up comedy at open mics.' },
    { id: 'tm-aisha-3', name: 'Callum Reid', role: 'Graduate, Cyber', funFact: 'Has climbed Ben Nevis three times.' },
    { id: 'tm-aisha-4', name: 'Mei Lin', role: 'Graduate, Technology', funFact: 'Runs a book club for the cohort.' },
  ],
  sam: [
    { id: 'tm-sam-1', name: 'Rachel Turner', role: 'Data Analyst', funFact: 'Works from a narrowboat twice a year.' },
    { id: 'tm-sam-2', name: 'Kofi Asante', role: 'Data Engineer', funFact: 'Makes his own hot sauce.' },
    { id: 'tm-sam-3', name: 'Zara Hussain', role: 'Insight Manager', funFact: 'Has a cat that attends every stand-up.' },
  ],
}

/** The first message in each thread, written by the manager or buddy. */
export function introMessage(personId: string, joinerFirstName: string, isBuddy: boolean): string {
  const custom: Record<string, string> = {
    'buddy-chloe': `Hi ${joinerFirstName}! I’m Chloe, your buddy 👋 I joined the Payments team 18 months ago, so I remember the first weeks well. Ask me anything, however small: where the good coffee is, how stand-ups work, anything.`,
    'buddy-ffion': `Shwmae ${joinerFirstName}! I’m Ffion, your buddy. I did the same induction last year, so I know exactly what it’s like. Shout if you have any questions before you start.`,
    'buddy-james': `Hello ${joinerFirstName}, James here. I’ll be your buddy on the risk leadership team. I joined from another bank last year, so I’m happy to share what helped me find my way around.`,
    'buddy-kerry': `Hiya ${joinerFirstName}! I’m Kerry, I’ve been at New Street for 8 years and I’ll be looking after you. We’re a friendly bunch, you’ll love it.`,
    'buddy-leo': `Hey ${joinerFirstName}! Leo here, I did the grad scheme last year. Happy to help with anything, from picking rotations to finding the best lunch in Bristol.`,
    'buddy-nadia': `Hi ${joinerFirstName}! I’m Nadia, your buddy. I’ve been fully remote for 3 years, so I’m an expert at not feeling remote 😄 Let’s set up a video coffee soon.`,
  }
  if (custom[personId]) return custom[personId]
  return isBuddy
    ? `Hi ${joinerFirstName}! I’m your buddy. Ask me anything before you start.`
    : `Hi ${joinerFirstName}, really pleased you’re joining us. I’ll be your manager. I’m here if you have any questions before you start, and I’ll set up a call the week before Day 1.`
}

export function managerIntro(personId: string, joinerFirstName: string): string {
  const custom: Record<string, string> = {
    'mgr-daniel': `Hi ${joinerFirstName}, Daniel here. Really pleased you’re joining Payments Platform! The team can’t wait to meet you. I’ll send your first-week plan soon. In the meantime, shout if you have questions.`,
    'mgr-gareth': `Hi ${joinerFirstName}, I’m Gareth, your team leader. Welcome to the team! Your cohort starts together, so you won’t be on your own. Any questions, just ask.`,
    'mgr-helen': `${joinerFirstName}, welcome. I’m delighted you’re joining us. I know the regulatory reference can feel slow; it’s entirely normal for this role. Happy to talk through the first 90 days whenever suits.`,
    'mgr-tariq': `Hi ${joinerFirstName}, Tariq here. Welcome to New Street! Kerry will look after you on the counter, and I’ll be around all of your first week.`,
    'mgr-fiona': `Hi ${joinerFirstName}, Fiona here. I look after the graduate programme. Great to have you in the 2026 cohort!`,
    'mgr-ben': `Hi ${joinerFirstName}, I’m Ben. Welcome to Customer Insight! We’re fully remote but very social. Our team day is the first Thursday of the month.`,
  }
  return custom[personId] ?? introMessage(personId, joinerFirstName, false)
}

/** Suggested first messages for the buddy chat. */
export const icebreakers = [
  'Hi! Thanks for being my buddy 😊',
  'What do you wish you’d known in your first week?',
  'Fancy a virtual coffee before I start?',
]

/** Friendly scripted replies, picked by what the joiner wrote. */
export function cannedReply(text: string, joinerFirstName: string, isBuddy: boolean): string {
  const t = text.toLowerCase()
  if (/coffee|chat|call|meet/.test(t))
    return isBuddy
      ? 'Yes, definitely! How about Thursday at 11? I’ll send an invite ☕'
      : 'Good idea. I’ll put 30 minutes in for the week before you start.'
  if (/thank/.test(t)) return isBuddy ? `No problem at all, ${joinerFirstName}. That’s what I’m here for!` : 'You’re very welcome. See you soon!'
  if (/wish|first week|advice|tip/.test(t))
    return 'Honestly, that nobody expects you to know everything. Ask loads of questions, take the mandatory training a bit at a time, and say yes to lunch invites!'
  if (/nervous|worried|anxious/.test(t))
    return 'Totally normal! Everyone feels like that. You’ll be fine, and I’m only a message away.'
  if (/\?/.test(t))
    return isBuddy
      ? 'Great question! Let me check and get back to you today. If it’s about a policy, the Ask tab is usually spot on too.'
      : 'Good question. Let me come back to you on that by tomorrow.'
  return isBuddy ? 'Love it 😄 Looking forward to meeting you!' : 'Thanks. Looking forward to working with you!'
}

/** Stable avatar colour per name, from a brand-friendly palette. */
const avatarPalette = ['#006A4D', '#11B67A', '#0B6E99', '#7B4FB7', '#C2410C', '#B4235A', '#4D7C0F', '#0F766E']

export function avatarColor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return avatarPalette[h % avatarPalette.length]
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
