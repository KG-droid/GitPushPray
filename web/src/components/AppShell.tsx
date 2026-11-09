import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import { repository } from '../data/repository'
import WbSunnyRounded from '@mui/icons-material/WbSunnyRounded'
import RouteRounded from '@mui/icons-material/RouteRounded'
import ExploreRounded from '@mui/icons-material/ExploreRounded'
import PeopleAltRounded from '@mui/icons-material/PeopleAltRounded'
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded'
import { BrandMark } from './BrandMark'
import { ThemeModeButton } from './ThemeModeButton'
import { DemoPanel } from '../demo/DemoPanel'
import { DemoBar, DEMO_BAR_HEIGHT } from '../demo/DemoBar'
import { useDemo } from '../demo/useDemo'
import { useLongPress } from './useLongPress'
import { CONTENT_WIDTH, PHONE_WIDTH, SIDEBAR_WIDTH } from './layout'

const joinerTabs = [
  { path: '/today', label: 'Today', icon: <WbSunnyRounded /> },
  { path: '/journey', label: 'Journey', icon: <RouteRounded /> },
  { path: '/explore', label: 'Explore', icon: <ExploreRounded /> },
  { path: '/people', label: 'People', icon: <PeopleAltRounded /> },
  { path: '/ask', label: 'Ask', icon: <AutoAwesomeRounded /> },
] as const

/** Responsive shell: a phone column with bottom tabs, or from md up a full-width page with a left nav rail. */
export function AppShell() {
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('md'))
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const current = joinerTabs.findIndex((t) => pathname.startsWith(t.path))
  const { setPanelOpen, toast, clearToast, role, journey } = useDemo()
  const isTeamView = role !== 'joiner'
  const viewerId = role === 'buddy' ? journey.persona.buddyId : journey.persona.managerId
  const viewerName = role === 'admin' ? 'People experience' : (viewerId ? repository.getPerson(viewerId)?.name.split(' ')[0] : undefined) ?? ''
  const pillLabel = role === 'buddy' ? 'Buddy view' : role === 'admin' ? 'Admin view' : 'Manager view'
  const longPress = useLongPress(() => setPanelOpen(true))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'd') setPanelOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPanelOpen])

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: { xs: 'background.default', sm: 'action.hover' } }}>
      <DemoBar />
      <Box
        sx={{
          maxWidth: { xs: PHONE_WIDTH, md: 'none' },
          mx: 'auto',
          minHeight: '100dvh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: { sm: 6, md: 0 },
        }}
      >
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ bgcolor: 'background.default', top: `calc(${DEMO_BAR_HEIGHT}px + env(safe-area-inset-top))` }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Long-press the logo (or press Shift+D) to open the presenter's demo controls. */}
            <Box {...longPress} sx={{ userSelect: 'none', WebkitTouchCallout: 'none', cursor: 'default' }}>
              <BrandMark />
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {isTeamView && (
                <Chip
                  size="small"
                  color="secondary"
                  icon={<BadgeRounded />}
                  label={pillLabel}
                  aria-label={`${pillLabel}, ${viewerName}. Open demo controls`}
                  onClick={() => setPanelOpen(true)}
                />
              )}
              <ThemeModeButton />
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
          {!isTeamView && isDesktop && (
            <Box
              component="nav"
              aria-label="Main"
              sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                position: 'sticky',
                top: `calc(${DEMO_BAR_HEIGHT}px + 64px + env(safe-area-inset-top))`,
                p: 2,
                borderRight: 1,
                borderColor: 'divider',
                minHeight: `calc(100dvh - ${DEMO_BAR_HEIGHT}px - 64px)`,
              }}
            >
              <List disablePadding>
                {joinerTabs.map((t, i) => (
                  <ListItemButton
                    key={t.path}
                    selected={(current === -1 ? 0 : current) === i}
                    onClick={() => navigate(t.path)}
                    sx={{ borderRadius: 3, mb: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>{t.icon}</ListItemIcon>
                    <ListItemText primary={t.label} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}
          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              maxWidth: { md: CONTENT_WIDTH },
              mx: 'auto',
              px: { xs: 2, md: 4 },
              pb: isTeamView ? 4 : { xs: 12, md: 6 },
            }}
          >
            <Outlet />
          </Box>
        </Box>

        {!isTeamView && !isDesktop && (
        <Paper
          elevation={0}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: PHONE_WIDTH,
            mx: 'auto',
            borderTop: 1,
            borderColor: 'divider',
            pb: 'env(safe-area-inset-bottom)',
            zIndex: (t) => t.zIndex.appBar,
          }}
        >
          <BottomNavigation
            showLabels
            value={current === -1 ? 0 : current}
            onChange={(_, i: number) => navigate(joinerTabs[i].path)}
          >
            {joinerTabs.map((t) => (
              <BottomNavigationAction key={t.path} label={t.label} icon={t.icon} />
            ))}
          </BottomNavigation>
        </Paper>
        )}
        <DemoPanel />
        <Snackbar
          open={!!toast}
          autoHideDuration={3500}
          // A click that sets a new toast would otherwise count as a click-away and dismiss it straight away.
          onClose={(_, reason) => reason !== 'clickaway' && clearToast()}
          message={toast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            bottom: isTeamView
              ? undefined
              : { xs: 'calc(84px + env(safe-area-inset-bottom)) !important', md: '24px !important' },
          }}
        />
      </Box>
    </Box>
  )
}
