import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Banner } from '../../shared/ui/Banner'
import { PageTitle } from '../../shared/ui/Text'

interface LegalSection {
  id: string
  title: string
  body: ReactNode
}

/** Szögletes zárójelben: amit a jogásznak kell kitöltenie. */
const TODO = (text: string) => <span className="rounded-sm bg-note px-1.5">[{text}]</span>

const PRIVACY: ReadonlyArray<LegalSection> = [
  { id: 'ki-vagyunk', title: 'Ki vagyunk', body: TODO('Az adatkezelő neve, székhelye és elérhetősége.') },
  {
    id: 'adatok',
    title: 'Milyen adatokat kezelünk',
    body: 'Regisztrációkor a nevedet és az e-mail-címedet, a tanuláshoz a megoldásaidat és a haladásodat, előfizetéskor a számlázási adataidat. A bankkártyaadataidat nem tároljuk, azokat a Barion kezeli.',
  },
  {
    id: 'megorzes',
    title: 'Meddig őrizzük őket',
    body: (
      <>
        {TODO('Megőrzési idők.')} A kiállított számlákat a jogszabályi határidőig megőrizzük, a fiók törlésekor a többi adatod törlődik.
      </>
    ),
  },
  {
    id: 'jogaid',
    title: 'A te jogaid',
    body: (
      <>
        Bármikor letöltheted az adataidat a fiókodban, és törölheted a fiókodat. <Link to="/fiok">Fiók beállításai</Link>
      </>
    ),
  },
  { id: 'sutik', title: 'Sütik', body: TODO('A használt sütik és a böngészőben tárolt adatok felsorolása.') },
  { id: 'kapcsolat', title: 'Kapcsolat', body: TODO('Adatvédelmi megkeresések címe.') },
]

const TERMS: ReadonlyArray<LegalSection> = [
  { id: 'szolgaltato', title: 'A szolgáltató', body: TODO('A szolgáltató neve, székhelye, cégjegyzékszáma, adószáma.') },
  {
    id: 'szolgaltatas',
    title: 'A szolgáltatás',
    body: 'Az InfoTanár a digitális kultúra érettségire készít fel leckékkel és automatikusan ellenőrzött feladatokkal. Az első két lecke minden sávban ingyenes, a többi Prémium előfizetéssel érhető el.',
  },
  {
    id: 'elofizetes',
    title: 'Előfizetés és fizetés',
    body: 'Az előfizetés havonta megújul, a díjat a Barion fizetőoldalán megadott bankkártyáról vonjuk le. Minden sikeres fizetésről számlát állítunk ki.',
  },
  {
    id: 'lemondas',
    title: 'Lemondás',
    body: (
      <>
        Az előfizetés bármikor lemondható a <Link to="/fiok/elofizetes">fiók Előfizetés oldalán</Link>. A hozzáférés a már kifizetett időszak
        végéig megmarad. {TODO('Elállási jog és visszatérítés szabályai.')}
      </>
    ),
  },
  { id: 'felelosseg', title: 'Felelősség', body: TODO('Felelősségi szabályok, a szolgáltatás elérhetősége.') },
  { id: 'kapcsolat', title: 'Kapcsolat', body: TODO('Ügyfélszolgálat elérhetősége, panaszkezelés.') },
]

/** Hosszú, olvasmányos jogi oldal tartalomjegyzékkel. A szöveg helykitöltő: jogásznak kell megírnia. */
function LegalPage({ title, sections }: { title: string; sections: ReadonlyArray<LegalSection> }) {
  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <Banner kind="warn" title="Jogi szöveg helye">
        A végleges szöveget jogásznak kell megírnia. Ami itt áll, elrendezési minta, nem hatályos tájékoztatás.
      </Banner>

      <div className="mt-8 flex flex-wrap items-start gap-x-12 gap-y-8">
        <nav aria-label="Tartalom" className="w-full md:sticky md:top-6 md:w-60 md:flex-none">
          <p className="text-15 font-bold">Tartalom</p>
          <ol className="mt-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="inline-flex min-h-11 items-center text-15 text-ink">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 flex-1 basis-96">
          <PageTitle>{title}</PageTitle>
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="mt-10 scroll-mt-6">
              <h2 className="font-serif text-24 leading-snug font-semibold">
                {index + 1}. {section.title}
              </h2>
              <p className="mt-3 max-w-prose font-serif text-18 leading-loose">{section.body}</p>
            </section>
          ))}
        </article>
      </div>
    </main>
  )
}

export function PrivacyPolicy() {
  return <LegalPage title="Adatkezelési tájékoztató" sections={PRIVACY} />
}

export function TermsOfService() {
  return <LegalPage title="Általános szerződési feltételek" sections={TERMS} />
}
