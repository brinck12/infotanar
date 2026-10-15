import { buildTaskDetail, buildTopic } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const sheetTask = Object.assign(buildTaskDetail({ id: 21, title: 'Összeg a táblázatban' }), {
  sheet_practice: {
    columns: 3,
    rows: 4,
    cells: { A1: 'Egy', B1: 'Kettő', C1: 'Összeg' },
    checks: [{ id: 1, label: 'A C2 cella képlet', type: 'has_formula', cell: 'C2' }],
  },
})

test.describe('Táblázatos gyakorló', () => {
  test.beforeEach(async ({ mockApi }) => {
    await mockApi.withCatalog({ topics: [buildTopic()], tasks: [sheetTask] })
  })

  test('a cellába közvetlenül lehet írni, az Enter lefelé, a Tab jobbra lép', { tag: '@regression' }, async ({ sheetPracticePage }) => {
    await sheetPracticePage.open(sheetTask.id)

    await sheetPracticePage.typeInto('A2', '7')
    await sheetPracticePage.typeInto('B2', '5', 'Tab')

    await expect(sheetPracticePage.cell('A2')).toContainText('7')
    await expect(sheetPracticePage.cell('B2')).toContainText('5')
    // Az Enter a következő sorba, a Tab a következő oszlopba lépett: a kijelölés a C2 cellán áll.
    await expect(sheetPracticePage.cell('C2')).toHaveAttribute('aria-pressed', 'true')
  })

  test('a hibaértéket adó képlet nem kap pontot, és magyar segítség jelenik meg', { tag: '@regression' }, async ({ sheetPracticePage }) => {
    await sheetPracticePage.open(sheetTask.id)
    await sheetPracticePage.typeInto('A2', '7')
    await sheetPracticePage.typeInto('B2', '5')

    await sheetPracticePage.typeInto('C2', '=SUM(A2;B2)')
    await sheetPracticePage.cell('C2').click()

    await expect(sheetPracticePage.cell('C2')).toContainText('#NÉV?')
    await expect(sheetPracticePage.errorHint).toContainText('magyar')
    await expect(sheetPracticePage.errorHint).toContainText('pontosvessző')
    await expect(sheetPracticePage.progress).toHaveText('0 / 1 kész')

    await sheetPracticePage.typeInto('C2', '=SZUM(A2;B2)')

    await expect(sheetPracticePage.cell('C2')).toContainText('12')
    await expect(sheetPracticePage.progress).toHaveText('1 / 1 kész')
  })

  test('a munkalap újratöltés után is megmarad', { tag: '@regression' }, async ({ sheetPracticePage }) => {
    await sheetPracticePage.open(sheetTask.id)
    await sheetPracticePage.typeInto('A3', '42')

    await sheetPracticePage.page.reload()

    await expect(sheetPracticePage.cell('A3')).toContainText('42')
  })
})
