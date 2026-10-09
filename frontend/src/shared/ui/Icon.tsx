import type { ReactNode } from 'react'

/** Egyetlen körvonalas ikonkészlet: 20-as rács, 1,8-as vonal, kerek végek. */
const PATHS = {
  check: <path d="M4.5 10.5l3.5 3.5 7.5-8" />,
  x: <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />,
  plus: <path d="M10 4v12M4 10h12" />,
  lock: (
    <>
      <rect x="4" y="9" width="12" height="8" rx="2" />
      <path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" />
    </>
  ),
  play: <path d="M6 4l10 6-10 6z" fill="currentColor" />,
  upload: <path d="M10 13V4M6 7.5l4-4 4 4M4 13v2.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V13" />,
  download: <path d="M10 4v9M6 9.5l4 4 4-4M4 16.5h12" />,
  file: <path d="M5 2.5h6.5L16 7v10.5H5zM11.5 2.5V7H16" />,
  doc: <path d="M5 2.5h6.5L16 7v10.5H5zM11.5 2.5V7H16M7.5 11h6M7.5 14h6" />,
  clock: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10l3 2" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v5M10 6.2v.1" />
    </>
  ),
  warn: (
    <>
      <path d="M10 3L18 17H2z" />
      <path d="M10 8v4M10 14.2v.1" />
    </>
  ),
  user: (
    <>
      <circle cx="10" cy="7" r="3.2" />
      <path d="M3.5 17c.8-3.2 3.3-4.8 6.5-4.8s5.7 1.6 6.5 4.8" />
    </>
  ),
  menu: <path d="M3 5.5h14M3 10h14M3 14.5h14" />,
  search: (
    <>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.2 13.2L17 17" />
    </>
  ),
  trash: <path d="M4.5 6h11M8 6V4h4v2M6 6l.7 10.5h6.6L14 6" />,
  drag: (
    <>
      <circle cx="7.5" cy="5" r="1.2" fill="currentColor" />
      <circle cx="12.5" cy="5" r="1.2" fill="currentColor" />
      <circle cx="7.5" cy="10" r="1.2" fill="currentColor" />
      <circle cx="12.5" cy="10" r="1.2" fill="currentColor" />
      <circle cx="7.5" cy="15" r="1.2" fill="currentColor" />
      <circle cx="12.5" cy="15" r="1.2" fill="currentColor" />
    </>
  ),
  edit: <path d="M4 16l1-4 8.5-8.5 3 3L8 15z" />,
  eye: (
    <>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z" />
      <circle cx="10" cy="10" r="2.2" />
    </>
  ),
  'chevron-right': <path d="M8 5l5 5-5 5" />,
  'chevron-left': <path d="M12 5l-5 5 5 5" />,
  'chevron-down': <path d="M5 8l5 5 5-5" />,
  'chevron-up': <path d="M5 12l5-5 5 5" />,
  sheet: (
    <>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 8h14M3 12.5h14M8 8v9" />
    </>
  ),
  slides: (
    <>
      <rect x="2.5" y="4" width="15" height="10" rx="1.5" />
      <path d="M10 14v3M6.5 17h7" />
    </>
  ),
  db: (
    <>
      <ellipse cx="10" cy="5" rx="6" ry="2.5" />
      <path d="M4 5v10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
    </>
  ),
  code: <path d="M7 6l-4 4 4 4M13 6l4 4-4 4" />,
  globe: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c2.5 2.5 2.5 12.5 0 15M10 2.5c-2.5 2.5-2.5 12.5 0 15" />
    </>
  ),
  mic: (
    <>
      <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
      <path d="M4.5 9.5a5.5 5.5 0 0011 0M10 15v2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="4.5" width="13" height="12" rx="2" />
      <path d="M3.5 9h13M7 2.5v3M13 2.5v3" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5" width="15" height="10" rx="2" />
      <path d="M2.5 8.5h15" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="M3 6l7 5 7-5" />
    </>
  ),
  shield: <path d="M10 2.5l6 2.2v4.6c0 3.7-2.4 6.6-6 8.2-3.6-1.6-6-4.5-6-8.2V4.7z" />,
  refresh: <path d="M16 8A6.5 6.5 0 004.5 6.5M4 12a6.5 6.5 0 0011.5 1.5M4 3.5v3h3M16 16.5v-3h-3" />,
  star: <path d="M10 2.8l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7z" />,
  flag: <path d="M5 17V3.5M5 4h9l-1.8 3L14 10H5" />,
  book: <path d="M3.5 4.5c2.5-.8 4.8-.6 6.5 1 1.7-1.6 4-1.8 6.5-1v11c-2.5-.8-4.8-.6-6.5 1-1.7-1.6-4-1.8-6.5-1z M10 5.5v11" />,
  list: <path d="M7 5.5h10M7 10h10M7 14.5h10M3.5 5.5h.1M3.5 10h.1M3.5 14.5h.1" />,
  home: <path d="M3 9.5L10 3l7 6.5M5 8.5V17h10V8.5" />,
  logout: <path d="M8 3.5H5A1.5 1.5 0 003.5 5v10A1.5 1.5 0 005 16.5h3M12 6.5l3.5 3.5-3.5 3.5M15.5 10H8" />,
  image: (
    <>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" />
      <circle cx="7" cy="8" r="1.4" />
      <path d="M3 15l4.5-4 3 2.5 3-3L17 15" />
    </>
  ),
  bold: <path d="M6 4h4.5a2.5 2.5 0 010 5H6zM6 9h5a2.5 2.5 0 010 5H6z" />,
  italic: <path d="M8 4h6M6 16h6M11.5 4l-3 12" />,
  underline: <path d="M6 3.5v6a4 4 0 008 0v-6M4.5 17h11" />,
  'align-left': <path d="M3 5h14M3 8.5h9M3 12h14M3 15.5h9" />,
  'align-center': <path d="M3 5h14M5.5 8.5h9M3 12h14M5.5 15.5h9" />,
  'align-justify': <path d="M3 5h14M3 8.5h14M3 12h14M3 15.5h14" />,
  undo: <path d="M5 8h7a3.5 3.5 0 010 7H8M5 8l3-3M5 8l3 3" />,
  dots: (
    <>
      <circle cx="4.5" cy="10" r="1.2" fill="currentColor" />
      <circle cx="10" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1.2" fill="currentColor" />
    </>
  ),
  bar: <path d="M4 16.5V10M10 16.5V4M16 16.5V7" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

