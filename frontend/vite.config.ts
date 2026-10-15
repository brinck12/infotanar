import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Build közben figyelmeztet, ha egy jogi dokumentum még vázlat (#132): így
 * helykitöltő szöveg nem kerülhet ki észrevétlenül. A jelölő ugyanaz, mint a
 * `features/legal/documents.ts` PLACEHOLDER_MARKER értéke.
 */
function warnAboutLegalPlaceholders(): Plugin {
  const directory = fileURLToPath(new URL('./src/features/legal/content', import.meta.url))

  return {
    name: 'warn-about-legal-placeholders',
    apply: 'build',
    buildStart() {
      for (const file of readdirSync(directory)) {
        if (readFileSync(join(directory, file), 'utf8').includes('<!-- status: placeholder -->')) {
          this.warn(`A jogi dokumentum még vázlat, nem végleges szöveg: ${file}`)
        }
      }
    },
  }
}

/**
 * A Barion kártyaelfogadó logója kötelező eleme az éles boltnak (#139), de a
 * hivatalos fájlt kézzel kell elhelyezni (lásd app/shells/SiteFooter.tsx). Hiányára a build figyelmeztet.
 */
function warnAboutMissingBarionLogo(): Plugin {
  const assets = fileURLToPath(new URL('./src/assets', import.meta.url))

  return {
    name: 'warn-about-missing-barion-logo',
    apply: 'build',
    buildStart() {
      if (!readdirSync(assets).some((file) => /^barion-card-acceptance\.(svg|png)$/.test(file))) {
        this.warn('Hiányzik a Barion kártyaelfogadó logó: src/assets/barion-card-acceptance.svg (vagy .png)')
      }
    },
  }
}

/** A nyilvános, indexelhető statikus útvonalak; az `app/RouteMeta.tsx` PUBLIC_META kulcsaival egyezik. */
const SITEMAP_PATHS = ['/', '/tanulasi-ut', '/feladatok', '/vizsgak', '/szobeli', '/arak', '/indulas', '/aszf', '/adatkezeles', '/impresszum']

/** Ezeket a keresők ne járják be (a `noindex` meta mellett a bejárást is kerüljék). */
const ROBOTS_DISALLOW = ['/admin', '/fiok', '/vizsgak/', '/beadasok', '/elofizetes', '/haladas', '/regisztracio', '/bejelentkezes', '/api/']

/**
 * `robots.txt` és `sitemap.xml` a buildbe (LAUNCH-1), plusz az `index.html`
 * `%SITE_URL%` helyőrzőjének kitöltése. A sitemap és az OG-kép abszolút URL-t
 * kér, ezért a `VITE_SITE_URL` (pl. https://infotanar.hu) kell hozzá; nélküle
 * a build figyelmeztet, és csak a `robots.txt` készül el. A sáv- és
 * leckeoldalak (dinamikus tartalom) a backend sitemap-parancsának feladata.
 */
function emitSeoFiles(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/+$/, '')

  return {
    name: 'emit-seo-files',
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', base)
    },
    generateBundle() {
      const lines = ['User-agent: *', 'Allow: /', ...ROBOTS_DISALLOW.map((path) => `Disallow: ${path}`)]

      if (base === '') {
        this.warn('A VITE_SITE_URL nincs megadva: a sitemap.xml kimarad, az OG-kép és a kanonikus URL relatív marad.')
      } else {
        const urls = SITEMAP_PATHS.map((path) => `  <url><loc>${base}${path}</loc></url>`).join('\n')
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        })
        lines.push('', `Sitemap: ${base}/sitemap.xml`)
      }

      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${lines.join('\n')}\n` })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    warnAboutLegalPlaceholders(),
    warnAboutMissingBarionLogo(),
    emitSeoFiles(loadEnv(mode, process.cwd(), 'VITE_')['VITE_SITE_URL'] ?? ''),
  ],
  server: {
    port: 5173,
  },
}))
