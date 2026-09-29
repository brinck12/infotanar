import fs from 'node:fs/promises'
import path from 'node:path'
import type { BrowserContext } from '@playwright/test'

/**
 * A @monaco-editor/react a szerkesztot futasidoben a jsDelivr CDN-rol
 * tolti. Hogy a tesztek ne fuggjenek kulso halozattol (flaky CI, zart
 * halozat), a CDN kereseket a frontend sajat node_modules/monaco-editor
 * csomagjabol szolgaljuk ki. A verzio a URL-bol nem szamit: a loader csak
 * a min/vs konyvtarszerkezetet varja.
 */
const MONACO_CDN = /^https:\/\/cdn\.jsdelivr\.net\/npm\/monaco-editor@[^/]+\/min\/(.+)$/

const MONACO_MIN_DIR = path.resolve(__dirname, '../../../frontend/node_modules/monaco-editor/min')

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
}

export async function serveMonacoLocally(context: BrowserContext): Promise<void> {
  await context.route(MONACO_CDN, async (route) => {
    const match = MONACO_CDN.exec(route.request().url())
    const relative = match?.[1]?.split('?')[0]
    const file = relative ? path.join(MONACO_MIN_DIR, relative) : undefined

    // Ne lehessen a min konyvtarbol kilepni (../).
    if (!file?.startsWith(MONACO_MIN_DIR + path.sep)) {
      await route.fulfill({ status: 404 })
      return
    }

    try {
      const body = await fs.readFile(file)
      await route.fulfill({
        body,
        contentType: CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
      })
    } catch {
      await route.fulfill({ status: 404 })
    }
  })
}
