import type { Code, Parent, Root, RootContent } from 'mdast'
import type { StudyLanguage } from '../domain/preferences'

/** A `code-tabs` elem blokkjai JSON-ként utaznak a tulajdonságban, hogy a HTML-fán is átmenjenek. */
export interface CodeTabBlock {
  language: StudyLanguage
  code: string
}

/** A `code-tabs` elem `blocks` tulajdonságának olvasása; hibás érték üres listát ad. */
export function parseCodeTabBlocks(raw: string | undefined): CodeTabBlock[] {
  if (raw === undefined) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((item: unknown) => {
      if (typeof item !== 'object' || item === null || !('language' in item) || !('code' in item)) return []
      const { language, code } = item
      return (language === 'python' || language === 'csharp') && typeof code === 'string' ? [{ language, code }] : []
    })
  } catch {
    return []
  }
}

function tabLanguage(node: RootContent): StudyLanguage | null {
  if (node.type !== 'code') return null
  if (node.lang === 'python' || node.lang === 'csharp') return node.lang

  return null
}

function tabsNode(blocks: ReadonlyArray<CodeTabBlock>): RootContent {
  // Egyedi csomóponttípus: a `data.hName` miatt a react-markdown a `code-tabs` komponensnek adja.
  return {
    type: 'code-tabs',
    data: { hName: 'code-tabs', hProperties: { blocks: JSON.stringify(blocks) } },
    children: [],
  } as unknown as RootContent
}

function mergeChildren(children: RootContent[]): RootContent[] {
  const result: RootContent[] = []
  let run: Code[] = []

  const flush = () => {
    const first = run[0]
    if (run.length >= 2) {
      result.push(
        tabsNode(
          run.flatMap((node) => {
            const language = tabLanguage(node)
            return language ? [{ language, code: node.value }] : []
          }),
        ),
      )
    } else if (first) result.push(first)
    run = []
  }

  for (const child of children) {
    const language = tabLanguage(child)
    if (language === null || child.type !== 'code') {
      flush()
      result.push(child)
      continue
    }
    // Egy nyelvből csak egy blokk fér a sorozatba: a második ugyanolyan lezárja, és újat kezd.
    if (run.some((node) => tabLanguage(node) === language)) flush()
    run.push(child)
  }
  flush()

  return result
}

function walk(node: Parent): void {
  node.children = mergeChildren(node.children as RootContent[])
  for (const child of node.children) {
    if ('children' in child && Array.isArray(child.children)) walk(child as Parent)
  }
}

/**
 * Remark-bővítmény: a közvetlenül egymás után álló ```python és ```csharp blokkok
 * (legfeljebb egy-egy nyelvenként, köztük más elem nélkül) egy `code-tabs` elemmé
 * válnak. Egyetlen blokk, valamint minden más nyelvű blokk változatlan marad.
 */
export function remarkCodeTabs(): (tree: Root) => void {
  return (tree) => {
    walk(tree)
  }
}
