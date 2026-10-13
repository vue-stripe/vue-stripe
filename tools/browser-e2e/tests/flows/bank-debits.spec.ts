import type { Locator } from '@playwright/test'
import { config } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'
import {
  backendResponse,
  elementFrame,
  pickFirstProduct,
  waitForFrame
} from '../../src/stripe-ui.ts'

interface IntentResponse {
  paymentIntentId: string
}

test('iban-element: SEPA Direct Debit confirms to processing', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/iban-element`)
  const created = backendResponse<IntentResponse>(page, '/api/sepa-debit-intent')
  await page.getByRole('button', { name: /Start/ }).click()
  const { paymentIntentId } = await created

  await page.getByPlaceholder('Full name').fill('Jenny Rosen')
  await page.getByPlaceholder('Email').fill('jenny.rosen@example.com')
  // DE89 3704 0044 0532 0130 00: processing, then succeeded (guide/testing).
  await elementFrame(page, '.vue-stripe-iban-element')
    .locator('input[name="iban"]')
    .fill('DE89370400440532013000')
  await snap('iban entered')
  await page.getByRole('button', { name: /with SEPA$/ }).click()

  await expect(page.getByRole('heading', { name: 'Debit submitted!' })).toBeVisible()
  await snap('submitted')
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  expect(['processing', 'succeeded']).toContain(intent.status)
})

test.describe('ach-debit', () => {
  test('Financial Connections test institution, then confirm', async ({ page, stripe, snap }) => {
    await page.goto(`${config.docsUrl}/live-demo/ach-debit`)
    const created = backendResponse<IntentResponse>(page, '/api/ach-debit-intent')
    await pickFirstProduct(page)
    const { paymentIntentId } = await created

    await page.locator('[data-test="ach-link"]').click()
    const modal = await waitForFrame(page, 'linked-accounts-inner')
    // Test (Non-OAuth) bank, accept the terms, choose the Success account (guide/testing).
    await modal.locator('[data-testid="institution-default"]').click()
    await modal.locator('[data-testid="agree-button"]').click()
    await modal
      .locator('[data-testid="account-picker-item"]')
      .filter({ hasText: /^Success/ })
      .filter({ hasNotText: 'Disputed' })
      .click({ timeout: 60_000 })
    await snap('account selected')
    await modal.locator('[data-testid="select-button"]').click()

    // Stripe may offer to save the account to Link, then may show a success screen.
    const linked = page.locator('[data-test="ach-linked"]')
    const notNow = modal.locator('[data-testid="link-not-now-button"]')
    const done = modal.locator('[data-testid="done-button"]')
    await expect
      .poll(
        async () => {
          if (await linked.isVisible()) return 'linked'
          // The modal's frame detaches when it closes.
          const visible = (locator: Locator): Promise<boolean> =>
            locator.isVisible().catch(() => false)
          if (await visible(notNow)) await notNow.click().catch(() => undefined)
          else if (await visible(done)) await done.click().catch(() => undefined)
          return 'in the modal'
        },
        { timeout: 90_000, intervals: [1_000] }
      )
      .toBe('linked')
    await expect(linked).toBeVisible({ timeout: 60_000 })
    await snap('bank linked')
    await page.locator('[data-test="ach-confirm"]').click()

    await expect(page.getByRole('heading', { name: 'Payment Submitted' })).toBeVisible()
    await snap('submitted')
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    expect(['processing', 'succeeded']).toContain(intent.status)
  })

  test('manual entry with micro-deposits', () => {
    test.skip(
      true,
      "Not reachable from the demo: apps/backend's /api/ach-debit-intent sets " +
        "verification_method: 'instant', so the Financial Connections modal offers no manual " +
        'entry. Allowing microdeposits there would make this path testable.'
    )
  })
})

test('becs-payment: BECS Direct Debit (Australian accounts only)', async ({
  page,
  stripe,
  snap
}) => {
  await page.goto(`${config.docsUrl}/live-demo/becs-payment`)
  await expect(page.locator('.account-note')).toContainText('Requires an Australian Stripe account')

  const account = await stripe.accounts.retrieveCurrent()
  if (account.country !== 'AU') {
    // On a non-AU account Stripe rejects the PaymentIntent and the demo shows the error.
    await pickFirstProduct(page)
    await expect(page.locator('.error-box')).toContainText(
      /au_becs_debit|allowed_payment_method_types/i
    )
    await snap('non-au account error')
    test.skip(
      true,
      `The keys belong to a ${account.country ?? 'non-AU'} account; BECS needs an Australian ` +
        "account. The demo shows Stripe's rejection as expected. Use AU test keys to run it."
    )
  }

  const created = backendResponse<IntentResponse>(page, '/api/becs-intent')
  await pickFirstProduct(page)
  const { paymentIntentId } = await created
  await page.locator('#name').fill('Jenny Rosen')
  await page.locator('#email').fill('jenny.rosen@example.com')
  const bank = elementFrame(page, '.vue-stripe-au-bank-account-element')
  // BSB 000-000 with account 000123456: processing, then succeeded (guide/testing).
  await bank.locator('input[name="bsb_number"]').fill('000000')
  await bank.locator('input[name="account_number"]').fill('000123456')
  await page.locator('.mandate-checkbox input').check()
  await snap('bank entered')
  await page.getByRole('button', { name: /^Pay|Confirm/ }).click()

  await expect(page.locator('.success-state, .success')).toBeVisible()
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  expect(['processing', 'succeeded']).toContain(intent.status)
})
