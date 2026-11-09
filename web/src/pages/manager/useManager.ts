import { repository } from '../../data/repository'
import { useDemo } from '../../demo/useDemo'
import { managerNudges, managerView } from '../../domain/manager'

/** The selected persona's manager, and everything they need about each of their joiners. */
export function useManager() {
  const { journey, journeyFor } = useDemo()
  const managerId = journey.persona.managerId
  const manager = repository.getPerson(managerId)
  const views = repository
    .listPersonas()
    .filter((p) => p.managerId === managerId)
    .map((p) => managerView(journeyFor(p.id), repository.listEvents(p.id)))
    .sort((a, b) => a.journey.daysToStart - b.journey.daysToStart)
  return { manager, views, nudges: managerNudges(views) }
}
