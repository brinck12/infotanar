/** `19 / 25 pont` */
export function pointsLabel(points: number, maxPoints: number): string {
  return `${points} / ${maxPoints} pont`
}

/** Fájlméret emberi léptékben: B, KB vagy MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('hu-HU', { maximumFractionDigits: 1 })} MB`
}
