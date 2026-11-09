import { createTheme } from '@mui/material/styles'

/** Lloyds-inspired palette. Keep brand colours here so screens never hard-code hex values. */
export const brand = {
  green: '#006A4D',
  greenDark: '#024731',
  greenBright: '#11B67A',
  mint: '#E6F4EF',
  ink: '#101820',
} as const

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: brand.green, dark: brand.greenDark, light: brand.greenBright, contrastText: '#fff' },
        secondary: { main: brand.greenBright, contrastText: brand.ink },
        background: { default: '#F4F6F5', paper: '#FFFFFF' },
        text: { primary: brand.ink, secondary: '#5B6670' },
      },
    },
    dark: {
      palette: {
        primary: { main: brand.greenBright, dark: brand.green, light: '#5FD3A5', contrastText: brand.ink },
        secondary: { main: '#5FD3A5', contrastText: brand.ink },
        background: { default: '#0B1210', paper: '#141E1B' },
        text: { primary: '#EEF3F1', secondary: '#A3B1AC' },
      },
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter Variable", system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, minHeight: 44, paddingInline: 20 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 20,
        }),
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { minWidth: 64, minHeight: 56 } },
    },
  },
})
