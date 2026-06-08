export interface BookingTheme {
  primaryColor:    string
  backgroundColor: string
  mode:            'dark' | 'light'
  borderRadius:    number
}

export const DEFAULT_THEME: BookingTheme = {
  primaryColor:    '#d4830c',
  backgroundColor: '#0e0b07',
  mode:            'dark',
  borderRadius:    14,
}

export function parseTheme(json: string): BookingTheme {
  try {
    const parsed = JSON.parse(json || '{}')
    return {
      primaryColor:    isHex(parsed.primaryColor)    ? parsed.primaryColor    : DEFAULT_THEME.primaryColor,
      backgroundColor: isHex(parsed.backgroundColor) ? parsed.backgroundColor : DEFAULT_THEME.backgroundColor,
      mode:            parsed.mode === 'light'        ? 'light'                : DEFAULT_THEME.mode,
      borderRadius:    Number.isFinite(parsed.borderRadius) ? Math.min(24, Math.max(4, parsed.borderRadius)) : DEFAULT_THEME.borderRadius,
    }
  } catch {
    return { ...DEFAULT_THEME }
  }
}

function isHex(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function buildCssVars(theme: BookingTheme): string {
  const fg   = theme.mode === 'dark' ? '255,255,255' : '0,0,0'
  const text = theme.mode === 'dark' ? '#ffffff'      : '#1a1a1a'
  const rr   = Math.round(theme.borderRadius * 0.6)

  return `:root {
  --bp-primary:      ${theme.primaryColor};
  --bp-primary-rgb:  ${hexToRgb(theme.primaryColor)};
  --bp-bg:           ${theme.backgroundColor};
  --bp-fg:           ${fg};
  --bp-text:         ${text};
  --bp-text-muted:   rgba(${fg}, 0.4);
  --bp-text-faint:   rgba(${fg}, 0.2);
  --bp-text-ghost:   rgba(${fg}, 0.12);
  --bp-surface:      rgba(${fg}, 0.03);
  --bp-surface-md:   rgba(${fg}, 0.06);
  --bp-border:       rgba(${fg}, 0.08);
  --bp-border-strong: rgba(${fg}, 0.15);
  --bp-radius:       ${theme.borderRadius}px;
  --bp-radius-sm:    ${rr}px;
}`
}
