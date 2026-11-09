import { Avatar } from '@mui/material'
import { avatarColor, initials } from '../data/people'

/** Coloured-initials avatar. No photos, real or generated, of fictional colleagues. */
export function PersonAvatar({ name, size = 48, muted = false }: { name: string; size?: number; muted?: boolean }) {
  return (
    <Avatar
      aria-hidden
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 700,
        bgcolor: muted ? 'action.disabledBackground' : avatarColor(name),
        color: muted ? 'text.disabled' : '#fff',
      }}
    >
      {muted ? '' : initials(name)}
    </Avatar>
  )
}
