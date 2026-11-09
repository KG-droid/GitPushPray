import type { JourneyView } from './journey'
import type { ChoiceOption, JobFamily } from './types'

/**
 * The laptop is a two-part decision: the manager sets the spec (standard or developer),
 * then the joiner picks a model in that spec.
 */

/** Roles that usually build or run code locally. The manager can still choose either spec. */
const developerSpecFamilies: JobFamily[] = ['technology', 'data']

export function suggestedLaptopSpec(jobFamily: JobFamily): 'standard' | 'developer' {
  return developerSpecFamilies.includes(jobFamily) ? 'developer' : 'standard'
}

export interface LaptopOrder {
  /** Set by the manager */
  spec?: ChoiceOption
  /** Chosen by the joiner */
  model?: ChoiceOption
}

export function laptopOrder(journey: JourneyView): LaptopOrder {
  const picked = (stepId: string) => {
    const step = journey.steps.find((s) => s.id === stepId && s.state === 'done')
    return step?.options?.find((o) => o.value === step.value)
  }
  return { spec: picked('mgr-set-device-spec'), model: picked('choose-kit') }
}

/** e.g. "HP EliteBook G11, Developer spec" */
export function laptopLabel({ spec, model }: LaptopOrder): string | undefined {
  if (!model) return undefined
  return spec ? `${model.label}, ${spec.label} spec` : model.label
}
