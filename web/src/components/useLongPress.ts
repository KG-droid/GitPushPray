import { useRef } from 'react'

/** Pointer handlers that fire `onLongPress` after holding for `ms` (works for touch and mouse). */
export function useLongPress(onLongPress: () => void, ms = 600) {
  const timer = useRef<number | undefined>(undefined)
  const cancel = () => window.clearTimeout(timer.current)
  return {
    onPointerDown: () => {
      cancel()
      timer.current = window.setTimeout(onLongPress, ms)
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
  }
}
