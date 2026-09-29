export function PageLoader({ label = 'Betöltés…' }: { label?: string }) {
  return (
    <div role="status" className="mx-auto max-w-3xl px-4 py-16 text-slate-400">
      {label}
    </div>
  )
}
