import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { daysUntilExam, tasksUntilExam } from '../../shared/domain/exam'
import { ButtonLink } from '../../shared/ui/Button'
import { Icon, type IconName } from '../../shared/ui/Icon'
import { Panel } from '../../shared/ui/Panel'
import { Lead } from '../../shared/ui/Text'
import * as billingApi from '../billing/api'
import { formatHuf } from '../billing/format'
import { LiveDemo } from './components/LiveDemo'

const TRACKS: ReadonlyArray<{ icon: IconName; title: string; body: string; points: string; to: string }> = [
  {
    icon: 'code',
    title: 'Programozás',
    body: 'Python 3 és C#. Az alapoktól a programozási tételekig, majd érettségi feladatsorok.',
    points: 'Közép 15, emelt 50 pont',
    to: '/tanulasi-ut',
  },
  {
    icon: 'db',
    title: 'Adatbázis-kezelés',
    body: 'SQL lekérdezések, importálás, csoportosítás, allekérdezések.',
    points: 'Közép 15, emelt 35 pont',
    to: '/tanulasi-ut',
  },
  {
    icon: 'sheet',
    title: 'Táblázatkezelés',
    body: 'Képletek, függvények, rendezés, diagramok. Excelben vagy LibreOffice Calcban.',
    points: 'Közép 25 pont, emelt 35 (választható)',
    to: '/tanulasi-ut',
  },
  {
    icon: 'doc',
    title: 'Szövegszerkesztés',
    body: 'Oldalbeállítás, stílusok, listák, táblázatok, tabulátorok. Wordben vagy Writerben.',
    points: 'Közép 25 pont',
    to: '/tanulasi-ut',
  },
  {
    icon: 'slides',
    title: 'Grafika és bemutató',
    body: 'Vektor- és pixelgrafika, diák, animáció, áttűnés.',
    points: 'Közép 20 pont',
    to: '/tanulasi-ut',
  },
  {
    icon: 'globe',
    title: 'Weboldal és szóbeli',
    body: 'HTML és CSS, valamint a szóbeli tételek begyakorlása.',
    points: 'Emelt dokumentumkészítés, szóbeli',
    to: '/szobeli',
  },
]

const STEPS: ReadonlyArray<{ icon: IconName; title: string; body: string }> = [
  { icon: 'play', title: 'Tanulsz', body: 'Rövid videók és leírások, érettségi szóhasználattal.' },
  {
    icon: 'check',
    title: 'Gyakorolsz',
    body: 'Feladatok azonnali ellenőrzéssel. A programodat lefuttatjuk, és tesztesetenként megmutatjuk, mi sikerült.',
  },
  { icon: 'flag', title: 'Vizsgázol', body: 'Régi feladatsorok időre, a hivatalos pontozás szerint.' },
]

const PREMIUM = [
  'Minden lecke, videó és gyakorlófeladat',
  'Teljes gyakorló feladatsorok időmérővel',
  'A haladásodat elmentjük és követjük',
  'Bármikor lemondható a fiókodban',
]

const PAYER_FACTS = [
  { term: 'Barionnal fizetsz', detail: 'A bankkártyaadatokat a Barion fizetőoldala kezeli, nálunk nem tárolódnak.' },
  { term: 'Minden díjról számlát kapsz', detail: 'A számlát a Számlázz.hu állítja ki, és a fiókból bármikor letölthető.' },
  { term: 'A lemondás egyszerű', detail: 'Ha lemondod, a hozzáférés a már kifizetett időszak végéig megmarad.' },
]

