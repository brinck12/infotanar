import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Markdown szöveg a tippekhez és magyarázatokhoz, a feladatleírással azonos megjelenéssel. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-invert max-w-none text-sm text-slate-200 [&_code]:rounded [&_code]:bg-slate-950 [&_code]:px-1 [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
