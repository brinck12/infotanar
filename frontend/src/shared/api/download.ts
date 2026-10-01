/**
 * Egy már letöltött tartalom mentése a böngésző letöltéseként. Az API Bearer
 * tokent vár, ezért a letöltést sima link helyett blobként kérjük le.
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