export function Home() {
  const plan = useQuery({ queryKey: billingApi.billingKeys.plan, queryFn: ({ signal }) => billingApi.plan(signal), staleTime: 60 * 60_000 })
  const days = daysUntilExam()

  return (
    <main>
      {/* A kockás füzet rácsa kizárólag itt, a hős mögött jelenik meg. */}
      <section className="border-y border-line bg-squared">
        <div className="mx-auto flex max-w-page flex-wrap items-start gap-12 px-4 py-12 md:px-6 md:py-18">
          <div className="max-w-form min-w-0 flex-1 basis-96">
            <h1 className="font-serif text-36 leading-tight font-semibold tracking-tight md:text-44 xl:text-54">
              Az alapoktól az érettségi feladatsorig, azonnali visszajelzéssel.
            </h1>
            <Lead className="mt-6 max-w-lead">
              Programozás, adatbázis, táblázatkezelés, szövegszerkesztés és minden, amit az érettségin kérnek. A programozási feladatokat a
              beépített szerkesztőben azonnal lefuttathatod.
            </Lead>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <ButtonLink to="/feladatok" size="lg">
                Első feladat megnyitása
              </ButtonLink>
              <Link to="/arak" className="text-16 font-semibold text-ink">
                Mennyibe kerül?
              </Link>
            </div>
            <p className="mt-3 text-15 leading-relaxed text-ink-soft">Belépés nélkül is kipróbálható.</p>

            <Panel pad="none" className="mt-10 flex items-start gap-4 px-5 py-4">
              <Icon name="calendar" size={28} className="text-accent" />
              <p className="text-16 leading-relaxed">
                Még <strong>{days} nap</strong> van az írásbeli érettségiig. Ha hetente két feladatot oldasz meg, addig{' '}
                <strong>{tasksUntilExam(days)} feladat</strong> jön össze.
              </p>
            </Panel>
          </div>

          <div className="min-w-0 flex-1 basis-120">
            <LiveDemo />
            <p className="mx-1 mt-4 max-w-prose text-15 leading-relaxed text-ink-soft">
              Ez élő minta: futtasd le a kódot, javítsd ki a hibát, majd add be. Rejtett tesztnél csak az eredményt látod, a bemenetet nem.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 pt-18 pb-6 md:px-6 md:pt-24" aria-labelledby="utak">
        <h2 id="utak" className="font-serif text-32 leading-snug font-semibold tracking-tight md:text-36">
          Az érettségi hat része, hat út
        </h2>
        <p className="mt-3 max-w-prose text-18 leading-relaxed text-ink-soft">
          Minden részhez saját tanulási út tartozik. Mindegyikben az első két lecke ingyenes, belépés nélkül is.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {TRACKS.map((track) => (
            <li key={track.title} className="flex">
              <Link
                to={track.to}
                className="flex flex-1 flex-col gap-2.5 rounded-md border border-line bg-sheet p-6 text-ink no-underline hover:bg-faint hover:text-ink"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-note">
                  <Icon name={track.icon} size={22} />
                </span>
                <span className="font-serif text-22 leading-snug font-semibold">{track.title}</span>
                <span className="text-16 leading-relaxed text-ink-soft">{track.body}</span>
                <span className="mt-auto text-14 font-semibold text-accent">{track.points}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-7">
          <ButtonLink to="/tanulasi-ut" variant="secondary">
            A teljes tanulási út
          </ButtonLink>
        </p>
      </section>

      <section className="mx-auto max-w-page px-4 pt-18 pb-6 md:px-6" aria-labelledby="igy-keszulsz">
        <h2 id="igy-keszulsz" className="font-serif text-32 leading-snug font-semibold tracking-tight">
          Így készülsz fel
        </h2>
        <ol className="mt-8 flex flex-wrap gap-8">
          {STEPS.map((step) => (
            <li key={step.title} className="flex flex-1 basis-72 gap-4">
              <Icon name={step.icon} size={28} className="text-accent" />
              <div>
                <h3 className="font-serif text-22 leading-snug font-semibold">{step.title}</h3>
                <p className="mt-1.5 max-w-lead text-16 leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-page px-4 pt-18 pb-24 md:px-6" aria-labelledby="arak">
        <h2 id="arak" className="font-serif text-32 leading-snug font-semibold tracking-tight md:text-36">
          Mennyibe kerül?
        </h2>
        <p className="mt-3 text-18 leading-relaxed text-ink-soft">Egy havi előfizetés, rejtett díjak nélkül.</p>
        <div className="mt-10 flex flex-wrap items-start gap-x-12 gap-y-8">
          <Panel kind="highlight" pad="xl" className="max-w-form min-w-0 flex-1 basis-96">
            <h3 className="font-serif text-22 leading-snug font-semibold">{plan.data?.name ?? 'InfoTanár Prémium'}</h3>
            {plan.data && (
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-serif text-44 leading-tight font-semibold tracking-tight">{formatHuf(plan.data.price_huf)}</span>
                <span className="text-17 text-ink-soft">havonta</span>
              </p>
            )}
            <ul className="mt-6 flex flex-col gap-3">
              {PREMIUM.map((item) => (
                <li key={item} className="flex gap-3 text-16 leading-normal">
                  <Icon name="check" className="mt-0.5 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <ButtonLink to="/elofizetes" size="lg" fullWidth className="mt-7">
              Prémium előfizetés
            </ButtonLink>
          </Panel>

          <div className="max-w-form min-w-0 flex-1 basis-88">
            <h3 className="font-serif text-24 leading-snug font-semibold">Ha te fizeted</h3>
            <dl className="mt-4 border-b border-line">
              {PAYER_FACTS.map((fact) => (
                <div key={fact.term} className="border-t border-line py-4">
                  <dt className="text-17 font-bold">{fact.term}</dt>
                  <dd className="mt-1.5 text-16 leading-relaxed text-ink-soft">{fact.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </main>
  )
}
