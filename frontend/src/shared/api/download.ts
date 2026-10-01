/**
 * Egy hitelesített kéréssel lekért fájl mentése a böngésző letöltéseként.
 * (Sima link nem jó: az nem küldené el a Bearer tokent.)
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  } finally {
    // A kattintás szinkron indítja a letöltést; utána az URL felszabadítható.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
