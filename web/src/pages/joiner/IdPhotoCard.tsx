import { useRef, useState, type ChangeEvent } from 'react'
import { Alert, Avatar, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import CameraAltRounded from '@mui/icons-material/CameraAltRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import { useDemo } from '../../demo/useDemo'

/**
 * The photo is a face image, so it is only held in memory for this visit and never saved to the
 * browser's storage. Reloading the page clears it.
 */
let heldPhotoUrl: string | null = null

/** Take a photo of your face for the ID badge used the first time you come into the office. */
export function IdPhotoCard() {
  const { journey, completeStep } = useDemo()
  const photoStep = journey.steps.find((s) => s.id === 'id-photo')
  const [photoUrl, setPhotoUrl] = useState<string | null>(heldPhotoUrl)
  // Only the fact that a photo was added is recorded, never the image, so a reload keeps the step done.
  const added = !!photoUrl || photoStep?.state === 'done'
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That doesn’t look like a photo. Please try again.')
      return
    }
    if (heldPhotoUrl) URL.revokeObjectURL(heldPhotoUrl)
    heldPhotoUrl = URL.createObjectURL(file)
    setError(null)
    setPhotoUrl(heldPhotoUrl)
    if (photoStep?.state === 'available') completeStep('id-photo')
  }

  const retake = () => {
    if (heldPhotoUrl) URL.revokeObjectURL(heldPhotoUrl)
    heldPhotoUrl = null
    setPhotoUrl(null)
    inputRef.current?.click()
  }

  return (
    <Card variant="outlined" component="section" aria-labelledby="id-photo-heading">
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            src={photoUrl ?? undefined}
            alt={photoUrl ? 'Your ID photo' : ''}
            sx={{ width: 72, height: 72, bgcolor: 'action.hover', color: 'text.secondary' }}
          >
            <CameraAltRounded />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography id="id-photo-heading" sx={{ fontWeight: 700 }}>
              Photo for your ID badge
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {added
                ? 'Looks good. Your badge will be printed and waiting for you the first time you come into the office.'
                : 'Take a quick photo of your face so your badge is ready when you first arrive. It takes a minute.'}
            </Typography>
          </Box>
        </Stack>

        {!added && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Face the camera in good light, with a plain background. No hats or sunglasses, and keep your face fully visible.
          </Typography>
        )}

        {error && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={onPick}
          data-testid="id-photo-input"
          aria-label="Take or choose a photo of your face"
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1.75, alignItems: 'center' }}>
          {added ? (
            <>
              <Button variant="outlined" startIcon={<ReplayRounded />} onClick={retake}>
                Retake photo
              </Button>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'primary.main' }}>
                <CheckRounded fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Photo added
                </Typography>
              </Stack>
            </>
          ) : (
            <Button variant="contained" startIcon={<CameraAltRounded />} onClick={() => inputRef.current?.click()}>
              Take photo
            </Button>
          )}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Your photo is only used for your ID badge. This demo keeps it on your device for this visit and doesn’t save it.
        </Typography>
      </CardContent>
    </Card>
  )
}
