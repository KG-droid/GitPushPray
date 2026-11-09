import { GOAL_SEPARATOR } from '../data/goals'
import {
  OTHER_BENEFITS_VALUE,
  bankPensionRate,
  flexibleBenefitValue,
  orgPriorities,
  salaries,
  teamGoals,
  type OrgPriority,
  type TeamGoal,
} from '../data/explore'
import type { JourneyView } from './journey'

/** How the joiner's own goals ladder up to their team's goals and the Group's priorities. */
export interface GoalCascade {
  team: string
  /** Goals the manager set; empty until they do */
  myGoals: { title: string; teamGoalIndex: number }[]
  goalsSetBy?: string
  priorities: (OrgPriority & { teamGoals: (TeamGoal & { index: number; mine: string[] })[] })[]
}

export function goalCascade(journey: JourneyView): GoalCascade {
  const team = teamGoals[journey.persona.id] ?? { team: journey.persona.team, goals: [] }
  const setStep = journey.steps.find((s) => s.id === 'mgr-set-goals' && s.state === 'done')
  const titles = setStep?.value ? setStep.value.split(GOAL_SEPARATOR).filter(Boolean) : []
  // Each of the manager's goals supports the team goal in the same position (3 and 3), wrapping if there are more.
  const myGoals = titles.map((title, i) => ({ title, teamGoalIndex: team.goals.length ? i % team.goals.length : 0 }))

  const priorities = orgPriorities
    .map((p) => ({
      ...p,
      teamGoals: team.goals
        .map((g, index) => ({ ...g, index, mine: myGoals.filter((m) => m.teamGoalIndex === index).map((m) => m.title) }))
        .filter((g) => g.priorityId === p.id),
    }))
    .filter((p) => p.teamGoals.length > 0)

  return { team: team.team, myGoals, goalsSetBy: setStep ? 'manager' : undefined, priorities }
}

export interface RewardPart {
  id: 'salary' | 'pension' | 'flexible' | 'other'
  label: string
  amount: number
}

export interface TotalReward {
  total: number
  parts: RewardPart[]
  salary: number
  employeePercent: number
  bankPercent: number
  /** Monthly amounts for the pension calculator */
  monthly: { you: number; bank: number }
}

/** The joiner's own total reward, for a chosen pension contribution. Illustrative values; private to the joiner. */
export function totalReward(journey: JourneyView, employeePercent: number): TotalReward {
  const salary = salaries[journey.persona.id] ?? 30_000
  const bankPercent = bankPensionRate(employeePercent)
  const pension = Math.round((salary * bankPercent) / 100)
  const choice = journey.steps.find((s) => s.id === 'choose-benefits' && s.state === 'done')?.value
  const flexible =
    choice === 'extra-leave' ? Math.round((salary / 260) * 5) : choice ? (flexibleBenefitValue[choice] ?? 0) : 0

  const parts: RewardPart[] = [
    { id: 'salary', label: 'Salary', amount: salary },
    { id: 'pension', label: 'Bank pension contribution', amount: pension },
    { id: 'flexible', label: 'Your flexible benefit', amount: flexible },
    { id: 'other', label: 'Wellbeing, discounts and more', amount: OTHER_BENEFITS_VALUE },
  ]
  return {
    total: parts.reduce((t, p) => t + p.amount, 0),
    parts,
    salary,
    employeePercent,
    bankPercent,
    monthly: { you: Math.round((salary * employeePercent) / 100 / 12), bank: Math.round(pension / 12) },
  }
}

export const formatGBP = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })
