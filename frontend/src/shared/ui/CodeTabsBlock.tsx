import { useId } from 'react'
import { useLessonLanguage } from '../domain/lessonLanguage'
import type { StudyLanguage } from '../domain/preferences'
import { CodeBlock } from './CodeBlock'
import { TabPanel, Tabs } from './Tabs'

const LABELS: Readonly<Record<StudyLanguage, string>> = { python: 'Python', csharp: 'C#' }

interface CodeTabsProps {
  blocks: ReadonlyArray<{ language: StudyLanguage; code: string }>
}

/** Egymás melletti python és C# kódminta nyelvváltóval; a választás az oldal összes fülsorára érvényes. */
export function CodeTabs({ blocks }: CodeTabsProps) {
  const [chosen, choose] = useLessonLanguage()
  const idPrefix = useId()
  // Ha a választott nyelv nincs a csoportban, az első blokk látszik (a tárolt választás nem változik).
  const active = blocks.some((block) => block.language === chosen) ? chosen : blocks[0]?.language

  if (active === undefined) return null

  return (
    <div className="prose-code-tabs">
      <Tabs
        label="Programozási nyelv"
        idPrefix={idPrefix}
        tabs={blocks.map((block) => ({ id: block.language, label: LABELS[block.language] }))}
        active={active}
        onChange={choose}
      />
      {blocks.map((block) => (
        <TabPanel key={block.language} idPrefix={idPrefix} id={block.language} active={block.language === active}>
          <CodeBlock code={block.code} language={block.language} label="Kódrészlet" className="prose-code rounded-b-md" />
        </TabPanel>
      ))}
    </div>
  )
}
