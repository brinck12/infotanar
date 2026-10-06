import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Field({ label, error, hint, ...input }: FieldProps) {
  const id = useId()
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block text-slate-300">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          error ? 'border-red-700' : 'border-slate-800'
        }`}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
  mono?: boolean
}

export function TextAreaField({ label, error, hint, mono = false, className = '', ...textarea }: TextAreaFieldProps) {
  const id = useId()
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block text-slate-300">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          mono ? 'font-mono text-xs' : ''
        } ${error ? 'border-red-700' : 'border-slate-800'} ${className}`}
        {...textarea}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Szöveg vagy linket tartalmazó tartalom (pl. elfogadó nyilatkozat). */
  label: ReactNode
  hint?: string
  error?: string
}

export function CheckboxField({ label, hint, error, ...input }: CheckboxFieldProps) {
  const id = useId()
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined

  return (
    <div className="text-sm">
      {/* Felülre igazítva: több soros címkénél a jelölőnégyzet az első sor mellett marad. */}
      <label htmlFor={id} className="flex items-start gap-2 text-slate-200">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...input}
        />
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 ml-6 text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 ml-6 text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: ReadonlyArray<{ value: string; label: string }>
}

export function SelectField({ label, error, options, ...select }: SelectFieldProps) {
  const id = useId()

  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block text-slate-300">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-slate-100 ${error ? 'border-red-700' : 'border-slate-800'}`}
        {...select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

export function SubmitButton({ busy, children, fullWidth = true }: { busy: boolean; children: ReactNode; fullWidth?: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className={`${fullWidth ? 'w-full' : ''} rounded-lg bg-sky-700 px-5 py-2.5 font-medium text-white transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-wait disabled:opacity-60`}
    >
      {children}
    </button>
  )
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-red-900 bg-red-950/60 text-red-200',
    success: 'border-emerald-900 bg-emerald-950/60 text-emerald-200',
    info: 'border-sky-900 bg-sky-950/60 text-sky-200',
  }[kind]

  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-4 text-sm ${styles}`}>
      {children}
    </div>
  )
}

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  )
}
