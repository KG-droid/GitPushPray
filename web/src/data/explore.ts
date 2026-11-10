import type { JobFamily, Person } from '../domain/types'

/**
 * Content for the Explore tab.
 * The purpose "Helping Britain Prosper" is publicly stated by Lloyds Banking Group. The values set is
 * ILLUSTRATIVE, modelled on LBG's public values; every story, figure, goal and person here is fictional.
 */

// ── Values ──────────────────────────────────────────────

export interface Value {
  id: string
  name: string
  tagline: string
  icon: string
  meaning: string
  behaviours: string[]
  isNot: string
  story: { name: string; role: string; location: string; text: string }
}

export const values: Value[] = [
  {
    id: 'people-first',
    name: 'People first',
    tagline: 'Customers and colleagues at the heart of every decision',
    icon: 'favorite',
    meaning:
      'We start with the person in front of us, whether that’s a customer worried about a bill or a colleague on their first day, and work back from what they need.',
    behaviours: [
      'Ask “what would help this person most?” before “what does the process say?”',
      'Spot customers who need extra care, and take the time to help',
      'Make time for colleagues: answer the question, share the context',
    ],
    isNot: 'Saying yes to everything. Sometimes putting people first means a kind, honest “no” with a better option.',
    story: {
      name: 'Bethan',
      role: 'Customer Service Advisor',
      location: 'Cardiff',
      text: 'A customer rang about a missed mortgage payment and was close to tears. Instead of reading the script, I asked what was going on. Her partner had just lost his job. We set up a payment break that afternoon, and she wrote in to say it was the first time a bank had listened.',
    },
  },
  {
    id: 'inclusive',
    name: 'Inclusive',
    tagline: 'Everyone belongs, and every voice counts',
    icon: 'groups',
    meaning:
      'We build teams and services that work for everyone in Britain: every background, ability, age and identity. Different perspectives make better decisions.',
    behaviours: [
      'Invite the quiet voices in the room, not just the loudest',
      'Design for accessibility from the start, not as an afterthought',
      'Join a colleague network, or be an ally to one',
    ],
    isNot: 'A box to tick once a year. It’s how we run meetings, hire and build every day.',
    story: {
      name: 'Marcus',
      role: 'Senior Engineer',
      location: 'Leeds',
      text: 'We tested our new payments screen with customers who use screen readers and found three journeys they simply couldn’t finish. Fixing them took a sprint. Now we test with them before every release, and the whole app got better for everyone.',
    },
  },
  {
    id: 'trustworthy',
    name: 'Trustworthy',
    tagline: 'Do the right thing, especially when no one is watching',
    icon: 'verified',
    meaning:
      'People trust us with their money, homes and businesses. We earn that by being open, keeping our promises and speaking up when something isn’t right.',
    behaviours: [
      'Be honest about what you don’t know, and find out',
      'Protect customer data as if it were your own',
      'Speak up early: raising a concern is always the right thing to do',
    ],
    isNot: 'Avoiding mistakes at all costs. It’s owning them quickly and fixing them openly.',
    story: {
      name: 'Oliver',
      role: 'Senior Credit Risk Manager',
      location: 'London',
      text: 'A model we relied on was quietly overstating how risky some small businesses were. Flagging it meant admitting a mistake in our own work. We raised it, fixed it and contacted the affected customers. Leadership thanked the team for speaking up.',
    },
  },
  {
    id: 'be-bold',
    name: 'Be bold',
    tagline: 'Try new things, learn fast, make banking better',
    icon: 'flag',
    meaning: 'Britain is changing fast, and so are our customers. We try new ideas, test them safely, and learn from what doesn’t work.',
    behaviours: [
      'Suggest the better way, even if you’re new: fresh eyes are valuable',
      'Start small, test with real users, then scale what works',
      'Share what you learned when an experiment fails',
    ],
    isNot: 'Being reckless with customers’ money or data. Bold ideas, safely tested.',
    story: {
      name: 'Grace',
      role: 'Graduate, Data',
      location: 'Bristol',
      text: 'Three weeks in, I suggested we nudge customers when a direct debit was about to bounce. My manager said “test it”. We trialled it with 2,000 customers, and missed payments dropped. It’s now rolling out to everyone.',
    },
  },
  {
    id: 'sustainable',
    name: 'Sustainable',
    tagline: 'Building a greener, fairer future for Britain',
    icon: 'eco',
    meaning:
      'Prosperity has to last. We help customers and businesses make greener choices, and we think about the long-term impact of everything we do.',
    behaviours: [
      'Think about the long-term impact, not just this quarter',
      'Help customers with greener choices, from home energy to EV finance',
      'Cut waste in how we work: fewer prints, smarter travel',
    ],
    isNot: 'Just about the environment. It also means fair, lasting outcomes for customers and communities.',
    story: {
      name: 'Kerry',
      role: 'Senior Customer Advisor',
      location: 'Birmingham',
      text: 'Our branch ran money-confidence sessions at the local library for people new to the UK. Six months on, some of those families have opened savings accounts for the first time. That’s what helping Britain prosper looks like on our high street.',
    },
  },
]

