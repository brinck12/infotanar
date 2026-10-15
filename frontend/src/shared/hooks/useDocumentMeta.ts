import { useEffect } from 'react'

export const SITE_NAME = 'InfoTanár'

/** Az oldal kanonikus alap-URL-je; a build idején a `VITE_SITE_URL` adja (lásd scripts/generate-seo.mjs). */
const SITE_URL = (import.meta.env['VITE_SITE_URL'] as string | undefined)?.replace(/\/+$/, '') ?? ''

export interface DocumentMeta {
  /** Az oldal neve; a böngészőlapon "<cím> – InfoTanár" lesz belőle. Üres: csak a márkanév. */
  title: string
  description?: string
  /** Keresők ne indexeljék (fiók, admin, vizsga, hibaoldalak). */
  noindex?: boolean
}

function setMeta(name: string, content: string | null, attribute: 'name' | 'property' = 'name'): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  if (content === null) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.append(element)
  }
  element.content = content
}

function setCanonical(href: string | null): void {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (href === null) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }
  element.href = href
}

/**
 * Az oldalankénti dokumentumcím és meta (LAUNCH-1): cím, leírás, `robots`,
 * kanonikus link és az Open Graph/Twitter megfelelőik. `null` esetén nem nyúl
 * semmihez (pl. amíg egy dinamikus oldal adata még töltődik).
 */
export function useDocumentMeta(meta: DocumentMeta | null): void {
  const title = meta?.title
  const description = meta?.description
  const noindex = meta?.noindex ?? false
  const active = meta !== null

  useEffect(() => {
    if (!active) return

    const fullTitle = title ? `${title} – ${SITE_NAME}` : `${SITE_NAME} – digitális kultúra érettségi felkészítő`
    document.title = fullTitle
    setMeta('description', description ?? null)
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', description ?? null, 'property')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description ?? null)
    setMeta('robots', noindex ? 'noindex, nofollow' : null)

    // Kanonikus URL csak indexelhető oldalon, lekérdezés és töredék nélkül.
    const canonical = noindex ? null : `${SITE_URL || window.location.origin}${window.location.pathname}`
    setCanonical(canonical)
    setMeta('og:url', canonical, 'property')
  }, [active, title, description, noindex])
}
