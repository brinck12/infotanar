import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cx } from './cx'

/** Markdown szöveg tankönyvi szedéssel (feladatleírás, leckejegyzet). */
export function Prose({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={cx('prose-task', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}
