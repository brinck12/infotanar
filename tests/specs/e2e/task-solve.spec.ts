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
      await expect(results.first()).toContainText('Elfogadva')
    })

    test('hibás kód futtatása után piros eredmény és az eltérés látszik', { tag: '@regression' }, async ({ mockApi, taskSolvePage }) => {
      await mockApi.onRun(aRunResponse().withResults(aTestResult().failing('0\n')).build())
      await taskSolvePage.open(task.id)

      await taskSolvePage.run()

      const panel = taskSolvePage.resultPanel
      await expect(panel.summary).toHaveAttribute('data-status', 'failed')
      await expect(panel.result(0)).toContainText('Hibás kimenet')
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
      await expect(panel.result(1)).toContainText('Rejtett')
      // A rejtett tesztesetnél nem jelenik meg kimenet.
      await expect(panel.actualOutputOf(panel.result(1))).toHaveCount(0)
    })

    test('elfogadott beadás után megjelenik a megerősítés', { tag: '@regression' }, async ({ mockApi, taskSolvePage }) => {
      await mockApi.onSubmit(aRunResponse().withResults(aTestResult()).buildSubmission())
      await taskSolvePage.open(task.id)

      await taskSolvePage.submit()

      await expect(taskSolvePage.nextStep).toContainText('Feladat megoldva')
    })

    test('sikertelen beadás után nincs megerősítés', { tag: '@regression' }, async ({ mockApi, taskSolvePage }) => {
      await mockApi.onSubmit(aRunResponse().withResults(aTestResult().failing('0\n')).buildSubmission())
      await taskSolvePage.open(task.id)

      await taskSolvePage.submit()

      await expect(taskSolvePage.resultPanel.summary).toHaveAttribute('data-status', 'failed')
      await expect(taskSolvePage.nextStep).toHaveCount(0)
    })
  })

  test.describe('futtatási korlát', () => {
    test('túl sok futtatásnál látszik a várakozás, és a gombok addig nem élnek', { tag: '@regression' }, async ({ mockApi, taskSolvePage }) => {
      await mockApi.onRunLimited({ reason: 'rate_limited', retry_after: 30, guest: true })
      await taskSolvePage.open(task.id)

      await taskSolvePage.run()

      await expect(taskSolvePage.rateLimitNotice).toContainText('Túl sok futtatás rövid idő alatt.')
      await expect(taskSolvePage.rateLimitNotice.getByRole('link', { name: 'Belépés a magasabb limitért' })).toBeVisible()
      await expect(taskSolvePage.runButton).toBeDisabled()
      await expect(taskSolvePage.submitButton).toBeDisabled()
    })

    test('a feladat idő- és memóriakorlátja a leírásnál látszik', { tag: '@regression' }, async ({ mockApi, taskSolvePage }) => {
      const limited = buildTaskDetail({ limits: { python: { time_limit_ms: 2000, memory_limit_kb: 128000 } } })
      await mockApi.withCatalog({ topics: [], tasks: [limited] })
      await taskSolvePage.open(limited.id)

      await expect(taskSolvePage.executionLimits).toContainText('Időkorlát: 2 mp')
      await expect(taskSolvePage.executionLimits).toContainText('Memória: 128 MB')
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
