// Brand audit design system — matches generate-report.mjs
export const theme = {
  colors: {
    bgPrimary: '#faf9f7',
    bgWhite: '#ffffff',
    bgElevated: '#fefefe',
    textPrimary: '#131314',
    textSecondary: '#55555a',
    textTertiary: '#9b9b9f',
    accent: '#d97757',
    accentLight: '#f5ebe6',
    accentSoft: '#faf0eb',
    green: '#2d8a4e',
    greenLight: '#e6f4eb',
    red: '#c4442a',
    redLight: '#fce8e4',
    yellow: '#b8860b',
    yellowLight: '#fdf4e0',
    border: '#e8e8e5',
    borderLight: '#f0efec',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)',
    md: '0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
    lg: '0 4px 12px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.04)',
  },
  radius: {
    sm: '10px',
    lg: '16px',
    xl: '20px',
  },
};

export function scoreColor(score) {
  const n = parseInt(score, 10);
  if (isNaN(n) || n <= 1) return { bg: 'var(--red-light)', text: 'var(--red)', bar: 'var(--red)' };
  if (n <= 3) return { bg: 'var(--yellow-light)', text: 'var(--yellow)', bar: 'var(--yellow)' };
  return { bg: 'var(--green-light)', text: 'var(--green)', bar: 'var(--green)' };
}

export function statusColor(status) {
  switch (status) {
    case 'active':
    case 'claimed': return { bg: theme.colors.greenLight, text: theme.colors.green };
    case 'stale':
    case 'inactive': return { bg: theme.colors.yellowLight, text: theme.colors.yellow };
    case 'missing':
    case 'broken': return { bg: theme.colors.redLight, text: theme.colors.red };
    default: return { bg: theme.colors.yellowLight, text: theme.colors.yellow };
  }
}

export function averageScore(findings) {
  if (!findings?.length) return 0;
  const scored = findings.filter(f => f.score != null);
  if (!scored.length) return 0;
  const sum = scored.reduce((a, f) => a + parseInt(f.score, 10), 0);
  return sum / scored.length;
}

export function gradeLabel(avg) {
  if (avg <= 1.5) return 'Needs Attention';
  if (avg <= 2.5) return 'Work to Do';
  if (avg <= 3.5) return 'Getting There';
  if (avg <= 4.5) return 'Looking Good';
  return 'Excellent';
}

export function gradeColor(avg) {
  if (avg <= 1.5) return 'var(--red)';
  if (avg <= 2.5) return 'var(--yellow)';
  if (avg <= 3.5) return 'var(--yellow)';
  return 'var(--green)';
}

export function actionGroupColor(key) {
  switch (key) {
    case 'this_week': return { color: 'var(--accent)', colorLight: 'var(--accent-light)' };
    case 'this_month': return { color: 'var(--yellow)', colorLight: 'var(--yellow-light)' };
    case 'ninety_days': return { color: 'var(--green)', colorLight: 'var(--green-light)' };
    default: return { color: 'var(--text-tertiary)', colorLight: 'var(--bg-primary)' };
  }
}