// ── Purpose ─────────────────────────────────────────────

export const purpose = {
  name: 'Helping Britain Prosper',
  summary:
      'Our purpose is to help Britain prosper: for the people, families, businesses and communities we serve. Everything we do, from a single payment to a new mortgage, should leave people better off.',
  pillars: [
    { icon: 'home', title: 'Homes', text: 'Helping people buy their first home, and stay in it when times are hard.', stat: '1 in 5', statLabel: 'first-time buyers (illustrative)' },
    { icon: 'payments', title: 'Money confidence', text: 'Helping people save, budget and feel in control of their money.', stat: '2m', statLabel: 'money-confidence sessions a year (illustrative)' },
    { icon: 'storefront', title: 'Businesses', text: 'Backing small businesses and start-ups that create jobs across the UK.', stat: '£10bn', statLabel: 'lent to small businesses (illustrative)' },
    { icon: 'insights', title: 'A sustainable future', text: 'Financing greener homes, transport and energy.', stat: '£15bn', statLabel: 'green finance (illustrative)' },
  ],
}

/** How each job family's day-to-day work connects to the purpose. */
export const howYouFit: Record<JobFamily, string> = {
  technology:
    'Every payment you help make faster and more reliable is a rent paid on time, a salary that lands, a small business paid by its customers. The platform you build is how millions of people feel in control of their money.',
  'contact-centre':
    'You’re often the voice people hear at a hard moment: a missed payment, a fraud scare, a bereavement. How you listen and what you fix on that call is helping Britain prosper, one conversation at a time.',
  risk: 'Good risk decisions keep the bank strong enough to keep lending, to the family buying a home and the business taking on staff. You help us say yes safely, and stay open for business through the tough years.',
  retail:
    'Your branch is the bank’s front door on the high street. Helping someone open their first account, spot a scam or plan for a home is prosperity you can see in your own community.',
  graduate:
    'Your rotations will show you the whole bank, from the platforms that move money to the teams that support customers in need. Wherever you land, your fresh ideas help us serve Britain better.',
  data: 'The insight you find shapes what we build and who we help first, like spotting customers heading for difficulty before they miss a payment. Good data, used responsibly, makes help arrive sooner.',
}

// ── Goals ───────────────────────────────────────────────

export interface OrgPriority {
  id: string
  title: string
  detail: string
}

/** Group-level priorities (fictional) under the purpose. */
export const orgPriorities: OrgPriority[] = [
  { id: 'simple', title: 'Make banking simple and personal', detail: 'Faster, easier everyday banking that feels made for you.' },
  { id: 'homes-savings', title: 'Help Britain save and own a home', detail: 'More people with savings, a pension and a home of their own.' },
  { id: 'greener-fairer', title: 'Support a greener, fairer Britain', detail: 'Finance for a sustainable economy, and help for those who need it most.' },
]

export interface TeamGoal {
  title: string
  /** Which Group priority this team goal ladders up to */
  priorityId: string
}