const SIZE = { 12: 'size-3', 16: 'size-4', 18: 'size-4.5', 20: 'size-5', 22: 'size-5.5', 28: 'size-7' } as const

interface IconProps {
  name: IconName
  size?: keyof typeof SIZE
  className?: string
  /** Ha az ikon önmagában hordoz jelentést; különben díszítő (`aria-hidden`). */
  label?: string
}

export function Icon({ name, size = 20, className = '', label }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-none ${SIZE[size]} ${className}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {PATHS[name]}
    </svg>
  )
}

export type StateKind = 'ok' | 'bad' | 'manual' | 'empty'

const STATE_LABEL: Readonly<Record<StateKind, string>> = {
  ok: 'Rendben',
  bad: 'Hibás',
  manual: 'Kézi ellenőrzés',
  empty: 'Még nincs kész',
}

/** Kitöltött állapotjel (kör + jel): az állapotot sosem csak a szín mutatja. */
export function StateIcon({ kind, size = 20, label }: { kind: StateKind; size?: 20 | 28; label?: string }) {
  const tone = {
    ok: 'fill-accent-soft stroke-accent',
    bad: 'fill-wrong-soft stroke-wrong',
    manual: 'fill-sheet stroke-ink',
    empty: 'fill-sheet stroke-muted',
  }[kind]

  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label ?? STATE_LABEL[kind]}
      className={`flex-none ${SIZE[size]} ${tone}`}
    >
      <circle cx="10" cy="10" r="9" strokeWidth="1.5" />
      {kind === 'ok' && <path d="M6 10.5l2.8 2.8L14 7.8" strokeWidth="1.8" fill="none" />}
      {kind === 'bad' && <path d="M7 7l6 6M13 7l-6 6" strokeWidth="1.8" fill="none" />}
      {kind === 'manual' && (
        <>
          <path d="M4.8 10s2-3.4 5.2-3.4S15.2 10 15.2 10s-2 3.4-5.2 3.4S4.8 10 4.8 10z" strokeWidth="1.4" fill="none" />
          <circle cx="10" cy="10" r="1.3" className="fill-ink" stroke="none" />
        </>
      )}
    </svg>
  )
}
