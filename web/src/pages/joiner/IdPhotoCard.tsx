import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Alert, Avatar, Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import CameraAltRounded from '@mui/icons-material/CameraAltRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import ReplayRounded from '@mui/icons-material/ReplayRounded'
import UploadRounded from '@mui/icons-material/UploadRounded'
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

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const canUseCamera = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const holdPhoto = (file: Blob) => {
    if (heldPhotoUrl) URL.revokeObjectURL(heldPhotoUrl)
    heldPhotoUrl = URL.createObjectURL(file)
    setError(null)
    setPhotoUrl(heldPhotoUrl)
    if (photoStep?.state === 'available') completeStep('id-photo')
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That doesn’t look like a photo. Please try again.')
      return
    }
    holdPhoto(file)
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  // Stop the camera if the card goes away while it is still on.
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])

  const openCamera = async () => {
    if (!canUseCamera) {
      inputRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      setError(null)
      setCameraOpen(true)
    } catch {
      setError('We couldn’t open your camera. Check that you’ve allowed camera access, or upload a photo instead.')
    }
  }

  // Attach the stream once the video element has rendered.
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      void videoRef.current.play().catch(() => undefined)
    }
  }, [cameraOpen])

  const snap = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) holdPhoto(blob)
        else setError('Something went wrong taking the photo. Please try again.')
        stopCamera()
      },
      'image/jpeg',
      0.92,
    )
  }

  const retake = () => {
    if (heldPhotoUrl) URL.revokeObjectURL(heldPhotoUrl)
    heldPhotoUrl = null
    setPhotoUrl(null)
    void openCamera()
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
          hidden
          onChange={onPick}
          data-testid="id-photo-input"
          aria-label="Choose a photo of your face"
        />

        {cameraOpen && (
          <Box sx={{ mt: 1.75 }}>
            <Box
              component="video"
              ref={videoRef}
              muted
              playsInline
              aria-label="Camera preview"
              sx={{ width: '100%', maxHeight: 320, borderRadius: 2, bgcolor: 'common.black', transform: 'scaleX(-1)', objectFit: 'cover' }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button variant="contained" startIcon={<CameraAltRounded />} onClick={snap}>
                Capture
              </Button>
              <Button variant="text" onClick={stopCamera}>
                Cancel
              </Button>
            </Stack>
          </Box>
        )}

        {!cameraOpen && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.75, alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
            <Button
              variant={added ? 'outlined' : 'contained'}
              startIcon={added ? <ReplayRounded /> : <CameraAltRounded />}
              onClick={added ? retake : () => void openCamera()}
            >
              {added ? 'Retake photo' : 'Take photo'}
            </Button>
            <Button variant="outlined" startIcon={<UploadRounded />} onClick={() => inputRef.current?.click()}>
              Upload photo
            </Button>
            {added && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'primary.main' }}>
                <CheckRounded fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Photo added
                </Typography>
              </Stack>
            )}
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Your photo is only used for your ID badge. This demo keeps it on your device for this visit and doesn’t save it.
        </Typography>
      </CardContent>
    </Card>
  )
}