/** Team-level goals (fictional), keyed by persona id. */
export const teamGoals: Record<string, { team: string; goals: TeamGoal[] }> = {
  priya: payments(),
  tom: payments(),
  amara: payments(),
  rhys: {
    team: 'Mortgages Customer Service',
    goals: [
      { title: 'Resolve 85% of calls first time', priorityId: 'simple' },
      { title: 'Support every customer in financial difficulty within 48 hours', priorityId: 'greener-fairer' },
      { title: 'Help 500 customers review their mortgage this year', priorityId: 'homes-savings' },
    ],
  },
  margaret: {
    team: 'Commercial Banking Risk',
    goals: [
      { title: 'Keep lending to small businesses within risk appetite', priorityId: 'greener-fairer' },
      { title: 'Halve the time for a credit decision', priorityId: 'simple' },
      { title: 'Build climate risk into every large lending decision', priorityId: 'greener-fairer' },
    ],
  },
  jordan: {
    team: 'Birmingham New Street branch',
    goals: [
      { title: 'Stop 100% of reported scams at the counter', priorityId: 'simple' },
      { title: 'Run a monthly community money-confidence session', priorityId: 'homes-savings' },
      { title: 'Help 50 local businesses go digital', priorityId: 'greener-fairer' },
    ],
  },
  aisha: {
    team: 'Graduate cohort 2026',
    goals: [
      { title: 'Complete three rotations across the bank', priorityId: 'simple' },
      { title: 'Deliver a cohort project that helps customers save', priorityId: 'homes-savings' },
      { title: 'Volunteer two days in a local community', priorityId: 'greener-fairer' },
    ],
  },
  sam: {
    team: 'Customer Insight',
    goals: [
      { title: 'Spot customers heading for difficulty two months sooner', priorityId: 'greener-fairer' },
      { title: 'Give every product team a live customer dashboard', priorityId: 'simple' },
      { title: 'Measure the impact of our savings nudges', priorityId: 'homes-savings' },
    ],
  },
}

function payments() {
  return {
    team: 'Payments Platform',
    goals: [
      { title: 'Make payments instant and 99.99% reliable', priorityId: 'simple' },
      { title: 'Launch the new self-serve refunds journey', priorityId: 'simple' },
      { title: 'Cut fraud losses on faster payments by a fifth', priorityId: 'greener-fairer' },
    ],
  }
}

// ── Organisation ────────────────────────────────────────

/** Fictional leaders above each manager, top first. The persona's manager and the persona are added below these. */
export const leaders: Record<string, Person> = {
  ceo: { id: 'ldr-ceo', name: 'Alex Morgan', role: 'Group Chief Executive', bio: 'Leads the Group and its purpose of helping Britain prosper.' },
  cto: { id: 'ldr-cto', name: 'Ruth Kaplan', role: 'Chief Technology Officer', bio: 'Leads 10,000 engineers across the UK.' },
  payEng: { id: 'ldr-payeng', name: 'Imogen Shaw', role: 'Director, Payments Engineering', bio: 'Owns the platforms that move £1bn a day (illustrative).' },
  custOps: { id: 'ldr-custops', name: 'Martin Lowe', role: 'Director of Customer Operations', bio: 'Leads contact centres in Cardiff, Leeds and Edinburgh.' },
  cardiff: { id: 'ldr-cardiff', name: 'Siân Price', role: 'Cardiff Centre Manager', bio: 'Runs the Cardiff contact centre, home to 900 colleagues.' },
  gcro: { id: 'ldr-gcro', name: 'Victoria Hale', role: 'Group Chief Risk Officer', bio: 'Keeps the bank safe, strong and able to keep lending.' },
  retail: { id: 'ldr-retail', name: 'Neil Brennan', role: 'Director, Branch Network (Midlands)', bio: 'Looks after 120 branches across the Midlands.' },
  area: { id: 'ldr-area', name: 'Priti Shah', role: 'Area Manager, Birmingham', bio: 'Supports 14 branches around Birmingham.' },
  cdo: { id: 'ldr-cdo', name: 'Ravi Desai', role: 'Chief Data & Analytics Officer', bio: 'Leads data science and analytics across the Group.' },
}

