import { Box } from '@mui/material'
import qrcode from 'qrcode-generator'

/** A QR code drawn as SVG squares. The quiet margin is part of the picture so it scans on a dark theme too. */
export function QrCode({ value, label, size = 176 }: { value: string; label: string; size?: number }) {
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()
  const n = qr.getModuleCount()
  const margin = 2
  const cells: string[] = []
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) cells.push(`M${c + margin} ${r + margin}h1v1h-1z`)

  return (
    <Box
      component="svg"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${n + margin * 2} ${n + margin * 2}`}
      sx={{ width: size, height: size, bgcolor: '#fff', borderRadius: 2, display: 'block' }}
      shapeRendering="crispEdges"
    >
      <path d={cells.join('')} fill="#000" />
    </Box>
  )
}
