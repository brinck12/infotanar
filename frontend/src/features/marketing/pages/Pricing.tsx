import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ButtonLink } from '../../../shared/ui/Button'
import { Icon } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
import { Table, Td, Th } from '../../../shared/ui/Table'
import { CardTitle, Lead, PageTitle, SectionTitle } from '../../../shared/ui/Text'
import * as billingApi from '../../billing/api'
import { formatHuf } from '../../billing/format'

const YES = <Icon name="check" className="text-accent" label="Igen" />
const NO = <Icon name="x" size={18} className="text-muted" label="Nem" />

const COMPARISON: ReadonlyArray<{ feature: string; free: ReactNode; premium: ReactNode }> = [
  { feature: 'Az első két lecke minden sávban', free: YES, premium: YES },
  { feature: 'Összes lecke és videó', free: NO, premium: YES },
  { feature: 'Gyakorló feladatok ellenőrzéssel', free: 'Csak az ingyenes leckékben', premium: YES },
  { feature: 'Gyakorló feladatsorok időmérővel', free: NO, premium: YES },
  { feature: 'Szóbeli tételek begyakorlása', free: NO, premium: YES },
  { feature: 'Haladás mentése', free: YES, premium: YES },
]

const FAQ: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'Mikor terheli meg a kártyámat?',
    answer: 'A megrendeléskor azonnal, utána havonta ugyanazon a napon. A kártyaadatokat a Barion kezeli.',
  },
  {
    question: 'Mi történik, ha nem sikerül a levonás?',
    answer: 'Néhány napig megtartod a hozzáférést, és e-mailben értesítünk. Ez idő alatt új kártyát is megadhatsz.',
  },
  {
    question: 'Hogyan mondhatom le?',
    answer: 'A fiókodban az Előfizetés oldalon, egy gombbal. A hozzáférés a már kifizetett időszak végéig megmarad.',
  },
  {
    question: 'Kapok számlát?',
    answer: 'Igen, minden sikeres fizetésről számlát állítunk ki, amit a fiókodból letölthetsz.',
  },
]

/** Árak: az ingyenes és a Prémium csomag összevetése, a csomag ára és a gyakori kérdések. */
export function Pricing() {
  const plan = useQuery({ queryKey: billingApi.billingKeys.plan, queryFn: ({ signal }) => billingApi.plan(signal), staleTime: 60 * 60_000 })

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <PageTitle>Egy előfizetés, minden sáv</PageTitle>
      <Lead className="mt-3 max-w-prose text-18">Rejtett díjak nélkül. Az első két lecke minden sávban ingyenes, belépés nélkül is.</Lead>

      <div className="mt-10 flex flex-wrap items-start gap-8">
        <Table caption="Az ingyenes és a Prémium csomag összehasonlítása" className="min-w-0 flex-1 basis-120">
          <thead>
            <tr>
              <Th>
                <span className="sr-only">Mit kapsz</span>
              </Th>
              <Th>Ingyenes</Th>
              <Th>Prémium</Th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.feature}>
                <Td className="py-3.5 text-16 font-medium">{row.feature}</Td>
                <Td className="py-3.5 text-ink-soft">{row.free}</Td>
                <Td className="py-3.5">{row.premium}</Td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Panel kind="highlight" pad="xl" className="w-full md:w-96 md:flex-none">
          <CardTitle as="h2" className="text-22">
            {plan.data?.name ?? 'InfoTanár Prémium'}
          </CardTitle>
          {plan.data && (
            <p className="mt-4 flex items-baseline gap-2">
              <span className="font-serif text-44 leading-tight font-semibold tracking-tight">{formatHuf(plan.data.price_huf)}</span>
              <span className="text-17 text-ink-soft">havonta</span>
            </p>
          )}
          <p className="mt-2 text-15 leading-relaxed text-ink-soft">Az ár bruttó, az áfát a számla bontja.</p>
          <ButtonLink to="/elofizetes" size="lg" fullWidth className="mt-6">
            Prémium előfizetés
          </ButtonLink>
          <p className="mt-3 text-14 leading-relaxed text-ink-soft">Fizetés Barionnal. Bármikor lemondható.</p>
        </Panel>
      </div>

      <section className="mt-18 max-w-account" aria-labelledby="gyik">
        <SectionTitle id="gyik">Gyakori kérdések</SectionTitle>
        <div className="mt-5 border-b border-line">
          {FAQ.map((item, index) => (
            <details key={item.question} open={index === 0} className="group border-t border-line">
              <summary className="flex min-h-14 list-none items-center justify-between gap-4 py-2 text-17 font-bold">
                {item.question}
                <Icon name="chevron-down" className="text-ink-soft group-open:rotate-180" />
              </summary>
              <p className="max-w-prose pb-5 text-16 leading-relaxed text-ink-soft">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
