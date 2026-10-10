/** A címsor szövegéből képzett horgony, pl. „4. Sütik és helyi tárolás” → `4-sutik-es-helyi-tarolas`. */
export function headingId(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** A Markdown második szintű címsorai sorrendben, a tartalomjegyzékhez. */
export function headingsOf(markdown: string): Array<{ id: string; title: string }> {
  return markdown
    .split('\n')
    .flatMap((line) => (line.startsWith('## ') ? [line.slice(3).trim()] : []))
    .map((title) => ({ id: headingId(title), title }))
}
