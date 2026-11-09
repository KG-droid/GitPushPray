import { describe, expect, it } from 'vitest'
import { managerEquipmentSummary, NO_EQUIPMENT, pickedLabels, togglePick } from './equipment'

const options = [
  { value: 'none', label: 'Nothing else' },
  { group: 'Workstation', value: 'monitor', label: 'Monitor' },
  { group: 'Workstation', value: 'chair', label: 'Chair' },
  { group: 'Assistive technology', value: 'screen-reader', label: 'Screen reader' },
]

describe('togglePick', () => {
  it('adds and removes picks', () => {
    expect(togglePick(togglePick([], 'monitor'), 'chair')).toEqual(['monitor', 'chair'])
    expect(togglePick(['monitor', 'chair'], 'monitor')).toEqual(['chair'])
  })

  it('keeps "nothing else" exclusive', () => {
    expect(togglePick(['monitor'], NO_EQUIPMENT)).toEqual([NO_EQUIPMENT])
    expect(togglePick([NO_EQUIPMENT], 'monitor')).toEqual(['monitor'])
  })
})

describe('equipment summaries', () => {
  const step = { options, value: 'monitor,screen-reader' }

  it('lists everything for the joiner', () => {
    expect(pickedLabels(step)).toBe('Monitor, Screen reader')
  })

  it('tells the manager about workstation kit but hides which assistive technology', () => {
    const summary = managerEquipmentSummary(step)
    expect(summary[0]).toEqual({ label: 'Home-working equipment', value: 'Monitor' })
    expect(JSON.stringify(summary)).not.toContain('Screen reader')
    expect(summary[1].label).toBe('Workplace adjustments')
  })

  it('shows the manager nothing when nothing was needed', () => {
    expect(managerEquipmentSummary({ options, value: NO_EQUIPMENT })).toEqual([])
  })
})
