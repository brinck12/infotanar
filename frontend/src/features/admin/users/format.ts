export function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('hu-HU') : '–'
}
