import type { JourneyView, StepView } from './journey'
import { laptopOrder } from './laptop'
import type { ChoiceOption } from './types'

/**
 * The welcome pack is the first thing a joiner gets from their manager, and the manager sends it from here.
 * Where the role comes with a laptop, the manager has to choose which laptops are on offer before it can go.
 */

export const SEND_WELCOME_PACK_STEP = 'mgr-send-welcome-pack'
const LAPTOP_SPEC_STEP = 'mgr-set-device-spec'

export interface WelcomePackStatus {
  /** The manager's task. Missing only if the catalogue has no welcome pack. */
  step?: StepView
  sent: boolean
  /** ISO date it was sent */
  sentOn?: string
  /** The laptop options still have to be chosen before the pack can be sent */
  needsLaptops: boolean
}

export function welcomePackStatus(journey: JourneyView): WelcomePackStatus {
  const step = journey.steps.find((s) => s.id === SEND_WELCOME_PACK_STEP)
  const sent = step?.state === 'done'
  return {
    step,
    sent,
    sentOn: sent ? step?.doneAt?.slice(0, 10) : undefined,
    needsLaptops: journey.steps.some((s) => s.id === LAPTOP_SPEC_STEP && s.state !== 'done'),
  }
}

export interface PackLaptops {
  spec: ChoiceOption
  /** The laptops the manager is letting the joiner choose from */
  options: ChoiceOption[]
  recommended?: ChoiceOption
}

/** The laptop options that go in the pack. Undefined if the role has no laptop, or the manager hasn't chosen yet. */
export function packLaptops(journey: JourneyView): PackLaptops | undefined {
  const order = laptopOrder(journey)
  if (!order.spec) return undefined
  const all = journey.steps.find((s) => s.id === 'choose-kit')?.options ?? []
  const options = order.models ? all.filter((o) => order.models?.includes(o.value)) : all
  return { spec: order.spec, options, recommended: options.find((o) => o.value === order.recommended) }
}
