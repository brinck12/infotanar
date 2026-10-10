import type { ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'
import { Panel } from '../../shared/ui/Panel'

interface ErrorPageProps {
  /** A HTTP-kód nagy számként a cím fölött. */
  code: string
  title: string
  children: ReactNode
  actions: ReactNode
}

/** Hibaoldal: megmondja, mi történt, és mit lehet tenni. */
export function ErrorPage({ code, title, children, actions }: ErrorPageProps) {
  return (
    <main className="mx-auto w-full max-w-form flex-1 px-4 pt-12 pb-24 md:px-6">
      <Panel pad="xl" className="rounded-lg">
        <p className="font-mono text-22 font-medium text-ink-soft">{code}</p>
        <h1 className="mt-2 font-serif text-32 leading-tight font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-16 leading-relaxed text-ink-soft">{children}</p>
        <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
      </Panel>
    </main>
  )
}

/** A hibahatár tartalma: router nélkül is működik, ezért sima hivatkozást használ. */
export function Crashed() {
  return (
    <div role="alert" className="flex flex-1 flex-col">
      <ErrorPage
        code="500"
        title="Valami elromlott nálunk"
        actions={
          <>
            <Button icon="refresh" onClick={() => window.location.reload()}>
              Újratöltés
            </Button>
            <a href="/" className="inline-flex min-h-11 items-center px-1 text-16 font-semibold">
              Kezdőlap
            </a>
          </>
        }
      >
        A hiba nem a te hibád. Próbáld újra egy perc múlva; a szerkesztőben lévő kódod piszkozatként megmaradt ebben a böngészőben.
      </ErrorPage>
    </div>
  )
}
