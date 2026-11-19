import { createTheme } from '@mui/material/styles';

/**
 * MDP Aroma Design Tokens
 * Direction: Modern Scandinavian / High-End Enterprise SaaS
 * Palette: Deep Green Primary, Warm Gold Accent, Warm White / Soft Neutral Backgrounds, Charcoal Text
 */
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#14532D',      // Deep Botanical Forest Green
      light: '#166534',
      dark: '#0B3B1F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#B45309',      // Subtle Warm Gold / Amber Accent
      light: '#D97706',
      dark: '#92400E',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#15803D',      // Subtle Leaf Green
      light: '#22C55E',
      dark: '#166534',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#B45309',      // Warm Amber
      light: '#F59E0B',
      dark: '#78350F',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#B91C1C',      // Restrained Crimson Red
      light: '#EF4444',
      dark: '#7F1D1D',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#1D4ED8',      // Classic Sapphire
      light: '#3B82F6',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FBFBFA',   // Warm White / Soft Neutral
      paper: '#FFFFFF',
    },
    text: {
      primary: '#18181B',   // Charcoal 900
      secondary: '#71717A', // Muted Gray 500
      disabled: '#A1A1AA',
    },
    divider: '#E4E4E7',     // Soft Border 200
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181B', lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#18181B', lineHeight: 1.25 },
    h3: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.015em', color: '#18181B', lineHeight: 1.3 },
    h4: { fontSize: '1.125rem', fontWeight: 600, color: '#18181B' },
    h5: { fontSize: '1rem', fontWeight: 600, color: '#18181B' },
    h6: { fontSize: '0.875rem', fontWeight: 600, color: '#18181B' },
    subtitle1: { fontSize: '0.9375rem', color: '#71717A' },
    subtitle2: { fontSize: '0.8125rem', color: '#71717A', fontWeight: 500 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5, color: '#27272A' },
    body2: { fontSize: '0.8125rem', lineHeight: 1.45, color: '#52525B' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem', color: '#71717A' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '7px 14px',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          },
        },
        contained: {
          backgroundColor: '#14532D',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#0F3B1F',
          },
        },
        outlined: {
          borderColor: '#E4E4E7',
          color: '#27272A',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            borderColor: '#D4D4D8',
            backgroundColor: '#FAFAF9',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          border: '1px solid #E4E4E7',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid #E4E4E7',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F4F4F5',
          padding: '10px 14px',
          fontSize: '0.84rem',
        },
        head: {
          fontWeight: 600,
          color: '#52525B',
          backgroundColor: '#FAFAF9',
          borderBottom: '1px solid #E4E4E7',
          fontSize: '0.78rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          fontSize: '0.72rem',
          height: 22,
        },
      },
    },
  },
});
