const MAX_DEPTH = 3

/**
 * A naplóbejegyzés `metadata` mezője kulcs–érték listaként. A beágyazott objektumok (pl. egy törölt
 * elem pillanatképe) is kibomlanak; a tömbök egy sorban, JSON-ként jelennek meg.
 */
export function MetadataList({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (isRecord(value) && depth < MAX_DEPTH) {
    return (
      <dl className={depth === 0 ? 'space-y-1' : 'mt-1 space-y-1 border-l border-slate-800 pl-3'}>
        {Object.entries(value).map(([key, item]) => (
          <div key={key} className="text-xs">
            <dt className="inline font-mono text-slate-400">{key}: </dt>
            <dd className="inline text-slate-200">
              <MetadataList value={item} depth={depth + 1} />
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <span className="break-words">{format(value)}</span>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function format(value: unknown): string {
  if (value === null) return '–'
  if (typeof value === 'string') return value === '' ? '(üres)' : value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  return JSON.stringify(value)
}
