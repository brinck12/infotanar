import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'text-danger' | 'danger' | 'dark'
export type ButtonSize = 'md' | 'lg'

interface StyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  fullWidth?: boolean
}

const VARIANT: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-accent text-sheet hover:bg-accent-dark hover:text-sheet',
  secondary: 'border border-ink bg-sheet text-ink hover:bg-note hover:text-ink',
  text: 'bg-transparent text-accent underline underline-offset-4 hover:text-accent-dark',
  'text-danger': 'bg-transparent text-wrong underline underline-offset-4 hover:text-wrong-dark',
  danger: 'bg-wrong text-sheet hover:bg-wrong-dark hover:text-sheet',
  dark: 'on-dark border border-code-edge bg-transparent text-code-text hover:bg-code-hover hover:text-code-text',
}

const DISABLED = 'disabled:border-transparent disabled:bg-chip disabled:text-disabled disabled:no-underline'
/** Sötét felületen a letiltott gomb is sötét marad, csak elhalványul. */
const DISABLED_DARK = 'disabled:border-code-line disabled:text-code-edge disabled:hover:bg-transparent'

function buttonClass({ variant = 'primary', size = 'md', fullWidth = false }: StyleProps, className?: string): string {
  const isText = variant === 'text' || variant === 'text-danger'
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-md py-0 font-sans font-semibold leading-tight',
    !isText && 'no-underline',
    size === 'lg' ? 'min-h-13 text-17' : 'min-h-11 text-16',
    isText ? 'px-1' : size === 'lg' ? 'px-7' : 'px-5',
    fullWidth && 'w-full',
    VARIANT[variant],
    className,
  )
}

interface ButtonProps extends StyleProps, ButtonHTMLAttributes<HTMLButtonElement> {
  /** Folyamatban lévő művelet: a gomb letiltva, a felirat a `busyLabel`. */
  busy?: boolean
  busyLabel?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant,
  size,
  icon,
  fullWidth,
  busy = false,
  busyLabel,
  className,
  children,
  type = 'button',
  disabled,
  ...button
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={buttonClass({ variant, size, fullWidth }, cx(variant === 'dark' ? DISABLED_DARK : DISABLED, className))}
      {...button}
    >
      {icon && <Icon name={icon} size={18} />}
      {busy && busyLabel ? busyLabel : children}
    </button>
  )
}

interface ButtonLinkProps extends StyleProps, Omit<LinkProps, 'className'> {
  className?: string
}

/** Navigáló gomb: ugyanaz a külső, de `<a>` elem. */
export function ButtonLink({ variant, size, icon, fullWidth, className, children, ...link }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, fullWidth }, className)} {...link}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </Link>
  )
}

interface ExternalButtonLinkProps extends StyleProps, AnchorHTMLAttributes<HTMLAnchorElement> {}

/** Külső címre (vagy fájlra) mutató gomb. */
export function ExternalButtonLink({ variant, size, icon, fullWidth, className, children, ...anchor }: ExternalButtonLinkProps) {
  return (
    <a className={buttonClass({ variant, size, fullWidth }, className)} {...anchor}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </a>
  )
}
