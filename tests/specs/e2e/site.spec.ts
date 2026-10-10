import { buildTaskDetail } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const task = buildTaskDetail()

test.describe('Kezdőlap', () => {
  test('a hős, a főmenü és az ár megjelenik', { tag: '@smoke' }, async ({ homePage }) => {
    await homePage.goto()

    await expect(homePage.heading).toContainText('Az alapoktól az érettségi feladatsorig')
    for (const name of ['Tanulási út', 'Feladatok', 'Gyakorló vizsgák', 'Szóbeli', 'Haladásom', 'Árak']) {
      await expect(homePage.navLink(name)).toBeVisible()
    }
    await expect(homePage.price).toBeVisible()
  })

  test('az élő minta hibás kóddal elbukik, javítás után minden teszten átmegy', { tag: '@regression' }, async ({ homePage }) => {
    await homePage.goto()

    // Kezdetben a hibás kód két nyilvános tesztjének eredménye látszik.
    await expect(homePage.demoResults).toHaveCount(2)
    await expect(homePage.demo).toContainText('1 / 2 teszteset sikeres')

    await homePage.fixAndSubmitDemo()

    await expect(homePage.demoResults).toHaveCount(4)
    await expect(homePage.demo).toContainText('4 / 4 teszteset sikeres')
    // A rejtett teszteknél csak az ítélet látszik, bemenet és kimenet nem.
    await expect(homePage.demoResults.nth(3)).toContainText('Rejtett')
    await expect(homePage.demoResults.nth(3)).not.toContainText('Bemenet')
  })

  test('az első feladat gombja a feladatlistára visz', { tag: '@regression' }, async ({ homePage, taskListPage }) => {
    await homePage.goto()
    await homePage.firstTaskLink.click()

    await expect(taskListPage.heading).toBeVisible()
  })

  test('keskeny kijelzőn a főmenü gombra nyílik', { tag: '@regression' }, async ({ homePage, page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await homePage.goto()

    await expect(homePage.mainNav).toBeHidden()
    await homePage.openMenu()

    await expect(homePage.menuButton).toHaveAttribute('aria-expanded', 'true')
    await expect(homePage.navLink('Tanulási út')).toBeVisible()
  })
})

test.describe('Tanulási út', () => {
  test('a pontok megoszlása és a sáv szakaszai megjelennek', { tag: '@smoke' }, async ({ learningPathPage }) => {
    await learningPathPage.goto()

    await expect(learningPathPage.pointsBar).toHaveAccessibleName(/Középszint: .*Táblázatkezelés 25/)
    await expect(learningPathPage.trackTab('Programozás')).toHaveAttribute('aria-selected', 'true')
    await expect(learningPathPage.lessonLink(task.title)).toBeVisible()
  })

  test('emelt szintre váltva a programozás 50 pontja látszik', { tag: '@regression' }, async ({ learningPathPage }) => {
    await learningPathPage.goto()
    await learningPathPage.chooseLevel('Emelt szint')

    await expect(learningPathPage.pointsBar).toHaveAccessibleName(/Emelt szint: .*programozás 50 pont/)
  })

  test('a leckéről megnyitható a hozzá tartozó feladat', { tag: '@regression' }, async ({ learningPathPage, page }) => {
    await learningPathPage.goto()
    await learningPathPage.openLesson(task.title)

    // A regi, azonosito szerinti cim a vegleges, beszedes cimre iranyit.
    await expect(page).toHaveURL(/\/tanulasi-ut\/programozas\/lecke-\d+$/)
    await expect(page.getByRole('heading', { level: 1, name: task.title })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Tananyag' })).toContainText('A lecke rövid összefoglalója.')
    await expect(page.getByRole('link', { name: 'Feladat megnyitása' })).toBeVisible()
  })
})
