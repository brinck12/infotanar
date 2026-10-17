import type { Paragraph, Parent, Root, RootContent } from 'mdast'
import type { StudyLanguage } from '../domain/preferences'

const OPEN = /^::: (python|csharp)$/
const CLOSE = ':::'

function paragraphText(node: RootContent): string | null {
  if (node.type !== 'paragraph') return null
  const [only, ...rest] = (node as Paragraph).children
  if (only?.type !== 'text' || rest.length > 0) return null

  return only.value.trim()
}

function sectionNode(language: StudyLanguage, children: RootContent[]): RootContent {
  // Egyedi csomóponttípus: a `data.hName` miatt a react-markdown a `lang-section` komponensnek adja.
  return {
    type: 'lang-section',
    data: { hName: 'lang-section', hProperties: { language } },
    children,
  } as unknown as RootContent
}

function mergeChildren(children: RootContent[]): RootContent[] {
  const result: RootContent[] = []

  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    if (!child) continue
    const open = OPEN.exec(paragraphText(child) ?? '')
    const language = open?.[1]
    const end = language ? children.findIndex((node, at) => at > index && paragraphText(node) === CLOSE) : -1
    if (language === undefined || end === -1 || (language !== 'python' && language !== 'csharp')) {
      result.push(child)
      continue
    }
    result.push(sectionNode(language, children.slice(index + 1, end)))
    index = end
  }

  return result
}

function walk(node: Parent): void {
  node.children = mergeChildren(node.children as RootContent[])
  for (const child of node.children) {
    if ('children' in child && Array.isArray(child.children)) walk(child as Parent)
  }
}

/**
 * Remark-bővítmény: a `::: python` vagy `::: csharp` bekezdés és a következő `:::` bekezdés
 * közötti tartalom egy `lang-section` elemmé válik, amely csak a választott nyelven látszik.
 * Lezáratlan nyitójelölő változatlan szövegként marad.
 */
export function remarkLangSections(): (tree: Root) => void {
  return (tree) => {
    walk(tree)
  }
}

/** Van-e a szövegben nyelvfüggő rész vagy kódfül, azaz van-e értelme nyelvválasztót mutatni. */
export function hasLanguageContent(markdown: string): boolean {
  return /^(::: (python|csharp)|```(python|csharp))\s*$/m.test(markdown)
}
