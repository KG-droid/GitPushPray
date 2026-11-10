import { repository } from '../data/repository'
import { DEMO_STATE_KEY, type DemoRole } from './useDemo'

const ROLES: DemoRole[] = ['joiner', 'manager', 'buddy', 'admin']

/**
 * Handles a shared-demo link (/manager?s=abcd2345&view=manager&p=priya): joins that demo, sets who this phone
 * is viewing as, and tidies the address bar. Does nothing for ordinary addresses.
 */
export function captureSharedDemo(): void {
  try {
    const url = new URL(window.location.href)
    const id = url.searchParams.get('s')
    if (!id) return
    repository.joinShared(id)

    const role = url.searchParams.get('view') as DemoRole | null
    const personaId = url.searchParams.get('p')
    const next: { role?: DemoRole; personaId?: string } = {}
    if (role && ROLES.includes(role)) next.role = role
    if (personaId && repository.getPersona(personaId)) next.personaId = personaId
    if (next.role || next.personaId) {
      const saved = JSON.parse(localStorage.getItem(DEMO_STATE_KEY) ?? '{}') as object
      localStorage.setItem(DEMO_STATE_KEY, JSON.stringify({ ...saved, ...next }))
    }

    for (const key of ['s', 'view', 'p']) url.searchParams.delete(key)
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  } catch {
    // Blocked storage: the app still opens, as a private demo.
  }
}

export const routeForRole = (role: DemoRole) =>
  role === 'manager' ? '/manager' : role === 'buddy' ? '/buddy' : role === 'admin' ? '/admin' : '/today'
