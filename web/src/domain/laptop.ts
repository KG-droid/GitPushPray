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

/** What the manager decides: the spec, which models the joiner sees, and which one to recommend. */
export interface LaptopSpecChoice {
  spec: string
  /** Model values the joiner can pick from. Undefined means every model. */
  models?: string[]
  recommended?: string
}

/** Stored in the spec step's value: "developer", or "developer|hp-elitebook-g11,macbook-pro|macbook-pro". */
export function parseLaptopSpec(value: string | undefined): LaptopSpecChoice | undefined {
  if (!value) return undefined
  const [spec, models, recommended] = value.split('|')
  return { spec, models: models ? models.split(',').filter(Boolean) : undefined, recommended: recommended || undefined }
}

export function encodeLaptopSpec({ spec, models, recommended }: LaptopSpecChoice): string {
  return models || recommended ? [spec, models?.join(',') ?? '', recommended ?? ''].join('|') : spec
}

export interface LaptopOrder {
  /** Set by the manager */
  spec?: ChoiceOption
  /** The models the joiner can choose from, if the manager narrowed them */
  models?: string[]
  /** The model the manager recommends */
  recommended?: string
  /** Chosen by the joiner */
  model?: ChoiceOption
}

export function laptopOrder(journey: JourneyView): LaptopOrder {
  const specStep = journey.steps.find((s) => s.id === 'mgr-set-device-spec' && s.state === 'done')
  const choice = parseLaptopSpec(specStep?.value)
  const kit = journey.steps.find((s) => s.id === 'choose-kit' && s.state === 'done')
  return {
    spec: specStep?.options?.find((o) => o.value === choice?.spec),
    models: choice?.models,
    recommended: choice?.recommended,
    model: kit?.options?.find((o) => o.value === kit.value),
  }
}

/** e.g. "HP EliteBook G11, Developer spec" */
export function laptopLabel({ spec, model }: LaptopOrder): string | undefined {
  if (!model) return undefined
  return spec ? `${model.label}, ${spec.label} spec` : model.label
}
