const KEY = 'lbg-joiner:access'

/** Picks the demo access code out of the address (/?k=…), keeps it for later, and removes it from the visible URL. */
export function captureAccessCode(): void {
  try {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('k')
    if (!code) return
    localStorage.setItem(KEY, code.slice(0, 200))
    url.searchParams.delete('k')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  } catch {
    // Private browsing or blocked storage: the app still works, with scripted assistant answers.
  }
}

/** Header that tells the server this browser holds the demo access code. */
export function accessHeaders(): Record<string, string> {
  try {
    const code = localStorage.getItem(KEY)
    return code ? { 'X-Demo-Key': code } : {}
  } catch {
    return {}
  }
}
