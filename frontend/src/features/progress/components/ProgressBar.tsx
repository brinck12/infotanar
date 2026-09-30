interface Props {
  label: string
  completed: number
  total: number
  percent: number
  size?: 'md' | 'lg'
}

/** Haladásjelző: a képernyőolvasó a címkét és a pontos értéket is megkapja. */
export function ProgressBar({ label, completed, total, percent, size = 'md' }: Props) {
  const done = total > 0 && completed === total

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">
          {completed} / {total} lecke · <span className={done ? 'text-emerald-300' : 'text-slate-200'}>{percent}%</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${completed} / ${total} lecke teljesítve (${percent}%)`}
        className={`overflow-hidden rounded-full bg-slate-800 ${size === 'lg' ? 'h-3' : 'h-2'}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${done ? 'bg-emerald-500' : 'bg-sky-500'}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  )
}
