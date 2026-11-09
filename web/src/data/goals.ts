import type { JobFamily } from '../domain/types'

/** Starter goals a manager can edit when setting a joiner's first 3 months. Synthetic. */
export const suggestedGoals: Record<JobFamily, string[]> = {
  technology: [
    'Ship your first change to production by the end of week 2',
    'Pair with every engineer on the team in your first month',
    'Lead a team demo by the end of month 3',
  ],
  'contact-centre': [
    'Complete call-handling training with your cohort',
    'Take your first supervised calls by week 3',
    'Reach an 85% quality score by the end of month 3',
  ],
  risk: [
    'Meet your 10 key stakeholders in month one',
    'Review the commercial credit risk appetite by week 6',
    'Present your 90-day plan to the risk committee',
  ],
  retail: [
    'Complete cash handling and security training in week 1',
    'Serve customers on the counter independently by week 4',
    'Run a community money-confidence session by month 3',
  ],
  graduate: [
    'Complete the graduate induction and choose your first rotation',
    'Deliver a small project for your rotation team by week 8',
    'Share what you’ve learned at the cohort showcase in month 3',
  ],
  data: [
    'Get access to the analytics platform and ship your first query by week 2',
    'Own a dashboard for the team by week 6',
    'Present an insight to the customer team by month 3',
  ],
}

export const GOAL_SEPARATOR = '\n'
