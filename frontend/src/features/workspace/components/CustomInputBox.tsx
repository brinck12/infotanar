import { TextAreaField } from '../../../shared/ui/Form'
import { MAX_CUSTOM_INPUT_LENGTH } from '../drafts'

/**
 * A "Saját bemenet" (#153) szövegdoboza. Nyitott állapotban a Futtatás
 * ezzel a bemenettel fut egyszer, a feladat tesztesetei nélkül.
 */
export function CustomInputBox({
  value,
  error,
  disabled,
  onChange,
}: {
  value: string
  error?: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <div data-testid="custom-input" className="space-y-1">
      <TextAreaField
        label="Saját bemenet (stdin)"
        rows={4}
        mono
        value={value}
        maxLength={MAX_CUSTOM_INPUT_LENGTH}
        disabled={disabled}
        error={error}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-slate-400">
        A Futtatás most csak ezzel a bemenettel fut egyszer, a tesztesetek nélkül; a program kimenetét látod, helyes/hibás
        minősítés nélkül. A Beadás nem változik.
      </p>
    </div>
  )
}
