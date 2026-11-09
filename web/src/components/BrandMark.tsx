import { useState } from 'react'
import { Box, Typography } from '@mui/material'

/**
 * Lloyds Banking Group brand mark.
 * Drop the logo at web/public/brand/lloyds-logo.svg; until then a text wordmark is shown.
 */
export function BrandMark({ height = 28 }: { height?: number }) {
  const [logoMissing, setLogoMissing] = useState(false)

  if (!logoMissing) {
    return (
      <Box
        component="img"
        src="/brand/lloyds-logo.svg"
        alt="Lloyds Banking Group"
        onError={() => setLogoMissing(true)}
        sx={{ height, display: 'block' }}
      />
    )
  }

  return (
    <Typography
      component="span"
      sx={{ fontWeight: 800, fontSize: height * 0.6, letterSpacing: '-0.01em', color: 'primary.main', lineHeight: 1 }}
    >
      Lloyds Banking Group
    </Typography>
  )
}
