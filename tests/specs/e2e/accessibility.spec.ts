import { buildTaskDetail } from '../../src/data'
import { expect, test } from '../../src/fixtures'

const task = buildTaskDetail()

test.describe('Akadálymentesség', () => {
  test('a kezdőlap megfelel a WCAG 2.1 AA szabályoknak', { tag: '@a11y' }, async ({ homePage, expectNoA11yViolations }) => {
    await homePage.goto()
    await expect(homePage.demoResults).toHaveCount(2)

    await expectNoA11yViolations()
  })

  test('a tanulási út megfelel a WCAG 2.1 AA szabályoknak', { tag: '@a11y' }, async ({ learningPathPage, expectNoA11yViolations }) => {
    await learningPathPage.goto()
    await expect(learningPathPage.trackTab('Programozás')).toBeVisible()

    await expectNoA11yViolations()
  })

  test('a feladatlista oldal megfelel a WCAG 2.1 AA szabályoknak', { tag: '@a11y' }, async ({
    taskListPage,
    expectNoA11yViolations,
  }) => {
    await taskListPage.goto()
    await expect(taskListPage.taskCards).toHaveCount(1)

    await expectNoA11yViolations()
  })

  test('a feladatmegoldó oldal megfelel a WCAG 2.1 AA szabályoknak', { tag: '@a11y' }, async ({
    taskSolvePage,
    expectNoA11yViolations,
  }) => {
    await taskSolvePage.open(task.id)
    await expect(taskSolvePage.heading(task.title)).toBeVisible()

    await expectNoA11yViolations()
  })
})
