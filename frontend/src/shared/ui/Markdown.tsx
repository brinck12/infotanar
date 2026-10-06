import type { ComponentProps } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Link } from 'react-router-dom'
import remarkGfm from 'remark-gfm'

/**
 * Hosszabb, olvasásra szánt Markdown szöveg (jogi dokumentumok, tananyag).
 * A tipográfia az index.css `.longform` szabályaiban van. A nyers HTML nem
 * jelenik meg: a szerkesztett tartalom nem tud szkriptet vagy saját jelölést
 * bevinni az oldalba.
 *
 * A `code` saját megjelenítőt ad a kódrészleteknek (a tananyag kódkiemelése),
 * hogy a kiemelő csak ott töltődjön le, ahol kell.
 */
export function Markdown({ children, code }: { children: string; code?: Components['code'] }) {
  return (
    <div className="longform">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: MarkdownLink, table: ScrollableTable, pre: ScrollableCode, ...(code && { code }) }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

/** Belső link oldalújratöltés nélkül; külső link új lapon, a megnyitott oldal nem éri el a miénket. */
function MarkdownLink({ href, children }: ComponentProps<'a'>) {
  if (href?.startsWith('/')) return <Link to={href}>{children}</Link>

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

/**
 * Keskeny kijelzőn a többoszlopos táblázat a saját keretén belül görgethető,
 * így az oszlopok olvashatók maradnak, és nem tolják szét az oldalt. A
 * görgethető terület fókuszálható, hogy billentyűzettel is görgetni lehessen.
 */
/** A hosszú kódsor nem törik (a behúzás olvasható marad), hanem a blokk görgethető, ugyanúgy, mint a táblázat. */
function ScrollableCode({ children }: ComponentProps<'pre'>) {
  return (
    <div className="longform-code" role="region" aria-label="Kódrészlet (vízszintesen görgethető)" tabIndex={0}>
      <pre>{children}</pre>
    </div>
  )
}

function ScrollableTable({ children }: ComponentProps<'table'>) {
  return (
    <div className="longform-table" role="region" aria-label="Táblázat (vízszintesen görgethető)" tabIndex={0}>
      <table>{children}</table>
    </div>
  )
}
