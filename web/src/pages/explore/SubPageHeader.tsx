import { Box, IconButton, Stack, Typography } from '@mui/material'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { useNavigate } from 'react-router-dom'

/** Back arrow + title for screens inside Explore. */
export function SubPageHeader({ title, subtitle, back = '/explore' }: { title: string; subtitle?: string; back?: string }) {
  const navigate = useNavigate()
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <IconButton aria-label="Back" edge="start" onClick={() => navigate(back)}>
        <ArrowBackRounded />
      </IconButton>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="h1" sx={{ lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  )
}