export const reportingLine: Record<string, (keyof typeof leaders)[]> = {
  priya: ['ceo', 'cto', 'payEng'],
  tom: ['ceo', 'cto', 'payEng'],
  amara: ['ceo', 'cto', 'payEng'],
  rhys: ['ceo', 'custOps', 'cardiff'],
  margaret: ['ceo', 'gcro'],
  jordan: ['ceo', 'retail', 'area'],
  aisha: ['ceo', 'cto'],
  sam: ['ceo', 'cdo'],
}

// ── Line manager responsibilities ───────────────────────

export interface ManagerResponsibility {
  id: string
  title: string
  icon: string
  summary: string
  points: string[]
}

/** What LBG expects of a line manager, in practical terms. Illustrative wording for the demo. */
export const managerResponsibilities: ManagerResponsibility[] = [
  {
    id: 'performance',
    title: 'Set clear expectations and manage performance',
    icon: 'flag',
    summary: 'Agree what good looks like, check in often, and deal with concerns early.',
    points: [
      'Agree meaningful performance goals and actions with colleagues in Workday.',
      'Hold regular, open Check-ins: at least quarterly, with extra conversations where needed.',
      'Assess both what colleagues deliver and how they deliver it, using evidence rather than reputation or visibility.',
      'Address performance concerns rather than letting them drift, with the right support and development.',
    ],
  },
  {
    id: 'development',
    title: 'Develop colleagues and build capability',
    icon: 'school',
    summary: 'Know your people’s skills and ambitions, and help them grow.',
    points: [
      'Understand colleagues’ skills and career aspirations.',
      'Agree development goals and encourage ongoing learning.',
      'Give constructive feedback, recognition and coaching.',
      'Create opportunities for colleagues to grow their skills and contribution. Development goals and active learning are part of how people leaders are measured, alongside performance objectives.',
    ],
  },
  {
    id: 'wellbeing',
    title: 'Look after wellbeing',
    icon: 'favorite',
    summary: 'Ask how people really are, not just how the work is going.',
    points: [
      'Have genuine conversations about how colleagues are doing. Check-ins aren’t only a performance process.',
      'Recognise when health, absence or disability may affect someone at work, and point them to LBG’s wellbeing support.',
    ],
  },
  {
    id: 'adjustments',
    title: 'Create an inclusive environment and support workplace adjustments',
    icon: 'accessibility_new',
    summary: 'Understand individual needs, and make adjustments happen.',
    points: [
      'Understand individual needs rather than making assumptions.',
      'Talk with the colleague about what helps them perform at their best.',
      'Put reasonable adjustments in place directly where appropriate, and involve specialist support where needed.',
      'If a colleague has a Workplace Adjustment Passport, familiarise yourself with it, keep it up to date, and check it has been reviewed within the last quarter.',
    ],
  },
  {
    id: 'fairness',
    title: 'Lead fairly and inclusively',
    icon: 'groups',
    summary: 'Decide on evidence, watch for bias, and make space for different views.',
    points: [
      'Make fair, evidence-based decisions and stay aware of potential bias.',
      'Seek different perspectives and create an environment where colleagues feel included.',
      'Take individual circumstances and adjustments into account when assessing performance. The scoring guidance calls out disability adjustments, pregnancy, maternity and absence as circumstances that may need to be considered.',
    ],
  },
  {
    id: 'lifecycle',
    title: 'Manage the colleague lifecycle',
    icon: 'event',
    summary: 'From recruitment to exit, you own or take part in most people processes.',
    points: [
      'Recruitment and onboarding, including the joining journey you’re seeing now from the other side.',
      'Changes in working arrangements, performance and reward, absence, and organisational change.',
      'Colleague exits: agree next steps, review holiday entitlement, and make sure any final salary adjustments are completed.',
    ],
  },
  {
    id: 'flexible',
    title: 'Support flexible ways of working',
    icon: 'home',
    summary: 'Find what works for the person, the role and the team, and revisit it.',
    points: [
      'Work with colleagues to find an arrangement that suits the individual, the role and the team.',
      'Review arrangements periodically. Flexibility isn’t a one-off decision.',
      'Balance what colleagues need with what is workable for the team and the business.',
    ],
  },
  {
    id: 'values',
    title: 'Role-model LBG values, risk and controls',
    icon: 'verified',
    summary: 'Your team takes its lead from how you behave.',
    points: [
      'A Culture & Values goal is automatically added for people leaders in Workday, because managers shape the culture and behaviour of their teams.',
      'LBG’s values are meant to guide day-to-day decisions, not sit in a separate exercise.',
      'Follow, and visibly follow, the risk and control expectations of your role.',
    ],
  },
]

