const MAX_LINES = 10

export interface FilePreview {
  /** A fájl első sorai. */
  text: string
  /** A fájlnak vannak további sorai az előnézeten túl. */
  truncated: boolean
}

/**
 * A fájl első sorai előnézetnek. Csak érvényes UTF-8 szöveget mutatunk: más
 * kódolású (pl. Latin-2) vagy bináris fájlt hibás karakterekkel nem jelenítünk meg.
 *
 * @returns null, ha a fájl nem UTF-8 szöveg.
 */
export async function previewOf(file: Blob): Promise<FilePreview | null> {
  let content: string
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
  } catch {
    return null
  }

  const lines = content.split(/\r?\n/)
  // A záró sortörés nem jelent külön (üres) sort.
  if (lines.at(-1) === '') lines.pop()

  return { text: lines.slice(0, MAX_LINES).join('\n'), truncated: lines.length > MAX_LINES }
}
