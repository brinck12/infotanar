import { Link } from 'react-router-dom'
import { userKeyOf } from '../../../shared/domain/lastTask'
import { Icon } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
import { Table, Td, Th } from '../../../shared/ui/Table'
import { CardTitle, Lead, PageTitle, SectionTitle } from '../../../shared/ui/Text'
import { useAuth } from '../../auth/context'
import { readPractice } from '../practice'
import { ORAL_MINUTES, ORAL_SCORING, ORAL_TOPICS } from '../topics'

const STEPS = [
  'Húzol egy tételt: az A) rész egy elméleti téma a hat közül, a B) rész egy programozási feladat.',
  'Felkészülsz: a B) feladatot a gépen megoldod, internet nélkül.',
  'Felelsz: az A) témát elmondod, a B) megoldását bemutatod.',
]

function attemptsLabel(attempts: number): string {
  if (attempts === 0) return 'Még nem gyakoroltad'
  return attempts === 1 ? 'Egyszer gyakoroltad' : `${attempts} alkalommal gyakoroltad`
}

/** Szóbeli: hogyan zajlik, mire jár pont, és a hat elméleti téma gyakorlása. */
export function Oral() {
  const { user } = useAuth()
  const userKey = userKeyOf(user)

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <PageTitle>Szóbeli</PageTitle>
      <Lead className="mt-3 max-w-prose text-18">
        Gyakorold a tételeket úgy, ahogy a bizottság előtt kell: idővel, kifejtéssel és programmal.
      </Lead>

      <div className="mt-8 flex flex-wrap items-start gap-6">
        <Panel as="section" className="min-w-0 flex-1 basis-96" aria-labelledby="menete">
          <CardTitle id="menete" as="h2">
            Hogy zajlik a szóbeli?
          </CardTitle>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-16 leading-relaxed">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-4 text-15 leading-relaxed text-ink-soft">
            Emelt szinten {ORAL_MINUTES.preparation} perc a felkészülés és {ORAL_MINUTES.answer.emelt} perc a felelet. Középszinten a felelet{' '}
            {ORAL_MINUTES.answer.kozep} perc.
          </p>
        </Panel>

        <Panel as="section" className="min-w-0 flex-1 basis-80" aria-labelledby="pontozas">
          <CardTitle id="pontozas" as="h2">
            Mire ad pontot a bizottság?
          </CardTitle>
          <Table caption="Az emelt szintű szóbeli pontozása" className="mt-3">
            <thead>
              <tr>
                <Th>Szempont</Th>
                <Th align="right">Pont</Th>
              </tr>
            </thead>
            <tbody>
              {ORAL_SCORING.map((row) => (
                <tr key={row.criterion}>
                  <Td>{row.criterion}</Td>
                  <Td align="right" className="font-semibold tabular-nums">
                    {row.points}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="mt-3 text-14 leading-relaxed text-ink-soft">Ez az emelt szintű 30 pontos szóbeli. Forrás: az Oktatási Hivatal leírása.</p>
        </Panel>
      </div>

      <section className="mt-12" aria-labelledby="temak">
        <SectionTitle id="temak">Az A) rész hat témája</SectionTitle>
        <ul className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {ORAL_TOPICS.map((topic) => (
            <li key={topic.slug} className="flex">
              <Link
                to={`/szobeli/${topic.slug}`}
                className="flex flex-1 flex-col gap-2 rounded-md border border-line bg-sheet p-6 text-ink no-underline hover:bg-faint hover:text-ink"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-note">
                  <Icon name={topic.icon} size={22} />
                </span>
                <span className="font-serif text-22 leading-snug font-semibold">{topic.title}</span>
                <span className="text-16 leading-relaxed text-ink-soft">Elméleti téma kifejtése, majd egy programozási feladat bemutatása.</span>
                <span className="mt-auto border-t border-grid pt-3 text-15 font-semibold text-ink-soft">
                  {attemptsLabel(readPractice(userKey, topic.slug).attempts)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
