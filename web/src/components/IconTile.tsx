import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { StepIcon } from './StepIcon'

/** Rounded square holding a step icon. `muted` for locked items. */
export function IconTile({ name, icon, muted = false, size = 44 }: { name?: string; icon?: ReactNode; muted?: boolean; size?: number }) {
  return (
    <Box
      sx={{
        bgcolor: muted ? 'action.hover' : 'action.selected',
        borderRadius: 3,
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {icon ?? <StepIcon name={name ?? ''} color={muted ? 'disabled' : 'primary'} />}
    </Box>
  )
}
