import type { StepView } from './journey'
import type { ChoiceOption } from './types'

/** Multi-select steps store their picks as one comma-separated string. */
const SEPARATOR = ','

/** Value for the "nothing needed" option. It is exclusive: picking it clears every other pick. */
export const NO_EQUIPMENT = 'none'

export function parsePicks(value: string | undefined): string[] {
  return value ? value.split(SEPARATOR).filter(Boolean) : []
}

export function joinPicks(picks: string[]): string {
  return picks.join(SEPARATOR)
}

/** Toggle one option, keeping "nothing needed" exclusive. */
export function togglePick(picks: string[], value: string): string[] {
  if (picks.includes(value)) return picks.filter((p) => p !== value)
  return value === NO_EQUIPMENT ? [value] : [...picks.filter((p) => p !== NO_EQUIPMENT), value]
}

export function pickedOptions(step: Pick<StepView, 'options' | 'value'>): ChoiceOption[] {
  const picks = parsePicks(step.value)
  return (step.options ?? []).filter((o) => picks.includes(o.value))
}

/** e.g. "Monitor, Ergonomic chair" */
export function pickedLabels(step: Pick<StepView, 'options' | 'value'>): string {
  return pickedOptions(step)
    .map((o) => o.label)
    .join(', ')
}

/**
 * What the manager may see. Assistive technology can reveal a health condition, so the manager
 * only learns that adjustments were requested, not which ones. IT and Occupational Health get the detail.
 */
export function managerEquipmentSummary(step: Pick<StepView, 'options' | 'value'>): { label: string; value: string }[] {
  const picked = pickedOptions(step).filter((o) => o.value !== NO_EQUIPMENT)
  const workstation = picked.filter((o) => o.group !== 'Assistive technology')
  const assistive = picked.filter((o) => o.group === 'Assistive technology')
  const out: { label: string; value: string }[] = []
  if (workstation.length) out.push({ label: 'Home-working equipment', value: workstation.map((o) => o.label).join(', ') })
  if (assistive.length) out.push({ label: 'Workplace adjustments', value: 'Requested. IT will follow up in confidence' })
  return out
}
