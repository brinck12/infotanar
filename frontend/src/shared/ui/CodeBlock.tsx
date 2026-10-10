import { cx } from './cx'

export type CodeLanguage = 'python' | 'csharp' | 'sql' | 'html' | 'css' | 'text'

type TokenKind = 'default' | 'keyword' | 'builtin' | 'number' | 'comment'

const TOKEN_CLASS: Readonly<Record<TokenKind, string>> = {
  default: 'text-code-text',
  keyword: 'text-code-keyword',
  builtin: 'text-code-builtin',
  number: 'text-code-number',
  comment: 'text-code-comment',
}

const WORDS: Readonly<Record<CodeLanguage, { keyword: ReadonlySet<string>; builtin: ReadonlySet<string>; comment: string | null }>> = {
  python: {
    keyword: new Set('and as break class continue def elif else except False finally for from if import in is lambda None not or pass return True try while with'.split(' ')),
    builtin: new Set('abs float input int len list max min open print range round sorted str sum'.split(' ')),
    comment: '#',
  },
  csharp: {
    keyword: new Set('bool break class double else false for foreach if in int namespace new null public return static string true using var void while'.split(' ')),
    builtin: new Set('Console File List Math Parse ReadAllLines ReadLine Write WriteLine'.split(' ')),
    comment: '//',
  },
  sql: {
    keyword: new Set('AND AS ASC BY COUNT DESC DISTINCT FROM GROUP HAVING IN INNER JOIN LIKE LIMIT MAX MIN NOT ON OR ORDER SELECT SUM WHERE'.split(' ')),
    builtin: new Set(),
    comment: '--',
  },
  html: { keyword: new Set(), builtin: new Set(), comment: null },
  css: { keyword: new Set(), builtin: new Set(), comment: null },
  text: { keyword: new Set(), builtin: new Set(), comment: null },
}

interface Token {
  text: string
  kind: TokenKind
}

/** Egyszerű szóalapú kiemelés a statikus kódmintákhoz; a szerkesztőben a Monaco színez. */
function tokenize(line: string, language: CodeLanguage): Token[] {
  const { keyword, builtin, comment } = WORDS[language]
  const commentAt = comment ? line.indexOf(comment) : -1
  const code = commentAt >= 0 ? line.slice(0, commentAt) : line
  const tokens: Token[] = []

  for (const part of code.split(/(\b[A-Za-z_][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b)/)) {
    if (part === '') continue
    const kind: TokenKind = keyword.has(part) ? 'keyword' : builtin.has(part) ? 'builtin' : /^\d/.test(part) ? 'number' : 'default'
    const last = tokens[tokens.length - 1]
    if (last && last.kind === kind) last.text += part
    else tokens.push({ text: part, kind })
  }
  if (commentAt >= 0) tokens.push({ text: line.slice(commentAt), kind: 'comment' })

  return tokens
}

interface CodeBlockProps {
  code: string
  language?: CodeLanguage
  /** A képernyőolvasónak szóló név, pl. „Kiinduló kód”. */
  label?: string
  className?: string
}

/** Csak olvasható kódminta a sötét kódfelületen, sorszámokkal. */
export function CodeBlock({ code, language = 'text', label = 'Kódminta', className }: CodeBlockProps) {
  const lines = code.replace(/\n$/, '').split('\n')

  return (
    <div
      role="group"
      aria-label={label}
      // A hosszú sorok vízszintesen görgethetők, ezért a doboz billentyűzettel is elérhető.
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className={cx('on-dark overflow-x-auto bg-code py-4 font-mono text-14 leading-loose text-code-text', className)}
    >
      {lines.map((line, index) => (
        // A kódsornak a helyén kívül nincs azonossága.
        // oxlint-disable-next-line react/no-array-index-key
        <div key={index} className="flex">
          <span aria-hidden="true" className="w-12 flex-none pr-4 text-right text-code-edge select-none">
            {index + 1}
          </span>
          <span className="pr-4 whitespace-pre">
            {tokenize(line, language).map((token, tokenIndex) => (
              // oxlint-disable-next-line react/no-array-index-key
              <span key={tokenIndex} className={TOKEN_CLASS[token.kind]}>
                {token.text}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}
