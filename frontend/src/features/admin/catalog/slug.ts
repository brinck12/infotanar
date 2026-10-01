/**
 * URL-azonosító a címből: ékezetek nélkül, kisbetűvel, kötőjelekkel
 * (a backend `alpha_dash:ascii` szabályának megfelelően).
 */
export function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}
