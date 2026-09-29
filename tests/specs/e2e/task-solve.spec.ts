import { aRunResponse, aTestResult, buildTaskDetail } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const task = buildTaskDetail()

test.describe('Feladat megoldása', () => {
  test.describe('futtatás', () => {
    test('helyes kód futtatása után zöld eredmény jelenik meg', { tag: '@smoke' }, async ({ mockApi, taskSolvePage }) => {
      await mockApi.onRun(aRunResponse().withResults(aTestResult()).build())
      await taskSolvePage.open(task.id)

      await taskSolvePage.run()

      const { summary, results } = taskSolvePage.resultPanel
      await expect(summary).toHaveAttribute('data-status', 'passed')
      await expect(summary).toContainText('Minden teszt sikeres')
      await expect(summary).toContainText('1 / 1 teszteset sikeres')
      await expect(results).toHaveCount(1)
      await expect(results.first()).toHaveAttribute('data-passed', 'true')
      await expect(results.first()).toContainText('SIKERES')
    })

    test('hibás kód futtatása után piros eredmény és az eltérés látszik', { tag: '@regression' }, async ({ mockApi, taskSolvePage }) => {
      await mockApi.onRun(aRunResponse().withResults(aTestResult().failing('0\n')).build())
      await taskSolvePage.open(task.id)

      await taskSolvePage.run()

      const panel = taskSolvePage.resultPanel
      await expect(panel.summary).toHaveAttribute('data-status', 'failed')
      await expect(panel.result(0)).toContainText('HIBÁS')
      await expect(panel.actualOutputOf(panel.result(0))).toBeVisible()
    })

    test('a backend hibája érthető magyar üzenetként jelenik meg', { tag: '@regression' }, async ({ mockApi, taskSolvePage }) => {
      const message = 'A kódfuttató szolgáltatás nem elérhető.'
      await mockApi.onRun(aRunResponse().errored(message).build(), { status: 503 })
      await taskSolvePage.open(task.id)

      await taskSolvePage.run()

      await expect(taskSolvePage.resultPanel.error).toContainText(message)
    })
  })

  test.describe('beadás', () => {
    test('a rejtett teszteset eredménye kimenet nélkül jelenik meg', { tag: '@regression' }, async ({ mockApi, taskSolvePage }) => {
      await mockApi.onSubmit(
        aRunResponse()
          .withResults(aTestResult().withId(1), aTestResult().withId(2).hidden())
          .buildSubmission()
      )
      await taskSolvePage.open(task.id)

      await taskSolvePage.submit()

      const panel = taskSolvePage.resultPanel
      await expect(panel.results).toHaveCount(2)
      await expect(panel.result(1)).toContainText('rejtett')
      // A rejtett tesztesetnél nem jelenik meg kimenet.
      await expect(panel.actualOutputOf(panel.result(1))).toHaveCount(0)
    })
  })

  test.describe('szerkesztő', () => {
    test('nyelvváltáskor betöltődik a megfelelő kiinduló kód', { tag: '@regression' }, async ({ taskSolvePage }) => {
      await taskSolvePage.open(task.id)
      await expect(taskSolvePage.editor.root).toContainText('n = int(input())')

      await taskSolvePage.selectLanguage('csharp')

      await expect(taskSolvePage.editor.root).toContainText('using System;')
    })
  })
})
