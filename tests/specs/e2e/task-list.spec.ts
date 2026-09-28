import { buildTaskDetail } from '../../src/data'
import { expect, test } from '../../src/fixtures'
import { TaskSolvePage } from '../../src/pages/TaskSolvePage'

const task = buildTaskDetail()

test.describe('Feladatlista', () => {
  test('a feladatlista betöltődik és megjelenik legalább egy feladat', { tag: '@smoke' }, async ({ taskListPage }) => {
    await taskListPage.goto()

    await expect(taskListPage.heading).toBeVisible()
    await expect(taskListPage.taskCards).toHaveCount(1)
    await expect(taskListPage.taskCards.first()).toContainText(task.title)
    await expect(taskListPage.taskCards.first()).toContainText('Középszint')
  })

  test(
    'feladatra kattintva megnyílik a megoldó oldal a leírással és a szerkesztővel',
    { tag: '@smoke' },
    async ({ taskListPage, taskSolvePage }) => {
      await taskListPage.goto()
      await taskListPage.openTask(task.title)

      await expect(taskSolvePage.page).toHaveURL(TaskSolvePage.urlPattern(task.id))
      await expect(taskSolvePage.heading(task.title)).toBeVisible()

      // A feladatleírás markdownként renderelődik.
      await expect(taskSolvePage.page.getByText('Add össze a beolvasott számokat!')).toBeVisible()

      // A Monaco szerkesztő betöltődött és a kiinduló kód benne van.
      await taskSolvePage.editor.waitUntilReady()
      await expect(taskSolvePage.editor.root).toContainText('n = int(input())')

      await expect(taskSolvePage.runButton).toBeVisible()
      await expect(taskSolvePage.submitButton).toBeVisible()
    }
  )
})
