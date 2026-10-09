import type { ReactNode } from 'react'
import { Badge, type BadgeKind } from '../../../shared/ui/Badge'
import type { Crumb } from '../../../shared/ui/Breadcrumb'
import { Panel } from '../../../shared/ui/Panel'
import { useCrumbs } from '../../../shared/ui/shell'
import { CardTitle, PageTitle } from '../../../shared/ui/Text'

export type { Crumb }

interface AdminShellProps {
  crumbs: Crumb[]
  title: string
  actions?: ReactNode
  children: ReactNode
}

/**
 * Egy admin oldal tartalma: cím, műveletek és a szakaszok. A fejlécet és a
 * bal oldali menüt az admin keret adja; a morzsamenüt innen kapja meg.
 */
export function AdminShell({ crumbs, title, actions, children }: AdminShellProps) {
  useCrumbs(crumbs)

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <PageTitle size="compact">{title}</PageTitle>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </>
  )
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <Panel as="section" aria-label={title}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <CardTitle as="h2">{title}</CardTitle>
        {aside && <div>{aside}</div>}
      </div>
      {children}
    </Panel>
  )
}

const PILL: Readonly<Record<'published' | 'draft' | 'free' | 'info', BadgeKind>> = {
  published: 'pub',
  draft: 'draft',
  free: 'free',
  info: 'neutral',
}

export function StatusPill({ tone, children }: { tone: keyof typeof PILL; children: ReactNode }) {
  return <Badge kind={PILL[tone]}>{children}</Badge>
}
