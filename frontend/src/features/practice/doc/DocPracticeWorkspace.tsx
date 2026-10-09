import { useMemo, useState } from 'react'
import { Badge, LevelBadge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { SelectField } from '../../../shared/ui/Form'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
import { Prose } from '../../../shared/ui/Prose'
import { RubricItem, type RubricState } from '../../../shared/ui/RubricItem'
import { CardTitle } from '../../../shared/ui/Text'
import type { DocPracticeInfo, UnlockedTaskDetail } from '../../../types'

type Align = 'left' | 'center' | 'right' | 'justify'

interface ParagraphFormat {
  align: Align
  fontSize: number
  bold: boolean
  italic: boolean
  underline: boolean
  lineSpacing: number
}

const DEFAULT_FORMAT: ParagraphFormat = { align: 'left', fontSize: 12, bold: false, italic: false, underline: false, lineSpacing: 1 }

const ALIGN: ReadonlyArray<{ value: Align; label: string; icon: IconName }> = [
  { value: 'left', label: 'Balra zárt', icon: 'align-left' },
  { value: 'center', label: 'Középre zárt', icon: 'align-center' },
  { value: 'right', label: 'Jobbra zárt', icon: 'align-left' },
  { value: 'justify', label: 'Sorkizárt', icon: 'align-justify' },
]
const ALIGN_NAME: Readonly<Record<Align, string>> = { left: 'balra zárt', center: 'középre zárt', right: 'jobbra zárt', justify: 'sorkizárt' }
const ALIGN_CLASS: Readonly<Record<Align, string>> = { left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify' }

const SIZES = [10, 11, 12, 14, 16, 18, 20, 24].map((size) => ({ value: String(size), label: `${size} pt` }))
const SPACINGS = [1, 1.15, 1.5, 2].map((value) => ({ value: String(value), label: value.toLocaleString('hu-HU', { minimumFractionDigits: 1 }) }))

type Check = DocPracticeInfo['checks'][number]

function evaluate(check: Check, format: ParagraphFormat): { passed: boolean; found: string } {
  switch (check.type) {
    case 'align':
      return { passed: format.align === check.value, found: ALIGN_NAME[format.align] }
    case 'font_size':
      return { passed: format.fontSize === check.value, found: `${format.fontSize} pt` }
    case 'bold':
      return { passed: format.bold, found: format.bold ? 'félkövér' : 'nem félkövér' }
    case 'italic':
      return { passed: format.italic, found: format.italic ? 'dőlt' : 'nem dőlt' }
    case 'underline':
      return { passed: format.underline, found: format.underline ? 'aláhúzott' : 'nincs aláhúzva' }
    case 'line_spacing':
      return { passed: format.lineSpacing === check.value, found: `sorköz: ${format.lineSpacing.toLocaleString('hu-HU')}` }
  }
}

/**
 * Böngészős szövegszerkesztő gyakorló: egyszerűsített szalag és egy papírlap.
 * A formázás bekezdésenként állítható; az ellenőrzőlista élőben frissül.
 * Rövid leckegyakorlatokhoz való, a vizsgafeladatok Wordben vagy Writerben készülnek.
 */
export function DocPracticeWorkspace({ task, info }: { task: UnlockedTaskDetail; info: DocPracticeInfo }) {
  const [formats, setFormats] = useState<ParagraphFormat[]>(() => info.paragraphs.map(() => DEFAULT_FORMAT))
  const [selected, setSelected] = useState(0)
  const current = formats[selected] ?? DEFAULT_FORMAT

  const update = (change: Partial<ParagraphFormat>) =>
    setFormats((all) => all.map((format, index) => (index === selected ? { ...format, ...change } : format)))

  const results = useMemo(
    () =>
      info.checks.map((check) => {
        const { passed, found } = evaluate(check, formats[check.paragraph] ?? DEFAULT_FORMAT)
        const state: RubricState = passed ? 'ok' : 'bad'
        return { check, state, found }
      }),
    [info.checks, formats],
  )
  const done = results.filter((result) => result.state === 'ok').length

  return (
    <main className="mx-auto flex w-full max-w-work flex-wrap items-start gap-6 px-4 py-6 md:px-6">
      <Panel as="section" pad="xl" aria-label="Feladat leírása" className="min-w-0 flex-1 basis-100 lg:max-w-form">
        <h1 className="font-serif text-32 leading-tight font-semibold tracking-tight">{task.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <LevelBadge level={task.level} />
          <Badge kind="lang">Böngészős gyakorló</Badge>
        </div>
        <Prose markdown={task.description} className="mt-6" />

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
          <CardTitle>Ellenőrzőlista</CardTitle>
          <span className="text-15 font-semibold">
            {done} / {results.length} kész
          </span>
        </div>
        <p className="mt-1 text-15 text-ink-soft">Dolgozz közvetlenül a lapon. A lista élőben frissül.</p>
        <ul className="mt-2" aria-live="polite">
          {results.map((result) => (
            <RubricItem
              key={result.check.id}
              state={result.state}
              text={result.check.label}
              points={result.state === 'ok' ? 1 : 0}
              maxPoints={1}
              found={result.found}
            />
          ))}
        </ul>
        <Button variant="text" onClick={() => setFormats(info.paragraphs.map(() => DEFAULT_FORMAT))} className="mt-4">
          Kiinduló szöveg
        </Button>
      </Panel>

      <Panel kind="work" pad="none" as="section" aria-label="Dokumentum" className="min-w-0 flex-1 basis-120 overflow-hidden">
        <div role="toolbar" aria-label="Formázás" className="flex flex-wrap items-end gap-x-4 gap-y-3 border-b border-line bg-headrow px-4 py-3">
          <SelectField
            className="w-28"
            label="Betűméret"
            options={SIZES}
            value={String(current.fontSize)}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
          />
          <div className="flex gap-1">
            <Toggle icon="bold" label="Félkövér" pressed={current.bold} onClick={() => update({ bold: !current.bold })} />
            <Toggle icon="italic" label="Dőlt" pressed={current.italic} onClick={() => update({ italic: !current.italic })} />
            <Toggle icon="underline" label="Aláhúzott" pressed={current.underline} onClick={() => update({ underline: !current.underline })} />
          </div>
          <div role="group" aria-label="Igazítás" className="flex gap-1">
            {ALIGN.map((option) => (
              <Toggle
                key={option.value}
                icon={option.icon}
                label={option.label}
                pressed={current.align === option.value}
                onClick={() => update({ align: option.value })}
                mirrored={option.value === 'right'}
              />
            ))}
          </div>
          <SelectField
            className="w-28"
            label="Sorköz"
            options={SPACINGS}
            value={String(current.lineSpacing)}
            onChange={(e) => update({ lineSpacing: Number(e.target.value) })}
          />
        </div>

        <div className="bg-note p-4 md:p-8">
          <div className="mx-auto flex max-w-form flex-col bg-sheet px-6 py-8 font-serif shadow-sheet md:px-12 md:py-12">
            {info.paragraphs.map((text, index) => {
              const format = formats[index] ?? DEFAULT_FORMAT
              const isSelected = index === selected
              return (
                <button
                  // A bekezdések sorrendje rögzített, a helyük az azonosságuk.
                  // oxlint-disable-next-line react/no-array-index-key
                  key={index}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${index + 1}. bekezdés kijelölése: ${text.slice(0, 40)}`}
                  onClick={() => setSelected(index)}
                  style={{ fontSize: `${format.fontSize}pt`, lineHeight: format.lineSpacing * 1.3 }}
                  className={cx(
                    'mb-2 min-h-11 rounded-sm px-1 text-ink',
                    ALIGN_CLASS[format.align],
                    format.bold && 'font-bold',
                    format.italic && 'italic',
                    format.underline && 'underline',
                    isSelected ? 'bg-accent-soft' : 'hover:bg-faint',
                  )}
                >
                  {text}
                </button>
              )
            })}
          </div>
        </div>
        <p className="border-t border-line px-4 py-3 text-14 leading-relaxed text-ink-soft">
          Kattints egy bekezdésre, majd állítsd a formázását a szalagon. A kijelölt bekezdés: {selected + 1}.
        </p>
      </Panel>
    </main>
  )
}

interface ToggleProps {
  icon: IconName
  label: string
  pressed: boolean
  onClick: () => void
  /** A jobbra zárás jele a balra zárás tükörképe. */
  mirrored?: boolean
}

function Toggle({ icon, label, pressed, onClick, mirrored = false }: ToggleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cx(
        'inline-flex size-12 items-center justify-center rounded-md border',
        pressed ? 'border-ink bg-ink text-sheet' : 'border-muted bg-sheet text-ink hover:bg-note',
      )}
    >
      <Icon name={icon} className={mirrored ? '-scale-x-100' : undefined} />
    </button>
  )
}
