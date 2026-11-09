/**
 * Microsoft Teams deep links. The people in this demo are fictional, so their addresses are made up
 * (first.last@lbg-demo.example) and a link opens Teams with a message ready to send, but to nobody real.
 * With real colleagues, only `teamsEmail` would change.
 */
export const teamsEmail = (fullName: string): string =>
  `${fullName.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '.')}@lbg-demo.example`

export function teamsChatLink(fullName: string, message?: string): string {
  const params = new URLSearchParams({ users: teamsEmail(fullName) })
  if (message) params.set('message', message)
  return `https://teams.microsoft.com/l/chat/0/0?${params.toString()}`
}
