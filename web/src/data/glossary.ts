/** Plain-English explanations of terms a new joiner meets in this app and in their first weeks. */
export interface GlossaryTerm {
  id: string
  term: string
  /** Other ways the term is written in the app's text */
  aliases?: string[]
  meaning: string
}

export const glossary: GlossaryTerm[] = [
  { id: 'fca', term: 'FCA', meaning: 'The Financial Conduct Authority. The UK regulator that checks banks treat customers fairly and behave properly in the markets.' },
  { id: 'pra', term: 'PRA', meaning: 'The Prudential Regulation Authority, part of the Bank of England. It makes sure banks are financially safe and sound.' },
  {
    id: 'smcr',
    term: 'SM&CR',
    aliases: ['Senior Managers & Certification Regime', 'Senior Managers and Certification Regime'],
    meaning: 'The Senior Managers and Certification Regime. Rules from the FCA and PRA that make named senior people personally accountable for their area of the bank, and require checks that other key staff are fit and proper.',
  },
  {
    id: 'sor',
    term: 'Statement of Responsibilities',
    meaning: 'A short document that sets out exactly what a senior manager is accountable for. The regulators see it, so it is worth reading carefully.',
  },
  {
    id: 'reg-reference',
    term: 'regulatory reference',
    aliases: ['Regulatory reference'],
    meaning: 'A reference from your previous employers in financial services covering up to the last 6 years. Firms have up to 6 weeks to reply, which is why it is often the last check to clear.',
  },
  {
    id: 'dbs',
    term: 'Basic DBS',
    aliases: ['DBS'],
    meaning: 'A check from the Disclosure and Barring Service. A basic check only shows convictions that are not yet spent. Every colleague at the bank has one.',
  },
  { id: 'rtw', term: 'right to work', aliases: ['right-to-work', 'Right to work'], meaning: 'A legal check that you are allowed to work in the UK, usually with your passport or a share code.' },
  { id: 'vetting', term: 'vetting', aliases: ['screening', 'Screening'], meaning: 'The pre-employment checks every bank joiner goes through: identity, right to work, criminal record, financial background and references.' },
  { id: 'soft-check', term: 'soft check', meaning: 'A credit check that leaves no mark on your credit score. Only you and the checking team can see that it happened.' },
  { id: 'hr-direct', term: 'HR Direct', meaning: 'The bank’s people-questions service. Ask about pay, contracts, leave and adjustments, and expect a reply within a working day.' },
  { id: 'mfa', term: 'multi-factor authentication', aliases: ['Multi-factor authentication', 'MFA'], meaning: 'Signing in with something you know (a password) and something you have (usually your phone), so a stolen password alone is not enough.' },
  { id: 'buddy', term: 'buddy', aliases: ['Buddy'], meaning: 'A friendly colleague who has been in your shoes. They are there for the questions you would rather not ask your manager.' },
  { id: 'cohort', term: 'cohort', meaning: 'The group of people who start at the same time as you and go through induction or training together.' },
  { id: 'rotation', term: 'rotation', aliases: ['rotations'], meaning: 'On a graduate scheme, a placement in a different team for several months, so you try different kinds of work.' },
  { id: 'one-to-one', term: 'one-to-one', aliases: ['1:1'], meaning: 'A regular private catch-up with your manager about how things are going, your goals and anything you need.' },
  { id: 'stakeholder', term: 'stakeholder', aliases: ['stakeholders'], meaning: 'Anyone who depends on your work or cares how it turns out, inside or outside your team.' },
  { id: 'salary-sacrifice', term: 'salary sacrifice', meaning: 'You give up part of your pay before tax in return for a benefit, such as a bike or a pension top-up. It can lower the tax and National Insurance you pay.' },
  { id: 'pension', term: 'pension', meaning: 'Money set aside from your pay for retirement. The bank adds to what you put in.' },
  { id: 'assistive-tech', term: 'assistive technology', meaning: 'Equipment or software that helps with a disability or health condition, such as screen readers, speech-to-text or an adapted keyboard.' },
  { id: 'adjustment', term: 'workplace adjustment', aliases: ['workplace adjustments'], meaning: 'A change to your equipment, hours or workspace so that a disability or health condition does not hold you back at work.' },
  { id: 'eap', term: 'EAP', meaning: 'The Employee Assistance Programme. A free, confidential service for support with personal or work worries.' },
  { id: 'rsi', term: 'RSI', meaning: 'Repetitive strain injury. Pain from doing the same movement often, such as typing. The right keyboard and desk set-up can help.' },
  { id: 'ssd', term: 'SSD', meaning: 'A solid-state drive. Fast storage inside a laptop that makes it start up and open files quickly.' },
  { id: 'hbp', term: 'Helping Britain Prosper', meaning: 'The bank’s purpose: to help customers, communities and businesses across Britain do well.' },
  { id: 'consumer-duty', term: 'Consumer Duty', meaning: 'FCA rules that require firms to deliver good outcomes for retail customers, not just follow the letter of the law.' },
  { id: 'guild', term: 'guild', aliases: ['guilds'], meaning: 'An informal group across teams for people who share a craft, such as engineers, who swap tips and learn together.' },
  { id: 'pull-request', term: 'pull request', meaning: 'A proposed change to code that teammates review before it is added. Your first one is a rite of passage.' },
  { id: 'hybrid', term: 'hybrid', aliases: ['hybrid working'], meaning: 'Splitting your week between the office and home, with set days in the office for your team.' },
]
