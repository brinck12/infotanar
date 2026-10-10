import { isValidElement, type ComponentProps, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import { Link } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import { CodeBlock, type CodeLanguage } from './CodeBlock'
import { cx } from './cx'
import { headingId } from './headings'

interface ProseProps {
  markdown: string
  className?: string
  /** A kerített kódblokkok a sötét kódfelületen, kiemelve jelennek meg (tananyag). */
  codeBlocks?: boolean
  /** A második szintű címsorok horgonyt kapnak (`headings.ts`), hogy tartalomjegyzék mutathasson rájuk. */
  anchors?: boolean
}

/**
 * Markdown szöveg tankönyvi szedéssel (feladatleírás, tananyag, jogi szöveg).
 * A nyers HTML nem jelenik meg: a szerkesztett tartalom nem tud szkriptet vagy
 * saját jelölést bevinni az oldalba.
 */
export function Prose({ markdown, className, codeBlocks = false, anchors = false }: ProseProps) {
  const components: Components = {
    a: ProseLink,
    table: ScrollableTable,
    ...(codeBlocks && { pre: HighlightedBlock }),
    ...(anchors && { h2: AnchoredHeading }),
  }

  return (
    <div className={cx('prose-task', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)

  return ''
}

function AnchoredHeading({ children }: ComponentProps<'h2'>) {
  return (
    <h2 id={headingId(textOf(children))} className="scroll-mt-6">
      {children}
    </h2>
  )
}

/** Belső link oldalújratöltés nélkül; külső link új lapon, a megnyitott oldal nem éri el a miénket. */
function ProseLink({ href, children }: ComponentProps<'a'>) {
  if (href?.startsWith('/')) return <Link to={href}>{children}</Link>
  if (href?.startsWith('#')) return <a href={href}>{children}</a>

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
function ScrollableTable({ children }: ComponentProps<'table'>) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="prose-scroll" role="region" aria-label="Táblázat (vízszintesen görgethető)" tabIndex={0}>
      <table>{children}</table>
    </div>
  )
}

const CODE_LANGUAGES: ReadonlyArray<CodeLanguage> = ['python', 'csharp', 'sql', 'html', 'css']

function isCodeLanguage(value: string | undefined): value is CodeLanguage {
  return CODE_LANGUAGES.some((language) => language === value)
}

/** Egy kerített kódblokk (```python) a sötét kódfelületen; ismeretlen nyelvnél kiemelés nélkül. */
function HighlightedBlock({ children }: ComponentProps<'pre'>) {
  const code = isValidElement<{ className?: string; children?: ReactNode }>(children) ? children.props : null
  const language = /language-(\S+)/.exec(code?.className ?? '')?.[1]

  return (
    <CodeBlock
      code={textOf(code ? code.children : children)}
      language={isCodeLanguage(language) ? language : 'text'}
      label="Kódrészlet"
      className="prose-code rounded-md"
    />
  )
}
