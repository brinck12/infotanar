import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { formatHuf } from '../../../billing/format'
import { AdminShell, Section } from '../../components/AdminShell'
import { QueryState } from '../../catalog/components/QueryState'
import { dashboardQuery, type DashboardMetrics, type DashboardRangeKey } from '../api'
import { AttentionList } from '../components/AttentionList'
import { StatTile } from '../components/StatTile'
import { TimeSeriesChart } from '../components/TimeSeriesChart'
import { VerdictDistribution } from '../components/VerdictDistribution'

const RANGES: ReadonlyArray<{ key: DashboardRangeKey; label: string }> = [
  { key: '7d', label: '7 nap' },
  { key: '30d', label: '30 nap' },
  { key: '90d', label: '90 nap' },
]

const integer = new Intl.NumberFormat('hu-HU')
const ratio = new Intl.NumberFormat('hu-HU', { style: 'percent', maximumFractionDigits: 0 })
const time = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' })

const percentOf = (value: number | null) => (value === null ? '–' : ratio.format(value))

/**
 * Az admin kezdőoldala (#160): előfizetések, bevétel, felhasználók, tanulás és a figyelmet kérő
 * dolgok egy helyen. A számok definíciója: docs/architecture.md.
 */
export function AdminDashboard() {
  const [range, setRange] = useState<DashboardRangeKey>('30d')
  // Az időszak váltásakor a régi számok maradnak látszani, amíg az újak megjönnek (nem villan a lap).
  const metrics = useQuery({ ...dashboardQuery(range), placeholderData: keepPreviousData })

  return (
    <AdminShell crumbs={[{ label: 'Admin' }, { label: 'Áttekintés' }]} title="Áttekintés" actions={<RangeSwitch value={range} onChange={setRange} />}>
      <QueryState query={metrics}>{(data) => <Dashboard metrics={data} />}</QueryState>
    </AdminShell>
  )
}

function RangeSwitch({ value, onChange }: { value: DashboardRangeKey; onChange: (range: DashboardRangeKey) => void }) {
  return (
    <div role="group" aria-label="Időszak" className="flex overflow-hidden rounded-lg border border-slate-700 text-sm">
      {RANGES.map((range) => (
        <button
          key={range.key}
          type="button"
          aria-pressed={value === range.key}
          onClick={() => onChange(range.key)}
          className="px-3 py-1.5 text-slate-300 hover:bg-slate-800 aria-pressed:bg-sky-900 aria-pressed:text-sky-100"
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

function Dashboard({ metrics }: { metrics: DashboardMetrics }) {
  const { subscriptions, revenue, users, learning, attention, range } = metrics
  const series = (daily: Record<string, number>) => range.days.map((day) => daily[day] ?? 0)

  return (
    <>
      <p className="text-xs text-slate-400" data-testid="dashboard-generated">
        Az utolsó {range.days.length} nap, {range.timezone} szerint; az előző, ugyanilyen hosszú időszakhoz hasonlítva. Számolva: {time.format(new Date(range.generated_at))} (legfeljebb 5 percig gyorsítótárazott).
      </p>

      <Section title="Előfizetések">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            label="Aktív előfizetők"
            value={integer.format(subscriptions.active)}
            detail={`${subscriptions.past_due} fizetési késedelemben · ${subscriptions.cancelling} lemondás alatt`}
          />
          <StatTile label="Havi ismétlődő bevétel (MRR)" value={formatHuf(subscriptions.mrr_huf)} detail="Az aktív előfizetések havi díja" />
          <StatTile
            label="Új előfizetés"
            value={integer.format(subscriptions.new)}
            change={{ current: subscriptions.new, previous: subscriptions.new_previous }}
          />
          <StatTile
            label="Lemorzsolódott"
            value={integer.format(subscriptions.churned)}
            change={{ current: subscriptions.churned, previous: subscriptions.churned_previous, upIsGood: false }}
          />
        </div>
      </Section>

      <Section title="Bevétel és felhasználók">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Bevétel" value={formatHuf(revenue.total)} change={{ current: revenue.total, previous: revenue.total_previous }} />
          <StatTile
            label="Sikertelen fizetés"
            value={integer.format(revenue.failed)}
            change={{ current: revenue.failed, previous: revenue.failed_previous, upIsGood: false }}
          />
          <StatTile
            label="Regisztráció"
            value={integer.format(users.registered)}
            detail={`${percentOf(users.verified_ratio)} megerősítette az e-mail-címét`}
            change={{ current: users.registered, previous: users.registered_previous }}
          />
          <StatTile
            label="Ingyenesből fizetőbe"
            value={percentOf(users.conversion)}
            detail="Az időszakban regisztráltak közül ennyien fizettek már"
            change={
              users.conversion !== null && users.conversion_previous !== null
                ? { current: users.conversion, previous: users.conversion_previous, kind: 'points' }
                : undefined
            }
          />
        </div>
        <div className="mt-4">
          <TimeSeriesChart
            title="Bevétel naponta"
            days={range.days}
            kind="bars"
            series={[{ label: 'Bevétel (Ft)', color: 'emerald', values: series(revenue.daily) }]}
            format={(value) => formatHuf(value)}
          />
        </div>
      </Section>

      <Section title="Tanulás">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Beadás" value={integer.format(learning.submissions)} change={{ current: learning.submissions, previous: learning.submissions_previous }} />
          <StatTile
            label="Aktív tanuló"
            value={integer.format(learning.active_learners)}
            detail="Bejelentkezve legalább egy beadással"
            change={{ current: learning.active_learners, previous: learning.active_learners_previous }}
          />
          <StatTile
            label="Elfogadási arány"
            value={percentOf(learning.acceptance_rate)}
            detail="A rendszerhibát nem számítva"
            change={
              learning.acceptance_rate !== null && learning.acceptance_rate_previous !== null
                ? { current: learning.acceptance_rate, previous: learning.acceptance_rate_previous, kind: 'points' }
                : undefined
            }
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TimeSeriesChart
            title="Beadások és aktív tanulók naponta"
            days={range.days}
            kind="lines"
            series={[
              { label: 'Beadás', color: 'sky', values: series(learning.submissions_daily) },
              { label: 'Aktív tanuló', color: 'amber', values: series(learning.active_learners_daily) },
            ]}
            format={(value) => integer.format(value)}
          />
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-200">A beadások állapota</h3>
            <VerdictDistribution verdicts={learning.verdicts} />
          </div>
        </div>
      </Section>

      <Section title="Figyelmet kér">
        <AttentionList attention={attention} />
      </Section>
    </>
  )
}
