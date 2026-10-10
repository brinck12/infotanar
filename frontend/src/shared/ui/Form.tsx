import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Button, type ButtonSize } from './Button'
import { cx } from './cx'
import { Icon } from './Icon'

const LABEL = 'text-15 font-semibold text-ink'
const CONTROL =
  'w-full rounded-md border bg-sheet text-16 text-ink placeholder:text-muted disabled:bg-chip disabled:text-disabled'

function border(error: string | undefined): string {
  return error ? 'border-wrong' : 'border-muted'
}

function describedBy(id: string, error: string | undefined, hint: ReactNode): string | undefined {
  return [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
}

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={`${id}-hint`} className="mt-1.5 text-14 leading-normal text-ink-soft">
      {children}
    </p>
  )
}

/** Mezőhiba: ikonnal és szöveggel, nem csak színnel. */
function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-14 leading-normal text-wrong">
      <Icon name="warn" size={16} className="mt-0.5" />
      <span>{children}</span>
    </p>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: ReactNode
  /** Jobbra igazított hivatkozás a címke sorában (pl. „Elfelejtetted?”). */
  labelAction?: ReactNode
  mono?: boolean
}

export function Field({ label, error, hint, labelAction, mono = false, className, ...input }: FieldProps) {
  const id = useId()

  return (
    <div className={cx('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {labelAction && <span className="text-15">{labelAction}</span>}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cx(CONTROL, 'mt-1.5 min-h-12 px-3.5', mono && 'font-mono', border(error))}
        {...input}
      />
      {hint && !error && <Hint id={id}>{hint}</Hint>}
      {error && <FieldError id={id}>{error}</FieldError>}
    </div>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: ReactNode
  mono?: boolean
}

export function TextAreaField({ label, error, hint, mono = false, className, ...textarea }: TextAreaFieldProps) {
  const id = useId()

  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cx(CONTROL, 'mt-1.5 block resize-y px-3.5 py-3 leading-normal', mono && 'font-mono text-14', border(error))}
        {...textarea}
      />
      {hint && !error && <Hint id={id}>{hint}</Hint>}
      {error && <FieldError id={id}>{error}</FieldError>}
    </div>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: ReactNode
  options: ReadonlyArray<{ value: string; label: string }>
  /** A címke a mező mellett áll (pl. „Nyelv:” a szerkesztő sávjában). */
  inline?: boolean
}

export function SelectField({ label, error, hint, options, inline = false, className, ...select }: SelectFieldProps) {
  const id = useId()

  return (
    <div className={cx('min-w-0', inline && 'flex items-center gap-2', className)}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cx(CONTROL, 'px-3', inline ? 'min-h-11 w-auto' : 'mt-1.5 min-h-12', border(error))}
        {...select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && <Hint id={id}>{hint}</Hint>}
      {error && <FieldError id={id}>{error}</FieldError>}
    </div>
  )
}

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  hint?: ReactNode
  error?: string
}

function Choice({ type, label, hint, error, className, ...input }: ChoiceProps & { type: 'checkbox' | 'radio' }) {
  const id = useId()

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className="mt-px size-5.5 flex-none accent-accent"
          {...input}
        />
        <label htmlFor={id} className="min-h-6 text-16 leading-normal">
          {label}
        </label>
      </div>
      {hint && (
        <div className="ml-8.5">
          <Hint id={id}>{hint}</Hint>
        </div>
      )}
      {error && (
        <div className="ml-8.5">
          <FieldError id={id}>{error}</FieldError>
        </div>
      )}
    </div>
  )
}

export function CheckboxField(props: ChoiceProps) {
  return <Choice type="checkbox" {...props} />
}

export function RadioField(props: ChoiceProps) {
  return <Choice type="radio" {...props} />
}

/** Rádiócsoport: valódi `<fieldset>` és `<legend>`. */
export function ChoiceGroup({ legend, children, className }: { legend: ReactNode; children: ReactNode; className?: string }) {
  return (
    <fieldset className={className}>
      <legend className={LABEL}>{legend}</legend>
      <div className="mt-2.5 flex flex-col gap-3">{children}</div>
    </fieldset>
  )
}

interface SwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ label, checked, onChange, disabled = false }: SwitchProps) {
  const id = useId()

  return (
    <div className="flex min-h-11 items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx('relative h-7 w-11.5 flex-none rounded-full disabled:opacity-60', checked ? 'bg-accent' : 'bg-muted')}
      >
        <span className={cx('absolute top-0.75 size-5.5 rounded-full bg-sheet', checked ? 'right-0.75' : 'left-0.75')} />
      </button>
      <span id={id} className="text-16">
        {label}
      </span>
    </div>
  )
}

interface SubmitButtonProps {
  busy: boolean
  children: ReactNode
  busyLabel?: ReactNode
  fullWidth?: boolean
  size?: ButtonSize
  disabled?: boolean
}

export function SubmitButton({ busy, children, busyLabel, fullWidth = true, size, disabled }: SubmitButtonProps) {
  return (
    <Button type="submit" busy={busy} busyLabel={busyLabel} fullWidth={fullWidth} size={size} disabled={disabled}>
      {children}
    </Button>
  )
}
