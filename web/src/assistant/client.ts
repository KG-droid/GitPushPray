import { accessHeaders } from './access'
import type { AskEvent, AskRequest, HandoverRequest, HandoverResponse, InsightsRequest, InsightsResponse } from './protocol'

/** POSTs a question and calls onEvent for each server-sent event as it arrives. */
export async function streamAsk(request: AskRequest, onEvent: (e: AskEvent) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...accessHeaders() },
    body: JSON.stringify(request),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`Assistant unavailable (${res.status})`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      const data = frame
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trimStart())
        .join('\n')
      if (data) onEvent(JSON.parse(data) as AskEvent)
    }
  }
}

export async function requestHandover(request: HandoverRequest): Promise<HandoverResponse> {
  const res = await fetch('/api/handover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...accessHeaders() },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`Handover unavailable (${res.status})`)
  return (await res.json()) as HandoverResponse
}

export async function requestInsights(request: InsightsRequest): Promise<InsightsResponse> {
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...accessHeaders() },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`Insights unavailable (${res.status})`)
  return (await res.json()) as InsightsResponse
}
