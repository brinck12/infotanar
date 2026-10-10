/**
 * A Monaco szerkesztő a saját buildünkből (#150).
 *
 * A `@monaco-editor/react` alapból futásidőben, a jsDelivr CDN-ről töltené le
 * a Monacót. Itt a csomagolt példányt adjuk át neki, így a feladatoldal nem
 * függ külső kiszolgálótól (szűrt iskolai hálózat, adatvédelem, CSP).
 *
 * Csak azt csomagoljuk, amit használunk: a szerkesztő magját, a szerkesztési
 * funkciókat (keresés, behajtás, több kurzor stb.) és a használt nyelvek
 * (Python, C#, SQL, a weboldal feladatokhoz HTML és CSS) szintaxiskiemelését.
 * A TypeScript/JSON/CSS/HTML nyelvi szolgáltatások és a hozzájuk tartozó nehéz
 * workerek kimaradnak.
 *
 * Ezt a modult csak a lustán betöltött `MonacoCodeEditor` importálja, ezért a
 * Monaco külön chunkba kerül, és a többi oldal nem fizet érte.
 */
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api'
// oxlint-disable-next-line import/default -- Vite "?worker" import: a linter nem látja a generált default exportot
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/definitions/csharp/register'
import 'monaco-editor/languages/definitions/css/register'
import 'monaco-editor/languages/definitions/html/register'
import 'monaco-editor/languages/definitions/python/register'
import 'monaco-editor/languages/definitions/sql/register'

/** A `@monaco-editor/react` ezután a csomagolt Monacót használja; az első szerkesztő megjelenése előtt kell hívni. */
export function configureBundledMonaco(): void {
  // Ezeknek a nyelveknek nincs saját workere: mindegyik az általános szerkesztő-workert kapja.
  self.MonacoEnvironment = {
    getWorker: () => new EditorWorker(),
  }

  loader.config({ monaco })
}
