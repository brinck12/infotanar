import type { Verdict } from '../../../types'

/** Állapotonként eltérő alakú ikon, hogy a szín nélkül is megkülönböztethető legyen. */
export function VerdictIcon({ verdict, className = 'h-5 w-5' }: { verdict: Verdict; className?: string }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className,
  } as const

  switch (verdict) {
    case 'accepted':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="8" />
          <path d="m6.5 10.2 2.3 2.3 4.7-4.9" />
        </svg>
      )
    case 'wrong_answer':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="8" />
          <path d="m7.2 7.2 5.6 5.6m0-5.6-5.6 5.6" />
        </svg>
      )
    case 'time_limit_exceeded':
      return (
        <svg {...common}>
          <circle cx="10" cy="11" r="7" />
          <path d="M10 7.5V11l2.5 1.5M8 2h4" />
        </svg>
      )
    case 'compilation_error':
      return (
        <svg {...common}>
          <path d="m7 6-4 4 4 4m6-8 4 4-4 4m-2.2-10-1.6 12" />
        </svg>
      )
    case 'runtime_error':
      return (
        <svg {...common}>
          <path d="M11 2 4.5 11H10l-1 7 6.5-9H10l1-7Z" />
        </svg>
      )
    case 'constraint_violation':
      return (
        <svg {...common}>
          <path d="M10 2.5 3.5 5v4.5c0 4 2.8 7 6.5 8 3.7-1 6.5-4 6.5-8V5L10 2.5Z" />
          <path d="m7.5 7.5 5 5" />
        </svg>
      )
    case 'system_error':
      return (
        <svg {...common}>
          <path d="M10 3 2.5 16.5h15L10 3Z" />
          <path d="M10 8v4m0 2.2v.3" />
        </svg>
      )
  }
}
