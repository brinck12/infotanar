import { buildTaskDetail } from '../../src/data'
import { MockApi } from '../../src/mocks/MockApi'
import { expect, test } from '../../src/fixtures'

const TRACK = 'programozas'
const LESSON = 'lecke-1'

const PY = '```python\nprint("py-egy")\n```'
const CS = '```csharp\nConsole.WriteLine("cs-egy");\n```'
const SQL = '```sql\nSELECT 1;\n```'
const PY2 = '```python\nprint("py-ketto")\n```'
const CS2 = '```csharp\nConsole.WriteLine("cs-ketto");\n```'

async function lessonWith(mockApi: MockApi, content: string) {
  await mockApi.withCatalog({ ...MockApi.defaultCatalog(), tasks: [buildTaskDetail()], lessonContent: content })
}

test.describe('Nyelvi lapfülek a leckeszövegben', () => {
  test('a szomszédos python és csharp blokk egy fülsorrá válik', { tag: '@regression' }, async ({ mockApi, lessonPage }) => {
    await lessonWith(mockApi, `${PY}\n\n${CS}`)
    await lessonPage.open(TRACK, LESSON)

    await expect(lessonPage.tablists).toHaveCount(1)
    await expect(lessonPage.languageTab(0, 'Python')).toHaveAttribute('aria-selected', 'true')
    await expect(lessonPage.codeGroups).toHaveCount(1)
    await expect(lessonPage.codeGroups).toContainText('py-egy')
  })

  test('a C# fülre váltás az összes fülsort átállítja, és újratöltés után is megmarad', { tag: '@regression' }, async ({
    mockApi,
    lessonPage,
  }) => {
    await lessonWith(mockApi, `${PY}\n\n${CS}\n\nKözbenső bekezdés.\n\n${PY2}\n\n${CS2}`)
    await lessonPage.open(TRACK, LESSON)
    await expect(lessonPage.tablists).toHaveCount(2)

    await lessonPage.chooseLanguage(0, 'C#')

    await expect(lessonPage.languageTab(0, 'C#')).toHaveAttribute('aria-selected', 'true')
    await expect(lessonPage.languageTab(1, 'C#')).toHaveAttribute('aria-selected', 'true')
    await expect(lessonPage.codeGroups.nth(1)).toContainText('cs-ketto')

    await lessonPage.page.reload()

    await expect(lessonPage.languageTab(0, 'C#')).toHaveAttribute('aria-selected', 'true')
    await expect(lessonPage.languageTab(1, 'C#')).toHaveAttribute('aria-selected', 'true')
  })

  test('a közéjük ékelt bekezdés megakadályozza az összevonást', { tag: '@regression' }, async ({ mockApi, lessonPage }) => {
    await lessonWith(mockApi, `${PY}\n\nKözbenső bekezdés.\n\n${CS}`)
    await lessonPage.open(TRACK, LESSON)

    await expect(lessonPage.codeGroups).toHaveCount(2)
    await expect(lessonPage.tablists).toHaveCount(0)
  })

  test('egyetlen python blokkból nem lesz fülsor', { tag: '@regression' }, async ({ mockApi, lessonPage }) => {
    await lessonWith(mockApi, PY)
    await lessonPage.open(TRACK, LESSON)

    await expect(lessonPage.codeGroups).toHaveCount(1)
    await expect(lessonPage.tablists).toHaveCount(0)
  })

  test('a python, csharp, sql sorozatból csak az első kettő vonódik össze', { tag: '@regression' }, async ({ mockApi, lessonPage }) => {
    await lessonWith(mockApi, `${PY}\n\n${CS}\n\n${SQL}`)
    await lessonPage.open(TRACK, LESSON)

    await expect(lessonPage.tablists).toHaveCount(1)
    await expect(lessonPage.codeGroups).toHaveCount(2)
    await expect(lessonPage.codeGroups.nth(1)).toContainText('SELECT 1;')
  })

  test('a fülek nyilakkal is válthatók', { tag: '@regression' }, async ({ mockApi, lessonPage }) => {
    await lessonWith(mockApi, `${PY}\n\n${CS}`)
    await lessonPage.open(TRACK, LESSON)

    await lessonPage.languageTab(0, 'Python').focus()
    await lessonPage.page.keyboard.press('ArrowRight')

    await expect(lessonPage.languageTab(0, 'C#')).toHaveAttribute('aria-selected', 'true')
    await expect(lessonPage.languageTab(0, 'C#')).toBeFocused()
  })

  test('a lapfüles lecke megfelel a WCAG 2.1 AA szabályoknak', { tag: '@a11y' }, async ({
    mockApi,
    lessonPage,
    expectNoA11yViolations,
  }) => {
    await lessonWith(mockApi, `${PY}\n\n${CS}`)
    await lessonPage.open(TRACK, LESSON)
    await expect(lessonPage.tablists).toHaveCount(1)

    await expectNoA11yViolations()
  })
})
