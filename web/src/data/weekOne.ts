import type { JobFamily } from '../domain/types'

/** Suggested sessions for a joiner's first week, which their manager picks from. Synthetic demo content. */
export interface WeekOneItem {
  id: string
  title: string
  detail: string
  /** Working day of the first week: 1 is Day 1 */
  day: 2 | 3 | 4 | 5
  time: string
  minutes: number
  /** Ticked by default */
  recommended?: boolean
}

export const weekOneItems: Record<JobFamily, WeekOneItem[]> = {
  technology: [
    { id: 'tech-arch', title: 'Architecture walkthrough', detail: 'A senior engineer shows how the platform fits together.', day: 2, time: '10:00', minutes: 60, recommended: true },
    { id: 'tech-pair', title: 'Pair on a small change', detail: 'Work through a real ticket with a teammate, start to finish.', day: 2, time: '14:00', minutes: 90, recommended: true },
    { id: 'tech-standup', title: 'Join stand-up and the team retro', detail: 'See how the team talks about work and what it wants to improve.', day: 3, time: '09:30', minutes: 45 },
    { id: 'tech-guild', title: 'Engineering guild lunch', detail: 'Meet engineers from other teams over lunch.', day: 3, time: '12:30', minutes: 45 },
    { id: 'tech-ship', title: 'How we ship: releases and on-call', detail: 'From pull request to production, and who to call when it goes wrong.', day: 4, time: '11:00', minutes: 45, recommended: true },
    { id: 'tech-product', title: 'Meet your product owner', detail: 'What the team is building next, and why.', day: 4, time: '14:00', minutes: 30, recommended: true },
  ],
  'contact-centre': [
    { id: 'cc-shadow', title: 'Listen in on live calls', detail: 'Sit with an experienced advisor and hear how calls really go.', day: 2, time: '10:00', minutes: 120, recommended: true },
    { id: 'cc-systems', title: 'Customer systems walkthrough', detail: 'Find your way around the tools you will use on every call.', day: 2, time: '14:00', minutes: 60, recommended: true },
    { id: 'cc-quality', title: 'How quality scoring works', detail: 'What good looks like, so there are no surprises.', day: 3, time: '11:00', minutes: 45, recommended: true },
    { id: 'cc-wellbeing', title: 'Wellbeing and breaks briefing', detail: 'How to look after yourself on busy days.', day: 3, time: '14:00', minutes: 30 },
    { id: 'cc-tricky', title: 'Handling a tricky call', detail: 'Role-play with your team leader, in a safe space.', day: 4, time: '10:00', minutes: 60, recommended: true },
    { id: 'cc-coach', title: 'First coaching conversation', detail: 'What went well this week and what to try next.', day: 5, time: '15:00', minutes: 30 },
  ],
  risk: [
    { id: 'risk-team', title: 'Meet your direct reports', detail: 'One conversation each, to hear what they need from you.', day: 2, time: '10:00', minutes: 60, recommended: true },
    { id: 'risk-committee', title: 'Risk committee briefing', detail: 'How the committee works and what it will ask of you.', day: 2, time: '14:00', minutes: 60, recommended: true },
    { id: 'risk-appetite', title: 'Risk appetite walkthrough', detail: 'The limits your area works within, with the team that set them.', day: 3, time: '10:00', minutes: 90 },
    { id: 'risk-sor', title: 'Statement of Responsibilities check-in', detail: 'Talk through exactly what you are accountable for.', day: 3, time: '15:00', minutes: 45, recommended: true },
    { id: 'risk-regulators', title: 'Introduction to your regulatory contacts', detail: 'Who you will deal with at the regulators, and how.', day: 4, time: '11:00', minutes: 45, recommended: true },
    { id: 'risk-peers', title: 'Lunch with the risk leadership team', detail: 'Your peers, no agenda.', day: 5, time: '12:30', minutes: 60 },
  ],
  retail: [
    { id: 'retail-counter', title: 'Shadow at the counter', detail: 'Watch a colleague serve customers, then try the simple tasks yourself.', day: 2, time: '09:30', minutes: 120, recommended: true },
    { id: 'retail-security', title: 'Cash handling and security walkthrough', detail: 'The routines that keep customers and colleagues safe.', day: 2, time: '14:00', minutes: 60, recommended: true },
    { id: 'retail-regulars', title: 'Meet the regulars', detail: 'The customers who know the branch best, introduced by your buddy.', day: 3, time: '10:00', minutes: 60 },
    { id: 'retail-products', title: 'Products and referral basics', detail: 'What we offer, and when to bring in a specialist.', day: 4, time: '11:00', minutes: 60, recommended: true },
    { id: 'retail-community', title: 'Community partnerships', detail: 'How the branch works with local charities and businesses.', day: 4, time: '15:00', minutes: 30, recommended: true },
    { id: 'retail-review', title: 'End-of-week review', detail: 'How it went and what you would like more of.', day: 5, time: '16:00', minutes: 30 },
  ],
  graduate: [
    { id: 'grad-cohort', title: 'Cohort welcome session', detail: 'Meet the other graduates and the programme team.', day: 2, time: '10:00', minutes: 60, recommended: true },
    { id: 'grad-rotation', title: 'How rotations work', detail: 'How placements are chosen and what to expect from each.', day: 2, time: '14:00', minutes: 60, recommended: true },
    { id: 'grad-network', title: 'Graduate network lunch', detail: 'Last year’s graduates share what they wish they had known.', day: 3, time: '12:30', minutes: 60 },
    { id: 'grad-sponsor', title: 'Meet your sponsor', detail: 'A senior colleague who will help with your career.', day: 4, time: '11:00', minutes: 45, recommended: true },
    { id: 'grad-project', title: 'Your first project brief', detail: 'What you will deliver in your first rotation.', day: 4, time: '14:00', minutes: 60, recommended: true },
  ],
  data: [
    { id: 'data-platform', title: 'Data platform tour', detail: 'Where the data lives and how to get at it safely.', day: 2, time: '10:00', minutes: 60, recommended: true },
    { id: 'data-query', title: 'Run your first query with a teammate', detail: 'From access request to a first result, together.', day: 2, time: '14:00', minutes: 90, recommended: true },
    { id: 'data-users', title: 'Meet the teams who use your insight', detail: 'What they do with your work, and what they wish for.', day: 3, time: '11:00', minutes: 45 },
    { id: 'data-community', title: 'Analytics community of practice', detail: 'Share tips with analysts from across the bank.', day: 3, time: '14:00', minutes: 45 },
    { id: 'data-dashboards', title: 'Walk through the main dashboards', detail: 'The reports the team is judged on, and how they are built.', day: 4, time: '10:00', minutes: 60, recommended: true },
    { id: 'data-coffee', title: 'Virtual coffee with the wider team', detail: 'A relaxed chat with people you will work with.', day: 5, time: '15:00', minutes: 30, recommended: true },
  ],
}
