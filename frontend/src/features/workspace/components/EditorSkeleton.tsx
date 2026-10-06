/** Különböző hosszú "kódsorok", hogy a váz szerkesztőre emlékeztessen. */
const LINE_WIDTHS = ['w-2/5', 'w-3/5', 'w-1/2', 'w-1/4', 'w-2/3', 'w-1/3'] as const

/**
 * A szerkesztő helyén látszik, amíg a Monaco letöltődik és elindul.
 * A háttér a Monaco `vs-dark` témájának színe, hogy a csere ne villanjon.
 */
export function EditorSkeleton() {
  return (
    <div role="status" className="h-full space-y-3 bg-[#1e1e1e] p-4">
      <span className="sr-only">Szerkesztő betöltése…</span>
      {LINE_WIDTHS.map((width) => (
        <div key={width} className={`h-3 animate-pulse rounded bg-slate-700/60 motion-reduce:animate-none ${width}`} />
      ))}
    </div>
  )
}
