import { useState } from 'react'
import { Alert, Box, Button, Chip, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { QrCode } from '../components/QrCode'
import { routeForRole } from './joinLink'
import { useDemo, type DemoRole } from './useDemo'

type LinkRole = Exclude<DemoRole, 'admin'>

/** Lets a presenter put the manager (or joiner, or buddy) on a second phone that follows the same demo live. */
export function SharePanel() {
  const demo = useDemo()
  const { share } = demo
  const [role, setRole] = useState<LinkRole>('manager')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  const link =
    share.id &&
    `${window.location.origin}${routeForRole(role)}?s=${share.id}&view=${role}&p=${demo.journey.persona.id}`

  const start = async () => {
    setBusy(true)
    setError(false)
    try {
      await demo.startSharing()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link || '')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Some browsers block the clipboard; the link is on screen to copy by hand.
    }
  }

  return (
    <>
      <Typography variant="subtitle2">Share this demo</Typography>
      {share.mode === 'solo' ? (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 1 }}>
            Put the manager on another phone and watch your actions land on both, live. Only demo data is shared, and it is deleted a day after it was last used.
          </Typography>
          {error && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              Couldn’t start a shared demo. Check the connection and try again.
            </Alert>
          )}
          <Button fullWidth variant="outlined" disabled={busy} onClick={() => void start()}>
            {busy ? 'Starting…' : 'Share with another phone'}
          </Button>
        </>
      ) : (
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip size="small" color={share.connected ? 'success' : 'warning'} label={share.connected ? 'Shared · live' : 'Reconnecting…'} />
            <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
              {share.id?.toUpperCase()}
            </Typography>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Scan on the other phone to open it as:
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            color="primary"
            value={role}
            onChange={(_, v: LinkRole | null) => v && setRole(v)}
            aria-label="Open the other phone as"
          >
            <ToggleButton value="manager">Manager</ToggleButton>
            <ToggleButton value="joiner">Joiner</ToggleButton>
            <ToggleButton value="buddy" disabled={!demo.journey.persona.buddyId}>
              Buddy
            </ToggleButton>
          </ToggleButtonGroup>

          {link && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <QrCode value={link} label={`QR code to open the ${role} view on another phone`} />
              </Box>
              <Typography variant="caption" sx={{ wordBreak: 'break-all', userSelect: 'all' }}>
                {link}
              </Typography>
            </>
          )}
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => void copy()}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button color="error" onClick={demo.stopSharing}>
              Stop sharing
            </Button>
          </Stack>
        </Stack>
      )}
    </>
  )
}
