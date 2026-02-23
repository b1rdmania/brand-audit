// Brand audit design system — matches existing report CSS
export const theme = {
  colors: {
    bgPrimary: '#faf9f7',
    bgWhite: '#ffffff',
    textPrimary: '#131314',
    textSecondary: '#6b6b6f',
    textTertiary: '#9b9b9f',
    accent: '#d97757',
    accentLight: '#f5ebe6',
    green: '#2d8a4e',
    greenLight: '#e6f4eb',
    red: '#c4442a',
    redLight: '#fce8e4',
    yellow: '#b8860b',
    yellowLight: '#fdf4e0',
    border: '#e8e8e5',
    borderDark: '#d4d4d0',
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.06)',
  },
  radius: {
    sm: '10px',
    lg: '14px',
  },
};

export function scoreColor(score) {
  if (score <= 1) return { bg: theme.colors.redLight, text: theme.colors.red };
  if (score <= 3) return { bg: theme.colors.yellowLight, text: theme.colors.yellow };
  return { bg: theme.colors.greenLight, text: theme.colors.green };
}

export function statusColor(status) {
  switch (status) {
    case 'active': return { bg: theme.colors.greenLight, text: theme.colors.green };
    case 'stale': return { bg: theme.colors.yellowLight, text: theme.colors.yellow };
    case 'missing':
    case 'broken': return { bg: theme.colors.redLight, text: theme.colors.red };
    default: return { bg: theme.colors.yellowLight, text: theme.colors.yellow };
  }
}
