import AxeBuilder from '@axe-core/playwright'
import { expect, type Fixtures, type PlaywrightTestArgs, type TestInfo } from '@playwright/test'

/**
 * Akadalymentessegi (a11y) ellenorzes az axe-core alapjan.
 *
 * A `makeAxeBuilder` egy elore beallitott AxeBuilder-t ad (WCAG 2.1 A/AA
 * szabalyok), az `expectNoA11yViolations` lefuttatja az ellenorzest, a
 * teljes jelentest csatolja a riporthoz, es elbukik, ha van hiba.
 */

/** Az ellenorzott WCAG szintek. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * Harmadik feltol szarmazo feluletek, amelyeket nem mi iranyitunk
 * (a Monaco szerkeszto belso DOM-ja). Itt bovitheto.
 */
const DEFAULT_EXCLUDES = ['.monaco-editor']

export interface A11yScanOptions {
  /** Tovabbi kizarando CSS szelektorok. */
  exclude?: string[]
  /** Kikapcsolt axe szabalyok; mindig indoklassal hasznald. */
  disableRules?: string[]
}

export interface A11yFixtures {
  makeAxeBuilder: () => AxeBuilder
  expectNoA11yViolations: (options?: A11yScanOptions) => Promise<void>
}

async function scan(builder: AxeBuilder, options: A11yScanOptions, testInfo: TestInfo): Promise<void> {
  for (const selector of options.exclude ?? []) builder.exclude(selector)
  if (options.disableRules?.length) builder.disableRules(options.disableRules)

  const results = await builder.analyze()

  await testInfo.attach('a11y-scan-results', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })

  // Olvashato osszefoglalo a hibauzenetben: szabaly, sulyossag, elemek.
  const summary = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }))
  expect(summary, 'Akadalymentessegi hibak').toEqual([])
}

export const a11yFixtures: Fixtures<A11yFixtures, object, PlaywrightTestArgs> = {
  makeAxeBuilder: async ({ page }, use) => {
    await use(() => new AxeBuilder({ page }).withTags(WCAG_TAGS).exclude(DEFAULT_EXCLUDES))
  },

  expectNoA11yViolations: async ({ makeAxeBuilder }, use, testInfo) => {
    await use((options = {}) => scan(makeAxeBuilder(), options, testInfo))
  },
}
