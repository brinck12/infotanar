const number = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 1 })

/** Emberi olvasatú fájlméret: "812 B", "12,4 KB", "1,2 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${number.format(bytes / 1024)} KB`
  return `${number.format(bytes / (1024 * 1024))} MB`
}
