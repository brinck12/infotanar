import { expect, test } from '@playwright/test'
import { mockReadEndpoints, mockRun, RUN_PASSED } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockReadEndpoints(page)
})

test('a feladatlista betöltődik és megjelenik legalább egy feladat', async ({ page }) => {
  await page.goto('/feladatok')

  await expect(page.getByRole('heading', { name: 'Feladatok' })).toBeVisible()

  const cards = page.getByTestId('task-card')
  await expect(cards).toHaveCount(1)
  await expect(cards.first()).toContainText('Összegzés tétele')
  await expect(cards.first()).toContainText('Középszint')
})

test('feladatra kattintva megnyílik a megoldó oldal a leírással és a szerkesztővel', async ({ page }) => {
  await page.goto('/feladatok')

  await page.getByTestId('task-card').first().click()

  await expect(page).toHaveURL(/\/feladatok\/1$/)
  await expect(page.getByRole('heading', { name: 'Összegzés tétele' })).toBeVisible()

  // A feladatleírás markdownként renderelődik.
  await expect(page.getByText('Add össze a beolvasott számokat!')).toBeVisible()

  // A Monaco szerkesztő betöltődött és a kiinduló kód benne van.
  const editor = page.locator('.monaco-editor').first()
  await expect(editor).toBeVisible({ timeout: 20_000 })
  await expect(editor).toContainText('n = int(input())')

  await expect(page.getByRole('button', { name: 'Futtatás' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Beadás' })).toBeVisible()
})

test('helyes kód futtatása után zöld eredmény jelenik meg', async ({ page }) => {
  await mockRun(page, RUN_PASSED)

  await page.goto('/feladatok/1')
  await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Futtatás' }).click()

  const summary = page.getByTestId('result-summary')
  await expect(summary).toHaveAttribute('data-status', 'passed')
  await expect(summary).toContainText('Minden teszt sikeres')
  await expect(summary).toContainText('1 / 1 teszteset sikeres')

  const results = page.getByTestId('test-result')
  await expect(results).toHaveCount(1)
  await expect(results.first()).toHaveAttribute('data-passed', 'true')
  await expect(results.first()).toContainText('SIKERES')
})

test('hibás kód futtatása után piros eredmény és az eltérés látszik', async ({ page }) => {
  await mockRun(page, {
    status: 'failed',
    results: [
      {
        test_case_id: 1,
        hidden: false,
        passed: false,
        time: 0.02,
        exit_code: 0,
        judge_status: 'Accepted',
        stdin: '3\n5\n10\n15\n',
        stdout: '0\n',
        expected: '30\n',
        stderr: '',
        compile_output: '',
      },
    ],
  })

  await page.goto('/feladatok/1')
  await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Futtatás' }).click()

  await expect(page.getByTestId('result-summary')).toHaveAttribute('data-status', 'failed')
  await expect(page.getByTestId('test-result').first()).toContainText('HIBÁS')
  await expect(page.getByText('A te kimeneted')).toBeVisible()
})

test('a rejtett teszteset eredménye kimenet nélkül jelenik meg', async ({ page }) => {
  await page.route('**/api/v1/submissions', (route) =>
    route.fulfill({
      json: {
        submission_id: 1,
        status: 'passed',
        results: [
          {
            test_case_id: 1,
            hidden: false,
            passed: true,
            time: 0.02,
            exit_code: 0,
            judge_status: 'Accepted',
            stdin: '3\n',
            stdout: '30\n',
            expected: '30\n',
          },
          {
            test_case_id: 2,
            hidden: true,
            passed: true,
            time: 0.02,
            exit_code: 0,
            judge_status: 'Accepted',
          },
        ],
      },
    })
  )

  await page.goto('/feladatok/1')
  await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Beadás' }).click()

  const results = page.getByTestId('test-result')
  await expect(results).toHaveCount(2)
  await expect(results.nth(1)).toContainText('rejtett')
  // A rejtett tesztesetnél nem jelenik meg kimenet.
  await expect(results.nth(1).getByText('A te kimeneted')).toHaveCount(0)
})

test('a backend hibája érthető magyar üzenetként jelenik meg', async ({ page }) => {
  await page.route('**/api/v1/run', (route) =>
    route.fulfill({
      status: 503,
      json: { status: 'error', message: 'A kódfuttató szolgáltatás nem elérhető.', results: [] },
    })
  )

  await page.goto('/feladatok/1')
  await expect(page.locator('.monaco-editor').first()).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Futtatás' }).click()

  await expect(page.getByTestId('result-error')).toContainText('A kódfuttató szolgáltatás nem elérhető.')
})

test('nyelvváltáskor betöltődik a megfelelő kiinduló kód', async ({ page }) => {
  await page.goto('/feladatok/1')

  const editor = page.locator('.monaco-editor').first()
  await expect(editor).toBeVisible({ timeout: 20_000 })
  await expect(editor).toContainText('n = int(input())')

  await page.getByLabel('Nyelv:').selectOption('csharp')

  await expect(editor).toContainText('using System;')
})
