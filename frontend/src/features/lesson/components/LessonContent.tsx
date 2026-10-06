import csharp from 'highlight.js/lib/languages/csharp'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import { createLowlight } from 'lowlight'
import type { ComponentProps, ReactNode } from 'react'
import { Markdown } from '../../../shared/ui/Markdown'

/** Csak a platformon tanított nyelvek nyelvtana kerül a csomagba. */
const lowlight = createLowlight({ python, csharp, sql })

type HighlightNode = ReturnType<typeof lowlight.highlight>['children'][number]

/** A lecke tananyaga: a hosszú szöveg tipográfiája, kiemelt kódblokkokkal. */
export function LessonContent({ children }: { children: string }) {
  return <Markdown code={HighlightedCode}>{children}</Markdown>
}

/**
 * Egy kódrészlet a Markdownból. A ```python jellegű, ismert nyelvű blokkot
 * kiemeljük; a többi (soron belüli kód, ismeretlen vagy meg nem adott nyelv)
 * változatlanul, kódként jelenik meg.
 */
function HighlightedCode({ className, children }: ComponentProps<'code'>) {
  const language = /language-(\S+)/.exec(className ?? '')?.[1]

  if (!language || !lowlight.registered(language) || typeof children !== 'string') {
    return <code className={className}>{children}</code>
  }

  return <code className={className}>{lowlight.highlight(language, children).children.map(toReact)}</code>
}

/** A kiemelő fája csak szövegből és osztállyal jelölt szakaszokból áll; HTML-t nem illesztünk be. */
function toReact(node: HighlightNode, key: number): ReactNode {
  if (node.type === 'text') return node.value
  if (node.type !== 'element') return null

  const classes = node.properties.className

  return (
    <span key={key} className={Array.isArray(classes) ? classes.join(' ') : undefined}>
      {node.children.map(toReact)}
    </span>
  )
}
