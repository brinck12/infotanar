import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cx } from './cx'

interface TableProps {
  /** Képernyőolvasónak szóló cím; a `showCaption` teszi láthatóvá. */
  caption?: string
  showCaption?: boolean
  children: ReactNode
  className?: string
}

/** Táblázat saját dobozban: keskeny kijelzőn a doboz görög, nem az oldal. */
export function Table({ caption, showCaption = false, children, className }: TableProps) {
  return (
    <div className={cx('overflow-x-auto rounded-md border border-line bg-sheet', className)}>
      <table className="w-full border-collapse">
        {caption && <caption className={showCaption ? 'px-3.5 py-2.5 text-left text-14 font-bold' : 'sr-only'}>{caption}</caption>}
        {children}
      </table>
    </div>
  )
}

interface CellProps {
  dense?: boolean
  align?: 'left' | 'right'
}

export function Th({ dense = false, align = 'left', className, scope = 'col', children, ...th }: CellProps & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={cx(
        'border-b border-line bg-headrow px-3.5 text-14 font-bold whitespace-nowrap text-ink-soft',
        dense ? 'py-2' : 'py-2.5',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
      {...th}
    >
      {children}
    </th>
  )
}

export function Td({ dense = false, align = 'left', className, children, ...td }: CellProps & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cx(
        'border-b border-grid px-3.5 align-middle text-15',
        dense ? 'py-1.5' : 'py-2.5',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
      {...td}
    >
      {children}
    </td>
  )
}

/** Táblázatsor halvány kiemeléssel az egér alatt. */
export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cx('hover:bg-faint', className)}>{children}</tr>
}
