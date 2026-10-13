import type { Locator } from '@playwright/test'
import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import { backendResponse, findInFrames } from '../../src/stripe-ui.ts'

test('identity: Complete with test data, Verification success', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/identity`)
  const created = backendResponse<{ verificationSessionId: string }>(page, '/api/identity-session')
  await page.locator('[data-test="identity-verify"]').click()
  const { verificationSessionId } = await created

  // Stripe's verification page sits in an iframe inside its lightbox iframe.
  const submitSelector = '[data-testid="testing-submit-autocomplete-button"]'
  const modal = await findInFrames(page, submitSelector, 60_000)
  const submit = modal.locator(submitSelector)
  await expect(submit).toBeVisible()
  // "Verification success" is the default outcome; pick it explicitly when offered.
  const outcome = modal.locator('select').first()
  if (await outcome.isVisible()) {
    const success = outcome.locator('option', { hasText: 'Verification success' })
    if (await success.count()) await outcome.selectOption({ label: 'Verification success' })
  }
  await snap('test data outcome')
  await submit.click()

  // The modal may end on a confirmation screen with its own close button.
  const submitted = page.locator('[data-test="identity-submitted"]')
  const close = modal.getByRole('button', { name: /^(Done|Close|Return|Finish)/i })
  await expect
    .poll(
      async () => {
        if (await submitted.isVisible()) return 'submitted'
        const visible = (locator: Locator): Promise<boolean> =>
          locator.isVisible().catch(() => false)
        if (await visible(close))
          await close
            .first()
            .click()
            .catch(() => undefined)
        return 'in the modal'
      },
      { timeout: 90_000, intervals: [1_000] }
    )
    .toBe('submitted')
  await expect(submitted).toContainText(verificationSessionId)
  await snap('submitted')

  await expect
    .poll(
      async () =>
        (await stripe.identity.verificationSessions.retrieve(verificationSessionId)).status,
      { timeout: 60_000 }
    )
    .toBe('verified')
})
