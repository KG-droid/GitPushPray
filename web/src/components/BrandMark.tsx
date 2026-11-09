import { useState } from 'react'
import { Box, Typography } from '@mui/material'

/**
 * Lloyds Banking Group brand mark.
 * Drop the official logo files in web/public/brand/ (see the README there):
 *   lloyds-logo.svg       for the light theme
 *   lloyds-logo-dark.svg  for the dark theme (optional, falls back to the light file)
 * Until the light file exists a text wordmark is shown.
 */
export function BrandMark({ height = 28 }: { height?: number }) {
  const [logoMissing, setLogoMissing] = useState(false)
  const [darkMissing, setDarkMissing] = useState(false)

  if (!logoMissing) {
    return (
      <>
        <Box
          component="img"
          src="/brand/lloyds-logo.svg"
          alt="Lloyds Banking Group"
          onError={() => setLogoMissing(true)}
          sx={(theme) => ({
            height,
            display: 'block',
            ...(!darkMissing && theme.applyStyles('dark', { display: 'none' })),
          })}
        />
        {!darkMissing && (
          <Box
            component="img"
            src="/brand/lloyds-logo-dark.svg"
            alt="Lloyds Banking Group"
            onError={() => setDarkMissing(true)}
            sx={(theme) => ({
              height,
              display: 'none',
              ...theme.applyStyles('dark', { display: 'block' }),
            })}
          />
        )}
      </>
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
