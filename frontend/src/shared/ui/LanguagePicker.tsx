import { useId } from 'react'
import { useLessonLanguage } from '../domain/lessonLanguage'
import type { StudyLanguage } from '../domain/preferences'
import { Tabs } from './Tabs'

const TABS: ReadonlyArray<{ id: StudyLanguage; label: string }> = [
  { id: 'python', label: 'Python' },
  { id: 'csharp', label: 'C#' },
]

/** Az oldal nyelvválasztója: a leckeszöveg és minden kódminta a választott nyelvre vált, a választás megmarad. */
export function LanguagePicker() {
  const [language, choose] = useLessonLanguage()

  return <Tabs label="Programozási nyelv" idPrefix={useId()} controls={false} tabs={TABS} active={language} onChange={choose} />
}