// ── Benefits & reward ───────────────────────────────────

/** Synthetic annual salaries, used only for the joiner's own reward summary (never shown to anyone else). */
export const salaries: Record<string, number> = {
  priya: 52_000,
  rhys: 24_500,
  margaret: 165_000,
  jordan: 23_800,
  aisha: 32_000,
  sam: 41_000,
  tom: 38_000,
  amara: 72_000,
}

export interface BenefitItem {
  name: string
  detail: string
}

export interface BenefitCategory {
  id: string
  title: string
  icon: string
  items: BenefitItem[]
}

export const benefitCategories: BenefitCategory[] = [
  {
    id: 'money',
    title: 'Money and pension',
    icon: 'payments',
    items: [
      { name: 'Pension', detail: 'Contribute 6% and the bank adds 15%. The bank matches more as you contribute more.' },
      { name: 'Annual bonus', detail: 'A discretionary bonus based on the Group’s and your performance.' },
      { name: 'Share plans', detail: 'Buy shares from your salary, and get some free from the bank.' },
      { name: 'Colleague discounts', detail: 'Better rates on some of our own products, plus a retail discount platform.' },
    ],
  },
  {
    id: 'health',
    title: 'Health and wellbeing',
    icon: 'favorite',
    items: [
      { name: 'Private medical cover', detail: 'Available as your flexible benefit, with partner and family add-ons.' },
      { name: 'Wellbeing app', detail: 'Free access to mindfulness, sleep and fitness content.' },
      { name: 'Employee Assistance Programme', detail: '24/7 confidential support for you and your family.' },
    ],
  },
  {
    id: 'time',
    title: 'Time off',
    icon: 'event',
    items: [
      { name: '28 days’ holiday', detail: 'Plus UK bank holidays, pro rata in your first year.' },
      { name: 'Buy extra leave', detail: 'Buy up to 5 extra days a year through flexible benefits.' },
      { name: 'Volunteering', detail: '2 paid days a year to volunteer in your community.' },
    ],
  },
  {
    id: 'family',
    title: 'Family and caring',
    icon: 'groups',
    items: [
      { name: 'Enhanced family leave', detail: 'Generous paid leave for every parent, however your family grows.' },
      { name: 'Emergency time off', detail: 'Paid time off when a dependant needs you unexpectedly.' },
    ],
  },
  {
    id: 'travel',
    title: 'Getting to work',
    icon: 'home',
    items: [
      { name: 'Season ticket loan', detail: 'Interest-free, paid back monthly from your salary.' },
      { name: 'Cycle to work', detail: 'Save on a bike and kit through salary sacrifice.' },
      { name: 'Home-working allowance', detail: '£30 a month for colleagues on home-based contracts.' },
    ],
  },
]

/** Other benefits everyone gets (wellbeing, discounts, EAP), as a rough annual value (illustrative). */
export const OTHER_BENEFITS_VALUE = 600

/** The bank's pension contribution for a given employee contribution: 6% → 15%, capped at 15%. */
export function bankPensionRate(employeePercent: number): number {
  if (employeePercent <= 0) return 0
  return Math.min(15, 3 + 2 * employeePercent)
}
