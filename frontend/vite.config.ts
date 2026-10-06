import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
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
 * hivatalos fájlt kézzel kell elhelyezni (lásd app/Footer.tsx). Hiányára a build figyelmeztet.
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

export default defineConfig({
  plugins: [react(), tailwindcss(), warnAboutLegalPlaceholders(), warnAboutMissingBarionLogo()],
  server: {
    port: 5173,
  },
})
