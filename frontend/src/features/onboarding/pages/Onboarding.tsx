import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { daysUntilExam, EXAM_PARTS } from '../../../shared/domain/exam'
import { userKeyOf } from '../../../shared/domain/lastTask'
import {
  DEFAULT_PREFERENCES,
  EXAM_PERIODS,
  isStudyPreferences,
  preferencesKey,
  WEEKLY_HOURS,
  type StudyPreferences,
} from '../../../shared/domain/preferences'
import { usePersistentState } from '../../../shared/hooks/usePersistentState'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { RadioField, SelectField } from '../../../shared/ui/Form'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
import { CardTitle, Lead, PageTitle } from '../../../shared/ui/Text'
import { useToast } from '../../../shared/ui/useToast'
import { useAuth } from '../../auth/context'

const LEVEL_OPTIONS = [
  { value: 'kozep', title: 'Középszint', detail: '180 perc, 100 pont. Mind az öt gyakorlati rész.' },
  { value: 'emelt', title: 'Emelt szint', detail: '240 perc, 120 pont. Nagyobb programozási és adatbázis-rész, plusz szóbeli.' },
] as const

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python 3' },
  { value: 'csharp', label: 'C#' },
] as const

/** Indulás: négy kérdés a célokról, mellette a belőlük adódó terv. Kihagyható. */
export function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [saved, save] = usePersistentState(preferencesKey(userKeyOf(user)), DEFAULT_PREFERENCES, isStudyPreferences)
  const [form, setForm] = useState<StudyPreferences>(saved)
  const set = <K extends keyof StudyPreferences>(key: K, value: StudyPreferences[K]) => setForm((current) => ({ ...current, [key]: value }))

  function submit(e: FormEvent) {
    e.preventDefault()
    save(form)
    toast.show('A céljaidat elmentettük.')
    navigate('/tanulasi-ut')
  }

  const days = daysUntilExam()
  const hours = WEEKLY_HOURS.find((option) => option.value === form.weeklyHours) ?? WEEKLY_HOURS[1]
  const tasks = Math.floor(days / 7) * (hours?.tasksPerWeek ?? 2)
  const biggest = [...EXAM_PARTS[form.level]].sort((a, b) => b.points - a.points)[0]

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <PageTitle>Állítsd be a céljaid</PageTitle>
      <Lead className="mt-3 max-w-prose text-18">Négy kérdés, fél perc. Ebből tudjuk, mit mutassunk először, és mennyi idő van hátra.</Lead>

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <form onSubmit={submit} className="flex min-w-0 flex-1 basis-120 flex-col gap-6">
          <Question number={1} legend="Melyik szintre készülsz?">
            {LEVEL_OPTIONS.map((option) => (
              <RadioField
                key={option.value}
                name="level"
                value={option.value}
                checked={form.level === option.value}
                onChange={() => set('level', option.value)}
                label={
                  <>
                    <strong className="block">{option.title}</strong>
                    <span className="text-15 text-ink-soft">{option.detail}</span>
                  </>
                }
              />
            ))}
          </Question>

          <Question number={2} legend="Mikor érettségizel?">
            <SelectField
              className="max-w-xs"
              label="Vizsgaidőszak"
              options={EXAM_PERIODS}
              value={form.examPeriod}
              onChange={(e) => set('examPeriod', e.target.value)}
              hint="A pontos nap a hivatalos beosztás után frissül."
            />
          </Question>

          <Question number={3} legend="Melyik programozási nyelven tanulnál?">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {LANGUAGE_OPTIONS.map((option) => (
                <RadioField
                  key={option.value}
                  name="language"
                  value={option.value}
                  checked={form.language === option.value}
                  onChange={() => set('language', option.value)}
                  label={option.label}
                />
              ))}
            </div>
            <p className="text-14 leading-relaxed text-ink-soft">
              A vizsgán Java és C++ is választható, ezekhez egyelőre nincs tananyagunk. Nyelvet bármikor válthatsz.
            </p>
          </Question>

          <Question number={4} legend="Heti hány órát tudsz rááldozni?">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {WEEKLY_HOURS.map((option) => (
                <RadioField
                  key={option.value}
                  name="hours"
                  value={option.value}
                  checked={form.weeklyHours === option.value}
                  onChange={() => set('weeklyHours', option.value)}
                  label={option.label}
                />
              ))}
            </div>
          </Question>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg">
              Kész, kezdjük
            </Button>
            <ButtonLink to="/tanulasi-ut" variant="text">
              Később
            </ButtonLink>
          </div>
        </form>

        <Panel as="aside" kind="highlight" aria-labelledby="terv" aria-live="polite" className="w-full md:w-96 md:flex-none">
          <CardTitle id="terv" as="h2">
            Ez lesz a terved
          </CardTitle>
          <ul className="mt-4 flex flex-col gap-4">
            <PlanItem icon="calendar" title={`Még ${days} nap az érettségiig`}>
              Heti {hours?.label ?? ''} mellett nagyjából {tasks} feladat fér bele.
            </PlanItem>
            <PlanItem icon="flag" title="Kezdd a programozással">
              {form.level === 'kozep'
                ? 'Középszinten 15 pont, de ez a legnagyobb ugrás, ezért érdemes korán elkezdeni.'
                : 'Emelt szinten 50 pont, a legnagyobb rész, és ezen múlik a szóbeli B része is.'}
            </PlanItem>
            {biggest && (
              <PlanItem icon={biggest.icon} title={`A legtöbb pont: ${biggest.name}`}>
                {biggest.points} pont a {form.level === 'kozep' ? '100' : '120'}-ból, {biggest.minutes} perc jut rá a vizsgán.
              </PlanItem>
            )}
          </ul>
          <p className="mt-4 text-14 leading-relaxed text-ink-soft">
            A terv csak javaslat. Bármelyik sávot megnyithatod. A beállításaidat egyelőre ez a böngésző őrzi meg.
          </p>
        </Panel>
      </div>
    </main>
  )
}

function Question({ number, legend, children }: { number: number; legend: string; children: ReactNode }) {
  return (
    <Panel as="fieldset">
      <legend className="float-left flex w-full items-center gap-3 font-serif text-20 leading-snug font-semibold">
        <span className="inline-flex size-8 flex-none items-center justify-center rounded-sm bg-ink font-sans text-15 font-bold text-sheet">{number}</span>
        {legend}
      </legend>
      <div className="clear-both flex flex-col gap-3 pt-4">{children}</div>
    </Panel>
  )
}

function PlanItem({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon name={icon} className="mt-0.5 text-accent" />
      <div>
        <p className="text-16 font-bold">{title}</p>
        <p className="mt-0.5 text-15 leading-normal text-ink-soft">{children}</p>
      </div>
    </li>
  )
}
